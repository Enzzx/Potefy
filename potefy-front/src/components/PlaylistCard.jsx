export default function PlaylistCard({
    playlist,
    selected,
    onSelect
}) {
    return (
        <button
            onClick={() =>
                onSelect(playlist.id)
            }
            className={`
                w-full text-left
                p-5 rounded-xl
                border transition-all
                duration-150
                bg-[#181818]
                hover:bg-[#1d1d1d]

                ${
                    selected
                        ? "border-[#1DB954]"
                        : "border-zinc-800"
                }
            `}
        >
            <div className="flex gap-4">
                <img
                    src={
                        playlist.image ||
                        "/placeholder.png"
                    }
                    alt={playlist.name}
                    className="w-16 h-16 rounded-md object-cover bg-zinc-800"
                />

                <div className="min-w-0">
                    <h2 className="font-medium truncate">
                        {playlist.name}
                    </h2>

                    <p className="text-sm text-zinc-400 mt-1">
                        {
                            playlist.totalTracks
                        }{" "}
                        músicas
                    </p>

                    <p className="text-xs text-zinc-500 mt-2 truncate">
                        {
                            playlist.owner
                        }
                    </p>
                </div>
            </div>
        </button>
    );
}