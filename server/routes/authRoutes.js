import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    spotifyConfig
} from "../config/spotify.js";

import {
    getUserProfile
} from "../services/spotifyService.js";

const router =
    express.Router();

router.get(
    "/login",
    (req, res) => {
        const scope = "playlist-read-private playlist-read-collaborative user-read-private user-read-email";
        
        const authUrl =
            "https://accounts.spotify.com/authorize?" +
            new URLSearchParams({
                response_type:
                    "code",

                client_id:
                    spotifyConfig.clientId,

                scope,

                redirect_uri:
                    spotifyConfig.redirectUri
            });

        res.redirect(authUrl);
    }
);

router.get(
    "/callback",
    async (req, res) => {
        const { code } =
            req.query;

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
                access_token
            } =
                tokenRes.data;

            const profile =
                await getUserProfile(
                    access_token
                );

            const token =
                jwt.sign(
                    {
                        id: profile.id,
                        displayName:
                            profile.display_name,

                        image:
                            profile
                                .images[0]
                                ?.url,

                        accessToken:
                            access_token
                    },

                    process.env
                        .JWT_SECRET,

                    {
                        expiresIn:
                            "7d"
                    }
                );

            res.cookie(
                "token",
                token,
                {
                    httpOnly: true,
                    secure: false,
                    sameSite:
                        "lax"
                }
            );

            res.redirect(
                `${process.env.CLIENT_URL}/playlists`
            );
        } catch (err) {
            //console.error(err);

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
        res.json(req.user);
    }
);

router.get(
    "/logout",
    (req, res) => {
        res.clearCookie(
            "token"
        );

        res.redirect(
            process.env.CLIENT_URL
        );
    }
);

export default router;