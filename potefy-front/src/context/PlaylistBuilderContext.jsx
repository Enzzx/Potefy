import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState
} from "react";

const PlaylistBuilderContext =
    createContext();

function toggleInArray(list, value) {
    return list.includes(value)
        ? list.filter(
            (item) => item !== value
        )
        : [...list, value];
}

export function PlaylistBuilderProvider({
    children
}) {
    const [analysis, setAnalysisState] =
        useState(null);

    const [analysisKey, setAnalysisKey] =
        useState(null);

    const [selectedTrackIds, setSelectedTrackIds] =
        useState([]);

    const [selectedArtistIds, setSelectedArtistIds] =
        useState([]);

    const [selectedGenres, setSelectedGenres] =
        useState([]);

    const [selectedFamilies, setSelectedFamilies] =
        useState([]);

    // Faixas que o usuário removeu manualmente no Builder
    // (a seleção de critérios continua igual).
    const [excludedTrackIds, setExcludedTrackIds] =
        useState([]);

    const analysisKeyRef = useRef(null);

    const clearSelection = useCallback(() => {
        setSelectedTrackIds([]);
        setSelectedArtistIds([]);
        setSelectedGenres([]);
        setSelectedFamilies([]);
        setExcludedTrackIds([]);
    }, []);

    // Guarda a análise; se for de um conjunto novo de playlists,
    // limpa a seleção (as músicas podem ter mudado).
    const setAnalysis = useCallback(
        (data, key) => {
            setAnalysisState(data);

            if (
                analysisKeyRef.current !== key
            ) {
                analysisKeyRef.current = key;

                setSelectedTrackIds([]);
                setSelectedArtistIds([]);
                setSelectedGenres([]);
                setSelectedFamilies([]);
                setExcludedTrackIds([]);
            }

            setAnalysisKey(key);
        },
        []
    );

    const toggleTrack = useCallback((id) => {
        setSelectedTrackIds((prev) =>
            toggleInArray(prev, id)
        );
    }, []);

    const toggleArtist = useCallback((id) => {
        setSelectedArtistIds((prev) =>
            toggleInArray(prev, id)
        );
    }, []);

    const toggleGenre = useCallback((name) => {
        setSelectedGenres((prev) =>
            toggleInArray(prev, name)
        );
    }, []);

    const toggleFamily = useCallback((id) => {
        setSelectedFamilies((prev) =>
            toggleInArray(prev, id)
        );
    }, []);

    const excludeTrack = useCallback((id) => {
        setExcludedTrackIds((prev) =>
            prev.includes(id)
                ? prev
                : [...prev, id]
        );
    }, []);

    const restoreTrack = useCallback((id) => {
        setExcludedTrackIds((prev) =>
            prev.filter((item) => item !== id)
        );
    }, []);

    const clearExclusions = useCallback(() => {
        setExcludedTrackIds([]);
    }, []);

    // União: uma faixa entra se qualquer critério bater
    // (música escolhida OU artista escolhido OU gênero escolhido).
    const resolvedTracks = useMemo(() => {
        if (!analysis?.tracks) {
            return [];
        }

        const trackSelection =
            new Set(selectedTrackIds);

        const artistSelection =
            new Set(selectedArtistIds);

        const genreSelection =
            new Set(selectedGenres);

        const familySelection =
            new Set(selectedFamilies);

        const hasCriteria =
            trackSelection.size > 0 ||
            artistSelection.size > 0 ||
            genreSelection.size > 0 ||
            familySelection.size > 0;

        if (!hasCriteria) {
            return [];
        }

        // Mapa subgênero -> família, montado a partir da análise.
        const genreToFamily = new Map(
            (analysis.genres || []).map(
                (genre) => [
                    genre.name,
                    genre.family
                ]
            )
        );

        const artistGenres = new Map(
            (analysis.artists || []).map(
                (artist) => [
                    artist.id,
                    artist.genres || []
                ]
            )
        );

        return analysis.tracks.filter(
            (track) => {
                if (
                    trackSelection.has(
                        track.id
                    )
                ) {
                    return true;
                }

                return track.artists.some(
                    (artist) => {
                        if (
                            artistSelection.has(
                                artist.id
                            )
                        ) {
                            return true;
                        }

                        const genres =
                            artistGenres.get(
                                artist.id
                            ) || [];

                        return genres.some(
                            (genre) =>
                                genreSelection.has(
                                    genre
                                ) ||
                                familySelection.has(
                                    genreToFamily.get(
                                        genre
                                    )
                                )
                        );
                    }
                );
            }
        );
    }, [
        analysis,
        selectedTrackIds,
        selectedArtistIds,
        selectedGenres,
        selectedFamilies
    ]);

    // Lista final do Builder = união dos critérios menos as
    // faixas removidas manualmente.
    const builderTracks = useMemo(() => {
        if (excludedTrackIds.length === 0) {
            return resolvedTracks;
        }

        const excluded = new Set(
            excludedTrackIds
        );

        return resolvedTracks.filter(
            (track) => !excluded.has(track.id)
        );
    }, [resolvedTracks, excludedTrackIds]);

    const counts = {
        tracks: selectedTrackIds.length,
        artists: selectedArtistIds.length,
        genres: selectedGenres.length,
        families: selectedFamilies.length,
        resolved: resolvedTracks.length,
        builder: builderTracks.length,
        excluded: excludedTrackIds.length
    };

    return (
        <PlaylistBuilderContext.Provider
            value={{
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
                excludeTrack,
                restoreTrack,
                clearExclusions,
                clearSelection,
                resolvedTracks,
                builderTracks,
                excludedTrackIds,
                counts
            }}
        >
            {children}
        </PlaylistBuilderContext.Provider>
    );
}

export function usePlaylistBuilder() {
    return useContext(
        PlaylistBuilderContext
    );
}
