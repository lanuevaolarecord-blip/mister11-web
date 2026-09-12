import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Theater } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const TheaterOverlay = ({
  isOpen,
  isTheater,
  onClose,
  title,
  children
}) => {
  const isVisible = isOpen !== undefined ? Boolean(isOpen) : Boolean(isTheater);
  const { t, isEn } = useTranslation();

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible || typeof document === 'undefined') return null;

  const overlayContent = (
    <div
      className="theater-modal-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose && onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || (isEn ? 'Theater Mode' : 'Modo Teatro')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        animation: 'theaterFadeIn 0.2s ease-out'
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
          background: '#13241C',
          border: '1px solid rgba(212, 168, 67, 0.4)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2147483647,
          pointerEvents: 'auto'
        }}
      >
        {/* Cabecera Modo Teatro */}
        <div
          className="theater-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(0, 0, 0, 0.4)',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2147483647
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4A843' }}>
            <Theater size={22} />
            <strong style={{ fontSize: '15px', color: '#FFFFFF', letterSpacing: '0.3px' }}>
              {title || (isEn ? 'Theater Mode' : 'Modo Teatro')}
            </strong>
          </div>
          <button
            type="button"
            className="theater-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose && onClose();
            }}
            title={isEn ? 'Close theater mode' : 'Cerrar modo teatro'}
            aria-label={isEn ? 'Close theater mode' : 'Cerrar modo teatro'}
            style={{
              minWidth: '48px',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              cursor: 'pointer',
              borderRadius: '8px',
              position: 'relative',
              zIndex: 2147483647,
              pointerEvents: 'auto'
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
            justifyContent: 'center',
            background: '#152C22'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(overlayContent, document.body);
};

export default TheaterOverlay;
