import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    getUserPlaylists
} from "../services/spotifyService.js";

import {
    getPlaylistTracks,
    getArtists
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
                playlistIds
            } = req.body;

            let allTracks =
                [];

            const artistIds =
                new Set();

            // pega tracks
            for (const playlistId of playlistIds) {
                const rawTracks =
                    await getPlaylistTracks(
                        req.user
                            .accessToken,
                        playlistId
                    ); 
                
                const tracks =
                    normalizeTracks(
                        rawTracks,
                        playlistId
                    );
                    

                allTracks.push(
                    ...tracks
                );

                for (const track of tracks) {
                    for (const artist of
                        track.artists) {
                        artistIds.add(
                            artist.id
                        );
                    }
                }
            }

            const artists =
                await getArtists(
                    req.user
                        .accessToken,

                    Array.from(
                        artistIds
                    )
                );

            console.log("lista artistas: ", artists)
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
                    artistsMap
                );

            res.json(
                analysis
            );
        } catch (err) {
            //console.error(err);

            res.status(500).json({
                error:
                    "Analyze failed"
            });
        }
    }
);
export default router;