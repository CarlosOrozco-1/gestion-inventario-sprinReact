import { create } from "zustand";

const getSafeUser = () => {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
};

export const useAuthStore = create((set) => ({

user: getSafeUser(),
token: localStorage.getItem("token") || null,
isAuthenticated: !!localStorage.getItem("token"),

// Función para guardar los datos cuando el login sea exitoso.

login: (userData, tokenData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);

    set({
        user: userData,
        token: tokenData,
        isAuthenticated: true,
    })
},

// Función para cerrar sesión.

logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    set({
        user: null,
        token: null,
        isAuthenticated: false,
    })
}
}));