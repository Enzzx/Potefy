export default function normalizeTracks(
    rawTracks,
    playlistId
) {
    return rawTracks
        .filter(
            (item) => item.item
        )
        .map((item) => {
            const track =
                item.item;

            return {
                id: track.id,

                name: track.name,

                artists:
                    track.artists.map(
                        (
                            artist
                        ) => ({
                            id: artist.id,
                            name:
                                artist.name
                        })
                    ),

                durationMs:
                    track.duration_ms,

                explicit:
                    track.explicit,

                playlistIds: [
                    playlistId
                ]
            };
        });
}