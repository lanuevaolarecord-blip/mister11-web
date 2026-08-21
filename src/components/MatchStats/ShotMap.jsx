import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Target, Trophy, Percent, Crosshair, X, Maximize2, Minimize2 } from 'lucide-react';

export const ShotMap = ({
  shots = [],
  teamName = 'Local',
  players = []
}) => {
  const [selectedShot, setSelectedShot] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef(null);

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

  // Calcular modelo de xG (Expected Goals) para cada tiro
  // Basado en distancia euclidean a la portería objetivo (x: 100, y: 50) y ángulo de visión
  const shotsWithXG = useMemo(() => {
    return shots.map((shot, idx) => {
      let y = typeof shot.y === 'number' ? shot.y : 50;
      if (shot.sector === 'left') y = 25;
      else if (shot.sector === 'right') y = 75;

      const x = typeof shot.x === 'number' ? shot.x : 75;

      // Distancia en metros (asumiendo campo 105x68m)
      const dx = ((100 - x) / 100) * 105;
      const dy = Math.abs(50 - y) * 0.68;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Ángulo de visión de la portería (ancho de portería = 7.32m)
      const goalWidth = 7.32;
      const angle = Math.atan2(goalWidth * dx, dx * dx + dy * dy - (goalWidth / 2) * (goalWidth / 2));
      const angleDeg = Math.max(0, (angle * 180) / Math.PI);

      // Modelo de regresión logística estándar para fútbol
      let xGValue = 1 / (1 + Math.exp(-(-0.13 * dist + 0.05 * angleDeg - 0.6)));

      if (shot.bodyPart === 'head' || shot.bodyPart === 'cabeza') xGValue *= 0.65;
      if (shot.isPenalty || shot.type === 'penalti') xGValue = 0.76;
      if (shot.outcome === 'goal' || shot.type === 'gol') {
        xGValue = Math.max(0.12, xGValue);
      }

      const finalXG = Number(Math.min(0.99, Math.max(0.02, xGValue)).toFixed(2));

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
      if (s.outcome === 'goal' || s.type === 'gol' || s.isGoal) goals++;
      if (s.outcome === 'goal' || s.outcome === 'on_target' || s.type === 'tiro_puerta' || s.type === 'gol') onTarget++;
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
    if (shot.outcome === 'goal' || shot.type === 'gol' || shot.isGoal) {
      return { label: 'GOL', icon: '⚽', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' };
    }
    if (shot.outcome === 'on_target' || shot.type === 'tiro_puerta') {
      return { label: 'A Puerta', icon: '🎯', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' };
    }
    if (shot.outcome === 'blocked' || shot.type === 'tiro_bloqueado') {
      return { label: 'Bloqueado', icon: '🚫', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
    }
    return { label: 'Fuera', icon: '❌', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
  };

  return (
    <div
      ref={wrapperRef}
      className="shot-map-container"
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
      {/* Header del Shot Map */}
      <div className="shot-map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
            Mapa de Tiros y Modelo xG ({teamName})
          </h3>
        </div>
        <button
          type="button"
          className="btn-fullscreen-match-card"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
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
            <span className="kpi-label">xG Esperado</span>
          </div>
        </div>

        <div className="shot-kpi-card">
          <div className="kpi-icon-box green">
            <Target size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{goalsCount} / {shotsWithXG.length}</span>
            <span className="kpi-label">Goles / Tiros</span>
          </div>
        </div>

        <div className="shot-kpi-card">
          <div className="kpi-icon-box blue">
            <Crosshair size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{onTargetCount}</span>
            <span className="kpi-label">Tiros a Puerta</span>
          </div>
        </div>

        <div className="shot-kpi-card">
          <div className="kpi-icon-box purple">
            <Percent size={18} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{conversionRate}%</span>
            <span className="kpi-label">Conversión</span>
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
          title={isFullscreen ? 'Salir de Pantalla Completa' : 'Ver en Pantalla Completa'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <svg
          viewBox="0 0 68 55"
          className="half-pitch-svg"
          preserveAspectRatio="none"
          style={isFullscreen ? { maxHeight: 'calc(100vh - 200px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
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
                <strong>Minuto {selectedShot.minute || selectedShot.time || '—'}′</strong>
              </div>
              <button type="button" onClick={() => setSelectedShot(null)} className="close-btn">
                <X size={14} />
              </button>
            </div>
            <div className="detail-card-grid">
              <div>Jugador: <strong>{selectedShot.playerName || `Dorsal #${selectedShot.playerNumber || '—'}`}</strong></div>
              <div>Valor xG: <strong className="gold-text">{selectedShot.xG}</strong></div>
              <div>Distancia: <strong>{selectedShot.distMeters} metros</strong></div>
              <div>Tipo: <strong>{selectedShot.action || selectedShot.bodyPart || 'Pie'}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de Tiros y xG */}
      <div className="shot-map-legend">
        <div className="legend-outcomes">
          <span>⚽ Gol</span>
          <span>🎯 A puerta</span>
          <span>❌ Fuera</span>
          <span>🚫 Bloqueado</span>
        </div>
        <div className="legend-xg-size">
          <span className="dot small" />
          <span className="dot medium" />
          <span className="dot large" />
          <span className="text">Tamaño = Mayor xG (Probabilidad de Gol)</span>
        </div>
      </div>
    </div>
  );
};
