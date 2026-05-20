import {
    createContext,
    useContext,
    useState
} from "react";

const PlaylistContext =
    createContext();

export function PlaylistProvider({
    children
}) {
    const [
        selectedPlaylists,
        setSelectedPlaylists
    ] = useState([]);

    function togglePlaylist(playlist) {
        setSelectedPlaylists(
            (prev) => {
                const exists =
                    prev.some((item) => item.id === playlist.id);

                if (exists) {
                    return prev.filter(
                        (item) =>
                            item.id !== playlist.id
                    );
                }

                return [...prev, playlist];
            }
        );
    }

    function clearSelection() {
        setSelectedPlaylists(
            []
        );
    }

    return (
        <PlaylistContext.Provider
            value={{
                selectedPlaylists,
                togglePlaylist,
                clearSelection
            }}
        >
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylists() {
    return useContext(
        PlaylistContext
    );
}