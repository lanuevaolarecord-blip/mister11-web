/**
 * src/components/MatchStats/ShotMap.jsx
 * Míster11 — Mapa de Tiros Profesional 105:68 con Modelo xG (App + PDF)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - On Target: #4CAF7D
 *  - Goles: #D4A843
 *  - Fuera / Bloqueado: #94A3B8 (gris neutro)
 *  - Rival: #EF4444 (espejado a la portería que ataca)
 *  - Ratio canónico 105:68 con PitchFrame reglamentario
 *  - Puntos limpios sin texto encima (radio por xG: 6-16px)
 *  - Jitter determinista anti-colisión y popover interactivo
 *  - Toggle [Combinado | Propio | Rival] con chips accesibles
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, Trophy, Percent, Crosshair, X, Maximize2, Minimize2, AlertTriangle, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';
import { TheaterOverlay } from '../common/TheaterOverlay';
import { getMatchAnalytics } from '../../utils/matchAnalytics';
import { getPitchFrameSvgMarkup } from '../canonical/PitchFrame';
import { resolveShotCollisions } from '../canonical/ShotMapSVG';

export const ShotMap = ({
  shots = [],
  events = [],
  matchData = {},
  teamName = 'Local',
  players = []
}) => {
  const [selectedShot, setSelectedShot] = useState(null);
  const [hoveredShot, setHoveredShot] = useState(null);
  const [shotFilter, setShotFilter] = useState('combined'); // 'combined' | 'own' | 'rival'
  const containerRef = useRef(null);
  const { isEn, t } = useTranslation();
  const { isFullscreen, isTheater, toggle: toggleFullscreen } = useTheaterFullscreen(containerRef);

  // Cerrar popover al pulsar fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (selectedShot && !e.target.closest('.shot-marker-g') && !e.target.closest('.shot-popover-card')) {
        setSelectedShot(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [selectedShot]);

  const rawEventsList = useMemo(() => {
    if (events && events.length > 0) return events;
    return shots || [];
  }, [events, shots]);

  const analytics = useMemo(() => {
    return getMatchAnalytics(matchData, rawEventsList, { isEn });
  }, [matchData, rawEventsList, isEn]);

  const { ownShots, rivalShots, all: allShots, ownTotalXg, ownGoalsCount, ownOnTargetCount, conversionRate, bySector } = analytics.shots;
  const { hasFinishingDeficit, finishingDeficitTextEs, finishingDeficitTextEn } = analytics.narrative;

  // Filtrar tiros según toggle
  const displayedShots = useMemo(() => {
    if (shotFilter === 'own') return ownShots;
    if (shotFilter === 'rival') return rivalShots;
    return allShots;
  }, [shotFilter, ownShots, rivalShots, allShots]);

  // Resolver colisiones sobre marco 1050x680
  const resolvedShots = useMemo(() => {
    return resolveShotCollisions(displayedShots, 1000, 630, 25, 25);
  }, [displayedShots]);

  // Conteos para la leyenda
  const counts = useMemo(() => {
    let goals = 0;
    let onTarget = 0;
    let offTarget = 0;
    let rival = 0;
    resolvedShots.forEach(s => {
      if (s.isRival) rival++;
      else if (s.isGoal) goals++;
      else if (s.isOnTarget) onTarget++;
      else offTarget++;
    });
    return { goals, onTarget, offTarget, rival };
  }, [resolvedShots]);

  const getOutcomeBadge = (shot) => {
    if (shot.isRival) {
      return { label: isEn ? 'Opponent Shot' : 'Tiro Rival', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
    }
    if (shot.isGoal) {
      return { label: isEn ? 'GOAL' : 'GOL', color: '#D4A843', bg: 'rgba(212, 168, 67, 0.25)', isGoal: true };
    }
    if (shot.isOnTarget) {
      return { label: isEn ? 'On Target' : 'A Puerta', color: '#4CAF7D', bg: 'rgba(76, 175, 125, 0.2)' };
    }
    return { label: isEn ? 'Off Target / Blocked' : 'Fuera / Bloqueado', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.2)' };
  };

  const activePopoverShot = selectedShot || hoveredShot;

  const renderContent = () => (
    <div className="shot-map-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header del Shot Map */}
      <div className="shot-map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={22} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#F2EDE4' }}>
            {isEn ? `Shot Map & xG Model (${teamName})` : `Mapa de Tiros y Modelo xG (${teamName})`}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Toggle de Selección [Combinado | Propio | Rival] */}
          <div className="shot-filter-chips" style={{ display: 'flex', background: '#152C22', borderRadius: '8px', padding: '3px', border: '1px solid rgba(76, 175, 125, 0.3)' }}>
            <button
              type="button"
              onClick={() => setShotFilter('combined')}
              style={{
                background: shotFilter === 'combined' ? '#4CAF7D' : 'transparent',
                color: shotFilter === 'combined' ? '#FFFFFF' : '#CBD5E1',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '48px',
                transition: 'all 0.2s'
              }}
            >
              {isEn ? 'Combined' : 'Combinado'}
            </button>
            <button
              type="button"
              onClick={() => setShotFilter('own')}
              style={{
                background: shotFilter === 'own' ? '#4CAF7D' : 'transparent',
                color: shotFilter === 'own' ? '#FFFFFF' : '#CBD5E1',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '48px',
                transition: 'all 0.2s'
              }}
            >
              {isEn ? 'Own' : 'Propio'}
            </button>
            <button
              type="button"
              onClick={() => setShotFilter('rival')}
              style={{
                background: shotFilter === 'rival' ? '#EF4444' : 'transparent',
                color: shotFilter === 'rival' ? '#FFFFFF' : '#CBD5E1',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '48px',
                transition: 'all 0.2s'
              }}
            >
              {isEn ? 'Rival' : 'Rival'}
            </button>
          </div>

          <button
            type="button"
            className="btn-fullscreen-match-card"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            style={{ minHeight: '48px', minWidth: '48px', borderRadius: '8px' }}
          >
            {isFullscreen || isTheater ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen || isTheater ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Narrativa Táctica Automática */}
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

      {/* KPIs Oficiales con frase plana e icono */}
      <div className="shot-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,168,67,0.35)', textAlign: 'center' }}>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#D4A843' }}>{ownTotalXg}</div>
          <div style={{ fontSize: '11.5px', color: 'rgba(242,237,228,0.75)', fontWeight: 600 }}>🎯 {isEn ? 'Expected xG' : 'xG Esperado'}</div>
        </div>

        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(76,175,125,0.35)', textAlign: 'center' }}>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#4CAF7D' }}>{ownGoalsCount} / {ownShots.length}</div>
          <div style={{ fontSize: '11.5px', color: 'rgba(242,237,228,0.75)', fontWeight: 600 }}>⚽ {isEn ? 'Goals / Shots' : 'Goles / Tiros'}</div>
        </div>

        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(76,175,125,0.35)', textAlign: 'center' }}>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#4CAF7D' }}>{ownOnTargetCount}</div>
          <div style={{ fontSize: '11.5px', color: 'rgba(242,237,228,0.75)', fontWeight: 600 }}>🥅 {isEn ? 'On Target' : 'Tiros a Puerta'}</div>
        </div>

        <div className="shot-kpi-card" style={{ background: '#152C22', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,168,67,0.35)', textAlign: 'center' }}>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#D4A843' }}>{conversionRate}%</div>
          <div style={{ fontSize: '11.5px', color: 'rgba(242,237,228,0.75)', fontWeight: 600 }}>📈 {isEn ? 'Conversion' : 'Conversión'}</div>
        </div>
      </div>

      {/* Desglose Pedagógico de los 3 Pasillos de Remate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
        <div style={{ background: 'rgba(76, 175, 125, 0.08)', padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.25)', textAlign: 'center' }}>
          <span style={{ fontWeight: 800, color: '#F2EDE4' }}>{isEn ? 'Left Channel' : 'Banda Izquierda'}: </span>
          <strong style={{ color: '#4CAF7D' }}>{bySector.left.count} tiros</strong> ({bySector.left.onTarget} puerta · {bySector.left.goals} ⚽ · {bySector.left.xG} xG)
        </div>
        <div style={{ background: 'rgba(212, 168, 67, 0.12)', padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(212, 168, 67, 0.35)', textAlign: 'center' }}>
          <span style={{ fontWeight: 800, color: '#F2EDE4' }}>{isEn ? 'Central Channel' : 'Pasillo Central'}: </span>
          <strong style={{ color: '#D4A843' }}>{bySector.center.count} tiros</strong> ({bySector.center.onTarget} puerta · {bySector.center.goals} ⚽ · {bySector.center.xG} xG)
        </div>
        <div style={{ background: 'rgba(76, 175, 125, 0.08)', padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.25)', textAlign: 'center' }}>
          <span style={{ fontWeight: 800, color: '#F2EDE4' }}>{isEn ? 'Right Channel' : 'Banda Derecha'}: </span>
          <strong style={{ color: '#4CAF7D' }}>{bySector.right.count} tiros</strong> ({bySector.right.onTarget} puerta · {bySector.right.goals} ⚽ · {bySector.right.xG} xG)
        </div>
      </div>

      {/* Terreno de Juego Canónico 105:68 Responsive */}
      <div
        className="field-shot-canvas-container"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1050px',
          margin: '0 auto',
          aspectRatio: '1050 / 680',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1.5px solid rgba(76, 175, 125, 0.35)',
          background: '#152C22',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)'
        }}
      >
        <svg
          viewBox="0 0 1050 680"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Base y marcado canónico */}
          <g
            id="pitch-base"
            dangerouslySetInnerHTML={{
              __html: getPitchFrameSvgMarkup({
                isDark: true,
                showTacticalCorridors: true,
                showGoals: true,
                showStripes: true,
                corridorsLabel: true,
                isEn
              })
            }}
          />

          {/* Marcadores de Remates sin números encima, con radio dinámico y halo */}
          {resolvedShots.map((shot) => {
            const badge = getOutcomeBadge(shot);
            const isSelected = selectedShot?.id === shot.id || hoveredShot?.id === shot.id;

            return (
              <g
                key={`shot-${shot.id || shot.idx}`}
                className="shot-marker-g"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedShot(selectedShot?.id === shot.id ? null : shot);
                }}
                onMouseEnter={() => setHoveredShot(shot)}
                onMouseLeave={() => setHoveredShot(null)}
              >
                {/* Anillo de comodidad si fue cómodo */}
                {shot.shooterComfort === 'comodo' && (
                  <circle
                    cx={shot.x}
                    cy={shot.y}
                    r={shot.radius + 3}
                    fill="none"
                    stroke="#D4A843"
                    strokeWidth="1.8"
                    strokeDasharray="3 2"
                  />
                )}

                {/* Anillo de gol si fue gol */}
                {badge.isGoal && (
                  <circle
                    cx={shot.x}
                    cy={shot.y}
                    r={shot.radius + 4.5}
                    fill="none"
                    stroke="#D4A843"
                    strokeWidth="2.2"
                  />
                )}

                {/* Halo blanco 2px */}
                <circle
                  cx={shot.x}
                  cy={shot.y}
                  r={shot.radius + (isSelected ? 3.5 : 2)}
                  fill="#FFFFFF"
                  opacity={isSelected ? 1 : 0.9}
                />

                {/* Punto de remate coloreado */}
                <circle
                  cx={shot.x}
                  cy={shot.y}
                  r={shot.radius}
                  fill={badge.color}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
        </svg>

        {/* Popover / Tooltip interactivo flotante al seleccionar o pasar el cursor */}
        {activePopoverShot && (
          <div
            className="shot-popover-card"
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              right: '14px',
              maxWidth: '480px',
              margin: '0 auto',
              background: '#1B3A2D',
              border: '1.5px solid #D4A843',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: getOutcomeBadge(activePopoverShot).bg,
                    color: getOutcomeBadge(activePopoverShot).color,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  {getOutcomeBadge(activePopoverShot).label}
                </span>
                <strong style={{ fontSize: '12px', color: '#F2EDE4' }}>
                  ⏱ Minuto {activePopoverShot.minute || activePopoverShot.minuto || 's/m'}′
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedShot(null);
                  setHoveredShot(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F2EDE4',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11.5px', color: '#CBD5E1' }}>
              <div>
                {isEn ? 'Player:' : 'Jugador:'}{' '}
                <strong style={{ color: '#FFFFFF' }}>{activePopoverShot.playerName || (activePopoverShot.isRival ? 'Rival' : 'Propio')}</strong>
              </div>
              <div>
                {isEn ? 'xG Value:' : 'Valor xG:'}{' '}
                <strong style={{ color: '#D4A843' }}>{Number(activePopoverShot.xG || activePopoverShot.xg || 0.15).toFixed(2)}</strong>
              </div>
              <div>
                {isEn ? 'Comfort:' : 'Comodidad:'}{' '}
                <strong style={{ color: activePopoverShot.shooterComfort === 'comodo' ? '#D4A843' : '#4CAF7D' }}>
                  {activePopoverShot.shooterComfort === 'comodo' ? (isEn ? 'Comfortable' : 'Cómodo') : (isEn ? 'Pressured' : 'Presionado')}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda Canónica con Conteos y Cómo se Lee */}
      <div
        className="shot-legend-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#152C22',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(76, 175, 125, 0.25)',
          fontSize: '11.5px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D4A843', display: 'inline-block' }} />
            <span style={{ color: '#F2EDE4', fontWeight: 600 }}>{isEn ? `Goal (${counts.goals})` : `Gol (${counts.goals})`}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4CAF7D', display: 'inline-block' }} />
            <span style={{ color: '#F2EDE4', fontWeight: 600 }}>{isEn ? `On Target (${counts.onTarget})` : `A puerta (${counts.onTarget})`}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
            <span style={{ color: '#F2EDE4', fontWeight: 600 }}>{isEn ? `Off Target / Blocked (${counts.offTarget})` : `Fuera / Bloqueado (${counts.offTarget})`}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
            <span style={{ color: '#F2EDE4', fontWeight: 600 }}>{isEn ? `Opponent Shot (${counts.rival})` : `Tiro Rival (${counts.rival})`}</span>
          </div>
        </div>

        {/* Línea cómo se lee de una frase */}
        <div style={{ color: 'rgba(242, 237, 228, 0.75)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={14} color="#D4A843" />
          <span>
            {isEn
              ? 'Dot size corresponds to xG probability (6-16px); rival shots mirrored towards attacking goal.'
              : 'Radio según probabilidad xG (6-16px); tiros rivales espejados hacia la portería que ataca.'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="match-shot-map-card" style={{ width: '100%' }}>
      {renderContent()}
      <TheaterOverlay
        isOpen={isTheater}
        onClose={toggleFullscreen}
        title={isEn ? `Shot Map & xG Model (${teamName})` : `Mapa de Tiros y Modelo xG (${teamName})`}
      >
        {renderContent()}
      </TheaterOverlay>
    </div>
  );
};

export default ShotMap;
