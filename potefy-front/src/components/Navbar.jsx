import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } =
        useAuth();

    return (
        <header className="shrink-0 border-b border-zinc-800 bg-[#121212]/90 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-sm font-semibold text-black">
                        ♪
                    </div>

                    <div>
                        <h1 className="text-sm font-medium">
                            Playlist Analytics
                        </h1>
                    </div>
                </div>

                {user && (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-zinc-200">
                                {user.displayName}
                            </p>

                            <p className="text-xs text-zinc-500">
                                Spotify
                            </p>
                        </div>

                        {user.image && (
                            <img
                                src={user.image}
                                alt="profile"
                                className="w-9 h-9 rounded-full"
                            />
                        )}

                        <button
                            onClick={logout}
                            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}