import React from 'react';
import { usePWA } from '../hooks/usePWA';
import './PlaceholderPage.css'; // Reuse some basic styles or create specific ones

const Instalar = () => {
  const { deferredPrompt, isInstalled, installApp } = usePWA();

  return (
    <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', textAlign: 'center', padding: '20px' }}>
      <div className="settings-card" style={{ maxWidth: '500px', width: '100%' }}>
        <img src="/logo_mister11.png" alt="Mister11 Logo" style={{ width: '120px', marginBottom: '20px' }} />
        <h1 style={{ color: '#ffffff', marginBottom: '10px' }}>Instalar Míster 11</h1>
        <p style={{ color: 'var(--accent)', marginBottom: '30px' }}>El banquillo en tu bolsillo</p>

        {isInstalled ? (
          <div className="success-message" style={{ color: '#4CAF7D', fontWeight: 'bold' }}>
            ¡La App ya está instalada en tu dispositivo!
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '15px' }}>Instrucciones:</h3>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--accent)' }}>Android (Chrome):</strong>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Pulsa el botón "Instalar ahora" abajo o usa el menú de tres puntos (⋮) y elige "Instalar aplicación".</p>
              </div>
              <div>
                <strong style={{ color: 'var(--accent)' }}>iOS (Safari):</strong>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Pulsa el botón "Compartir" (cuadrado con flecha) y selecciona "Añadir a la pantalla de inicio".</p>
              </div>
            </div>

            {deferredPrompt && (
              <button 
                className="btn-primary" 
                onClick={installApp}
                style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }}
              >
                Instalar ahora
              </button>
            )}
            
            {!deferredPrompt && !isInstalled && (
              <p style={{ fontSize: '12px', color: '#888' }}>
                Si no ves el botón de instalación, usa la opción "Añadir a pantalla de inicio" de tu navegador.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Instalar;
