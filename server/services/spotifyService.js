import axios from "axios";

import db from "../db/index.js";

export async function getUserProfile(
    accessToken
) {
    const req =
        await axios.get(
            "https://api.spotify.com/v1/me",
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

    return req.data;
}

export async function getUserPlaylists(
    accessToken
) {
    let items = [];
    let nextUrl =
        "https://api.spotify.com/v1/me/playlists?limit=50";

    while (nextUrl) {
        const response = await axios.get(
            nextUrl,
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        items = items.concat(response.data.items);

        nextUrl = response.data.next;
    }

    return items.map(
        (playlist) => ({
            id: playlist.id,
            name: playlist.name,
            owner:
                playlist.owner
                    ?.display_name ||
                playlist.owner?.id ||
                "Unknown",

            totalTracks:
                playlist.items?.total ??
                playlist.tracks?.total ??
                0,

            image:
                playlist.images?.[0]
                    ?.url || null
        })
    );
}

export async function getPlaylistTracks(accessToken, playlistId) {
    let items = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

    while (nextUrl) {
        const response = await axios.get(nextUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // Adiciona os itens da página atual à lista completa
        items = items.concat(response.data.items);

        // Atualiza a URL para a próxima página (será null quando chegar ao fim)
        nextUrl = response.data.next;
    }

    return items;
}


const getTimestamp = () => new Date().toISOString();

export async function getArtists(accessToken, artistIds) {
    let sucessosApi = 0;
    let errosApi = 0;

    const finalArtistsResult = [];
    const fullyFoundIds = new Set();
    const partialArtistsMap = new Map();

    const MIN_POPULARITY = 15;
    const MIN_FOLLOWERS = 500;

    // --- PASSO 1: BUSCAR NO BANCO EM CHUNKS ---
    const dbChunks = chunkArray(artistIds, 500);

    for (const chunk of dbChunks) {
        const inList = chunk.map(() => "?").join(", ");
        // Usa "_rowid_" (rowid interno) porque a base pré-provisionada
        // possui uma coluna explícita chamada "rowid", que fica NULL para
        // artistas inseridos em runtime. O "_rowid_" é consistente para
        // linhas antigas e novas.
        const query = `
            SELECT a._rowid_ AS rowid, a.id, a.name, a.followers_total, a.popularity, json_group_array(ag.genre) as genres
            FROM artists a
            LEFT JOIN artist_genres ag ON a._rowid_ = ag.artist_rowid
            WHERE a.id IN (${inList})
            GROUP BY a._rowid_
        `;

        const dbRows = db.prepare(query).all(...chunk);

        for (const row of dbRows) {
            let parsedGenres = [];
            if (row.genres) {
                parsedGenres = JSON.parse(row.genres);
                if (parsedGenres.length === 1 && parsedGenres[0] === null) {
                    parsedGenres = [];
                }
            }

            const artistObj = {
                rowid: row.rowid,
                id: row.id,
                name: row.name,
                followers_total: row.followers_total,
                popularity: row.popularity,
                genres: parsedGenres
            };

            if (parsedGenres.length > 0) {
                fullyFoundIds.add(row.id);
                finalArtistsResult.push(artistObj);
            } else {
                const isBigEnough = row.popularity > MIN_POPULARITY || row.followers_total > MIN_FOLLOWERS;
                if (isBigEnough) {
                    // Categoria 2: Está no DB, mas falta gênero. Vai pro Wikidata.
                    partialArtistsMap.set(row.id, artistObj);
                    finalArtistsResult.push(artistObj);
                } else {
                    fullyFoundIds.add(row.id);
                    finalArtistsResult.push(artistObj);
                }
            }
        }
    }

    // --- PASSO 2: IDENTIFICAR QUEM É QUEM ---
    // Artistas totalmente inéditos (não estão no Set nem no Map)
    const newArtistIds = artistIds.filter(id => !fullyFoundIds.has(id) && !partialArtistsMap.has(id));
    
    // Todos que precisam de gêneros (Inéditos + Existentes sem gênero)
    const idsNeedingGenres = [...newArtistIds, ...Array.from(partialArtistsMap.keys())];

    // --- PASSO 3: BUSCAR GÊNEROS NO WIKIDATA EM LOTE ---
    let wikidataGenresMap = {};
    if (idsNeedingGenres.length > 0) {
        console.log(`Buscando gêneros no Wikidata para ${idsNeedingGenres.length} artistas...`);
        // Aqui você pode até usar o chunkArray para o Wikidata se a lista for muito gigante (ex: > 1000)
        // mas o POST aceita cargas muito grandes tranquilamente.
        wikidataGenresMap = await fetchWikidataGenres(idsNeedingGenres);
        console.log(`Gêneros do Wikidata recebidos para ${Object.keys(wikidataGenresMap).length} artistas.`);
    }

    // --- PASSO 4: BUSCAR NA API DO SPOTIFY (APENAS NOVOS) ---
    const apiArtists = [];
    if (newArtistIds.length > 0) {
        console.log(`Buscando ${newArtistIds.length} artistas INÉDITOS no Spotify...`);

        for (const id of newArtistIds) {
            try {
                const response = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (response.data) {
                    const artistData = response.data;
                    // Sobrescrevemos os gêneros do Spotify com os do Wikidata (se existirem).
                    // Se o Wikidata não tiver, fazemos fallback para o que o Spotify enviou.
                    artistData.genres = wikidataGenresMap[id] || artistData.genres || [];
                    
                    apiArtists.push(artistData);
                    sucessosApi++;
                }
            } catch (error) {
                errosApi++;
                console.error(`Erro ao buscar ID ${id} no Spotify:`, error.response?.status || error.message);
            }
        }
    }

    // --- PASSO 5: TRANSAÇÃO UNIFICADA (ATUALIZAÇÕES E INSERÇÕES) ---
    // Só abrimos transação se houver algo para salvar (novos artistas OU gêneros atualizados)
    if (apiArtists.length > 0 || partialArtistsMap.size > 0) {
        const insertArtistStmt = db.prepare(`
            INSERT INTO artists (id, fetched_at, name, followers_total, popularity) 
            VALUES (?, ?, ?, ?, ?)
        `);
        const insertGenreStmt = db.prepare(`
            INSERT INTO artist_genres (artist_rowid, genre) 
            VALUES (?, ?)
        `);

        const runTransaction = () => {
            db.exec("BEGIN TRANSACTION");

            try {
                // 1. Atualizar os artistas existentes que ganharam gêneros via Wikidata
                for (const [id, existingArtist] of partialArtistsMap.entries()) {
                    const novosGeneros = wikidataGenresMap[id] || [];
                    if (novosGeneros.length > 0) {
                        for (const genre of novosGeneros) {
                            insertGenreStmt.run(existingArtist.rowid, genre);
                        }
                        existingArtist.genres = novosGeneros; // Atualiza o objeto que já está no array de retorno
                    }
                }

                // 2. Inserir os artistas inéditos vindos do Spotify + Wikidata
                for (const artist of apiArtists) {
                    const info = insertArtistStmt.run(
                        artist.id,
                        getTimestamp(),
                        artist.name,
                        artist.followers?.total || 0,
                        artist.popularity || 0
                    );

                    const newRowId = info.lastInsertRowid;
                    const genres = artist.genres || [];

                    for (const genre of genres) {
                        insertGenreStmt.run(newRowId, genre);
                    }

                    finalArtistsResult.push({
                        rowid: newRowId,
                        id: artist.id,
                        name: artist.name,
                        followers_total: artist.followers?.total || 0,
                        popularity: artist.popularity || 0,
                        genres: genres
                    });
                }

                db.exec("COMMIT");
            } catch (error) {
                db.exec("ROLLBACK");
                console.error("Falha ao salvar no banco, desfazendo lote...", error);
            }
        };

        runTransaction();
    }

    console.log(`Processo finalizado. API Spotify: ${sucessosApi} sucessos, ${errosApi} erros.`);
    return finalArtistsResult;
}

// Cria uma playlist na conta do usuário logado.
// A Spotify Web API usa o campo booleano "public".
export async function createPlaylist(
    accessToken,
    { name, description = "", isPublic = false }
) {
    const response = await axios.post(
        "https://api.spotify.com/v1/me/playlists",
        {
            name,
            description: String(description).slice(0, 300),
            public: Boolean(isPublic)
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    return response.data;
}

// Adiciona faixas a uma playlist. A API aceita no máximo 100
// URIs por chamada, então enviamos em lotes.
export async function addPlaylistTracks(
    accessToken,
    playlistId,
    uris
) {
    const chunks = chunkArray(uris, 100);

    for (const chunk of chunks) {
        await axios.post(
            `https://api.spotify.com/v1/playlists/${playlistId}/items`,
            { uris: chunk },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
    }

    return uris.length;
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Função auxiliar para buscar gêneros no Wikidata em lote
async function fetchWikidataGenres(spotifyIds) {
    if (!spotifyIds || spotifyIds.length === 0) return {};

    // Formata os IDs para o padrão da query SPARQL: "id1" "id2" "id3"
    const formattedIds = spotifyIds.map(id => `"${id}"`).join(' ');

    // Otimizado: Removido o rdfs:label e FILTER pesados, injetado o SERVICE nativo
    const query = `
        SELECT ?spotifyId ?genreLabel WHERE {
          VALUES ?spotifyId { ${formattedIds} }
          ?artist wdt:P1902 ?spotifyId ;
                  wdt:P136 ?genre .
          
          # O SERVICE abaixo faz a mágica de criar a variável ?genreLabel automaticamente em inglês ou português
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en,pt". }
        }
    `;

    try {
        const params = new URLSearchParams();
        params.append('query', query);

        const response = await axios.post('https://query.wikidata.org/sparql', params, {
            headers: {
                'Accept': 'application/sparql-results+json',
                'Content-Type': 'application/x-www-form-urlencoded',
                "User-Agent": "MeuAppDeMusica/1.0 (bellottie814@gmail.com)"
            }
        });

        // Garante que o retorno existe para evitar quebras de destruturação
        const bindings = response.data?.results?.bindings || [];
        const genreMap = {};

        for (const row of bindings) {
            const sId = row.spotifyId.value;
            // O Wikidata gera a propriedade .value no genreLabel quando o SERVICE funciona
            const gLabel = row.genreLabel?.value?.toLowerCase();
            
            if (!gLabel) continue; // Pula caso venha nulo por falta de tradução
            if (!genreMap[sId]) genreMap[sId] = [];
            
            if (!genreMap[sId].includes(gLabel)) {
                genreMap[sId].push(gLabel);
            }
        }

        return genreMap;
    } catch (error) {
        console.error("Erro na consulta ao Wikidata:", error.response?.data || error.message);
        return {}; 
    }
}
