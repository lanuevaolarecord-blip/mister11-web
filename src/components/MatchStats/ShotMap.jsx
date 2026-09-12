import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Target, Trophy, Percent, Crosshair, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { calculateShotXg } from '../../config/xgWeights';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';

export const ShotMap = ({
  shots = [],
  teamName = 'Local',
  players = []
}) => {
  const [selectedShot, setSelectedShot] = useState(null);
  const [showTacticalGuide, setShowTacticalGuide] = useState(false);
  const wrapperRef = useRef(null);
  const { isEn, t } = useTranslation();
  const { isFullscreen, isTheater, toggle: toggleFullscreen } = useTheaterFullscreen(wrapperRef);
  const isExpanded = isFullscreen || isTheater;

  // Calcular modelo de xG canónico (Expected Goals) para cada tiro
  const shotsWithXG = useMemo(() => {
    return shots.map((shot, idx) => {
      let y = typeof shot.y === 'number' ? shot.y : 50;
      const sec = String(shot.sector || '').toLowerCase();
      if (sec === 'left' || sec.includes('izq')) y = 18;
      else if (sec === 'right' || sec.includes('der')) y = 82;
      else if (sec === 'center' || sec.includes('cent')) y = 50;

      const x = typeof shot.x === 'number' ? shot.x : 78;

      // Distancia en metros (asumiendo campo 105x68m)
      const dx = ((100 - x) / 100) * 105;
      const dy = Math.abs(50 - y) * 0.68;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Usar modelo canónico de xG weights
      const finalXG = shot.xG !== undefined ? Number(shot.xG) : calculateShotXg({ ...shot, x, y });

      return {
        ...shot,
        id: shot.id || `shot-${idx}`,
        x,
        y,
        distMeters: Math.round(dist),
        xG: shot.xG !== undefined ? Number(shot.xG) : finalXG
      };
    });
  }, [shots]);

  // Resumen acumulado de métricas
  const { totalXG, goalsCount, onTargetCount, conversionRate } = useMemo(() => {
    let sumXG = 0;
    let goals = 0;
    let onTarget = 0;

    shotsWithXG.forEach(s => {
      sumXG += s.xG;
      const isGoal = s.outcome === 'goal' || s.type === 'gol' || s.type === 'goal' || s.type === 'gol_local' || s.type === 'gol_rival' || s.isGoal;
      const isOnTarget = isGoal || s.outcome === 'on_target' || s.type === 'tiro_puerta' || s.type === 'shot_on_target_own' || s.type === 'shot_on_target_rival';
      if (isGoal) goals++;
      if (isOnTarget) onTarget++;
    });

    const conversion = shotsWithXG.length > 0 ? Math.round((goals / shotsWithXG.length) * 100) : 0;

    return {
      totalXG: sumXG.toFixed(2),
      goalsCount: goals,
      onTargetCount: onTarget,
      conversionRate: conversion
    };
  }, [shotsWithXG]);

  const getOutcomeBadge = (shot) => {
    const isGoal = shot.outcome === 'goal' || shot.type === 'gol' || shot.type === 'goal' || shot.type === 'gol_local' || shot.type === 'gol_rival' || shot.isGoal;
    if (isGoal) {
      return { label: 'GOL', icon: '⚽', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)', isGoal: true };
    }
    const isOnTarget = shot.outcome === 'on_target' || shot.type === 'tiro_puerta' || shot.type === 'shot_on_target_own' || shot.type === 'shot_on_target_rival';
    if (isOnTarget) {
      return { label: isEn ? 'On Target' : 'A Puerta', icon: '🎯', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' };
    }
    if (shot.outcome === 'blocked' || shot.type === 'tiro_bloqueado') {
      return { label: isEn ? 'Blocked' : 'Bloqueado', icon: '🚫', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
    }
    return { label: isEn ? 'Missed' : 'Fuera', icon: '❌', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
  };

  return (
    <div
      ref={wrapperRef}
      className="shot-map-container"
      style={isExpanded ? {
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
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999999,
        boxSizing: 'border-box'
      } : {}}
    >
      {/* Header del Shot Map */}
      <div className="shot-map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            {isEn ? `Shot Map & xG Model (${teamName})` : `Mapa de Tiros y Modelo xG (${teamName})`}
          </h3>
        </div>
        <button
          type="button"
          className="btn-fullscreen-match-card"
          onClick={toggleFullscreen}
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{isExpanded ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
        </button>
      </div>

      {/* Tarjetas KPI de Tiros & xG */}
      <div className="shot-kpi-grid" style={{ flexShrink: 0, marginBottom: isFullscreen ? '8px' : '16px' }}>
        <div className="shot-kpi-card">
          <div className="kpi-icon-box gold">
            <Trophy size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalXG}</span>
            <span className="kpi-label">{isEn ? 'Expected xG' : 'xG Esperado'}</span>
          </div>
        </div>

        <div className="shot-kpi-card">
          <div className="kpi-icon-box green">
            <Target size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{goalsCount} / {shotsWithXG.length}</span>
            <span className="kpi-label">{isEn ? 'Goals / Shots' : 'Goles / Tiros'}</span>
          </div>
        </div>

        <div className="shot-kpi-card">
          <div className="kpi-icon-box blue">
            <Crosshair size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{onTargetCount}</span>
            <span className="kpi-label">{isEn ? 'Shots on Target' : 'Tiros a Puerta'}</span>
          </div>
        </div>

        <div className="shot-kpi-card">
          <div className="kpi-icon-box purple">
            <Percent size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{conversionRate}%</span>
            <span className="kpi-label">{isEn ? 'Conversion' : 'Conversión'}</span>
          </div>
        </div>
      </div>

      {/* Medio Campo Ofensivo SVG con Tiros (Zero-scroll) */}
      <div
        className="field-shot-canvas"
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
          style={{ minWidth: '48px', minHeight: '48px' }}
          title={isExpanded ? (isEn ? 'Exit Fullscreen' : 'Salir de Pantalla Completa') : (isEn ? 'View Fullscreen' : 'Ver en Pantalla Completa')}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <svg
          viewBox="0 0 68 55"
          className="half-pitch-svg"
          preserveAspectRatio="none"
          style={isExpanded ? { maxHeight: 'calc(100dvh - 200px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
        >
          {/* Fondo del campo */}
          <rect x="0" y="0" width="68" height="55" fill="#1b4d2e" />

          {/* Franjas de césped estadio */}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x="0"
              y={i * (55 / 6)}
              width="68"
              height={55 / 6}
              fill={i % 2 === 0 ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.02)'}
            />
          ))}

          {/* Pasillos Verticales (Banda Izquierda, Centro, Banda Derecha) */}
          <line x1="22.6" y1="3" x2="22.6" y2="52" stroke="rgba(212,168,67,0.3)" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="45.3" y1="3" x2="45.3" y2="52" stroke="rgba(212,168,67,0.3)" strokeWidth="0.6" strokeDasharray="2 2" />

          {/* Rótulos de Sectores Tácticos en el Medio Campo Ofensivo */}
          <text x="11.3" y="8" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.3" fontSize="2.4" fontWeight="800" style={{ paintOrder: 'stroke fill' }}>⬅️ {isEn ? 'LEFT WING' : 'BANDA IZQ'}</text>
          <text x="34" y="8" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.3" fontSize="2.4" fontWeight="800" style={{ paintOrder: 'stroke fill' }}>⏺️ {isEn ? 'CENTER' : 'PASILLO CENTRAL'}</text>
          <text x="56.7" y="8" textAnchor="middle" fill="#FFFFFF" stroke="#000000" strokeWidth="0.3" fontSize="2.4" fontWeight="800" style={{ paintOrder: 'stroke fill' }}>➡️ {isEn ? 'RIGHT WING' : 'BANDA DER'}</text>

          {/* Línea de medio campo */}
          <line x1="3" y1="3" x2="65" y2="3" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
          {/* Semicírculo central */}
          <path d="M 24.85 3 A 9.15 9.15 0 0 0 43.15 3" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
          <circle cx="34" cy="3" r="0.8" fill="rgba(255,255,255,0.85)" />

          {/* Líneas laterales y línea de fondo */}
          <line x1="3" y1="3" x2="3" y2="52" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
          <line x1="65" y1="3" x2="65" y2="52" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
          <line x1="3" y1="52" x2="65" y2="52" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />

          {/* Arcos de Córner inferiores */}
          <path d="M 3 50 A 2 2 0 0 0 5 52" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
          <path d="M 63 52 A 2 2 0 0 0 65 50" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />

          {/* Área grande (40m x 16.5m) */}
          <rect x="14" y="35.5" width="40" height="16.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />

          {/* Área pequeña (19m x 5.5m) */}
          <rect x="24.5" y="46.5" width="19" height="5.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />

          {/* Punto de penalti a 11m de la línea de fondo */}
          <circle cx="34" cy="41" r="0.8" fill="rgba(255,255,255,0.85)" />

          {/* Semicírculo del área grande (arco de penalti) */}
          <path d="M 27.5 35.5 A 9.15 9.15 0 0 1 40.5 35.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />

          {/* Portería */}
          <rect x="30.34" y="52" width="7.32" height="2.2" fill="rgba(255,255,255,0.2)" stroke="#D4A843" strokeWidth="0.7" />
          <text x="34" y="50" textAnchor="middle" fill="#D4A843" fontSize="1.8" fontWeight="800">{isEn ? 'GOAL' : 'PORTERÍA'}</text>

          {/* Renderizado de Marcadores de Tiro */}
          {shotsWithXG.map(shot => {
            // Mapear coordenadas a 68x55
            const posX = Math.max(5, Math.min(63, 3 + (shot.y / 100) * 62));
            const rawY = typeof shot.x === 'number' ? shot.x : 75;
            const posY = Math.max(5, Math.min(50, 3 + (Math.max(0, rawY - 45) / 55) * 48));

            const badge = getOutcomeBadge(shot);
            const radius = Math.max(1.8, Math.min(4.2, 1.6 + shot.xG * 3.5));
            const isSelected = selectedShot?.id === shot.id;

            return (
              <g
                key={shot.id}
                transform={`translate(${posX}, ${posY})`}
                onClick={() => setSelectedShot(shot)}
                style={{ cursor: 'pointer' }}
                className="shot-marker-group"
              >
                {/* Halo de selección */}
                {isSelected && (
                  <circle r={radius + 1.8} fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
                )}

                {/* Círculo con tamaño = xG */}
                <circle
                  r={radius}
                  fill={badge.color}
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  fillOpacity="0.9"
                />

                {/* Indicador especial de Gol */}
                {badge.isGoal && (
                  <circle
                    r={radius + 0.9}
                    fill="none"
                    stroke="#D4A843"
                    strokeWidth="0.8"
                    strokeDasharray="1.5 1.5"
                  />
                )}

                {/* Valor de xG sobre el tiro */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth="0.25"
                  fontSize="1.8"
                  fontWeight="900"
                  style={{ paintOrder: 'stroke fill' }}
                >
                  {badge.isGoal ? '⚽' : shot.xG.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Modal de Detalle de Tiro */}
        {selectedShot && (
          <div className="shot-detail-card">
            <div className="detail-card-header">
              <div className="header-left">
                <span className="outcome-pill" style={{ backgroundColor: getOutcomeBadge(selectedShot).bg, color: getOutcomeBadge(selectedShot).color }}>
                  {getOutcomeBadge(selectedShot).icon} {getOutcomeBadge(selectedShot).label}
                </span>
                <strong>{'⏱'} {isEn ? 'Minute' : 'Minuto'} {selectedShot.minute || selectedShot.time || '—'}′</strong>
              </div>
              <button type="button" onClick={() => setSelectedShot(null)} className="close-btn">
                <X size={14} />
              </button>
            </div>
            <div className="detail-card-grid">
              <div>{isEn ? 'Player:' : 'Jugador:'} <strong>{selectedShot.playerName || `#${selectedShot.playerNumber || '—'}`}</strong></div>
              <div>{isEn ? 'xG Value:' : 'Valor xG:'} <strong className="gold-text">{selectedShot.xG}</strong></div>
              <div>{isEn ? 'Distance:' : 'Distancia:'} <strong>{selectedShot.distMeters} {isEn ? 'm' : 'metros'}</strong></div>
              <div>{isEn ? 'Type:' : 'Tipo:'} <strong>{selectedShot.action || selectedShot.bodyPart || (isEn ? 'Foot' : 'Pie')}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de Tiros y xG */}
      <div className="shot-map-legend">
        <div className="legend-outcomes">
          <span>⚽ {isEn ? 'Goal' : 'Gol'}</span>
          <span>🎯 {isEn ? 'On Target' : 'A puerta'}</span>
          <span>❌ {isEn ? 'Missed' : 'Fuera'}</span>
          <span>🚫 {isEn ? 'Blocked' : 'Bloqueado'}</span>
        </div>
        <div className="legend-xg-size">
          <span className="dot small" />
          <span className="dot medium" />
          <span className="dot large" />
          <span className="text">{isEn ? 'Size = Higher xG (Goal Probability)' : 'Tamaño = Mayor xG (Probabilidad de Gol)'}</span>
        </div>
      </div>

      {/* Panel pedagógico y táctico (oculto en fullscreen para evitar scroll) */}
      {!isFullscreen && (
        <div className="tactical-guide-panel" style={{ marginTop: '16px' }}>
          <div className="tactical-guide-header" onClick={() => setShowTacticalGuide(prev => !prev)}>
            <div className="tactical-guide-title">
              <span className="guide-icon">💡</span>
              <strong>{isEn ? 'Tactical Guide: How to interpret and use the Shot Map & xG?' : 'Guía Táctica: ¿Cómo interpretar y usar el Mapa de Tiros y xG?'}</strong>
            </div>
            <button type="button" className="tactical-guide-toggle-btn">
              {showTacticalGuide ? (isEn ? 'Hide Guide ▲' : 'Ocultar Explicación ▲') : (isEn ? 'View Methodology ▼' : 'Ver Metodología Completa ▼')}
            </button>
          </div>

          <div className="tactical-guide-summary">
            <span>🎯 xG = <strong>{isEn ? 'Expected Goals (stochastic goal probability 0.00–1.00)' : 'Expected Goals (Probabilidad estocástica de gol entre 0.00 y 1.00)'}</strong></span>
            <span>📐 {isEn ? 'Criteria:' : 'Criterios:'} <strong>{isEn ? 'Euclidean distance' : 'Distancia euclidiana'}</strong> · <strong>{isEn ? 'Visible goal angle' : 'Ángulo visible de portería'}</strong></span>
          </div>

          {showTacticalGuide && (
            <div className="tactical-guide-body">
              <div className="guide-card">
                <h4>📖 ¿Qué es este mapa?</h4>
                <p>
                  Es una <strong>geolocalización de todos los remates</strong> efectuados hacia la portería rival sobre el medio campo ofensivo reglamentario. A cada tiro se le calcula el índice <strong>xG (Goles Esperados)</strong>, que evalúa la probabilidad matemática de que ese remate acabe en gol basándose en miles de disparos en posiciones idénticas.
                </p>
              </div>

              <div className="guide-card">
                <h4>📲 ¿Cómo se toman los datos?</h4>
                <p>
                  El sistema captura cada remate registrando los siguientes valores clave:
                </p>
                <ul>
                  <li><strong>Ubicación de remate:</strong> Posición en el eje longitudinal ($X$) y sector lateral (Banda Izquierda, Pasillo Central, Banda Derecha).</li>
                  <li><strong>Resultado real:</strong> Clasificación inmediata en <em>GOL</em> (⚽), <em>A puerta</em> (🎯), <em>Fuera</em> (❌) o <em>Bloqueado</em> (🚫).</li>
                  <li><strong>Parámetros balísticos:</strong> Distancia a línea de gol (en metros) y ángulo subtendido entre ambos postes de la portería reglamentaria (7.32m).</li>
                </ul>
              </div>

              <div className="guide-card">
                <h4>🎯 ¿Cómo se debe usar táctica y operativamente?</h4>
                <ul>
                  <li><strong>Calidad vs. Cantidad:</strong> Un equipo con 15 tiros lejanos puede sumar apenas 0.40 xG total, mientras que un equipo con 4 tiros a bocajarro en el área pequeña puede sumar 2.30 xG. Evalúa si tus jugadores seleccionan bien los disparos o rematan precipitadamente desde zonas de bajo peligro.</li>
                  <li><strong>Eficacia rematadora (Goles vs xG):</strong> Si tus goles convertidos superan al total xG, tu equipo está finalizando con gran precisión. Si los goles están muy por debajo del xG, existe un problema de definición o grandes paradas del portero rival.</li>
                  <li><strong>Puntos de remate preferentes:</strong> Comprueba si los tiros nacen tras centros laterales (desde bandas hacia el corazón del área) o filtraciones frontales por el pasillo central.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
