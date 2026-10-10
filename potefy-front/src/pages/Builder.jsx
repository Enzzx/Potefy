import {
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import SectionTitle from "../components/SectionTitle";
import EmptyState from "../components/EmptyState";
import SectionCard from "../components/SectionCard";
import Chip from "../components/Chip";

import {
    usePlaylistBuilder
} from "../context/PlaylistBuilderContext";

import {
    createPlaylist
} from "../api/spotify";

const inputClassName = `
    w-full
    bg-[#121212]
    border border-zinc-700
    rounded-lg
    px-4 py-2.5
    text-sm
    text-zinc-100
    placeholder:text-zinc-600
    focus:outline-none
    focus:border-[#1DB954]
    transition-colors
`;

function chipButtonClass(active) {
    return `
        text-xs
        px-3 py-1
        rounded-full
        border
        transition-colors
        ${
            active
                ? "bg-[#1DB954] border-[#1DB954] text-black font-medium"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        }
    `;
}

export default function Builder() {
    const navigate = useNavigate();

    const {
        analysis,
        builderTracks,
        counts,
        excludeTrack,
        clearExclusions
    } = usePlaylistBuilder();

    const [name, setName] =
        useState("Potefy Mix");

    const [description, setDescription] =
        useState("");

    const [isPublic, setIsPublic] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] = useState(null);

    const [created, setCreated] = useState(null);

    const [query, setQuery] = useState("");

    const [familyFilter, setFamilyFilter] =
        useState("all");

    // Rótulo legível de cada família (a partir da análise).
    const familyLabels = useMemo(() => {
        const map = new Map();

        for (const family of
            analysis?.genreFamilies || []) {
            map.set(family.id, family.label);
        }

        return map;
    }, [analysis]);

    // Artista -> conjunto de famílias, para etiquetar as músicas.
    const artistFamilies = useMemo(() => {
        const genreToFamily = new Map(
            (analysis?.genres || []).map(
                (genre) => [
                    genre.name,
                    genre.family
                ]
            )
        );

        const map = new Map();

        for (const artist of
            analysis?.artists || []) {
            const families = new Set();

            for (const genre of
                artist.genres || []) {
                const family =
                    genreToFamily.get(genre);

                if (family && family !== "other") {
                    families.add(family);
                }
            }

            map.set(artist.id, families);
        }

        return map;
    }, [analysis]);

    // Cada música ganha a lista de famílias e a família principal
    // (a mais frequente entre os artistas da faixa).
    const decoratedTracks = useMemo(() => {
        return builderTracks.map((track) => {
            const frequency = new Map();

            for (const artist of track.artists) {
                const families = artistFamilies.get(
                    artist.id
                );

                if (!families) {
                    continue;
                }

                for (const family of families) {
                    frequency.set(
                        family,
                        (frequency.get(family) ||
                            0) + 1
                    );
                }
            }

            let primaryFamily = null;
            let best = -1;

            for (const [family, value] of
                frequency) {
                if (value > best) {
                    best = value;
                    primaryFamily = family;
                }
            }

            return {
                ...track,
                families: [
                    ...frequency.keys()
                ],
                primaryFamily
            };
        });
    }, [builderTracks, artistFamilies]);

    // Famílias que realmente aparecem nas músicas do Builder.
    const availableFamilies = useMemo(() => {
        const present = new Set();

        for (const track of decoratedTracks) {
            for (const family of track.families) {
                present.add(family);
            }
        }

        return (
            analysis?.genreFamilies || []
        ).filter((family) =>
            present.has(family.id)
        );
    }, [decoratedTracks, analysis]);

    // Aplica busca (nome, álbum, artista) + filtro de família.
    const filteredTracks = useMemo(() => {
        const term = query.trim().toLowerCase();

        return decoratedTracks.filter((track) => {
            if (
                familyFilter !== "all" &&
                !track.families.includes(familyFilter)
            ) {
                return false;
            }

            if (!term) {
                return true;
            }

            return (
                track.name
                    .toLowerCase()
                    .includes(term) ||
                (track.albumName || "")
                    .toLowerCase()
                    .includes(term) ||
                track.artists.some((artist) =>
                    artist.name
                        .toLowerCase()
                        .includes(term)
                )
            );
        });
    }, [decoratedTracks, query, familyFilter]);

    // Agrupa as músicas filtradas por família principal.
    const groups = useMemo(() => {
        const buckets = new Map();

        for (const track of filteredTracks) {
            const key =
                track.primaryFamily || "none";

            if (!buckets.has(key)) {
                buckets.set(key, []);
            }

            buckets.get(key).push(track);
        }

        const order = (
            analysis?.genreFamilies || []
        ).map((family) => family.id);

        return [...buckets.entries()].sort(
            (a, b) => {
                const indexA = order.indexOf(a[0]);
                const indexB = order.indexOf(b[0]);

                return (
                    (indexA === -1
                        ? 999
                        : indexA) -
                    (indexB === -1
                        ? 999
                        : indexB)
                );
            }
        );
    }, [filteredTracks, analysis]);

    async function handleCreate() {
        setError(null);
        setCreated(null);

        if (!name.trim()) {
            setError("Dê um nome para a playlist.");
            return;
        }

        if (builderTracks.length === 0) {
            setError("Adicione pelo menos uma música.");
            return;
        }

        try {
            setSaving(true);

            const result = await createPlaylist({
                name: name.trim(),
                description: description.trim(),
                isPublic,
                trackIds: builderTracks.map(
                    (track) => track.id
                )
            });

            setCreated(result);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                    "Não foi possível criar a playlist."
            );
        } finally {
            setSaving(false);
        }
    }

    if (counts.resolved === 0) {
        return (
            <Layout>
                <SectionTitle
                    title="Playlist Builder"
                    subtitle="Monte sua nova playlist"
                />

                <EmptyState
                    title="Nada selecionado"
                    description="Volte para a análise e selecione músicas, artistas ou gêneros."
                />

                <button
                    onClick={() =>
                        navigate("/analyze")
                    }
                    className="
                        mt-2
                        px-5 py-3
                        rounded-lg
                        bg-[#1DB954]
                        text-black
                        font-medium
                        hover:brightness-95
                        transition
                    "
                >
                    Ir para a análise
                </button>
            </Layout>
        );
    }

    return (
        <Layout>
            <button
                onClick={() => navigate("/analyze")}
                className="
                    mb-4
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    text-zinc-400
                    hover:text-[#1DB954]
                    transition-colors
                "
            >
                ← Voltar
            </button>

            <SectionTitle
                title="Playlist Builder"
                subtitle={`${counts.builder} de ${counts.resolved} músicas`}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* DETALHES */}
                <SectionCard title="Detalhes">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Nome
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Nome da playlist"
                                className={
                                    inputClassName
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Descrição
                            </label>

                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target
                                            .value
                                    )
                                }
                                rows={3}
                                placeholder="Opcional"
                                className={
                                    inputClassName
                                }
                            />
                        </div>

                        <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(event) =>
                                    setIsPublic(
                                        event.target
                                            .checked
                                    )
                                }
                                className="w-4 h-4 accent-[#1DB954]"
                            />

                            Tornar pública
                        </label>
                    </div>

                    {error && (
                        <p className="mt-4 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    {created && (
                        <div className="
                            mt-4
                            p-4
                            rounded-lg
                            bg-[#1DB954]/10
                            border border-[#1DB954]/40
                            text-sm
                        ">
                            <p className="text-[#1DB954] font-medium">
                                Playlist criada com{" "}
                                {created.total}{" "}
                                músicas!
                            </p>

                            {created.url && (
                                <a
                                    href={created.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="
                                        inline-block
                                        mt-2
                                        text-zinc-200
                                        underline
                                        hover:text-white
                                    "
                                >
                                    Abrir no Spotify
                                </a>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={
                            saving ||
                            builderTracks.length === 0
                        }
                        className="
                            mt-6
                            w-full
                            px-5 py-3
                            rounded-lg
                            bg-[#1DB954]
                            text-black
                            font-medium
                            hover:brightness-95
                            transition
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        {saving
                            ? "Criando..."
                            : "Criar playlist"}
                    </button>
                </SectionCard>

                {/* MÚSICAS */}
                <SectionCard
                    title={`Músicas (${counts.builder})`}
                >
                    {counts.excluded > 0 && (
                        <button
                            onClick={clearExclusions}
                            className="
                                mb-4
                                text-sm
                                text-zinc-400
                                hover:text-[#1DB954]
                                transition-colors
                            "
                        >
                            Restaurar{" "}
                            {counts.excluded}{" "}
                            removida(s)
                        </button>
                    )}

                    {builderTracks.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                            Todas as músicas foram
                            removidas. Restaure ou
                            volte para a análise.
                        </p>
                    ) : (
                        <>
                            <input
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    setQuery(
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Pesquisar por nome, álbum ou artista..."
                                className={`
                                    ${inputClassName}
                                    mb-4
                                `}
                            />

                            {availableFamilies.length >
                                0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() =>
                                            setFamilyFilter(
                                                "all"
                                            )
                                        }
                                        className={chipButtonClass(
                                            familyFilter ===
                                                "all"
                                        )}
                                    >
                                        Todos
                                    </button>

                                    {availableFamilies.map(
                                        (family) => (
                                            <button
                                                key={
                                                    family.id
                                                }
                                                onClick={() =>
                                                    setFamilyFilter(
                                                        family.id
                                                    )
                                                }
                                                className={chipButtonClass(
                                                    familyFilter ===
                                                        family.id
                                                )}
                                            >
                                                {
                                                    family.label
                                                }
                                            </button>
                                        )
                                    )}
                                </div>
                            )}

                            {filteredTracks.length ===
                            0 ? (
                                <p className="text-sm text-zinc-500">
                                    Nenhuma música
                                    encontrada.
                                </p>
                            ) : (
                                <div className="
                                    max-h-[32rem]
                                    overflow-y-auto
                                    -mx-2
                                ">
                                    {groups.map(
                                        ([
                                            familyId,
                                            familyTracks
                                        ]) => (
                                            <div
                                                key={
                                                    familyId
                                                }
                                            >
                                                <div className="
                                                    sticky top-0 z-10
                                                    flex items-center
                                                    justify-between
                                                    gap-3
                                                    px-2 py-2
                                                    bg-[#181818]
                                                    border-b border-zinc-800
                                                ">
                                                    <span className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-zinc-400
                                                        font-medium
                                                    ">
                                                        {familyId ===
                                                        "none"
                                                            ? "Sem gênero"
                                                            : familyLabels.get(
                                                                  familyId
                                                              ) ||
                                                              familyId}
                                                    </span>

                                                    <span className="text-xs text-zinc-600">
                                                        {
                                                            familyTracks.length
                                                        }
                                                    </span>
                                                </div>

                                                {familyTracks.map(
                                                    (
                                                        track
                                                    ) => (
                                                        <div
                                                            key={
                                                                track.id
                                                            }
                                                            className="
                                                                flex
                                                                items-center
                                                                gap-3
                                                                px-2 py-2
                                                                rounded-lg
                                                                hover:bg-zinc-800/60
                                                                transition-colors
                                                            "
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm">
                                                                    {
                                                                        track.name
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-zinc-500 truncate">
                                                                    {track.artists
                                                                        .map(
                                                                            (
                                                                                artist
                                                                            ) =>
                                                                                artist.name
                                                                        )
                                                                        .join(
                                                                            ", "
                                                                        )}

                                                                    {track.albumName &&
                                                                        ` · ${track.albumName}`}

                                                                    {track.releaseYear &&
                                                                        ` (${track.releaseYear})`}
                                                                </p>
                                                            </div>

                                                            {track.primaryFamily &&
                                                                track.primaryFamily !==
                                                                    "none" && (
                                                                    <Chip
                                                                        label={
                                                                            familyLabels.get(
                                                                                track.primaryFamily
                                                                            ) ||
                                                                            track.primaryFamily
                                                                        }
                                                                        id={
                                                                            track.primaryFamily
                                                                        }
                                                                        className="shrink-0 hidden sm:inline-flex"
                                                                    />
                                                                )}

                                                            <button
                                                                onClick={() =>
                                                                    excludeTrack(
                                                                        track.id
                                                                    )
                                                                }
                                                                title="Remover da playlist"
                                                                aria-label={`Remover ${track.name}`}
                                                                className="
                                                                    shrink-0
                                                                    w-7 h-7
                                                                    rounded-full
                                                                    text-zinc-500
                                                                    hover:text-red-400
                                                                    hover:bg-zinc-800
                                                                    transition-colors
                                                                "
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            <p className="mt-3 text-xs text-zinc-600">
                                {
                                    filteredTracks.length
                                }{" "}
                                de {counts.builder}{" "}
                                músicas
                            </p>
                        </>
                    )}
                </SectionCard>
            </div>
        </Layout>
    );
}
