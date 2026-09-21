import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Home,
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
  Camera,
  FileText,
  Film,
  Save,
  Loader2
} from 'lucide-react';
import { TOOLS, STROKE_WIDTHS } from '../../lib/mister11-tools.js';
import { useTranslation } from '../../hooks/useTranslation';

import FieldSelector from './FieldSelector';

const CanvasToolbar = ({
  fieldType,
  setFieldType,
  fullscreenMode,
  setFullscreenMode,
  toggleFullscreen,
  autoSaveStatus,
  reducedDim,
  setReducedDim,
  frRef,
  isSwapped,
  setIsSwapped,
  activeTool,
  setActiveTool,
  isMobile,
  setShowMoreMenu,
  activeColor,
  showColorPicker,
  setShowColorPicker,
  activeWidth,
  showWidthPicker,
  setShowWidthPicker,
  fcRef,
  setZoomLevel,
  undo,
  redo,
  histCount,
  redoCount,
  clearCanvas,
  handleNewPizarra,
  handleCapture,
  handleExportPDF,
  isCapturing,
  exportAnimationVideo,
  isRecording,
  exportProgress,
  handleSave,
  setLeftPanelOpen,
  setRightPanelOpen,
  setShowTeamsDrawer,
  setShowMatsDrawer,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pizarra-topbar">
      <div className="topbar-scroll-wrapper">
        <div className="topbar-group essential">
          {autoSaveStatus && (
            <div style={{ color: autoSaveStatus.includes('Error') ? '#ff4d4f' : '#10b981', fontSize: '12px', fontWeight: 'bold', marginRight: '8px', whiteSpace: 'nowrap' }}>
              {autoSaveStatus}
            </div>
          )}

          {!fullscreenMode && (
            <button className="topbar-btn secondary" onClick={() => {
              if (setLeftPanelOpen) setLeftPanelOpen(false);
              if (setRightPanelOpen) setRightPanelOpen(false);
              if (setShowTeamsDrawer) setShowTeamsDrawer(false);
              if (setShowMatsDrawer) setShowMatsDrawer(false);
              if (toggleFullscreen) {
                toggleFullscreen();
              } else if (setFullscreenMode) {
                setFullscreenMode(true);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
              }
            }}>
              🗖 {t('board.toolbar.fullscreen')}
            </button>
          )}
          <FieldSelector fieldType={fieldType} setFieldType={setFieldType} />
        </div>

        <div className="topbar-adaptive-content">
          {fieldType === 'reduced' && (
            <div className="topbar-group reduced-controls-group">
              <div className="reduced-controls">
                <div className="slider-box">
                  <span>{t('board.toolbar.width')}: {reducedDim.w}m</span>
                  <input type="range" min="10" max="105" value={reducedDim.w} 
                    onChange={e => {
                      const w = parseInt(e.target.value);
                      setReducedDim(p => ({ ...p, w }));
                      frRef.current?.setReducedDimensions(w, reducedDim.h);
                    }} 
                  />
                </div>
                <div className="slider-box">
                  <span>{t('board.toolbar.height')}: {reducedDim.h}m</span>
                  <input type="range" min="10" max="70" value={reducedDim.h} 
                    onChange={e => {
                      const h = parseInt(e.target.value);
                      setReducedDim(p => ({ ...p, h }));
                      frRef.current?.setReducedDimensions(reducedDim.w, h);
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="topbar-group">
            <button 
              className={`topbar-btn ${isSwapped ? 'active' : ''}`} 
              onClick={() => setIsSwapped(!isSwapped)}
              title={t('board.toolbar.swapSides')}
            >
              ⇄ {t('board.toolbar.sides')}
            </button>
          </div>

          <div className="topbar-group tools">
            {Object.values(TOOLS).map(tool => (
              <button
                key={tool.id}
                className={`tool-icon-btn ${activeTool === tool.id ? 'active' : ''}`}
                title={tool.label}
                onClick={() => {
                  setActiveTool(tool.id);
                  if (isMobile && setShowMoreMenu) setShowMoreMenu(false);
                }}
                dangerouslySetInnerHTML={{ __html: tool.icon }}
              />
            ))}
          </div>

          <div className="topbar-group color-picker-container" style={{ position: 'static' }}>
            <button
              className="topbar-btn color-trigger"
              onClick={(e) => { 
                e.stopPropagation();
                setShowColorPicker(!showColorPicker); 
                setShowWidthPicker(false); 
              }}
              title={t('board.toolbar.strokeColor')}
            >
              <div className="current-color-preview" style={{ backgroundColor: activeColor }} />
            </button>
          </div>

          <div className="topbar-group width-picker-container" style={{ position: 'static' }}>
            <button
              className="topbar-btn width-trigger"
              onClick={(e) => { 
                e.stopPropagation();
                setShowWidthPicker(!showWidthPicker); 
                setShowColorPicker(false); 
              }}
              title={t('board.toolbar.strokeWidth')}
            >
              <span className="current-width-label">
                {activeWidth === 1.5 ? t('board.stroke.fine') : activeWidth === 3 ? t('board.stroke.medium') : t('board.stroke.thick')}
              </span>
            </button>
          </div>

          <div className="topbar-divider" />

          <div className="topbar-group actions">
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              const zoom = fc.getZoom() * 1.1;
              fc.setZoom(zoom);
              setZoomLevel(zoom);
            }} title={t('board.toolbar.zoomIn')} aria-label={t('board.toolbar.zoomIn')}>
              <ZoomIn size={16} />
            </button>
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              const zoom = fc.getZoom() / 1.1;
              fc.setZoom(zoom);
              setZoomLevel(zoom);
            }} title={t('board.toolbar.zoomOut')} aria-label={t('board.toolbar.zoomOut')}>
              <ZoomOut size={16} />
            </button>
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              fc.setZoom(1);
              fc.absolutePan({ x: 0, y: 0 });
              setZoomLevel(1);
            }} title={t('board.toolbar.resetZoom')} aria-label={t('board.toolbar.resetZoom')}>
              <Home size={16} />
            </button>
            <div className="topbar-divider" />
            <button className="topbar-btn" onClick={undo} disabled={histCount === 0} title={t('board.toolbar.undo')} aria-label={t('board.toolbar.undo')}>
              <Undo2 size={16} />
            </button>
            <button className="topbar-btn" onClick={redo} disabled={redoCount === 0} title={t('board.toolbar.redo')} aria-label={t('board.toolbar.redo')}>
              <Redo2 size={16} />
            </button>
            <button className="topbar-btn danger" onClick={clearCanvas} title={t('board.toolbar.clearCanvas')} aria-label={t('board.toolbar.clearCanvas')}>
              <Trash2 size={16} />
            </button>
            <button className="topbar-btn secondary" onClick={handleNewPizarra} title={t('board.toolbar.new')} style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} />
              <span>{t('board.toolbar.new')}</span>
            </button>
            <button className="topbar-btn" onClick={() => handleCapture(true)} disabled={isCapturing} title="PNG" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={15} />
              <span>PNG</span>
            </button>
            <button className="topbar-btn" onClick={handleExportPDF} disabled={isCapturing} title="PDF" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} />
              <span>PDF</span>
            </button>
            <button
              className={`topbar-btn ${isRecording ? 'exporting disabled' : ''}`}
              onClick={exportAnimationVideo}
              disabled={isRecording}
              title={t('board.toolbar.exportMp4')}
              style={{
                background: isRecording ? '#1B3A2D' : 'var(--accent)',
                color: 'white',
                fontWeight: 'bold',
                position: 'relative',
                overflow: 'hidden',
                minWidth: isRecording ? '140px' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isRecording ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{exportProgress !== null && exportProgress !== undefined ? `${exportProgress}%` : t('board.toolbar.exportingMp4')}</span>
                </span>
              ) : (
                <>
                  <Film size={15} />
                  <span>{t('board.toolbar.exportMp4')}</span>
                </>
              )}
              {isRecording && typeof exportProgress === 'number' && exportProgress > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '4px',
                    width: `${exportProgress}%`,
                    backgroundColor: '#D4A843',
                    transition: 'width 0.2s ease-out'
                  }}
                />
              )}
            </button>
            <button id="btn-guardar-pizarra" className="topbar-btn primary" onClick={handleSave} disabled={isCapturing} title={t('board.toolbar.save')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Save size={15} />
              <span>{t('board.toolbar.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasToolbar;
