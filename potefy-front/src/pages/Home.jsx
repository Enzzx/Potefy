import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { login } = useAuth();

    return (
        <div>
            <h1>
                Spotify Playlist Analytics
            </h1>

            <p>
                Analise playlists,
                músicas, artistas e
                duplicatas.
            </p>

            <button onClick={login}>
                Entrar com Spotify
            </button>
        </div>
    );
}