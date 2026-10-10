import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    getUserPlaylists
} from "../services/spotifyService.js";

import {
    getPlaylistTracks,
    getArtists,
    createPlaylist,
    addPlaylistTracks
} from "../services/spotifyService.js";

import normalizeTracks from "../utils/normalizeTracks.js";

import {
    analyzePlaylists
} from "../services/analyticsService.js";


const router =
    express.Router();

router.get(
    "/playlists",
    authMiddleware,
    async (req, res) => {
        try {
            const playlists =
                await getUserPlaylists(
                    req.user
                        .accessToken
                );

            res.json(
                playlists
            );
        } catch (err) {
            //console.error(err);

            res.status(500).json({
                error:
                    "Failed to get playlists"
            });
        }
    }
);

router.post(
    "/analyze",
    authMiddleware,
    async (req, res) => {
        try {
            const {
                playlists
            } = req.body;

            if (
                !Array.isArray(playlists) ||
                playlists.length === 0
            ) {
                return res.status(400).json({
                    error:
                        "At least one playlist is required"
                });
            }

            const validPlaylists =
                playlists.filter(
                    (playlist) =>
                        playlist &&
                        typeof playlist.id ===
                            "string" &&
                        playlist.id
                );

            if (
                validPlaylists.length === 0
            ) {
                return res.status(400).json({
                    error:
                        "Invalid playlists payload"
                });
            }

            const accessToken =
                req.user.accessToken;

            const playlistsMap = new Map(
                validPlaylists.map(
                    (playlist) => [
                        playlist.id,
                        playlist.name ||
                            playlist.id
                    ]
                )
            );

            const warnings = [];

            let allTracks = [];

            const artistIds = new Set();

            for (const playlist of validPlaylists) {
                try {
                    const rawTracks =
                        await getPlaylistTracks(
                            accessToken,
                            playlist.id
                        );

                    const tracks =
                        normalizeTracks(
                            rawTracks,
                            playlist.id
                        );

                    allTracks.push(...tracks);

                    for (const track of tracks) {
                        for (const artist of
                            track.artists) {
                            if (artist.id) {
                                artistIds.add(
                                    artist.id
                                );
                            }
                        }
                    }
                } catch (err) {
                    console.error(
                        `Failed to load playlist ${playlist.id}:`,
                        err.response?.status ||
                            err.message
                    );

                    warnings.push({
                        playlistId:
                            playlist.id,

                        playlistName:
                            playlistsMap.get(
                                playlist.id
                            ),

                        message:
                            "Could not load this playlist"
                    });
                }
            }

            const artists =
                await getArtists(
                    accessToken,

                    Array.from(
                        artistIds
                    )
                );

            const artistsMap =
                new Map(
                    artists.map(
                        (
                            artist
                        ) => [
                            artist.id,
                            artist
                        ]
                    )
                );

            const analysis =
                await analyzePlaylists(
                    allTracks,
                    artistsMap,
                    playlistsMap
                );

            analysis.warnings = warnings;

            res.json(
                analysis
            );
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error:
                    "Analyze failed"
            });
        }
    }
);

router.post(
    "/playlists",
    authMiddleware,
    async (req, res) => {
        try {
            const {
                name,
                description,
                trackIds,
                isPublic
            } = req.body;

            if (
                typeof name !== "string" ||
                !name.trim()
            ) {
                return res.status(400).json({
                    error:
                        "Playlist name is required"
                });
            }

            if (
                !Array.isArray(trackIds) ||
                trackIds.length === 0
            ) {
                return res.status(400).json({
                    error:
                        "At least one track is required"
                });
            }

            // Reconstrói as URIs do Spotify a partir dos IDs das
            // faixas (não guardamos a URI na análise para economizar
            // memória) e remove duplicatas.
            const uris = [
                ...new Set(
                    trackIds
                        .filter(
                            (id) =>
                                typeof id ===
                                    "string" &&
                                id
                        )
                        .map(
                            (id) =>
                                `spotify:track:${id}`
                        )
                )
            ];

            if (uris.length === 0) {
                return res.status(400).json({
                    error:
                        "Invalid trackIds payload"
                });
            }

            const accessToken =
                req.user.accessToken;

            const playlist =
                await createPlaylist(
                    accessToken,
                    {
                        name: name.trim(),

                        description:
                            typeof description ===
                            "string"
                                ? description.trim()
                                : "",

                        isPublic: Boolean(
                            isPublic
                        )
                    }
                );

            await addPlaylistTracks(
                accessToken,
                playlist.id,
                uris
            );

            res.status(201).json({
                id: playlist.id,
                name: playlist.name,

                url:
                    playlist.external_urls
                        ?.spotify || null,

                total: uris.length
            });
        } catch (err) {
            console.error(
                "Failed to create playlist:",
                err.response?.data ||
                    err.message
            );

            res.status(502).json({
                error:
                    "Failed to create playlist on Spotify"
            });
        }
    }
);

export default router;