/**
 * src/components/MatchStats/ShotMap.jsx
 * Míster11 — Mapa de Tiros y Modelo xG (Mi Equipo)
 *
 * Paleta Oficial Tierra y Campo (Cero azul):
 *  - Fondo institucional: #1B3A2D
 *  - On Target: #4CAF7D (#10B981)
 *  - Goles: #D4A843
 *  - Fuera / Bloqueado: #A3B5AD / #EF4444
 *  - Dispersión determinista (Jitter seed = hash(matchId + shotId))
 *  - Paridad 1:1 con Tab Estadísticas, Post-Partido y PDF Report
 */

import React, { useState, useMemo, useRef } from 'react';
import { Target, Trophy, Percent, Crosshair, X, Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';
import { TheaterOverlay } from '../common/TheaterOverlay';
import { getMatchAnalytics } from '../../utils/matchAnalytics';
import { CHART_THEME } from '../../config/chartTheme';

export const ShotMap = ({
  shots = [],
  events = [],
  matchData = {},
  teamName = 'Local',
  players = []
}) => {
  const [selectedShot, setSelectedShot] = useState(null);
  const [showTacticalGuide, setShowTacticalGuide] = useState(false);
  const containerRef = useRef(null);
  const { isEn, t } = useTranslation();
  const { isFullscreen, isTheater, toggle: toggleFullscreen, exit: exitTheater } = useTheaterFullscreen(containerRef);

  // Consumir el Único Pipeline Canónico de Datos
  const rawEventsList = useMemo(() => {
    if (events && events.length > 0) return events;
    return shots || [];
  }, [events, shots]);

  const analytics = useMemo(() => {
    return getMatchAnalytics(matchData, rawEventsList, { isEn });
  }, [matchData, rawEventsList, isEn]);

  const { ownShots, ownTotalXg, ownGoalsCount, ownOnTargetCount, conversionRate, bySector } = analytics.shots;
  const { hasFinishingDeficit, finishingDeficitTextEs, finishingDeficitTextEn } = analytics.narrative;

  const getOutcomeBadge = (shot) => {
    if (shot.isGoal) {
      return { label: 'GOL', icon: '⚽', color: '#D4A843', bg: 'rgba(212, 168, 67, 0.2)', isGoal: true };
    }
    if (shot.isOnTarget) {
      return { label: isEn ? 'On Target' : 'A Puerta', icon: '🎯', color: '#4CAF7D', bg: 'rgba(76, 175, 125, 0.2)' };
    }
    if (shot.outcome === 'blocked' || String(shot.type).includes('bloqueado')) {
      return { label: isEn ? 'Blocked' : 'Bloqueado', icon: '🚫', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
    }
    return { label: isEn ? 'Missed' : 'Fuera', icon: '❌', color: '#A3B5AD', bg: 'rgba(163, 181, 173, 0.2)' };
  };

  const renderContent = () => (
    <div className="shot-map-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header del Shot Map */}
      <div className="shot-map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#F2EDE4' }}>
            {isEn ? `Shot Map & xG Model (${teamName})` : `Mapa de Tiros y Modelo xG (${teamName})`}
          </h3>
        </div>
        <button
          type="button"
          className="btn-fullscreen-match-card"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          {isFullscreen || isTheater ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{isFullscreen || isTheater ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
        </button>
      </div>

      {/* Alerta de Narrativa Táctica Automática (Regla: goles < xG - 1.5) */}
      {hasFinishingDeficit && (
        <div
          style={{
            background: 'rgba(212, 168, 67, 0.15)',
            border: '1px solid rgba(212, 168, 67, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#D4A843',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{isEn ? finishingDeficitTextEn : finishingDeficitTextEs}</span>
        </div>
      )}

      {/* Tarjetas KPI de Tiros & xG */}
      <div className="shot-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,168,67,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#D4A843' }}>{ownTotalXg}</div>
          <div style={{ fontSize: '11px', color: 'rgba(242,237,228,0.7)', fontWeight: 600 }}>{isEn ? 'Expected xG' : 'xG Esperado'}</div>
        </div>

        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(76,175,125,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#4CAF7D' }}>{ownGoalsCount} / {ownShots.length}</div>
          <div style={{ fontSize: '11px', color: 'rgba(242,237,228,0.7)', fontWeight: 600 }}>{isEn ? 'Goals / Shots' : 'Goles / Tiros'}</div>
        </div>

        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(76,175,125,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#4CAF7D' }}>{ownOnTargetCount}</div>
          <div style={{ fontSize: '11px', color: 'rgba(242,237,228,0.7)', fontWeight: 600 }}>{isEn ? 'On Target' : 'Tiros a Puerta'}</div>
        </div>

        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,168,67,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#D4A843' }}>{conversionRate}%</div>
          <div style={{ fontSize: '11px', color: 'rgba(242,237,228,0.7)', fontWeight: 600 }}>{isEn ? 'Conversion' : 'Conversión'}</div>
        </div>
      </div>

      {/* Desglose Pedagógico de los 3 Pasillos de Remate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
        <div style={{ background: 'rgba(76, 175, 125, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.2)', textAlign: 'center' }}>
          <span style={{ fontWeight: 800, color: '#F2EDE4' }}>{isEn ? 'Left Wing' : 'Banda Izquierda'}: </span>
          <strong style={{ color: '#4CAF7D' }}>{bySector.left.count} tiros</strong> ({bySector.left.onTarget} puerta · {bySector.left.goals} ⚽ · {bySector.left.xG} xG)
        </div>
        <div style={{ background: 'rgba(212, 168, 67, 0.12)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212, 168, 67, 0.3)', textAlign: 'center' }}>
          <span style={{ fontWeight: 800, color: '#F2EDE4' }}>{isEn ? 'Center' : 'Pasillo Central'}: </span>
          <strong style={{ color: '#D4A843' }}>{bySector.center.count} tiros</strong> ({bySector.center.onTarget} puerta · {bySector.center.goals} ⚽ · {bySector.center.xG} xG)
        </div>
        <div style={{ background: 'rgba(76, 175, 125, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.2)', textAlign: 'center' }}>
          <span style={{ fontWeight: 800, color: '#F2EDE4' }}>{isEn ? 'Right Wing' : 'Banda Derecha'}: </span>
          <strong style={{ color: '#4CAF7D' }}>{bySector.right.count} tiros</strong> ({bySector.right.onTarget} puerta · {bySector.right.goals} ⚽ · {bySector.right.xG} xG)
        </div>
      </div>

      {/* Campo Táctico Vertical de Medio Campo con los 21 Tiros Dispersados */}
      <div
        className="field-shot-canvas"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '68 / 55',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1.5px solid rgba(76, 175, 125, 0.3)',
          background: '#152C22',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}
      >
        <svg
          viewBox="0 0 68 55"
          className="half-pitch-svg"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Césped táctico con franjas */}
          <rect x="0" y="0" width="68" height="55" fill="#152C22" />
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x="0"
              y={i * (55 / 6)}
              width="68"
              height={55 / 6}
              fill={i % 2 === 0 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'}
            />
          ))}

          {/* Pasillos Tácticos Verticales muy sutiles */}
          <line x1="22.6" y1="3" x2="22.6" y2="52" stroke="rgba(242,237,228,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="45.3" y1="3" x2="45.3" y2="52" stroke="rgba(242,237,228,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Líneas reglamentarias */}
          <line x1="3" y1="3" x2="65" y2="3" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />
          <path d="M 24.85 3 A 9.15 9.15 0 0 0 43.15 3" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />
          <circle cx="34" cy="3" r="0.8" fill="rgba(255,255,255,0.9)" />

          <line x1="3" y1="3" x2="3" y2="52" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />
          <line x1="65" y1="3" x2="65" y2="52" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />
          <line x1="3" y1="52" x2="65" y2="52" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />

          {/* Área grande */}
          <rect x="14" y="35.5" width="40" height="16.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />
          {/* Área pequeña */}
          <rect x="24.5" y="46.5" width="19" height="5.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />
          {/* Punto de penalti */}
          <circle cx="34" cy="41" r="0.7" fill="rgba(255,255,255,0.9)" />
          {/* Arco de penalti */}
          <path d="M 27.5 35.5 A 9.15 9.15 0 0 1 40.5 35.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" />

          {/* Portería */}
          <rect x="30.34" y="52" width="7.32" height="2.2" fill="rgba(212,168,67,0.3)" stroke="#D4A843" strokeWidth="0.8" />
          <text x="34" y="50" textAnchor="middle" fill="#D4A843" fontSize="2" fontWeight="800">{isEn ? 'GOAL' : 'PORTERÍA'}</text>

          {/* Renderizado individual de CADA UNO de los tiros (visibles e interactivos) */}
          {ownShots.map(shot => {
            const posX = Math.max(5, Math.min(63, 3 + (shot.y / 100) * 62));
            const rawX = typeof shot.x === 'number' ? shot.x : 78;
            const posY = Math.max(6, Math.min(49, 3 + (Math.max(0, rawX - 45) / 55) * 46));

            const badge = getOutcomeBadge(shot);
            const radius = Math.max(2, Math.min(4.5, 1.8 + shot.xG * 3.2));
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

                {/* Círculo del tiro */}
                <circle
                  r={radius}
                  fill={badge.color}
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  fillOpacity="0.95"
                />

                {/* Borde dorado de Gol */}
                {badge.isGoal && (
                  <circle
                    r={radius + 1.2}
                    fill="none"
                    stroke="#D4A843"
                    strokeWidth="0.9"
                    strokeDasharray="1.5 1"
                  />
                )}

                {/* Etiqueta de valor o icono */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth="0.25"
                  fontSize="1.9"
                  fontWeight="900"
                  style={{ paintOrder: 'stroke fill' }}
                >
                  {badge.isGoal ? '⚽' : shot.xG.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Modal / Card flotante de Detalle de Tiro seleccionado */}
        {selectedShot && (
          <div
            className="shot-detail-card"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: '#1B3A2D',
              border: '1.5px solid #D4A843',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: getOutcomeBadge(selectedShot).bg, color: getOutcomeBadge(selectedShot).color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                  {getOutcomeBadge(selectedShot).icon} {getOutcomeBadge(selectedShot).label}
                </span>
                <strong style={{ fontSize: '12px', color: '#F2EDE4' }}>⏱ Minuto {selectedShot.minute}′</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShot(null)}
                style={{ background: 'transparent', border: 'none', color: '#F2EDE4', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px', color: '#CBD5E1' }}>
              <div>{isEn ? 'Player:' : 'Jugador:'} <strong style={{ color: '#FFFFFF' }}>{selectedShot.playerName}</strong></div>
              <div>{isEn ? 'xG Value:' : 'Valor xG:'} <strong style={{ color: '#D4A843' }}>{selectedShot.xG}</strong></div>
              <div>{isEn ? 'Distance:' : 'Distancia:'} <strong style={{ color: '#FFFFFF' }}>{selectedShot.distMeters} m</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda Inferior de Remates */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', fontSize: '11px', color: '#CBD5E1', padding: '4px 0' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D4A843', display: 'inline-block' }} />
          {isEn ? 'Goal (⚽)' : 'Gol (⚽)'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4CAF7D', display: 'inline-block' }} />
          {isEn ? 'On Target (🎯)' : 'A puerta (🎯)'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#A3B5AD', display: 'inline-block' }} />
          {isEn ? 'Off Target / Blocked (❌)' : 'Fuera / Bloqueado (❌)'}
        </span>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="shot-map-container"
      style={{
        width: '100%',
        background: '#1B3A2D',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(212, 168, 67, 0.25)',
        boxSizing: 'border-box'
      }}
    >
      {renderContent()}

      {/* Pantalla Completa / Modo Teatro mediante Portal */}
      <TheaterOverlay isOpen={isTheater} onClose={exitTheater} title={isEn ? 'Shot Map & xG Model' : 'Mapa de Tiros y Modelo xG'}>
        {renderContent()}
      </TheaterOverlay>
    </div>
  );
};

export default ShotMap;
