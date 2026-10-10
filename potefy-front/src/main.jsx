import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import {
    AuthProvider
} from "./context/AuthContext";

import {
    PlaylistProvider
} from "./context/PlaylistContext";

import {
    PlaylistBuilderProvider
} from "./context/PlaylistBuilderContext";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <AuthProvider>
        <PlaylistProvider>
            <PlaylistBuilderProvider>
                <App />
            </PlaylistBuilderProvider>
        </PlaylistProvider>
    </AuthProvider>
);
