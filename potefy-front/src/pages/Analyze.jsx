import {
    useEffect,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import SectionTitle from "../components/SectionTitle";
import Loading from "../components/Loading";
import StatsCard from "../components/StatsCard";
import SectionCard from "../components/SectionCard";
import ExpandableList from "../components/ExpandableList";
import BarRow from "../components/BarRow";
import Chip from "../components/Chip";
import Collapsible from "../components/Collapsible";
import HeatmapGrid from "../components/HeatmapGrid";

import {
    usePlaylists
} from "../context/PlaylistContext";

import {
    usePlaylistBuilder
} from "../context/PlaylistBuilderContext";

import {
    analyzePlaylists
} from "../api/spotify";

export default function Analyze() {
    const navigate = useNavigate();

    const {
        selectedPlaylists
    } = usePlaylists();

    const {
        analysis,
        analysisKey,
        setAnalysis,
        selectedTrackIds,
        selectedArtistIds,
        selectedGenres,
        selectedFamilies,
        toggleTrack,
        toggleArtist,
        toggleGenre,
        toggleFamily,
        clearSelection,
        counts
    } = usePlaylistBuilder();

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        let active = true;

        async function load() {
            const key = selectedPlaylists
                .map(
                    (playlist) =>
                        playlist.id
                )
                .sort()
                .join(",");

            if (
                selectedPlaylists.length ===
                0
            ) {
                if (active) {
                    setLoading(false);
                }

                return;
            }

            // Já temos a análise desse mesmo conjunto de playlists.
            if (
                analysis &&
                key === analysisKey
            ) {
                if (active) {
                    setLoading(false);
                }

                return;
            }

            if (active) {
                setLoading(true);
            }

            try {
                const data =
                    await analyzePlaylists(
                        selectedPlaylists
                    );

                if (active) {
                    setAnalysis(data, key);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [
        selectedPlaylists,
        analysis,
        analysisKey,
        setAnalysis
    ]);

    if (loading) {
        return (
            <Layout>
                <Loading />
            </Layout>
        );
    }

    if (
        selectedPlaylists.length === 0 ||
        !analysis
    ) {
        return (
            <Layout>
                <p>
                    No analysis data.
                </p>
            </Layout>
        );
    }

    const { summary } = analysis;

    const uniquePercent =
        summary.totalSongs > 0
            ? Math.round(
                (summary.uniqueSongs /
                    summary.totalSongs) *
                    100
            )
            : 0;

    const maxArtist =
        analysis.topArtists[0]?.count || 0;

    const maxGenre =
        analysis.genres[0]?.count || 0;

    const maxDecade = Math.max(
        0,
        ...analysis.byDecade.map(
            (item) => item.count
        )
    );

    const heatmapPlaylists =
        selectedPlaylists.map(
            (playlist) => ({
                id: playlist.id,
                name: playlist.name
            })
        );

    return (
        <Layout>
            <SectionTitle
                title="Analysis"
                subtitle={`${selectedPlaylists.length} playlists selected`}
            />

            {analysis.warnings?.length >
                0 && (
                <div className="
                    mb-8
                    rounded-xl
                    border border-amber-900/60
                    bg-amber-950/30
                    p-4
                    text-sm text-amber-200
                    space-y-1
                ">
                    {analysis.warnings.map(
                        (warning) => (
                            <p
                                key={
                                    warning.playlistId
                                }
                            >
                                <span className="font-medium">
                                    {
                                        warning.playlistName
                                    }
                                </span>
                                {": "}
                                {
                                    warning.message
                                }
                            </p>
                        )
                    )}
                </div>
            )}

            {/* SUMMARY */}

            <div className="
                grid
                grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-5
                gap-4
                mb-8
            ">
                <StatsCard
                    title="Total Songs"
                    value={summary.totalSongs}
                />

                <StatsCard
                    title="Unique Songs"
                    value={summary.uniqueSongs}
                >
                    <div className="mt-3">
                        <div className="
                            h-1.5
                            rounded-full
                            bg-zinc-800
                            overflow-hidden
                        ">
                            <div
                                className="
                                    h-full
                                    rounded-full
                                    bg-[#1DB954]
                                "
                                style={{
                                    width: `${uniquePercent}%`
                                }}
                            />
                        </div>

                        <p className="text-xs text-zinc-500 mt-1.5">
                            {uniquePercent}% do
                            total
                        </p>
                    </div>
                </StatsCard>

                <StatsCard
                    title="Artists"
                    value={summary.artists}
                />

                <StatsCard
                    title="Genres"
                    value={summary.genreFamilies}
                >
                    <p className="text-xs text-zinc-500 mt-2">
                        {summary.genres} subgêneros
                    </p>
                </StatsCard>

                <StatsCard
                    title="Avg. Popularity"
                    value={summary.averagePopularity}
                />
            </div>

            <div className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-6
                pb-24
            ">
                {/* REPEATED SONGS */}

                <SectionCard title="Repeated Songs">
                    <p className="text-xs text-zinc-500 mb-3">
                        Clique no círculo para
                        selecionar e na linha
                        para ver as playlists.
                    </p>

                    <ExpandableList
                        items={
                            analysis.repeatedSongs
                        }
                        initialCount={8}
                        emptyMessage="Nenhuma música aparece em mais de uma playlist."
                        renderItem={(song) => (
                            <Collapsible
                                key={song.id}
                                selected={selectedTrackIds.includes(
                                    song.id
                                )}
                                onToggleSelect={() =>
                                    toggleTrack(
                                        song.id
                                    )
                                }
                                selectLabel={`Selecionar ${song.name}`}
                                header={
                                    <div className="
                                        flex
                                        justify-between
                                        items-center
                                        gap-4
                                    ">
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {
                                                    song.name
                                                }
                                            </p>

                                            <p className="text-sm text-zinc-500 truncate">
                                                {song.artists
                                                    .map(
                                                        (
                                                            artist
                                                        ) =>
                                                            artist.name
                                                    )
                                                    .join(
                                                        ", "
                                                    )}
                                            </p>
                                        </div>

                                        <span className="text-sm text-zinc-400 shrink-0">
                                            {
                                                song
                                                    .playlistIds
                                                    .length
                                            }{" "}
                                            playlists
                                        </span>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    {(
                                        song.playlistNames ||
                                        song.playlistIds
                                    ).map(
                                        (
                                            name,
                                            index
                                        ) => (
                                            <Chip
                                                key={`${song.id}-${index}`}
                                                label={name}
                                                id={
                                                    song
                                                        .playlistIds[
                                                        index
                                                    ]
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </Collapsible>
                        )}
                    />
                </SectionCard>

                {/* TOP ARTISTS */}

                <SectionCard title="Top Artists">
                    <ExpandableList
                        items={
                            analysis.topArtists
                        }
                        initialCount={10}
                        emptyMessage="Nenhum artista encontrado."
                        renderItem={(artist) => (
                            <BarRow
                                key={
                                    artist.id ||
                                    artist.name
                                }
                                label={
                                    artist.name
                                }
                                value={artist.count}
                                max={maxArtist}
                                selected={
                                    artist.id
                                        ? selectedArtistIds.includes(
                                            artist.id
                                        )
                                        : false
                                }
                                onClick={
                                    artist.id
                                        ? () =>
                                            toggleArtist(
                                                artist.id
                                            )
                                        : undefined
                                }
                            />
                        )}
                    />
                </SectionCard>

                {/* GENRES */}

                <SectionCard title="Gêneros">
                    <p className="text-xs text-zinc-500 mb-3">
                        Clique no círculo para
                        selecionar a família
                        inteira; expanda para
                        escolher subgêneros.
                    </p>

                    {analysis.genreFamilies.map(
                        (family) => (
                            <Collapsible
                                key={family.id}
                                selected={selectedFamilies.includes(
                                    family.id
                                )}
                                onToggleSelect={() =>
                                    toggleFamily(
                                        family.id
                                    )
                                }
                                selectLabel={`Selecionar ${family.label}`}
                                header={
                                    <div className="
                                        flex
                                        justify-between
                                        items-center
                                        gap-4
                                    ">
                                        <span className="font-medium">
                                            {
                                                family.label
                                            }
                                        </span>

                                        <span className="text-sm text-zinc-400 shrink-0">
                                            {
                                                family.count
                                            }{" "}
                                            músicas
                                        </span>
                                    </div>
                                }
                            >
                                <ExpandableList
                                    items={
                                        family.subgenres
                                    }
                                    initialCount={8}
                                    emptyMessage="Sem subgêneros."
                                    renderItem={(
                                        genre
                                    ) => (
                                        <BarRow
                                            key={
                                                genre.name
                                            }
                                            label={
                                                genre.name
                                            }
                                            value={
                                                genre.count
                                            }
                                            max={
                                                maxGenre
                                            }
                                            labelClassName="capitalize"
                                            selected={selectedGenres.includes(
                                                genre.name
                                            )}
                                            onClick={() =>
                                                toggleGenre(
                                                    genre.name
                                                )
                                            }
                                        />
                                    )}
                                />
                            </Collapsible>
                        )
                    )}
                </SectionCard>

                {/* OVERLAP */}

                <SectionCard title="Overlap">
                    <HeatmapGrid
                        playlists={
                            heatmapPlaylists
                        }
                        overlap={
                            analysis.overlap
                        }
                    />
                </SectionCard>

                {/* BY DECADE */}

                <SectionCard title="Por década">
                    <ExpandableList
                        items={analysis.byDecade}
                        initialCount={10}
                        emptyMessage="Sem dados de ano de lançamento."
                        renderItem={(item) => (
                            <BarRow
                                key={item.decade}
                                label={item.decade}
                                value={item.count}
                                max={maxDecade}
                            />
                        )}
                    />
                </SectionCard>

                {/* POPULARITY */}

                <SectionCard title="Mais populares">
                    <div className="
                        mb-4
                        flex items-baseline gap-2
                    ">
                        <span className="text-2xl font-semibold">
                            {
                                summary.averagePopularity
                            }
                        </span>

                        <span className="text-sm text-zinc-500">
                            popularidade média
                        </span>
                    </div>

                    <ExpandableList
                        items={
                            analysis.topPopular
                        }
                        initialCount={5}
                        emptyMessage="Sem dados de popularidade."
                        renderItem={(track) => (
                            <BarRow
                                key={track.id}
                                label={track.name}
                                title={track.artists
                                    .map(
                                        (artist) =>
                                            artist.name
                                    )
                                    .join(", ")}
                                value={
                                    track.popularity
                                }
                                max={100}
                                selected={selectedTrackIds.includes(
                                    track.id
                                )}
                                onClick={() =>
                                    toggleTrack(
                                        track.id
                                    )
                                }
                            />
                        )}
                    />
                </SectionCard>

                {/* PLAYLIST BREAKDOWN */}

                <SectionCard title="Distribuição por playlist">
                    {analysis.playlistBreakdown
                        .length === 0 && (
                        <p className="text-sm text-zinc-500">
                            Sem dados.
                        </p>
                    )}

                    {analysis.playlistBreakdown.map(
                        (playlist) => (
                            <div
                                key={playlist.id}
                                className="mb-4 last:mb-0"
                            >
                                <div className="
                                    flex
                                    justify-between
                                    items-baseline
                                    gap-3
                                    text-sm
                                    mb-1.5
                                ">
                                    <span className="truncate text-zinc-200">
                                        {
                                            playlist.name
                                        }
                                    </span>

                                    <span className="text-zinc-400 shrink-0">
                                        {
                                            playlist.total
                                        }{" "}
                                        músicas
                                    </span>
                                </div>

                                <div className="
                                    h-2
                                    rounded-full
                                    bg-zinc-800
                                    overflow-hidden
                                    flex
                                ">
                                    <div
                                        className="h-full bg-[#1DB954]"
                                        style={{
                                            width: `${
                                                playlist.total
                                                    ? (playlist.exclusive /
                                                        playlist.total) *
                                                      100
                                                    : 0
                                            }%`
                                        }}
                                        title={`${playlist.exclusive} exclusivas`}
                                    />

                                    <div
                                        className="h-full bg-zinc-500"
                                        style={{
                                            width: `${
                                                playlist.total
                                                    ? (playlist.shared /
                                                        playlist.total) *
                                                      100
                                                    : 0
                                            }%`
                                        }}
                                        title={`${playlist.shared} compartilhadas`}
                                    />
                                </div>

                                <p className="text-xs text-zinc-500 mt-1">
                                    {
                                        playlist.exclusive
                                    }{" "}
                                    exclusivas ·{" "}
                                    {
                                        playlist.shared
                                    }{" "}
                                    compartilhadas
                                </p>
                            </div>
                        )
                    )}
                </SectionCard>
            </div>

            {/* SELECTION BAR */}

            {counts.resolved > 0 && (
                <div className="
                    fixed
                    bottom-0 left-0 right-0
                    z-40
                    border-t border-zinc-800
                    bg-[#121212]/95
                    backdrop-blur-sm
                ">
                    <div className="
                        max-w-7xl
                        mx-auto
                        px-6 py-4
                        flex items-center
                        justify-between
                        gap-4
                    ">
                        <div className="
                            flex items-center
                            gap-4
                            text-sm
                            min-w-0
                        ">
                            <span className="font-medium shrink-0">
                                {
                                    counts.resolved
                                }{" "}
                                músicas
                            </span>

                            <span className="text-zinc-500 truncate">
                                {
                                    counts.artists
                                }{" "}
                                artistas ·{" "}
                                {
                                    counts.families
                                }{" "}
                                famílias ·{" "}
                                {
                                    counts.genres
                                }{" "}
                                subgêneros
                            </span>
                        </div>

                        <div className="
                            flex items-center
                            gap-3
                            shrink-0
                        ">
                            <button
                                onClick={
                                    clearSelection
                                }
                                className="
                                    text-sm
                                    text-zinc-400
                                    hover:text-zinc-200
                                    transition-colors
                                "
                            >
                                Limpar
                            </button>

                            <button
                                onClick={() =>
                                    navigate(
                                        "/builder"
                                    )
                                }
                                className="
                                    px-5 py-2.5
                                    rounded-lg
                                    bg-[#1DB954]
                                    text-black
                                    font-medium
                                    hover:brightness-95
                                    transition
                                "
                            >
                                Abrir Builder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
