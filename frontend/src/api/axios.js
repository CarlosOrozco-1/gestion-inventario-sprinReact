import axios from "axios";

// Creamos una instancia de axios preconfigurada.

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    timeout: 10000, // 10 segundos
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor para manejar respuestas del backend
api.interceptors.response.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Aqui podemos agregar tokens de autenticación si fuera necesario.
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;