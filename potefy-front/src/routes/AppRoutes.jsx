import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Home from "../pages/Home";
import Playlists from "../pages/Playlists";
import Analyze from "../pages/Analyze";
import PlaylistDetails from "../pages/PlaylistDetails";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/playlists"
                    element={
                        <ProtectedRoute>
                            <Playlists />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/analyze"
                    element={
                        <ProtectedRoute>
                            <Analyze />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/playlist/:id"
                    element={
                        <ProtectedRoute>
                            <PlaylistDetails />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}