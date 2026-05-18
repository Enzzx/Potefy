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

    function togglePlaylist(id) {
        setSelectedPlaylists(
            (prev) => {
                const exists =
                    prev.includes(id);

                if (exists) {
                    return prev.filter(
                        (item) =>
                            item !== id
                    );
                }

                return [...prev, id];
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