import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '828388535241-48mgb2mbu1b57qeuvuuhnnk8j95l55m9.apps.googleusercontent.com';
  const gsiInitializedRef = useRef(false);

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

    // Método 1: Usar google.accounts.id con popup (FedCM / One Tap)
    if (window.google?.accounts?.id) {
      try {
        if (!gsiInitializedRef.current) {
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
            },
            ux_mode: 'popup',
            auto_select: false,
            use_fedcm_for_prompt: true,
          });
          gsiInitializedRef.current = true;
        }

        // Intentar con prompt(), pero si no funciona, abrir popup OAuth2 como fallback
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google One Tap no disponible, usando popup OAuth2 como fallback...');
            openGoogleOAuth2Popup(clientId);
          }
        });
      } catch (e) {
        console.error('OAuth Exception:', e);
        // Fallback a popup OAuth2
        openGoogleOAuth2Popup(clientId);
      }
    } else {
      // Si la librería GSI no cargó, abrir OAuth2 directamente en una ventana nueva
      console.warn('Librería GSI no cargada, abriendo OAuth2 directamente...');
      openGoogleOAuth2Popup(clientId);
    }
  };

  // Fallback: abre el flujo estándar de OAuth2 en un popup del navegador
  const openGoogleOAuth2Popup = (clientId) => {
    const redirectUri = window.location.origin + '/login';
    const scope = 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token id_token` +
      `&scope=${encodeURIComponent(scope)}` +
      `&nonce=${Math.random().toString(36).substring(2)}` +
      `&prompt=select_account`;

    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'GoogleLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
    );

    if (!popup || popup.closed) {
      setError('El navegador bloqueó la ventana emergente. Permite ventanas emergentes (popups) para este sitio e intenta de nuevo.');
      setGoogleLoading(false);
      return;
    }

    // Monitorear el popup para capturar el token del redirect
    const pollTimer = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(pollTimer);
          setGoogleLoading(false);
          return;
        }
        // Verificar si el popup redirigió de vuelta a nuestro origen
        if (popup.location.origin === window.location.origin) {
          clearInterval(pollTimer);
          const hash = popup.location.hash.substring(1);
          popup.close();

          const params = new URLSearchParams(hash);
          const idToken = params.get('id_token');

          if (idToken) {
            const res = await loginWithGoogle(idToken);
            if (!res.success) {
              setError(res.error);
            }
          } else {
            setError('No se recibió un token válido de Google. Verifica la configuración del Client ID.');
          }
          setGoogleLoading(false);
        }
      } catch (e) {
        // Cross-origin error esperado mientras el popup está en Google - ignorar
      }
    }, 500);
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
    <div className="login-layout" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Panel izquierdo: descripción del sistema y accesos rápidos (suave) */}
      <div className="login-panel-left" style={{
        flex: '1.2',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 40px',
        position: 'relative',
        background:
          'radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.10) 0%, transparent 45%),' +
          'radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.08) 0%, transparent 45%),' +
          'linear-gradient(160deg, #0d1322 0%, #0b0f19 55%, #0e1628 100%)'
      }}>
        <div style={{ maxWidth: '540px', width: '100%' }}>
          {/* Marca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.35)'
            }}>
              📦
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>Stock Manager</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Gestión de Inventario
              </div>
            </div>
          </div>

          {/* Descripción */}
          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '18px',
            background: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Controla tu inventario con inteligencia
          </h1>
          <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '480px' }}>
            Plataforma profesional para administrar insumos, movimientos y alertas de tu
            inventario en un solo lugar, con control de accesos por roles y reportes en tiempo real.
          </p>

          {/* Características */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
            {[
              { icon: '📦', title: 'Gestión centralizada', desc: 'Insumos, existencias y movimientos al detalle.' },
              { icon: '📊', title: 'Reportes y alertas', desc: 'Visualiza el estado de tu stock al instante.' },
              { icon: '🛡️', title: 'Roles y permisos', desc: 'Acceso seguro según el perfil de cada usuario.' }
            ].map((f) => (
              <div key={f.title} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '2px' }}>{f.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Accesos rápidos de prueba */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              ── Accesos rápidos para probar los roles ──
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { icon: '👑', rol: 'Admin', desc: 'Acceso total', email: 'admin@inventario.com', pass: 'admin123' },
                { icon: '👔', rol: 'Jefe', desc: 'Gestión de personal', email: 'mrodriguez@inventario.com', pass: 'jefe123' },
                { icon: '🛠️', rol: 'Auxiliar', desc: 'Control de insumos', email: 'jperez@inventario.com', pass: 'aux123' }
              ].map((r) => (
                <button
                  key={r.rol}
                  type="button"
                  onClick={() => handleFill(r.email, r.pass)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    padding: '14px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                  className="btn-secondary"
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{r.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.rol}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.desc}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', textAlign: 'center', marginTop: '14px' }}>
              Selecciona un rol y sus credenciales se cargarán automáticamente en el formulario.
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho: modal de inicio de sesión */}
      <div className="login-panel-right" style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
        background:
          'radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.16) 0%, transparent 50%),' +
          'radial-gradient(circle at 10% 90%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),' +
          'linear-gradient(160deg, #101a33 0%, #0b0f19 100%)'
      }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '40px 36px' }}>
          {/* Encabezado */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
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
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
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

          {/* Pie del modal: acceso con Google */}
          <div style={{
            marginTop: '26px',
            paddingTop: '22px',
            borderTop: '1px solid var(--border-glass)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: '14px'
            }}>
              Ingresa con tu cuenta de Google
            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
