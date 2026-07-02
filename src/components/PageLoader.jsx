import React from 'react';

/**
 * PageLoader – spinner de carga usado por React.lazy/Suspense.
 * Muestra el logo de Míster11 con una animación de pulso para las
 * transiciones de página en rutas de carga diferida.
 */
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '20px',
    }}
  >
    <img
      src="/logo_mister11.png"
      alt="Míster11"
      style={{
        height: '56px',
        animation: 'pageloader-pulse 1.4s ease-in-out infinite',
        opacity: 0.85,
      }}
    />
    <div
      style={{
        width: '36px',
        height: '36px',
        border: '3px solid var(--border-color, rgba(255,255,255,0.15))',
        borderTop: '3px solid var(--accent-green, #4CAF7D)',
        borderRadius: '50%',
        animation: 'pageloader-spin 0.8s linear infinite',
      }}
    />
    <style>{`
      @keyframes pageloader-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pageloader-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50%       { opacity: 1;   transform: scale(1.06); }
      }
    `}</style>
  </div>
);

export default PageLoader;
