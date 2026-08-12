import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Restaurar el estado de los botones cuando la ventana principal recupera el foco (ej: al cerrar el popup de Google)
  useEffect(() => {
    const handleWindowFocus = () => {
      const timer = setTimeout(() => {
        setGoogleLoading(false);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  const handleCustomGoogleLogin = () => {
    setError('');
    setGoogleLoading(true);

    if (window.google?.accounts?.id) {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '828388535241-48mgb2mbu1b57qeuvuuhnnk8j95l55m9.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (credentialResponse) => {
            if (!credentialResponse.credential) {
              setError('Se canceló la autenticación con Google.');
              setGoogleLoading(false);
              return;
            }
            try {
              const res = await loginWithGoogle(credentialResponse.credential);
              if (!res.success) {
                setError(res.error);
                setGoogleLoading(false);
              }
            } catch (e) {
              setError('No se pudo verificar la información del usuario con Google.');
              setGoogleLoading(false);
            }
          }
        });

        window.google.accounts.id.prompt();
      } catch (e) {
        console.error('OAuth Exception:', e);
        setError('Error al abrir la ventana de Google OAuth.');
        setGoogleLoading(false);
      }
    } else {
      setError('La librería de Google aún se está cargando. Espere un momento e intente de nuevo.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleFill = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Elementos decorativos de fondo */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(0,0,0,0) 70%)',
        top: '20%',
        left: '25%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(59,130,246,0.4)'
          }}>
            📦
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>Bienvenido</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Ingrese sus credenciales para acceder al inventario
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            lineHeight: 1.4
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Botón con el Diseño Oscuro Elegante que activa el Popup Real de Google OAuth */}
        <button
          type="button"
          onClick={handleCustomGoogleLogin}
          disabled={googleLoading || loading}
          style={{
            width: '100%',
            padding: '13px 20px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '1.02rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          className="btn-secondary"
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{googleLoading ? 'Abriendo Google...' : 'Continuar con Google'}</span>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.78rem', color: 'var(--text-dark)' }}>
          ── O INGRESA CON TUS CREDENCIALES ──
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Correo Electrónico</label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@inventario.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={loading || googleLoading}
          >
            {loading ? 'Iniciando Sesión...' : 'Ingresar al Sistema 🚀'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px', textAlign: 'center', uppercase: true }}>
            Accesos Rápidos de Prueba (Roles)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleFill('admin@inventario.com', 'admin123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleFill('mrodriguez@inventario.com', 'jefe123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
            >
              👔 Jefe
            </button>
            <button
              type="button"
              onClick={() => handleFill('jperez@inventario.com', 'aux123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
            >
              🛠️ Auxiliar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
