import express from "express";
import axios from "axios";
import { randomBytes } from "node:crypto";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    spotifyConfig
} from "../config/spotify.js";

import {
    getUserProfile
} from "../services/spotifyService.js";

import {
    createSessionToken,
    setSessionCookie,
    clearSessionCookie
} from "../utils/session.js";

const router =
    express.Router();

const SCOPES = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-private",
    "user-read-email"
].join(" ");

router.get(
    "/login",
    (req, res) => {
        const state =
            randomBytes(16).toString(
                "hex"
            );

        res.cookie(
            "oauth_state",
            state,
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 10 * 60 * 1000
            }
        );

        const authUrl =
            "https://accounts.spotify.com/authorize?" +
            new URLSearchParams({
                response_type:
                    "code",

                client_id:
                    spotifyConfig.clientId,

                scope: SCOPES,

                redirect_uri:
                    spotifyConfig.redirectUri,

                state
            });

        res.redirect(authUrl);
    }
);

router.get(
    "/callback",
    async (req, res) => {
        const {
            code,
            state
        } = req.query;

        if (
            !state ||
            state !==
                req.cookies.oauth_state
        ) {
            return res.status(400).json({
                error:
                    "Invalid state"
            });
        }

        res.clearCookie("oauth_state");

        try {
            const tokenRes =
                await axios.post(
                    "https://accounts.spotify.com/api/token",

                    new URLSearchParams(
                        {
                            code,

                            redirect_uri:
                                spotifyConfig.redirectUri,

                            grant_type:
                                "authorization_code"
                        }
                    ),

                    {
                        headers: {
                            Authorization:
                                "Basic " +
                                Buffer.from(
                                    `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`
                                ).toString(
                                    "base64"
                                ),

                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        }
                    }
                );

            const {
                access_token,
                refresh_token,
                expires_in
            } =
                tokenRes.data;

            const profile =
                await getUserProfile(
                    access_token
                );

            const token =
                createSessionToken({
                    id: profile.id,

                    displayName:
                        profile.display_name,

                    image:
                        profile
                            .images[0]
                            ?.url,

                    accessToken:
                        access_token,

                    refreshToken:
                        refresh_token,

                    expiresAt:
                        Date.now() +
                        expires_in * 1000
                });

            setSessionCookie(res, token);

            res.redirect(
                `${process.env.CLIENT_URL}/playlists`
            );
        } catch (err) {
            console.error(
                "Auth callback failed:",
                err.response?.status ||
                    err.message
            );

            res.status(500).json({
                error:
                    "Auth failed"
            });
        }
    }
);

router.get(
    "/me",
    authMiddleware,
    (req, res) => {
        const {
            id,
            displayName,
            image
        } = req.user;

        res.json({
            id,
            displayName,
            image
        });
    }
);

router.get(
    "/logout",
    (req, res) => {
        clearSessionCookie(res);

        res.redirect(
            process.env.CLIENT_URL
        );
    }
);

export default router;
