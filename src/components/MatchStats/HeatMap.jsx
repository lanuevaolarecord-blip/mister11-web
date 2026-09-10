import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Flame, Maximize2, Minimize2, Eye } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

// ── Mapa semántico: tipo de evento → zona estimada (0–100) ──────────────────
const ZONE_MAP = {
  shot_on_target_own:    { x: 88, y: 50 },
  shot_off_target_own:   { x: 80, y: 45 },
  shot_on_target_rival:  { x: 12, y: 50 },
  shot_off_target_rival: { x: 20, y: 55 },
  gol:                   { x: 92, y: 50 },
  goal:                  { x: 92, y: 50 },
  gol_local:             { x: 92, y: 50 },
  gol_rival:             { x: 8,  y: 50 },
  pass:                  { x: 50, y: 50 },
  pase:                  { x: 50, y: 50 },
  pass_completed:        { x: 55, y: 50 },
  pass_failed:           { x: 52, y: 50 },
  key_pass:              { x: 74, y: 50 },
  recovery:              { x: 55, y: 48 },
  loss:                  { x: 45, y: 52 },
  ball_loss:             { x: 45, y: 52 },
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
  const { isEn } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState(null);
  const [activeTab, setActiveTab] = useState('density');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTacticalGuide, setShowTacticalGuide] = useState(false);
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
      if (activeTab === 'passes' && !['recovery','duel_won','pass','pase','pass_completed','pass_failed','key_pass'].includes(e.type)) return false;
      if (activeTab === 'shots' && !['shot_on_target_own','shot_off_target_own','shot_on_target_rival','shot_off_target_rival','shot','tiro','gol','goal','gol_local','gol_rival'].includes(e.type)) return false;
      return true;
    });
  }, [events, selectedPlayerId, activeTab]);

  // Construir la matriz usando ZONE_MAP como fallback si no hay coordenadas reales
  const { grid, maxCount, totalCount } = useMemo(() => {
    const matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let max = 0;
    let total = 0;

    filteredEvents.forEach(e => {
      // Determinar Y prioritariamente por sector lateral seleccionado
      let y = 50;
      const sec = String(e.sector || '').toLowerCase();
      if (sec === 'left' || sec.includes('izq')) {
        y = 16;
      } else if (sec === 'right' || sec.includes('der')) {
        y = 84;
      } else if (sec === 'center' || sec.includes('cent')) {
        y = 50;
      } else if (typeof e.y === 'number' && e.y >= 0 && e.y <= 100 && e.y !== 50) {
        y = e.y;
      } else if (ZONE_MAP[e.type]) {
        y = ZONE_MAP[e.type].y;
      }

      // Determinar X por coordenadas numéricas o zona según acción
      let fallbackX = ZONE_MAP[e.type]?.x ?? 50;
      if (e.type?.includes('shot') || e.type?.includes('goal') || e.type === 'corner_favor') fallbackX = 85;
      else if (e.type?.includes('foul') || e.type?.includes('card') || e.type === 'corner_against') fallbackX = 30;

      const x = (typeof e.x === 'number' && e.x >= 0 && e.x <= 100) ? e.x : fallbackX;

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
        height: '100dvh',
        maxHeight: '100dvh',
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
          <h3>{isEn ? `Tactical Heat Map (${teamName})` : `Mapa de Calor Táctico (${teamName})`}</h3>
        </div>

        <div className="heat-map-controls">
          <div className="heat-mode-pills">
            {[
              { key: 'density', label: isEn ? 'Overall Activity' : 'Actividad General' },
              { key: 'passes', label: isEn ? 'Passes' : 'Pases' },
              { key: 'shots', label: isEn ? 'Shots' : 'Tiros' }
            ].map(({ key, label }) => (
              <button key={key} type="button" className={`mode-pill ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
            ))}
          </div>

          {players.length > 0 && (
            <div className="player-filter-select-wrapper">
              <select value={selectedPlayerId} onChange={e => onSelectPlayer && onSelectPlayer(e.target.value)} className="player-filter-select">
                <option value="all">{isEn ? `Whole Team (${teamName})` : `Todo el equipo (${teamName})`}</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>#{p.dorsal || p.number || '•'} {p.nombre || p.name || (isEn ? 'Player' : 'Jugador')}</option>
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
            <span>{isFullscreen ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
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
          title={isFullscreen ? (isEn ? 'Exit Fullscreen' : 'Salir de Pantalla Completa') : (isEn ? 'View Fullscreen' : 'Ver en Pantalla Completa')}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <div style={{ position: 'relative', width: '100%', height: isFullscreen ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 105 68"
            className="football-pitch-svg"
            preserveAspectRatio="none"
            style={isFullscreen ? { maxHeight: 'calc(100dvh - 120px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
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
            <line x1="3" y1="22.6" x2="102" y2="22.6" stroke="rgba(212,168,67,0.4)" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="3" y1="45.3" x2="102" y2="45.3" stroke="rgba(212,168,67,0.4)" strokeWidth="0.6" strokeDasharray="2 2" />

            {/* Etiquetas de Sector y Zonas con Contraste Máximo */}
            <text x="52.5" y="13" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.35" fontSize="3.2" fontWeight="900" style={{ paintOrder: 'stroke fill' }}>⬅️ {isEn ? 'LEFT FLANK' : 'BANDA IZQUIERDA'}</text>
            <text x="52.5" y="34.8" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.35" fontSize="3.2" fontWeight="900" style={{ paintOrder: 'stroke fill' }}>⏺️ {isEn ? 'CENTER CHANNEL' : 'PASILLO CENTRAL'}</text>
            <text x="52.5" y="57" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.35" fontSize="3.2" fontWeight="900" style={{ paintOrder: 'stroke fill' }}>➡️ {isEn ? 'RIGHT FLANK' : 'BANDA DERECHA'}</text>

            <text x="17" y="7" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.35" fontSize="3.6" fontWeight="900" style={{ paintOrder: 'stroke fill' }}>{isEn ? 'DEFENSE' : 'DEFENSA'}</text>
            <text x="52.5" y="7" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.35" fontSize="3.6" fontWeight="900" style={{ paintOrder: 'stroke fill' }}>{isEn ? 'MIDFIELD' : 'MEDIO'}</text>
            <text x="88" y="7" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.35" fontSize="3.6" fontWeight="900" style={{ paintOrder: 'stroke fill' }}>{isEn ? 'ATTACK' : 'ATAQUE'}</text>
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
              <div className="tooltip-title">{isEn ? 'Sector' : 'Sector'} [{hoveredCell.col + 1}, {hoveredCell.row + 1}]</div>
              <div className="tooltip-value">{hoveredCell.count} {isEn ? 'action(s)' : 'acción(es)'} ({hoveredCell.pct}%)</div>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda de Intensidad */}
      <div className="heatmap-legend" style={{ flexShrink: 0, marginTop: isFullscreen ? '6px' : '14px' }}>
        <div className="legend-scale">
          <span className="legend-label">{isEn ? 'Low activity' : 'Baja actividad'}</span>
          <div className="legend-gradient-bar" />
          <span className="legend-label">{isEn ? 'High intensity' : 'Alta intensidad'}</span>
        </div>
        <div className="total-actions-badge">
          {isEn ? 'Total analyzed actions:' : 'Total acciones analizadas:'} <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Panel explicativo pedagógico y táctico (oculto en fullscreen para evitar scroll) */}
      {!isFullscreen && (
        <div className="tactical-guide-panel">
          <div className="tactical-guide-header" onClick={() => setShowTacticalGuide(prev => !prev)}>
            <div className="tactical-guide-title">
              <span className="guide-icon">💡</span>
              <strong>{isEn ? 'Tactical Guide: How to interpret and use this Heat Map?' : 'Guía Táctica: ¿Cómo interpretar y usar este Mapa de Calor?'}</strong>
            </div>
            <button type="button" className="tactical-guide-toggle-btn">
              {showTacticalGuide ? (isEn ? 'Hide Guide ▲' : 'Ocultar Explicación ▲') : (isEn ? 'View Methodology ▼' : 'Ver Metodología Completa ▼')}
            </button>
          </div>

          <div className="tactical-guide-summary">
            <span>📍 {isEn ? 'Analyzed thirds:' : 'Tercios analizados:'} <strong>{isEn ? 'Defense (0-35m)' : 'Defensa (0-35m)'}</strong> · <strong>{isEn ? 'Midfield (35-70m)' : 'Medio (35-70m)'}</strong> · <strong>{isEn ? 'Attack (70-105m)' : 'Ataque (70-105m)'}</strong></span>
            <span>⚡ {isEn ? 'Flank sectors:' : 'Sectores laterales:'} <strong>{isEn ? 'Left Flank (0-33%)' : 'Banda Izq (0-33%)'}</strong> · <strong>{isEn ? 'Center (33-66%)' : 'Centro (33-66%)'}</strong> · <strong>{isEn ? 'Right Flank (66-100%)' : 'Banda Der (66-100%)'}</strong></span>
          </div>

          {showTacticalGuide && (
            <div className="tactical-guide-body">
              <div className="guide-card">
                <h4>📖 {isEn ? 'What is this map?' : '¿Qué es este mapa?'}</h4>
                <p>
                  {isEn
                    ? 'A matrix representation (15 columns × 10 rows) of the spatial density and playing intensity of your team or specific player. Shows where ball actions were concentrated throughout the match.'
                    : 'Es una representación matricial (15 columnas × 10 filas) de la densidad espacial e intensidad de juego de tu equipo o de un jugador específico. Refleja dónde se concentraron las acciones con balón (pases, recuperaciones, duelos, faltas y disparos) a lo largo del partido.'}
                </p>
              </div>

              <div className="guide-card">
                <h4>📲 {isEn ? 'How are data collected?' : '¿Cómo se toman los datos?'}</h4>
                <p>
                  {isEn
                    ? 'Each action registered in "Live Capture" or "Post-Match Entry" automatically assigns coordinates based on two verified parameters:'
                    : 'Cada intervención registrada en la pestaña "Captura en Vivo" o en la "Carga Post-Partido" asigna automáticamente las coordenadas en base a dos parámetros verificados:'}
                </p>
                <ul>
                  <li><strong>{isEn ? 'Longitudinal Third:' : 'Tercio longitudinal:'}</strong> {isEn ? 'Determined by play nature (Attack: shots & crosses; Midfield: duels, passes & turnovers; Defense: clearances & fouls).' : 'Determinado según la naturaleza de la jugada (Ataque: remates y centros; Medio: duelos, pases y pérdidas; Defensa: despejes y faltas defensivas).'}</li>
                  <li><strong>{isEn ? 'Play Sector:' : 'Sector de jugada:'}</strong> {isEn ? 'Assigned by active sector button (Left Flank, Center, Right Flank) chosen during capture.' : 'Asignado por el botón de sector activo (⬅️ Banda Izquierda, ⏺️ Centro, ➡️ Banda Derecha) seleccionado durante la captura.'}</li>
                </ul>
              </div>

              <div className="guide-card">
                <h4>🎯 {isEn ? 'How to use it tactically?' : '¿Cómo se debe usar táctica y operativamente?'}</h4>
                <ul>
                  <li><strong>{isEn ? 'Detect offensive asymmetries:' : 'Detectar asimetrías ofensivas:'}</strong> {isEn ? "Check if team attacks obsessively down one wing and ignores the opponent's weak side." : 'Comprueba si el equipo ataca obsesivamente por una banda y desaprovecha el lado débil del rival.'}</li>
                  <li><strong>{isEn ? 'Evaluate block height:' : 'Evaluar la altura del bloque:'}</strong> {isEn ? 'If red high-density zones sit in mid/defensive third, the team played a low block; if concentrated in midfield/attack, high press succeeded.' : 'Si las zonas rojas de alta intensidad están en tercio medio y defensivo, el equipo jugó en bloque bajo; si predominan en medio campo y ataque, la presión alta y el dominio territorial fueron efectivos.'}</li>
                  <li><strong>{isEn ? 'Player-by-player analysis:' : 'Análisis por jugador:'}</strong> {isEn ? 'Select a player to check whether wingers held width, pivot dominated central channel, or striker entered the box frequently.' : 'Selecciona un jugador en el desplegable superior para verificar si los extremos mantuvieron la amplitud, si el pivote dominó el pasillo central o si el delantero pisó el área con frecuencia.'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeatMap;

