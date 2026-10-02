import axios from "axios";

// Creamos una instancia de axios preconfigurada.

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    timeout: 10000, // 10 segundos
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor para interceptar las PETICIONES (requests) antes de que salgan
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de RESPUESTAS: el backend ya devuelve siempre un JSON con
// { message, details } en los errores. Sin esto, cada componente repetia el mismo
// try/catch con strings genericos y un 403 por falta de permisos terminaba
// mostrandose como "Ocurrio un error al guardar. Verifica los datos.", que
// manda al usuario a corregir datos que estaban bien. Se extrae el mensaje real
// del servidor y se deja disponible en error.response.data.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error?.response?.data;

        if (data && typeof data === "object") {
            if (data.message) {
                error.mensajeUsuario = data.message;
            }
            // Los errores de validacion vienen campo por campo en `details`.
            if (data.details && typeof data.details === "object") {
                const campos = Object.entries(data.details)
                    .map(([campo, texto]) => `${campo}: ${texto}`)
                    .join(" ");
                if (campos) {
                    error.mensajeUsuario = campos;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;