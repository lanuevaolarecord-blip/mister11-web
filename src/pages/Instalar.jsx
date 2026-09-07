import React, { useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useTranslation } from '../hooks/useTranslation';
import './PlaceholderPage.css'; // Reuse some basic styles or create specific ones

const Instalar = () => {
  const { deferredPrompt, isInstalled, installApp } = usePWA();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('install.metaTitle');
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.content : "";
    
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = t('install.metaDesc');
    
    return () => {
      document.title = t('app.copyright', { slogan: t('app.slogan') });
      if (metaDesc) metaDesc.content = originalDesc;
    };
  }, [t]);

  return (
    <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', textAlign: 'center', padding: '20px' }}>
      <div className="settings-card" style={{ maxWidth: '500px', width: '100%' }}>
        <img src="/logo_mister11.png" alt="Míster11" width="120" style={{ marginBottom: '20px' }} />
        <h1 style={{ color: '#ffffff', marginBottom: '10px' }}>{t('install.title')}</h1>
        <p style={{ color: 'var(--accent)', marginBottom: '30px' }}>{t('install.slogan')}</p>

        {isInstalled ? (
          <div className="success-message" style={{ color: '#4CAF7D', fontWeight: 'bold' }}>
            {t('install.alreadyInstalled')}
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '15px' }}>{t('install.instructions')}</h3>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--accent)' }}>{t('install.androidTitle')}</strong>
                <p style={{ fontSize: '14px', color: '#ccc' }}>{t('install.androidDesc')}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--accent)' }}>{t('install.iosTitle')}</strong>
                <p style={{ fontSize: '14px', color: '#ccc' }}>{t('install.iosDesc')}</p>
              </div>
            </div>

            {deferredPrompt && (
              <button 
                className="btn-primary" 
                onClick={installApp}
                style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {t('install.btnInstall')}
              </button>
            )}
            
            {!deferredPrompt && !isInstalled && (
              <p style={{ fontSize: '12px', color: '#888' }}>
                {t('install.fallbackNotice')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Instalar;
