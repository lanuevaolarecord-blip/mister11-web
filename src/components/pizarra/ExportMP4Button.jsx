import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { exportAnimationMP4 } from '../../utils/mp4Exporter';
import { downloadVideo } from '../../utils/download';

/**
 * ExportMP4Button
 * Botón de exportación MP4 determinista con progreso real (0-100%),
 * indicador de frame actual/total y manejo seguro de errores con try/catch/finally.
 */
const ExportMP4Button = ({
  fcRef,
  frRef,
  fieldCanvasRef,
  framesRef,
  planId,
  isProActive,
  onRequireUpgrade,
  onShowToast,
  className = '',
  style = {}
}) => {
  const { t, isEn } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const handleExport = async () => {
    if (isExporting) return;

    if (!isProActive) {
      if (typeof onRequireUpgrade === 'function') {
        onRequireUpgrade();
      }
      return;
    }

    const fc = fcRef?.current;
    const fr = frRef?.current;
    const fieldCanvas = fieldCanvasRef?.current;
    const frames = framesRef?.current || [];

    if (!fc || !fieldCanvas || frames.length < 2) {
      if (typeof onShowToast === 'function') {
        onShowToast(
          isEn
            ? 'You need at least 2 frames to export a video.'
            : 'Necesitas al menos 2 frames para exportar un video.',
          'info'
        );
      }
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setStatusText(isEn ? 'Preparing export...' : 'Preparando exportación...');

    try {
      const result = await exportAnimationMP4({
        fc,
        fr,
        fieldCanvas,
        frames,
        planId,
        onProgress: (pct, currentFrame, totalFrames) => {
          setProgress(pct);
          setStatusText(
            isEn
              ? `Exporting frame ${currentFrame} of ${totalFrames} (${pct}%)`
              : `Exportando frame ${currentFrame} de ${totalFrames} (${pct}%)`
          );
        },
        onStatus: (msg) => {
          setStatusText(msg);
        }
      });

      // Descargar video exportado
      downloadVideo(result.base64data, result.filename, result.mimeType);

      if (typeof onShowToast === 'function') {
        onShowToast(
          isEn
            ? 'Video exported successfully!'
            : '¡Video exportado exitosamente!',
          'success'
        );
      }
    } catch (err) {
      console.error('[ExportMP4Button] Error al exportar video:', err);
      if (typeof onShowToast === 'function') {
        onShowToast(
          isEn
            ? `Export failed: ${err?.message || 'Unknown error'}. Click to retry.`
            : `Fallo en exportación: ${err?.message || 'Error desconocido'}. Pulsa para reintentar.`,
          'error'
        );
      }
    } finally {
      // Patrón certificado: reseteo garantizado en finally
      setIsExporting(false);
      setTimeout(() => {
        setProgress(0);
        setStatusText('');
      }, 1200);
    }
  };

  return (
    <div className="export-mp4-wrapper" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', ...style }}>
      <button
        type="button"
        className={`topbar-btn mp4-btn ${isExporting ? 'exporting disabled' : ''} ${className}`}
        onClick={handleExport}
        disabled={isExporting}
        style={{
          minHeight: '48px',
          minWidth: '48px',
          touchAction: 'manipulation',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: isExporting ? '#1B3A2D' : undefined
        }}
        title={t('board.toolbar.exportMp4', {}, 'EXPORTAR MP4')}
      >
        {isExporting ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="export-spinner" style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            <span>{statusText || t('board.toolbar.exportingMp4', {}, 'REC... EXPORTANDO MP4')}</span>
          </span>
        ) : (
          <span>🎬 {t('board.toolbar.exportMp4', {}, 'EXPORTAR MP4')}</span>
        )}

        {/* Barra de progreso real 0 - 100% */}
        {isExporting && (
          <div
            className="export-progress-bar"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '4px',
              width: `${progress}%`,
              backgroundColor: '#4CAF7D',
              transition: 'width 0.2s ease-out'
            }}
          />
        )}
      </button>

      {isExporting && statusText && (
        <span
          style={{
            fontSize: '10px',
            color: '#4CAF7D',
            marginTop: '2px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {statusText}
        </span>
      )}
    </div>
  );
};

export default ExportMP4Button;
