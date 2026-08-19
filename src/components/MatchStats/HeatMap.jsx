import React, { useState, useMemo } from 'react';
import { Flame, Info, User } from 'lucide-react';

export const HeatMap = ({
  events = [],
  players = [],
  selectedPlayerId = 'all',
  onSelectPlayer,
  teamName = 'Local'
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [activeTab, setActiveTab] = useState('density'); // 'density', 'passes', 'shots'

  const COLS = 15;
  const ROWS = 10;

  // Filtrar eventos por jugador seleccionado y tipo de acción
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedPlayerId !== 'all' && e.playerId !== selectedPlayerId) {
        return false;
      }
      if (activeTab === 'passes' && e.type !== 'pass' && e.type !== 'pase') return false;
      if (activeTab === 'shots' && e.type !== 'shot' && e.type !== 'tiro' && e.type !== 'gol') return false;
      return true;
    });
  }, [events, selectedPlayerId, activeTab]);

  // Construir la matriz de frecuencias
  const { grid, maxCount, totalCount } = useMemo(() => {
    const matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let max = 0;
    let total = 0;

    filteredEvents.forEach(e => {
      // Normalizar coordenadas (0 a 100)
      const x = typeof e.x === 'number' ? Math.max(0, Math.min(100, e.x)) : 50;
      const y = typeof e.y === 'number' ? Math.max(0, Math.min(100, e.y)) : 50;

      const col = Math.min(COLS - 1, Math.floor((x / 100) * COLS));
      const row = Math.min(ROWS - 1, Math.floor((y / 100) * ROWS));

      matrix[row][col] += 1;
      total += 1;
      if (matrix[row][col] > max) {
        max = matrix[row][col];
      }
    });

    return { grid: matrix, maxCount: max || 1, totalCount: total };
  }, [filteredEvents]);

  // Color de celda según intensidad
  const getCellColor = (count) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.02)';
    const ratio = count / maxCount;
    if (ratio < 0.25) {
      return `rgba(74, 222, 128, ${0.3 + ratio * 0.4})`; // Verde claro
    } else if (ratio < 0.55) {
      return `rgba(250, 204, 21, ${0.4 + ratio * 0.4})`; // Amarillo
    } else if (ratio < 0.8) {
      return `rgba(251, 146, 60, ${0.5 + ratio * 0.4})`; // Naranja
    } else {
      return `rgba(239, 68, 68, ${0.6 + ratio * 0.4})`; // Rojo intenso
    }
  };

  return (
    <div className="heat-map-container">
      {/* Header del Mapa de Calor */}
      <div className="heat-map-header">
        <div className="heat-map-title">
          <Flame size={20} className="flame-icon" />
          <h3>Mapa de Calor Táctico</h3>
        </div>

        <div className="heat-map-controls">
          {/* Selector de modo */}
          <div className="heat-mode-pills">
            <button
              type="button"
              className={`mode-pill ${activeTab === 'density' ? 'active' : ''}`}
              onClick={() => setActiveTab('density')}
            >
              Actividad General
            </button>
            <button
              type="button"
              className={`mode-pill ${activeTab === 'passes' ? 'active' : ''}`}
              onClick={() => setActiveTab('passes')}
            >
              Pases
            </button>
            <button
              type="button"
              className={`mode-pill ${activeTab === 'shots' ? 'active' : ''}`}
              onClick={() => setActiveTab('shots')}
            >
              Tiros
            </button>
          </div>

          {/* Selector de Jugador */}
          {players.length > 0 && (
            <div className="player-filter-select-wrapper">
              <User size={14} />
              <select
                value={selectedPlayerId}
                onChange={e => onSelectPlayer && onSelectPlayer(e.target.value)}
                className="player-filter-select"
              >
                <option value="all">Todo el equipo ({teamName})</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.dorsal || p.number || '•'} {p.nombre || p.name || `Jugador`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Representación del Campo con SVG y Rejilla */}
      <div className="field-heatmap-wrapper">
        <svg 
          viewBox="0 0 105 68" 
          className="football-pitch-svg" 
          preserveAspectRatio="none"
        >
          {/* Fondo del campo */}
          <rect x="0" y="0" width="105" height="68" fill="#1b4d2e" />
          
          {/* Rayas de césped estéticas */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect 
              key={i} 
              x={i * (105 / 9)} 
              y="0" 
              width={105 / 9} 
              height="68" 
              fill={i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.02)'} 
            />
          ))}

          {/* Líneas perimetrales y centrales */}
          <rect x="3" y="3" width="99" height="62" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <line x1="52.5" y1="3" x2="52.5" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="0.8" fill="rgba(255,255,255,0.7)" />

          {/* Área penal y portería izquierda */}
          <rect x="3" y="14" width="16.5" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <rect x="3" y="24.5" width="5.5" height="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <circle cx="14" cy="34" r="0.8" fill="rgba(255,255,255,0.7)" />

          {/* Área penal y portería derecha */}
          <rect x="85.5" y="14" width="16.5" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <rect x="96.5" y="24.5" width="5.5" height="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <circle cx="91" cy="34" r="0.8" fill="rgba(255,255,255,0.7)" />
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

      {/* Leyenda de Intensidad */}
      <div className="heatmap-legend">
        <div className="legend-scale">
          <span className="legend-label">Baja actividad</span>
          <div className="legend-gradient-bar" />
          <span className="legend-label">Alta intensidad</span>
        </div>
        <div className="total-actions-badge">
          Total acciones analizadas: <strong>{totalCount}</strong>
        </div>
      </div>
    </div>
  );
};
