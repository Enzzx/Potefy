import {
    classifyGenre,
    getFamilyLabel
} from "./genreTaxonomy.js";

export async function analyzePlaylists(
    playlistsTracks,
    artistsMap,
    playlistsMap = new Map()
) {
    const trackMap = new Map();

    let totalSongs = 0;

    // Agrupa as faixas únicas primeiro (mesclando as playlists de origem),
    // para que uma música presente em várias playlists seja contada uma vez.
    for (const track of playlistsTracks) {
        totalSongs++;

        if (!trackMap.has(track.id)) {
            trackMap.set(track.id, {
                ...track,
                playlistIds: [...track.playlistIds]
            });
        } else {
            const existing =
                trackMap.get(track.id);

            for (const playlistId of
                track.playlistIds) {
                if (
                    !existing.playlistIds.includes(
                        playlistId
                    )
                ) {
                    existing.playlistIds.push(
                        playlistId
                    );
                }
            }
        }
    }

    const uniqueTracks = Array.from(
        trackMap.values()
    ).map((track) => ({
        ...track,

        playlistNames: track.playlistIds.map(
            (id) => playlistsMap.get(id) || id
        )
    }));

    const uniqueSongs = uniqueTracks.length;

    // Frequências calculadas sobre as músicas únicas:
    // - cada artista conta uma vez por música;
    // - cada gênero conta uma vez por música, mesmo que a faixa tenha
    //   vários artistas do mesmo gênero.
    // Agrupado por id de artista (fallback para o nome quando não houver id).
    const artistFrequency = new Map();

    const genreFrequency = new Map();

    // Frequência por família (gênero "principal"): conta cada música
    // uma vez por família, mesmo que ela tenha vários subgêneros da
    // mesma família.
    const familyFrequency = new Map();

    // Cache gênero cru -> família (evita reclassificar).
    const genreFamily = new Map();

    for (const track of uniqueTracks) {
        const seenArtists = new Set();

        const trackGenres = new Set();

        for (const artist of track.artists) {
            const key =
                artist.id || artist.name;

            if (!seenArtists.has(key)) {
                seenArtists.add(key);

                const entry =
                    artistFrequency.get(
                        key
                    ) || {
                        id: artist.id || null,
                        name: artist.name,
                        count: 0
                    };

                entry.count++;

                artistFrequency.set(key, entry);
            }

            const artistData =
                artistsMap.get(artist.id);

            if (artistData?.genres) {
                for (const genre of
                    artistData.genres) {
                    trackGenres.add(genre);
                }
            }
        }

        for (const genre of trackGenres) {
            genreFrequency.set(
                genre,

                (genreFrequency.get(
                    genre
                ) || 0) + 1
            );
        }

        const trackFamilies = new Set();

        for (const genre of trackGenres) {
            let family =
                genreFamily.get(genre);

            if (!family) {
                family = classifyGenre(genre);
                genreFamily.set(genre, family);
            }

            trackFamilies.add(family);
        }

        for (const family of trackFamilies) {
            familyFrequency.set(
                family,

                (familyFrequency.get(
                    family
                ) || 0) + 1
            );
        }
    }

    const repeatedSongs = uniqueTracks
        .filter(
            (track) =>
                track.playlistIds.length > 1
        )
        .sort(
            (a, b) =>
                b.playlistIds.length -
                a.playlistIds.length
        );

    const topArtists = Array.from(
        artistFrequency.values()
    ).sort((a, b) => b.count - a.count);

    const genres = Array.from(
        genreFrequency.entries()
    )
        .map(([name, count]) => ({
            name,
            count,
            family:
                genreFamily.get(name) ||
                classifyGenre(name)
        }))
        .sort((a, b) => b.count - a.count);

    // Família "principal" com seus subgêneros aninhados, ordenada
    // pela contagem (músicas únicas que têm algum gênero da família).
    const genreFamilies = Array.from(
        familyFrequency.entries()
    )
        .map(([id, count]) => ({
            id,
            label: getFamilyLabel(id),
            count,
            subgenres: genres.filter(
                (genre) => genre.family === id
            )
        }))
        .sort((a, b) => b.count - a.count);

    // Décadas (a partir do ano de lançamento) e popularidade
    const decadeFrequency = new Map();

    let popularitySum = 0;
    let popularityCount = 0;

    for (const track of uniqueTracks) {
        if (track.releaseYear) {
            const decade =
                Math.floor(
                    track.releaseYear / 10
                ) * 10;

            const label = `${decade}s`;

            decadeFrequency.set(
                label,

                (decadeFrequency.get(
                    label
                ) || 0) + 1
            );
        }

        if (
            typeof track.popularity ===
                "number" &&
            track.popularity > 0
        ) {
            popularitySum +=
                track.popularity;

            popularityCount++;
        }
    }

    const byDecade = Array.from(
        decadeFrequency.entries()
    )
        .map(([decade, count]) => ({
            decade,
            count
        }))
        .sort((a, b) =>
            a.decade.localeCompare(b.decade)
        );

    const averagePopularity =
        popularityCount > 0
            ? Math.round(
                popularitySum /
                    popularityCount
            )
            : 0;

    const topPopular = [...uniqueTracks]
        .sort(
            (a, b) =>
                b.popularity - a.popularity
        )
        .slice(0, 10)
        .map((track) => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            popularity: track.popularity
        }));

    // Distribuição por playlist: exclusivas vs compartilhadas
    const playlistBreakdown = Array.from(
        playlistsMap.entries()
    ).map(([id, name]) => {
        let total = 0;
        let exclusive = 0;
        let shared = 0;

        for (const track of uniqueTracks) {
            if (
                !track.playlistIds.includes(
                    id
                )
            ) {
                continue;
            }

            total++;

            if (
                track.playlistIds.length ===
                1
            ) {
                exclusive++;
            } else {
                shared++;
            }
        }

        return {
            id,
            name,
            total,
            exclusive,
            shared
        };
    });

    // Mapa de artistas (id -> { name, genres }) para o Builder
    // filtrar por artista/gênero sem precisar de um novo fetch.
    const artists = Array.from(
        artistsMap.values()
    ).map((artist) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || []
    }));

    const overlap = calculateOverlap(
        uniqueTracks,

        playlistsMap
    );

    return {
        summary: {
            totalSongs,
            uniqueSongs,

            artists:
                artistFrequency.size,

            genres:
                genreFrequency.size,

            genreFamilies:
                genreFamilies.length,

            averagePopularity
        },

        tracks: uniqueTracks,

        repeatedSongs,

        topArtists,

        genres,

        genreFamilies,

        artists,

        overlap,

        byDecade,

        topPopular,

        playlistBreakdown
    };
}

