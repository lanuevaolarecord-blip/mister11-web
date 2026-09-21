import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Film,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  Play,
  Settings,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

/**
 * ExportAnimationModal
 * Modal paramétrico de exportación MP4/PNG para la Pizarra Táctica (Fix Crítico C - Horizonte 1)
 *
 * Características:
 * - Previsualización de canvas interactiva con controles de Zoom, desplazamiento X/Y y Reset.
 * - Parámetros configurables: Formato (MP4/PNG), Calidad (720p/1080p/2K/4K), Velocidad (0.5x, 1x, 2x, 4x), Orientación.
 * - Metadatos editables: Título, duración calculada y peso estimado.
 * - Barra de progreso por frames en tiempo real (0-100%).
 * - Estado final "Export Completed" con descarga directa y soporte para Web Share API.
 * - Paleta estricta Tierra y Campo (#1B3A2D, #4CAF7D, #D4A843), cero emojis y touch targets >= 48dp.
 */
export const ExportAnimationModal = ({
  isOpen = false,
  onClose,
  fcRef,
  frRef,
  fieldCanvasRef,
  framesRef,
  planId = 'tactica',
  planTitle = 'Animación Táctica',
  sceneState = { orientation: 'landscape', fieldType: 'full' },
  onExport,
  isRecording = false,
  exportProgress = null,
  exportResult = null,
  onResetExportResult = null
}) => {
  const { t, isEn } = useTranslation();

  // Opciones de configuración
  const [format, setFormat] = useState('MP4'); // 'MP4' | 'PNG'
  const [quality, setQuality] = useState('1080p'); // '720p' | '1080p' | '2K' | '4K'
  const [speed, setSpeed] = useState('1x'); // '0.5x' | '1x' | '2x' | '4x'
  const [title, setTitle] = useState(planTitle || 'Animación Táctica');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Orientación derivada de la escena
  const orientation = sceneState?.orientation || 'landscape';
  const framesCount = framesRef?.current?.length || 0;

  // Sincronizar título inicial si cambia el plan
  useEffect(() => {
    if (planTitle) setTitle(planTitle);
  }, [planTitle]);

  // Generar snapshot para el preview del modal
  useEffect(() => {
    if (!isOpen) return;
    try {
      const fc = fcRef?.current;
      const fieldCanvas = fieldCanvasRef?.current;
      if (fieldCanvas) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = fieldCanvas.width || 800;
        offCanvas.height = fieldCanvas.height || 500;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(fieldCanvas, 0, 0);
          if (fc && typeof fc.toCanvasElement === 'function') {
            const fabricEl = fc.toCanvasElement();
            ctx.drawImage(fabricEl, 0, 0);
          }
          setPreviewDataUrl(offCanvas.toDataURL('image/png'));
        }
      }
    } catch (e) {
      console.warn('[ExportAnimationModal] No se pudo generar snapshot de preview:', e);
    }
  }, [isOpen, fcRef, fieldCanvasRef]);

  // Cálculo de duración estimada según frames y velocidad
  const estimatedDurationSec = useMemo(() => {
    if (format === 'PNG') return 0;
    const speedFactor = speed === '0.5x' ? 0.5 : speed === '2x' ? 2 : speed === '4x' ? 4 : 1;
    const baseSec = Math.max(2, (framesCount - 1) * 0.8);
    return Math.max(1, (baseSec / speedFactor)).toFixed(1);
  }, [format, framesCount, speed]);

  // Cálculo de tamaño estimado
  const estimatedSizeMb = useMemo(() => {
    if (format === 'PNG') return '1.2 MB';
    const qualityMultipliers = { '720p': 1.0, '1080p': 2.2, '2K': 4.5, '4K': 9.0 };
    const qFactor = qualityMultipliers[quality] || 2.0;
    const dur = parseFloat(estimatedDurationSec) || 2;
    return `${(dur * 0.45 * (qFactor / 2.2)).toFixed(1)} MB`;
  }, [format, quality, estimatedDurationSec]);

  if (!isOpen) return null;

  const handleResetPreview = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleTriggerExport = () => {
    if (typeof onExport === 'function') {
      onExport({
        format,
        quality,
        speed,
        title,
        zoom,
        panX,
        panY,
        orientation
      });
    }
  };

  const handleShare = async () => {
    if (!exportResult) return;
    try {
      const file = exportResult.blob
        ? new File([exportResult.blob], exportResult.filename || 'animacion-mister11.mp4', {
            type: exportResult.mimeType || (format === 'PNG' ? 'image/png' : 'video/mp4')
          })
        : null;

      if (navigator.share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || 'Míster 11 - Animación',
          text: 'Pizarra táctica exportada con Míster 11'
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else if (navigator.share) {
        await navigator.share({
          title: title || 'Míster 11 - Animación',
          url: window.location.href
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: descarga directa
        if (exportResult.dataURL || exportResult.blob) {
          const a = document.createElement('a');
          a.href = exportResult.dataURL || URL.createObjectURL(exportResult.blob);
          a.download = exportResult.filename || `animacion.${format.toLowerCase()}`;
          a.click();
        }
      }
    } catch (shareErr) {
      if (shareErr.name !== 'AbortError') {
        console.warn('[ExportAnimationModal] Fallback de compartir:', shareErr);
      }
    }
  };

  const isFinished = !!exportResult && exportProgress === 100;

  return (
    <div
      className="export-animation-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 12, 9, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRecording) onClose();
      }}
    >
      <div
        className="export-animation-modal-card"
        style={{
          backgroundColor: '#102219',
          border: '1.5px solid #1B3A2D',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(212, 168, 67, 0.25)',
          overflow: 'hidden',
          color: '#FFFFFF'
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(27, 58, 45, 0.4) 0%, rgba(16, 34, 25, 0) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(76, 175, 125, 0.15)',
                border: '1.5px solid #4CAF7D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4CAF7D'
              }}
            >
              <Film size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                {t('board.exportModal.title')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
                {t('board.exportModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            style={{
              minWidth: '48px',
              minHeight: '48px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: isRecording ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
            aria-label={t('board.exportModal.closeModal')}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Preview del Canvas con controles de Zoom y Centrado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('board.exportModal.framingTitle')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))}
                  style={{
                    minWidth: '48px',
                    minHeight: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={t('board.exportModal.zoomOut')}
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '42px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, parseFloat((z + 0.1).toFixed(1))))}
                  style={{
                    minWidth: '48px',
                    minHeight: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={t('board.exportModal.zoomIn')}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleResetPreview}
                  style={{
                    minWidth: '48px',
                    minHeight: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '0 10px'
                  }}
                  title={t('board.exportModal.btnReset')}
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                backgroundColor: '#0B1712',
                borderRadius: '12px',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                    transition: 'transform 0.15s ease-out'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <ImageIcon size={36} />
                  <span style={{ fontSize: '12px' }}>{t('board.exportModal.loadingPreview')}</span>
                </div>
              )}

              {/* Tag de orientación actual */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(27, 58, 45, 0.9)',
                  border: '1px solid #4CAF7D',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase'
                }}
              >
                {orientation === 'landscape' ? t('board.exportModal.landscape') : t('board.exportModal.portrait')}
              </div>
            </div>
          </div>

          {/* 2. Parámetros de Exportación (Formato, Calidad, Velocidad) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            {/* Formato: MP4 / PNG */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                {t('board.exportModal.format')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['MP4', 'PNG'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    disabled={isRecording}
                    style={{
                      flex: 1,
                      minHeight: '48px',
                      backgroundColor: format === fmt ? '#1B3A2D' : 'rgba(255, 255, 255, 0.04)',
                      border: format === fmt ? '2px solid #4CAF7D' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: format === fmt ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: isRecording ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {fmt === 'MP4' ? <Film size={16} /> : <ImageIcon size={16} />}
                    <span>{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calidad: 720p, 1080p, 2K, 4K */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                {t('board.exportModal.quality')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['720p', '1080p', '2K', '4K'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    disabled={isRecording}
                    style={{
                      minHeight: '48px',
                      backgroundColor: quality === q ? '#1B3A2D' : 'rgba(255, 255, 255, 0.04)',
                      border: quality === q ? '2px solid #4CAF7D' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: quality === q ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: isRecording ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Velocidad: 0.5x, 1x, 2x, 4x (solo si es MP4) */}
            {format === 'MP4' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                  {t('board.exportModal.speed')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {['0.5x', '1x', '2x', '4x'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      disabled={isRecording}
                      style={{
                        minHeight: '48px',
                        backgroundColor: speed === s ? '#1B3A2D' : 'rgba(255, 255, 255, 0.04)',
                        border: speed === s ? '2px solid #4CAF7D' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: speed === s ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: isRecording ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Metadatos editables y estimados */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              padding: '12px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                {t('board.exportModal.metaTitle')}
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isRecording}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                {t('board.exportModal.metaDuration')}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#4CAF7D', marginTop: '6px', display: 'block' }}>
                {format === 'PNG' ? t('board.exportModal.oneFrame') : `${estimatedDurationSec} s`}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                {t('board.exportModal.metaSize')}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#D4A843', marginTop: '6px', display: 'block' }}>
                {estimatedSizeMb}
              </span>
            </div>
          </div>

          {/* 4. Barra de Progreso y Estado */}
          {isRecording && (
            <div
              style={{
                backgroundColor: 'rgba(27, 58, 45, 0.3)',
                border: '1.5px solid #4CAF7D',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: '#4CAF7D' }} />
                  <span>{t('board.exportModal.preparing')}</span>
                </span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#4CAF7D' }}>
                  {exportProgress !== null && exportProgress !== undefined ? `${exportProgress}%` : '0%'}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${exportProgress || 0}%`,
                    backgroundColor: '#4CAF7D',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease-out'
                  }}
                />
              </div>
            </div>
          )}

          {/* 5. Estado Final "Export Completed" */}
          {isFinished && (
            <div
              style={{
                backgroundColor: 'rgba(27, 58, 45, 0.45)',
                border: '2px solid #4CAF7D',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={28} style={{ color: '#4CAF7D' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                    {t('board.exportModal.completedTitle')}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {t('board.exportModal.completedDesc')}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    minHeight: '48px',
                    padding: '0 16px',
                    backgroundColor: 'rgba(212, 168, 67, 0.15)',
                    border: '1.5px solid #D4A843',
                    color: '#FFF5D0',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Share2 size={16} />
                  <span>{shareSuccess ? t('board.exportModal.shared') : t('board.exportModal.btnShare')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal: Botones de Acción */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: 'rgba(11, 23, 18, 0.95)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            style={{
              minHeight: '48px',
              padding: '0 20px',
              backgroundColor: 'transparent',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isRecording ? 'not-allowed' : 'pointer'
            }}
          >
            {t('board.exportModal.btnCancel')}
          </button>

          <button
            type="button"
            onClick={handleTriggerExport}
            disabled={isRecording || (format === 'MP4' && framesCount < 2)}
            style={{
              minHeight: '48px',
              padding: '0 24px',
              backgroundColor: '#1B3A2D',
              border: '1.5px solid #4CAF7D',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '0.6px',
              cursor: isRecording || (format === 'MP4' && framesCount < 2) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(27, 58, 45, 0.4)',
              opacity: isRecording || (format === 'MP4' && framesCount < 2) ? 0.6 : 1
            }}
          >
            {isRecording ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('board.toolbar.exportingMp4')}</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>{t('board.exportModal.btnExport')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportAnimationModal;
