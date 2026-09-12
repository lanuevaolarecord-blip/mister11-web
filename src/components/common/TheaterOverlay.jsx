import React from 'react';
import { X, Theater } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const TheaterOverlay = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const { t, isEn } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="theater-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || t('stats.theater.theater_mode')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="theater-modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1280px',
          height: '90vh',
          maxHeight: '90vh',
          background: 'var(--bg-card, #13241C)',
          border: '1px solid var(--border-color, rgba(212, 168, 67, 0.35))',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
          boxSizing: 'border-box'
        }}
      >
        {/* Cabecera Modo Teatro */}
        <div
          className="theater-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.25)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4A843' }}>
            <Theater size={20} />
            <strong style={{ fontSize: '15px', color: 'var(--text-primary, #FFFFFF)' }}>
              {title || t('stats.theater.theater_mode')}
            </strong>
          </div>
          <button
            type="button"
            className="theater-close-btn"
            onClick={onClose}
            title={t('stats.theater.close')}
            aria-label={t('stats.theater.close')}
            style={{
              minWidth: '48px',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94A3B8)',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Contenido con scroll interno */}
        <div
          className="theater-modal-body"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default TheaterOverlay;
