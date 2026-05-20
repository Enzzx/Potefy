export async function analyzePlaylists(
    playlistsTracks,
    artistsMap
) {
    const trackMap =
        new Map();

    const artistFrequency =
        new Map();

    const genreFrequency =
        new Map();

    let totalSongs = 0;

    for (const track of playlistsTracks) {
        totalSongs++;

        // músicas únicas
        if (
            !trackMap.has(
                track.id
            )
        ) {
            trackMap.set(
                track.id,
                track
            );
        } else {
            trackMap
                .get(track.id)
                .playlistIds
                .push(
                    ...track.playlistIds
                );
        }

        // artistas
        for (const artist of track.artists) {
            artistFrequency.set(
                artist.name,

                (artistFrequency.get(
                    artist.name
                ) || 0) + 1
            );

            const artistData =
                artistsMap.get(
                    artist.id
                );

            if (
                artistData
                    ?.genres
            ) {
                for (const genre of
                    artistData.genres) {
                    genreFrequency.set(
                        genre,

                        (genreFrequency.get(
                            genre
                        ) || 0) + 1
                    );
                }
            }
        }
    }

    const uniqueSongs =
        trackMap.size;

    const repeatedSongs =
        Array.from(
            trackMap.values()
        )
            .filter(
                (track) =>
                    track
                        .playlistIds
                        .length > 1
            )
            .sort(
                (a, b) =>
                    b.playlistIds
                        .length -
                    a.playlistIds
                        .length
            );

    const topArtists =
        Array.from(
            artistFrequency.entries()
        )
            .map(
                ([name, count]) => ({
                    name,
                    count
                })
            )
            .sort(
                (a, b) =>
                    b.count -
                    a.count
            )
            .slice(0, 20);

    const genres =
        Array.from(
            genreFrequency.entries()
        )
            .map(
                ([name, count]) => ({
                    name,
                    count
                })
            )
            .sort(
                (a, b) =>
                    b.count -
                    a.count
            )
            .slice(0, 20);

    const overlap =
    calculateOverlap(
        playlistsTracks
    );

    return {
        summary: {
            totalSongs,
            uniqueSongs,
            artists:
                artistFrequency.size,

            genres:
                genreFrequency.size
        },

        repeatedSongs,

        topArtists,

        genres,

        overlap
    };
}

function calculateOverlap(
    playlistsTracks
) {
    const playlistMap =
        new Map();

    // agrupa tracks por playlist
    for (const track of playlistsTracks) {
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

    const playlistIds =
        Array.from(
            playlistMap.keys()
        );

    const overlap = [];

    for (
        let i = 0;
        i <
        playlistIds.length;
        i++
    ) {
        for (
            let j = i + 1;
            j <
            playlistIds.length;
            j++
        ) {
            const first =
                playlistIds[i];

            const second =
                playlistIds[j];

            const setA =
                playlistMap.get(
                    first
                );

            const setB =
                playlistMap.get(
                    second
                );

            const repeated =
                [...setA].filter(
                    (trackId) =>
                        setB.has(
                            trackId
                        )
                );

            overlap.push({
                playlistA:
                    first,

                playlistB:
                    second,

                repeatedCount:
                    repeated.length,

                repeatedTracks:
                    repeated
            });
        }
    }

    return overlap.sort(
        (a, b) =>
            b.repeatedCount -
            a.repeatedCount
    );
}