import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { login } = useAuth();

    return (
        <Layout>
            <div className="py-20 max-w-2xl">
                <h1 className="text-3xl font-semibold">
                    Spotify Playlist
                    Analytics
                </h1>

                <p className="text-zinc-400 mt-4">
                    Analise playlists,
                    músicas, artistas e
                    duplicatas. Monte novas
                    playlists a partir do que
                    você descobrir.
                </p>

                <button
                    onClick={login}
                    className="
                        mt-8
                        px-6 py-3
                        rounded-lg
                        bg-[#1DB954]
                        text-black
                        font-medium
                        hover:brightness-95
                        transition
                    "
                >
                    Entrar com Spotify
                </button>
            </div>
        </Layout>
    );
}
