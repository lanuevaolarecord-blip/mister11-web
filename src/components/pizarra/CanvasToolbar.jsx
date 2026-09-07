import React from 'react';
import { TOOLS, STROKE_WIDTHS } from '../../lib/mister11-tools.js';
import { useTranslation } from '../../hooks/useTranslation';

const CanvasToolbar = ({
  fieldType,
  setFieldType,
  fullscreenMode,
  setFullscreenMode,
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
              setFullscreenMode(true);
              if (setLeftPanelOpen) setLeftPanelOpen(false);
              if (setRightPanelOpen) setRightPanelOpen(false);
              if (setShowTeamsDrawer) setShowTeamsDrawer(false);
              if (setShowMatsDrawer) setShowMatsDrawer(false);
              setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
            }}>
              🗖 {t('board.toolbar.fullscreen')}
            </button>
          )}
          <select className="topbar-select" value={fieldType} onChange={e => setFieldType(e.target.value)}>
            <option value="full">{t('board.fields.full')}</option>
            <option value="half-attack">{t('board.fields.halfAttack')}</option>
            <option value="half-defense">{t('board.fields.halfDefense')}</option>
            <option value="third_defense">{t('board.fields.thirdDefense')}</option>
            <option value="third_mid">{t('board.fields.thirdMid')}</option>
            <option value="third_attack">{t('board.fields.thirdAttack')}</option>
            <option value="penalty_area">{t('board.fields.penaltyArea')}</option>
            <option value="f7">{t('board.fields.f7')}</option>
            <option value="f8">{t('board.fields.f8')}</option>
            <option value="futsal">{t('board.fields.futsal')}</option>
            <option value="reduced">{t('board.fields.reduced')}</option>
            <option value="blank">{t('board.fields.blank')}</option>
          </select>
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
            }} title={t('board.toolbar.zoomIn')}>🔍+</button>
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              const zoom = fc.getZoom() / 1.1;
              fc.setZoom(zoom);
              setZoomLevel(zoom);
            }} title={t('board.toolbar.zoomOut')}>🔍-</button>
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              fc.setZoom(1);
              fc.absolutePan({ x: 0, y: 0 });
              setZoomLevel(1);
            }} title={t('board.toolbar.resetZoom')}>🏠</button>
            <div className="topbar-divider" />
            <button className="topbar-btn" onClick={undo} disabled={histCount === 0} title={t('board.toolbar.undo')}>↩</button>
            <button className="topbar-btn" onClick={redo} disabled={redoCount === 0} title={t('board.toolbar.redo')}>↪</button>
            <button className="topbar-btn danger" onClick={clearCanvas} title={t('board.toolbar.clearCanvas')}>🗑</button>
            <button className="topbar-btn secondary" onClick={handleNewPizarra} title={t('board.toolbar.new')} style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold' }}>✨ {t('board.toolbar.new')}</button>
            <button className="topbar-btn" onClick={() => handleCapture(true)} disabled={isCapturing} title="PNG">📸 PNG</button>
            <button className="topbar-btn" onClick={handleExportPDF} disabled={isCapturing} title="PDF">📄 PDF</button>
            <button className="topbar-btn" onClick={exportAnimationVideo} disabled={isRecording} title={t('board.toolbar.exportMp4')} style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold' }}>
              {isRecording ? t('board.toolbar.exportingMp4') : t('board.toolbar.exportMp4')}
            </button>
            <button id="btn-guardar-pizarra" className="topbar-btn primary" onClick={handleSave} disabled={isCapturing} title={t('board.toolbar.save')}>💾 {t('board.toolbar.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasToolbar;
