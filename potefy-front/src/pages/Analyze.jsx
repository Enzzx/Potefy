import {
    useEffect,
    useState
} from "react";

import Layout from "../components/Layout";
import SectionTitle from "../components/SectionTitle";
import Loading from "../components/Loading";
import StatsCard from "../components/StatsCard";
import SectionCard from "../components/SectionCard";

import {
    usePlaylists
} from "../context/PlaylistContext";

import {
    analyzePlaylists
} from "../api/spotify";

export default function Analyze() {
    const {
        selectedPlaylists
    } = usePlaylists();

    const [loading, setLoading] =
        useState(true);

    const [analysis, setAnalysis] =
        useState(null);

    useEffect(() => {
        async function load() {
            try {
                const data =
                    await analyzePlaylists(
                        selectedPlaylists
                    );

                setAnalysis(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (
            selectedPlaylists.length
        ) {
            load();
        }
    }, [selectedPlaylists]);

    if (loading) {
        return (
            <Layout>
                <Loading />
            </Layout>
        );
    }

    if (!analysis) {
        return (
            <Layout>
                <p>
                    No analysis data.
                </p>
            </Layout>
        );
    }

    return (
        <Layout>
            <SectionTitle
                title="Analysis"
                subtitle={`${selectedPlaylists.length} playlists selected`}
            />

            {/* SUMMARY */}

            <div className="
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-4
                gap-4
                mb-8
            ">
                <StatsCard
                    title="Total Songs"
                    value={
                        analysis
                            .summary
                            .totalSongs
                    }
                />

                <StatsCard
                    title="Unique Songs"
                    value={
                        analysis
                            .summary
                            .uniqueSongs
                    }
                />

                <StatsCard
                    title="Artists"
                    value={
                        analysis
                            .summary
                            .artists
                    }
                />

                <StatsCard
                    title="Genres"
                    value={
                        analysis
                            .summary
                            .genres
                    }
                />
            </div>

            <div className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-6
            ">
                {/* REPEATED SONGS */}

                <SectionCard title="Repeated Songs">
                    <div className="space-y-4">
                        {analysis.repeatedSongs
                            .slice(
                                0,
                                15
                            )
                            .map(
                                (
                                    song
                                ) => (
                                    <div
                                        key={
                                            song.id
                                        }
                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            border-b
                                            border-zinc-800
                                            pb-3
                                        "
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {
                                                    song.name
                                                }
                                            </p>

                                            <p className="text-sm text-zinc-500">
                                                {song.artists
                                                    .map(
                                                        (
                                                            a
                                                        ) =>
                                                            a.name
                                                    )
                                                    .join(
                                                        ", "
                                                    )}
                                            </p>
                                        </div>

                                        <span className="text-sm text-zinc-400">
                                            {
                                                song
                                                    .playlistIds
                                                    .length
                                            }{" "}
                                            playlists
                                        </span>
                                    </div>
                                )
                            )}
                    </div>
                </SectionCard>

                {/* TOP ARTISTS */}

                <SectionCard title="Top Artists">
                    <div className="space-y-4">
                        {analysis.topArtists.map(
                            (
                                artist
                            ) => (
                                <div
                                    key={
                                        artist.name
                                    }
                                    className="
                                        flex
                                        justify-between
                                        border-b
                                        border-zinc-800
                                        pb-3
                                    "
                                >
                                    <span>
                                        {
                                            artist.name
                                        }
                                    </span>

                                    <span className="text-zinc-400">
                                        {
                                            artist.count
                                        }
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </SectionCard>

                {/* GENRES */}

                <SectionCard title="Genres">
                    <div className="space-y-4">
                        {analysis.genres.map(
                            (
                                genre
                            ) => (
                                <div
                                    key={
                                        genre.name
                                    }
                                    className="
                                        flex
                                        justify-between
                                        border-b
                                        border-zinc-800
                                        pb-3
                                    "
                                >
                                    <span className="capitalize">
                                        {
                                            genre.name
                                        }
                                    </span>

                                    <span className="text-zinc-400">
                                        {
                                            genre.count
                                        }
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </SectionCard>
            </div>
        </Layout>
    );
}