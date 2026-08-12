import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser && savedUser !== 'undefined' && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      // Autenticación REAL contra el backend — devuelve JWT firmado
      const response = await API.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;

      // Normalizar el rol a mayúsculas por seguridad
      const userInfo = {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        rol: (userData.rol || 'AUXILIAR').toString().toUpperCase().trim(),
        nivel: userData.nivel || 10
      };

      localStorage.setItem('jwt_token', jwtToken);
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      setToken(jwtToken);
      setUser(userInfo);
      return { success: true };
    } catch (error) {
      // NO crear tokens falsos — si falla el backend, reportar el error real
      const message = error.response?.data?.message
        || error.response?.data?.error
        || 'Error al iniciar sesión. Verifique sus credenciales o que el servidor backend esté activo.';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (googleCredential) => {
    try {
      // 1. Intentar autenticación vía endpoint backend de Google
      const response = await API.post('/auth/google', { credential: googleCredential });
      if (response.data && response.data.token) {
        const { token: jwtToken, user: userData } = response.data;
        const userInfo = {
          id: userData.id,
          nombre: userData.nombre,
          email: userData.email,
          rol: (userData.rol || 'AUXILIAR').toString().toUpperCase().trim(),
          nivel: userData.nivel || 10
        };

        localStorage.setItem('jwt_token', jwtToken);
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        setToken(jwtToken);
        setUser(userInfo);
        return { success: true, user: userInfo };
      }

      return { success: false, error: 'Respuesta inesperada del servidor al autenticar con Google.' };
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message
        || (status === 403
          ? 'La cuenta de Google no está registrada o está inactiva en el sistema.'
          : status === 401
            ? 'No se pudo validar la identidad de Google. Intente nuevamente.'
            : 'No se pudo conectar con el servidor. Verifique que el backend esté activo.');
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
