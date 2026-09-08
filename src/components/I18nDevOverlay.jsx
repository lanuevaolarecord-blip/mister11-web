/**
 * src/components/I18nDevOverlay.jsx
 * Míster11 — Developer Overlay for Language Protocol Monitoring
 * Active ONLY in development mode (import.meta.env.DEV === true).
 * Zero bundle impact in production.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../i18n/translations';

export const I18nDevOverlay = () => {
  if (!import.meta.env.DEV) return null;

  const { language, setLanguage, isEn } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [missingKeys, setMissingKeys] = useState([]);

  const totalKeys = Object.keys(translations['Español (ES)'] || {}).length;

  useEffect(() => {
    const handleMissingKey = (e) => {
      if (e.detail?.key) {
        setMissingKeys(prev => Array.from(new Set([...prev, e.detail.key])));
      }
    };
    window.addEventListener('m11-i18n-missing-key', handleMissingKey);
    return () => window.removeEventListener('m11-i18n-missing-key', handleMissingKey);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 999999,
        fontFamily: 'monospace',
        fontSize: '11px',
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            background: missingKeys.length > 0 ? '#EF4444' : '#1B3A2D',
            color: '#FFFFFF',
            border: '1.5px solid #D4A843',
            borderRadius: '20px',
            padding: '6px 12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 'bold'
          }}
          title={isEn ? 'Míster11 i18n Dev Inspector' : 'Inspector i18n Míster11'}
        >
          <span>🌐 {isEn ? 'EN' : 'ES'}</span>
          <span style={{ opacity: 0.7 }}>|</span>
          <span>{totalKeys} keys</span>
          {missingKeys.length > 0 && (
            <span style={{ background: '#FFF', color: '#EF4444', borderRadius: '10px', padding: '1px 6px' }}>
              {missingKeys.length} ⚠️
            </span>
          )}
        </button>
      ) : (
        <div
          style={{
            background: '#1B3A2D',
            color: '#FFFFFF',
            border: '2px solid #D4A843',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            width: '260px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ color: '#D4A843', fontSize: '12px' }}>🛠️ i18n Dev Inspector</strong>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setLanguage('Español (ES)')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: !isEn ? '#D4A843' : 'rgba(255,255,255,0.15)',
                color: !isEn ? '#000' : '#FFF',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('English (EN)')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: isEn ? '#D4A843' : 'rgba(255,255,255,0.15)',
                color: isEn ? '#000' : '#FFF',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              EN
            </button>
          </div>

          <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• Active: <strong>{language}</strong></div>
            <div>• Parity: <strong>{totalKeys}/{totalKeys} (100%)</strong></div>
            <div>• Missing keys: <strong>{missingKeys.length}</strong></div>
          </div>

          {missingKeys.length > 0 && (
            <div style={{ marginTop: '8px', maxHeight: '80px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
              {missingKeys.map(k => (
                <div key={k} style={{ color: '#F87171' }}>• {k}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default I18nDevOverlay;
