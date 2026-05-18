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

        genres
    };
}

