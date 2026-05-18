import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:3000/api",
    withCredentials: true
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = "/";
        }

        return Promise.reject(error);
    }
);

export default api;