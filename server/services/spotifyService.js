import axios from "axios";

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
    const req =
        await axios.get(
            "https://api.spotify.com/v1/me/playlists",
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

    return req.data.items.map(
        (playlist) => ({
            id: playlist.id,
            name: playlist.name,
            owner:
                playlist.owner
                    .display_name,
            totalTracks:
                playlist.items
                    .total,

            image:
                playlist.images[0]
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


export async function getArtists(accessToken, artistIds) {
    // Divide os IDs em lotes de no máximo 50
    const chunks = chunkArray(artistIds, 50);
    
    const allArtists = [];
    let sucessos = 0;
    let erros = 0;

    // Executa cada lote em sequência (espera um terminar para começar o outro)
    for (const chunk of chunks) {
        try {
            // Transforma o array de 50 IDs em uma string separada por vírgulas
            const idsString = chunk.join(',');
            
            // Faz uma única requisição para buscar até 50 artistas de uma vez
            const response = await axios.get(`https://api.spotify.com/v1/artists`, {
                params: { ids: idsString },
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            //console.log(`Lote processado: ${chunk.length} IDs | Sucessos até agora: ${sucessos} | Erros até agora: ${erros}`);

            // Se deu certo, adiciona os artistas extraídos no array final
            if (response.data && response.data.artists) {
                allArtists.push(...response.data.artists);
                sucessos += chunk.length; // Conta quantos IDs deram certo neste lote
            }
        } catch (error) {
            erros += chunk.length; // Se o lote falhar, conta os IDs como erro
            
            //console.error('Status do Erro:', error.response?.status);
            console.error('Detalhes do Erro:', error.response?.data);
            //console.error('Mensagem:', error.message);
        }
    }

    console.log(`Processamento concluído! Sucessos: ${sucessos} | Erros: ${erros}`);

    // Retorna a lista unificada de todos os artistas encontrados
    return allArtists;
}


function chunkArray(array, size) {
    const chunks = [];

    for (
        let i = 0;
        i < array.length;
        i += size
    ) {
        chunks.push(
            array.slice(i, i + size)
        );
    }

    return chunks;
}