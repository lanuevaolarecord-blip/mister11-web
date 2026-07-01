import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app, #111B21)',
      color: 'var(--text-primary, #fff)',
      fontFamily: "Outfit, Inter, sans-serif",
      padding: '24px',
      textAlign: 'center'
    }}>
      <img
        src="/logo_mister11.png"
        alt="Mister11"
        style={{ height: '72px', marginBottom: '24px', opacity: 0.9 }}
      />

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '40px 32px',
        maxWidth: '420px',
        width: '100%'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚽</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 8px', color: '#D4A843' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 12px' }}>
          Página no encontrada
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', lineHeight: '1.6' }}>
          Esta ruta no existe en Míster11. Puede que el enlace esté caducado o que la URL sea incorrecta.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate(user ? '/' : '/login')}
            style={{
              background: '#1B3A2D',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 24px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              minHeight: '48px',
              fontFamily: 'inherit'
            }}
          >
            🏠 {user ? 'Ir al Dashboard' : 'Ir al Inicio'}
          </button>
          {!user && (
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                color: '#D4A843',
                border: '2px solid #D4A843',
                borderRadius: '8px',
                padding: '14px 24px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minHeight: '48px',
                fontFamily: 'inherit'
              }}
            >
              🔐 Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
        © {new Date().getFullYear()} Míster11 · El banquillo en tu bolsillo
      </p>
    </div>
  );
};

export default NotFound;