function calculateOverlap(
    uniqueTracks,
    playlistsMap
) {
    const playlistMap = new Map();

    const trackById = new Map();

    // agrupa tracks por playlist
    for (const track of uniqueTracks) {
        trackById.set(track.id, track);

        for (const playlistId of
            track.playlistIds) {
            if (
                !playlistMap.has(
                    playlistId
                )
            ) {
                playlistMap.set(
                    playlistId,
                    new Set()
                );
            }

            playlistMap
                .get(
                    playlistId
                )
                .add(track.id);
        }
    }

    const playlistIds = Array.from(
        playlistMap.keys()
    );

    const overlap = [];

    for (
        let i = 0;
        i < playlistIds.length;
        i++
    ) {
        for (
            let j = i + 1;
            j < playlistIds.length;
            j++
        ) {
            const first = playlistIds[i];

            const second = playlistIds[j];

            const setA =
                playlistMap.get(first);

            const setB =
                playlistMap.get(second);

            const repeated = [...setA].filter(
                (trackId) => setB.has(trackId)
            );

            overlap.push({
                playlistA: {
                    id: first,
                    name:
                        playlistsMap.get(
                            first
                        ) || first
                },

                playlistB: {
                    id: second,
                    name:
                        playlistsMap.get(
                            second
                        ) || second
                },

                repeatedCount:
                    repeated.length,

                repeatedTracks:
                    repeated.map((trackId) => {
                        const track =
                            trackById.get(
                                trackId
                            );

                        return {
                            id: track.id,
                            name: track.name,
                            artists:
                                track.artists
                        };
                    })
            });
        }
    }

    return overlap.sort(
        (a, b) =>
            b.repeatedCount -
            a.repeatedCount
    );
}
