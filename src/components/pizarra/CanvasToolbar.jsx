import React from 'react';
import { TOOLS, STROKE_WIDTHS } from '../../lib/mister11-tools.js';

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
  isCapturing,
  exportAnimationVideo,
  isRecording,
  handleSave,
  setLeftPanelOpen,
  setRightPanelOpen,
  setShowTeamsDrawer,
  setShowMatsDrawer,
}) => {
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
              🗖 P. Completa
            </button>
          )}
          <select className="topbar-select" value={fieldType} onChange={e => setFieldType(e.target.value)}>
            <option value="full">Campo Completo</option>
            <option value="half-attack">½ Ataque</option>
            <option value="half-defense">½ Defensa</option>
            <option value="third_defense">1/3 Defensivo</option>
            <option value="third_mid">1/3 Medio</option>
            <option value="third_attack">1/3 Ofensivo</option>
            <option value="penalty_area">Área Penalti</option>
            <option value="f7">Fútbol 7 (65x45m)</option>
            <option value="f8">Fútbol 8 (62x46m)</option>
            <option value="futsal">Fútbol Sala (40x20m)</option>
            <option value="reduced">Campo Reducido</option>
            <option value="blank">Campo en Blanco</option>
          </select>
        </div>

        <div className="topbar-adaptive-content">
          {fieldType === 'reduced' && (
            <div className="topbar-group reduced-controls-group">
              <div className="reduced-controls">
                <div className="slider-box">
                  <span>Ancho: {reducedDim.w}m</span>
                  <input type="range" min="10" max="105" value={reducedDim.w} 
                    onChange={e => {
                      const w = parseInt(e.target.value);
                      setReducedDim(p => ({ ...p, w }));
                      frRef.current?.setReducedDimensions(w, reducedDim.h);
                    }} 
                  />
                </div>
                <div className="slider-box">
                  <span>Alto: {reducedDim.h}m</span>
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
              title="Cambiar lados de equipos"
            >
              ⇄ Lados
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
              title="Color de trazo"
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
              title="Grosor de trazo"
            >
              <span className="current-width-label">
                {Object.values(STROKE_WIDTHS).find(v => v.value === activeWidth)?.label || 'Fino'}
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
            }} title="Acercar">🔍+</button>
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              const zoom = fc.getZoom() / 1.1;
              fc.setZoom(zoom);
              setZoomLevel(zoom);
            }} title="Alejar">🔍-</button>
            <button className="topbar-btn" onClick={() => {
              const fc = fcRef.current;
              if (!fc) return;
              fc.setZoom(1);
              fc.absolutePan({ x: 0, y: 0 });
              setZoomLevel(1);
            }} title="Reiniciar Zoom">🏠</button>
            <div className="topbar-divider" />
            <button className="topbar-btn" onClick={undo} disabled={histCount === 0} title="Deshacer (Ctrl+Z)">↩</button>
            <button className="topbar-btn" onClick={redo} disabled={redoCount === 0} title="Rehacer (Ctrl+Y)">↪</button>
            <button className="topbar-btn danger" onClick={clearCanvas} title="Limpiar todo el canvas">🗑</button>
            <button className="topbar-btn secondary" onClick={handleNewPizarra} title="Crear nueva animación desde cero" style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold' }}>✨ NUEVA</button>
            <button className="topbar-btn" onClick={() => handleCapture(true)} disabled={isCapturing} title="Descargar Imagen">📸</button>
            <button className="topbar-btn" onClick={exportAnimationVideo} disabled={isRecording} title="Exportar animacion como video MP4" style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold' }}>
              {isRecording ? 'REC... EXPORTANDO MP4' : 'EXPORTAR MP4'}
            </button>
            <button id="btn-guardar-pizarra" className="topbar-btn primary" onClick={handleSave} disabled={isCapturing} title="Guardar pizarra y captura">💾 GUARDAR</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasToolbar;
