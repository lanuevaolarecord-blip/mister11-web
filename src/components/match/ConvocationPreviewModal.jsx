import React, { useState } from 'react';
import { X, Download, Send, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { t } from '../../i18n/translations';
import { SendConvocationModal } from './SendConvocationModal';

export const ConvocationPreviewModal = ({
  isOpen,
  onClose,
  pngUrl,
  pngBlob,
  filename = 'convocatoria.png',
  teamId,
  teamPath,
  matchData,
  selectedPlayers = [],
  lang = 'es',
  currentUserId = null,
  onRegenerate = null
}) => {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[ConvocationPreviewModal] Error downloading PNG:', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(13, 33, 24, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            backgroundColor: '#1B3A2D',
            border: '1.5px solid #D4A843',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            color: '#FFFFFF'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(212, 168, 67, 0.25)',
              backgroundColor: '#132B21'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(212, 168, 67, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D4A843'
                }}
              >
                <ImageIcon size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', letterSpacing: '0.5px' }}>
                {t('convocation.previewTitle', lang)}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '8px',
                minWidth: '48px',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Image Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0D2118'
            }}
          >
            {pngUrl ? (
              <img
                src={pngUrl}
                alt="Convocatoria PNG"
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(212, 168, 67, 0.3)'
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px' }}>
                <Loader2 size={32} className="animate-spin" color="#4CAF7D" />
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>{t('convocation.generating', lang)}</span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(212, 168, 67, 0.25)',
              backgroundColor: '#132B21',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            {/* Botón Regenerar / Volver a editar */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onRegenerate) onRegenerate();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '48px'
              }}
            >
              <RefreshCw size={16} />
              <span>{t('convocation.regenerate', lang)}</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Botón Descargar PNG */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!pngUrl || isDownloading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid #D4A843',
                  backgroundColor: '#D4A843',
                  color: '#0D2118',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: !pngUrl || isDownloading ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  minWidth: '48px',
                  boxShadow: '0 4px 12px rgba(212, 168, 67, 0.25)'
                }}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('convocation.downloading', lang)}</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>{t('convocation.download', lang)}</span>
                  </>
                )}
              </button>

              {/* Botón Enviar a Jugadores */}
              <button
                type="button"
                onClick={() => setIsSendModalOpen(true)}
                disabled={!pngUrl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4CAF7D',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: !pngUrl ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  minWidth: '48px',
                  boxShadow: '0 4px 12px rgba(76, 175, 125, 0.3)'
                }}
              >
                <Send size={16} />
                <span>{t('convocation.sendToPlayers', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Secundario de Envío */}
      <SendConvocationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        teamId={teamId}
        teamPath={teamPath}
        matchData={matchData}
        selectedPlayers={selectedPlayers}
        pngBlob={pngBlob}
        pngUrl={pngUrl}
        lang={lang}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default ConvocationPreviewModal;
