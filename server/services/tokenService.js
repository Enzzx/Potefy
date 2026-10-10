import axios from "axios";

import { spotifyConfig } from "../config/spotify.js";

const TOKEN_URL = "https://accounts.spotify.com/api/token";

function basicAuthHeader() {
    return (
        "Basic " +
        Buffer.from(
            `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`
        ).toString("base64")
    );
}

export async function refreshAccessToken(refreshToken) {
    const response = await axios.post(
        TOKEN_URL,

        new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken
        }),

        {
            headers: {
                Authorization: basicAuthHeader(),
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    // { access_token, expires_in, refresh_token?, scope, token_type }
    return response.data;
}
