import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import {
    AuthProvider
} from "./context/AuthContext";

import {
    PlaylistProvider
} from "./context/PlaylistContext";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <AuthProvider>
        <PlaylistProvider>
            <App />
        </PlaylistProvider>
    </AuthProvider>
);