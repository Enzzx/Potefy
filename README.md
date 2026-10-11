# Potefy - Spotify playlists manager

## Features
You can select your playlists and get a bunch of analyzes on it, like repeated songs or ranking of artists appearance. You can also create a new playlist from the existing ones, filtering from genre, repeated or all.

## About the project
AI coded project cause i only wanted the service, even it is for personal use i still modified/revised all the development and UI/UX process. 

_Not finished yet_

## Setup

### Server
```
cd server
npm install
npm run dev
```

Requer Node.js 22 ou superior (usa `node:sqlite`).

Variáveis de ambiente (`server/.env`):

```
PORT=3000
CLIENT_URL=http://127.0.0.1:5173
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
JWT_SECRET=...
```

#### Banco de dados (cache de artistas/gêneros)

O servidor usa um cache local em SQLite (`server/spotify_api.db`). O arquivo é
criado automaticamente a partir de `server/db/schema.sql` na primeira execução;
sem a base pré-provisionada o servidor funciona, mas busca os gêneros sob
demanda (Spotify/Wikidata), o que é bem mais lento.

A base pré-provisionada (~1,4 GB; ~15,4M artistas + 2,2M gêneros) **não é
versionada** (excede o limite de 100 MB do GitHub). Para obtê-la:

```bash
cd server

# Opção 1 (recomendada): baixar o asset do Release e validar o SHA-256
npm run db:fetch          # use `npm run db:fetch -- --force` para forçar

# Opção 2: reconstruir do zero a partir do Kaggle
#   requer `pip install kaggle pyarrow` e ~/.kaggle/kaggle.json
npm run db:build
```

`npm run db:optimize` remove o índice `idx_artist_rowid` (não usado pela
aplicação) e compacta o arquivo com `VACUUM`.

Fonte dos dados: [Anna's Archive Spotify 2025-07](https://www.kaggle.com/datasets/lordpatil/spotify-metadata-by-annas-archive)
(tabelas `artists` e `artist_genres`, licença Apache-2.0). URL e hash ficam em
`server/scripts/db.manifest.json`.

### Client
```
cd potefy-front
npm install
npm run dev
```

O processo de login usa OAuth do Spotify. O `access_token` (expira em ~1h) é
renovado automaticamente no servidor via `refresh_token`.

## Gêneros (famílias + subgêneros)

Os gêneros crus vindos do Spotify/Wikidata são agrupados em famílias amplas
(Pop, Rock, Metal, Hip Hop & Rap, Eletrônico & Dance, Latino, ...). A
classificação fica em `server/services/genreTaxonomy.js` (regras por
palavra-chave + overrides) e é aplicada na análise, sem alterar o banco.

Na tela de análise, cada família pode ser selecionada por inteiro ou expandida
para escolher subgêneros específicos. No Builder, dá para remover músicas
individuais antes de criar a playlist.

## API

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/spotify/playlists` | Lista as playlists do usuário |
| POST | `/api/spotify/analyze` | Analisa uma ou mais playlists |
| POST | `/api/spotify/playlists` | Cria uma playlist a partir de `trackIds` |

Exemplo de criação:

```json
POST /api/spotify/playlists
{
  "name": "Potefy Mix",
  "description": "Gerada pelo Potefy",
  "isPublic": false,
  "trackIds": ["4cOdK2wGLETKBW3PvgPWqT"]
}
```

