import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import Layout from "../components/Layout";
import PlaylistCard from "../components/PlaylistCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import SectionTitle from "../components/SectionTitle";

import {
    getUserPlaylists
} from "../api/spotify";

import {
    usePlaylists
} from "../context/PlaylistContext";

export default function Playlists() {
    const navigate =
        useNavigate();

    const [playlists, setPlaylists] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const {
        selectedPlaylists,
        togglePlaylist
    } = usePlaylists();

    useEffect(() => {
        async function load() {
            try {
                const data =
                    await getUserPlaylists();

                setPlaylists(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    const filteredPlaylists =
        useMemo(() => {
            return playlists.filter(
                (playlist) =>
                    playlist.name
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )
            );
        }, [playlists, search]);

    return (
        <Layout>
            <SectionTitle
                title="Your Playlists"
                subtitle="Select playlists to analyze"
            />

            <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">

                <input
                    type="text"
                    placeholder="Search playlists..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    className="
                        bg-[#181818]
                        border border-zinc-800
                        rounded-lg
                        px-4 py-3
                        outline-none
                        w-full md:w-80
                        focus:border-zinc-700
                        transition-colors
                    "
                />

                <div className="flex items-center justify-between md:justify-end gap-5">

                    <span className="text-sm text-zinc-500">
                        Selected:
                        {" "}
                        {
                            selectedPlaylists.length
                        }
                    </span>

                    <button
                        disabled={
                            selectedPlaylists.length ===
                            0
                        }
                        onClick={() =>
                            navigate(
                                "/analyze"
                            )
                        }
                        className="
                            px-5 py-3
                            rounded-lg
                            bg-[#1DB954]
                            text-black
                            font-medium
                            hover:brightness-95
                            transition
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                        "
                    >
                        Analyze
                    </button>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : filteredPlaylists.length ===
              0 ? (
                <EmptyState
                    title="No playlists found"
                    description="Try another search."
                />
            ) : (
                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-4
                ">
                    {filteredPlaylists.map(
                        (
                            playlist
                        ) => (
                            <PlaylistCard
                                key={
                                    playlist.id
                                }
                                playlist={
                                    playlist
                                }
                                selected={selectedPlaylists.includes(
                                    playlist.id
                                )}
                                onSelect={
                                    togglePlaylist
                                }
                            />
                        )
                    )}
                </div>
            )}
        </Layout>
    );
}