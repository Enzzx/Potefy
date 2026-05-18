import api from "./axios";

export async function getCurrentUser() {
    const req = await api.get("/auth/me");
    return req.data;
}

export async function loginSpotify() {
    window.location.href =
        "http://127.0.0.1:3000/api/auth/login";
}

export async function getUserPlaylists() {
    const req = await api.get("/spotify/playlists");
    return req.data;
}

export async function analyzePlaylists(
    playlistIds
) {
    const req =
        await api.post(
            "/spotify/analyze",
            {
                playlistIds
            }
        );

    return req.data;
}

export async function getPlaylistById(id) {
    const req = await api.get(
        `/spotify/playlists/${id}`
    );

    return req.data;
}