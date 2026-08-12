import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GoogleLoginModal({ isOpen, onClose }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = async (response) => {
    if (!response.credential) return;

    setLoading(true);
    setError('');

    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
      setError('No se pudo decodificar la respuesta del servidor de Google.');
      setLoading(false);
      return;
    }

    const res = await loginWithGoogle(payload.email);
    if (!res.success) {
      setError(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && window.google?.accounts?.id) {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '828388535241-48mgb2mbu1b57qeuvuuhnnk8j95l55m9.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            locale: 'es'
          });
        }
      } catch (e) {
        console.error('Google Auth Init Exception:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '400px', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
            Autenticación de Google
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
            Selecciona tu cuenta oficial para acceder al sistema
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f87171',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            lineHeight: 1.4,
            textAlign: 'left'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Únicamente el Botón Oficial de Google Identity Services SDK */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div ref={googleBtnRef}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
