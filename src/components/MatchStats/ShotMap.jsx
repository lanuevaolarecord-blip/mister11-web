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
          viewBox="0 0 100 80"
          className="half-pitch-svg"
          preserveAspectRatio="none"
          style={isFullscreen ? { maxHeight: 'calc(100vh - 200px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
        >
          {/* Fondo del campo */}
          <rect x="0" y="0" width="100" height="80" fill="#1b4d2e" />

          {/* Pasillos Verticales (Banda Izquierda, Centro, Banda Derecha) */}
          <line x1="33" y1="4" x2="33" y2="76" stroke="rgba(212,168,67,0.25)" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="67" y1="4" x2="67" y2="76" stroke="rgba(212,168,67,0.25)" strokeWidth="0.6" strokeDasharray="2 2" />

          {/* Línea de medio campo */}
          <line x1="0" y1="4" x2="100" y2="4" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <circle cx="50" cy="4" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* Líneas laterales y fondo */}
          <line x1="3" y1="4" x2="3" y2="76" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="97" y1="4" x2="97" y2="76" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="3" y1="76" x2="97" y2="76" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* Área grande */}
          <rect x="22" y="46" width="56" height="30" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

          {/* Área pequeña */}
          <rect x="36" y="66" width="28" height="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

          {/* Punto de penalti */}
          <circle cx="50" cy="56" r="0.8" fill="rgba(255,255,255,0.8)" />

          {/* Portería */}
          <rect x="42" y="76" width="16" height="3" fill="#D4A843" stroke="#FFFFFF" strokeWidth="0.6" />

          {/* Renderizado de Marcadores de Tiro */}
          {shotsWithXG.map(shot => {
            // Mapear coordenadas (x: 50..100 -> Y visual hacia la portería de abajo)
            const posX = Math.max(8, Math.min(92, shot.y)); // Y del dato corresponde al eje horizontal del medio campo
            const posY = Math.max(8, Math.min(74, ((shot.x - 40) / 60) * 70)); // X del dato corresponde a cercanía a portería

            const badge = getOutcomeBadge(shot);
            const radius = Math.max(3.2, Math.min(7.5, 2.5 + shot.xG * 6));
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
                  <circle r={radius + 3} fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                )}

                {/* Círculo con tamaño = xG */}
                <circle
                  r={radius}
                  fill={badge.color}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  fillOpacity="0.85"
                />

                {/* Símbolo central */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize={radius > 5 ? '3.5' : '2.8'}
                >
                  {badge.icon}
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
