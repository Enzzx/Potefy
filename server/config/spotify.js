import 'dotenv/config';

export const spotifyConfig = {
    clientId:
        process.env
            .SPOTIFY_CLIENT_ID,

    clientSecret:
        process.env
            .SPOTIFY_CLIENT_SECRET,

    redirectUri:
        "http://127.0.0.1:3000/api/auth/callback"
};