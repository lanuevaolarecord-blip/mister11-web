import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Flame, Maximize2, Minimize2, Eye } from 'lucide-react';

// ── Mapa semántico: tipo de evento → zona estimada (0–100) ──────────────────
const ZONE_MAP = {
  shot_on_target_own:    { x: 88, y: 50 },
  shot_off_target_own:   { x: 80, y: 45 },
  shot_on_target_rival:  { x: 12, y: 50 },
  shot_off_target_rival: { x: 20, y: 55 },
  recovery:              { x: 55, y: 48 },
  loss:                  { x: 45, y: 52 },
  duel_won:              { x: 58, y: 45 },
  duel_lost:             { x: 42, y: 55 },
  foul_favor:            { x: 62, y: 50 },
  foul_against:          { x: 38, y: 50 },
  counter_not_cut:       { x: 30, y: 50 },
  player_no_finish:      { x: 75, y: 50 },
  corner_favor:          { x: 99, y: 5  },
  corner_against:        { x: 1,  y: 95 },
  card_yellow_own:       { x: 40, y: 50 },
  card_red_own:          { x: 38, y: 52 },
  card_yellow_rival:     { x: 60, y: 50 },
  card_red_rival:        { x: 62, y: 48 },
  offside_own:           { x: 82, y: 50 },
  offside_rival:         { x: 18, y: 50 },
};

