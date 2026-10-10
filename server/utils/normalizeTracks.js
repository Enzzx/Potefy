export default function normalizeTracks(
    rawTracks,
    playlistId
) {
    return rawTracks
        .map((entry) => entry?.item ?? entry?.track)
        .filter((track) => track)
        .filter(
            (track) =>
                track.type === "track" &&
                track.id
        )
        .map((track) => {
            const releaseDate =
                track.album?.release_date ||
                null;

            const releaseYear = releaseDate
                ? parseInt(
                    releaseDate.slice(
                        0,
                        4
                    ),
                    10
                ) || null
                : null;

            return {
                id: track.id,

                name: track.name,

                artists: Array.isArray(
                    track.artists
                )
                    ? track.artists.map(
                        (
                            artist
                        ) => ({
                            id: artist.id,
                            name:
                                artist.name
                        })
                    )
                    : [],

                albumName:
                    track.album?.name ||
                    null,

                releaseYear,

                popularity:
                    track.popularity ?? 0,

                durationMs:
                    track.duration_ms ??
                    0,

                explicit:
                    Boolean(
                        track.explicit
                    ),

                playlistIds: [
                    playlistId
                ]
            };
        });
}