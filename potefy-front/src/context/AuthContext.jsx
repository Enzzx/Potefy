import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    getCurrentUser,
    loginSpotify
} from "../api/spotify";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] =
        useState(true);

    async function loadUser() {
        try {
            const userData =
                await getCurrentUser();

            setUser(userData);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUser();
    }, []);

    function login() {
        loginSpotify();
    }

    function logout() {
        window.location.href =
            "http://localhost:3000/api/auth/logout";
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}