export const HeatMap = ({
  events = [],
  players = [],
  selectedPlayerId = 'all',
  onSelectPlayer,
  teamName = 'Local'
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [activeTab, setActiveTab] = useState('density');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef(null);

  const COLS = 15;
  const ROWS = 10;

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Filtrar eventos por jugador y modo
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedPlayerId !== 'all' && e.playerId !== selectedPlayerId) return false;
      if (activeTab === 'passes' && !['recovery','duel_won','pass','pase'].includes(e.type)) return false;
      if (activeTab === 'shots' && !['shot_on_target_own','shot_off_target_own','shot','tiro','gol'].includes(e.type)) return false;
      return true;
    });
  }, [events, selectedPlayerId, activeTab]);

  // Construir la matriz usando ZONE_MAP como fallback si no hay coordenadas reales
  const { grid, maxCount, totalCount } = useMemo(() => {
    const matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let max = 0;
    let total = 0;

    filteredEvents.forEach(e => {
      // Usar coordenadas explícitas o fallback por tipo y sector
      let fallbackY = 50;
      if (e.sector === 'left') fallbackY = 20;
      else if (e.sector === 'right') fallbackY = 80;
      else if (ZONE_MAP[e.type]) fallbackY = ZONE_MAP[e.type].y;

      const fallbackX = ZONE_MAP[e.type]?.x ?? 50;
      const x = typeof e.x === 'number' ? Math.max(0, Math.min(100, e.x)) : fallbackX;
      const y = typeof e.y === 'number' ? Math.max(0, Math.min(100, e.y)) : fallbackY;

      const col = Math.min(COLS - 1, Math.floor((x / 100) * COLS));
      const row = Math.min(ROWS - 1, Math.floor((y / 100) * ROWS));

      matrix[row][col] += 1;
      total += 1;
      if (matrix[row][col] > max) max = matrix[row][col];
    });

    return { grid: matrix, maxCount: max || 1, totalCount: total };
  }, [filteredEvents]);

  const getCellColor = (count) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.02)';
    const ratio = count / maxCount;
    if (ratio < 0.25) return `rgba(74, 222, 128, ${0.35 + ratio * 0.6})`;
    if (ratio < 0.55) return `rgba(250, 204, 21, ${0.45 + ratio * 0.5})`;
    if (ratio < 0.8)  return `rgba(251, 146, 60, ${0.55 + ratio * 0.4})`;
    return `rgba(239, 68, 68, ${0.65 + ratio * 0.35})`;
  };

  const hasEvents = totalCount > 0;

  return (
    <div
      ref={wrapperRef}
      className={`heat-map-container ${isFullscreen ? 'heat-map-fullscreen-active' : ''}`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        background: '#0b1712',
        padding: '12px 16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999999,
        boxSizing: 'border-box'
      } : {}}
    >
      {/* Header del Mapa de Calor */}
      <div className="heat-map-header" style={{ flexShrink: 0, marginBottom: isFullscreen ? '8px' : '16px' }}>
        <div className="heat-map-title">
          <Flame size={20} className="flame-icon" />
          <h3>Mapa de Calor Táctico ({teamName})</h3>
        </div>

        <div className="heat-map-controls">
          <div className="heat-mode-pills">
            {[{key:'density',label:'Actividad General'},{key:'passes',label:'Pases'},{key:'shots',label:'Tiros'}].map(({key,label})=>(
              <button key={key} type="button" className={`mode-pill ${activeTab===key?'active':''}`} onClick={()=>setActiveTab(key)}>{label}</button>
            ))}
          </div>

          {players.length > 0 && (
            <div className="player-filter-select-wrapper">
              <select value={selectedPlayerId} onChange={e=>onSelectPlayer&&onSelectPlayer(e.target.value)} className="player-filter-select">
                <option value="all">Todo el equipo ({teamName})</option>
                {players.map(p=>(
                  <option key={p.id} value={p.id}>#{p.dorsal||p.number||'•'} {p.nombre||p.name||'Jugador'}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn-fullscreen-match-card"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {/* Campo SVG con rejilla superpuesta (Zero-scroll en Fullscreen) */}
      <div
        className="field-heatmap-wrapper"
        style={isFullscreen ? {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        } : { position: 'relative' }}
      >
        {/* Botón flotante directo en la esquina del campo */}
        <button
          type="button"
          className="btn-floating-pitch-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de Pantalla Completa' : 'Ver en Pantalla Completa'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <div style={{ position: 'relative', width: '100%', height: isFullscreen ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 105 68"
            className="football-pitch-svg"
            preserveAspectRatio="none"
            style={isFullscreen ? { maxHeight: 'calc(100vh - 120px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
          >
            <rect x="0" y="0" width="105" height="68" fill="#1b4d2e" />
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} x={i*(105/9)} y="0" width={105/9} height="68"
                fill={i%2===0?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.02)'} />
            ))}
            
            {/* Líneas perimetrales y de fútbol */}
            <rect x="3" y="3" width="99" height="62" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <line x1="52.5" y1="3" x2="52.5" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <circle cx="52.5" cy="34" r="0.8" fill="rgba(255,255,255,0.7)" />

            {/* Áreas penales */}
            <rect x="3" y="14" width="16.5" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <rect x="3" y="24.5" width="5.5" height="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <circle cx="14" cy="34" r="0.8" fill="rgba(255,255,255,0.7)" />
            <rect x="85.5" y="14" width="16.5" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <rect x="96.5" y="24.5" width="5.5" height="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <circle cx="91" cy="34" r="0.8" fill="rgba(255,255,255,0.7)" />

            {/* Pasillos Tácticos Horizontales (Bandas y Centro) */}
            <line x1="3" y1="22.6" x2="102" y2="22.6" stroke="rgba(212,168,67,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="3" y1="45.3" x2="102" y2="45.3" stroke="rgba(212,168,67,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* Etiquetas de Sector y Zonas */}
            <text x="52.5" y="13" textAnchor="middle" fill="rgba(212,168,67,0.4)" fontSize="2.8" fontWeight="bold">⬅️ BANDA IZQUIERDA</text>
            <text x="52.5" y="34.8" textAnchor="middle" fill="rgba(212,168,67,0.4)" fontSize="2.8" fontWeight="bold">⏺️ PASILLO CENTRAL</text>
            <text x="52.5" y="57" textAnchor="middle" fill="rgba(212,168,67,0.4)" fontSize="2.8" fontWeight="bold">➡️ BANDA DERECHA</text>

            <text x="17" y="6.5" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="3.2" fontWeight="bold">DEFENSA</text>
            <text x="52.5" y="6.5" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="3.2" fontWeight="bold">MEDIO</text>
            <text x="88" y="6.5" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="3.2" fontWeight="bold">ATAQUE</text>
          </svg>

          {/* Celdas interactivas de calor */}
          <div 
            className="heatmap-grid" 
            style={{ 
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`
            }}
          >
            {grid.map((row, rIdx) => 
              row.map((count, cIdx) => {
                const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: getCellColor(count)
                    }}
                    onMouseEnter={() => setHoveredCell({ row: rIdx, col: cIdx, count, pct })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })
            )}
          </div>

          {/* Tooltip flotante */}
          {hoveredCell && (
            <div className="heatmap-tooltip">
              <div className="tooltip-title">Sector [{hoveredCell.col + 1}, {hoveredCell.row + 1}]</div>
              <div className="tooltip-value">{hoveredCell.count} acción(es) ({hoveredCell.pct}%)</div>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda de Intensidad */}
      <div className="heatmap-legend" style={{ flexShrink: 0, marginTop: isFullscreen ? '6px' : '14px' }}>
        <div className="legend-scale">
          <span className="legend-label">Baja actividad</span>
          <div className="legend-gradient-bar" />
          <span className="legend-label">Alta intensidad</span>
        </div>
        <div className="total-actions-badge">
          Total acciones analizadas: <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Panel explicativo de sectores (oculto en fullscreen para evitar scroll) */}
      {!isFullscreen && (
        <div className="heatmap-zone-info">
          <p className="zone-info-title">📍 <strong>Mapeo de Zonas y Bandas del Campo</strong></p>
          <p className="zone-info-desc">
            Cada botón de captura registra automáticamente el tercio (Defensa, Medio, Ataque) y el <strong>sector activo</strong> (Banda Izquierda, Centro, Banda Derecha) seleccionado en la barra de captura.
          </p>
          <div className="zone-info-grid">
            <div className="zone-info-item"><span className="zone-dot" style={{background:'#EF4444'}}/><div><strong>Ataque</strong><span>Tiros a puerta, Córners a favor, Fuera de juego</span></div></div>
            <div className="zone-info-item"><span className="zone-dot" style={{background:'#D4A843'}}/><div><strong>Medio</strong><span>Recuperaciones, Pérdidas, Duelos, Faltas</span></div></div>
            <div className="zone-info-item"><span className="zone-dot" style={{background:'#3B82F6'}}/><div><strong>Defensa</strong><span>Tiros rivales, Córners en contra, Tarjetas</span></div></div>
          </div>
          {!hasEvents && (
            <p className="zone-info-empty">⬆️ Pulsa botones en <strong>"Captura en Vivo"</strong> para poblar el mapa.</p>
          )}
        </div>
      )}
    </div>
  );
};

