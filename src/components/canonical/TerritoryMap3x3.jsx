/**
 * src/components/canonical/TerritoryMap3x3.jsx
 * Míster11 — Componente Canónico de Mapa Territorial 3x3 (Unificado)
 *
 * Fusión canónica del Mapa de Calor Táctico y el Mapa de Eventos por Zona 3x3.
 *
 * Características:
 *  - Dos modos de visualización conmutables: [Intensidad] (escala alfa dorada/esmeralda sobre PitchFrame) y [Detalle] (conteo + mini-desglose).
 *  - Fuente única: matchAnalytics.js (mismos números y definiciones de 9 zonas).
 *  - Controles internos: chips de filtro (Todo / Recuperaciones / Duelos / Tiros / Faltas / Pases), selector de equipo (Mi equipo / Rival / Ambos), selector de jugador.
 *  - Badge reactivo de volumen de acciones y línea de insight táctico automático.
 *  - Guía pedagógica colapsable "¿Cómo se lee?".
 *  - Modo Teatro / Pantalla Completa con touch targets >= 48dp (Android First).
 *  - Tokens de contraste AA por tema (ink, inkMuted, accentText).
 *  - Exportador SVG puro: renderTerritoryMap3x3SvgString (para PDF y tests).
 */

import React, { useState, useMemo, useRef } from 'react';
import { LayoutGrid, Flame, Maximize2, Minimize2, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../context/ThemeContext';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';
import { TheaterOverlay } from '../common/TheaterOverlay';
import { PitchFrame } from './PitchFrame';
import { getMatchAnalytics, ZONE_9_DEFINITIONS, normalizeEventTo9Zone } from '../../utils/matchAnalytics';
import { CHART_THEME } from '../../config/chartTheme';

import { renderTerritoryMap3x3SvgString } from './TerritoryMap3x3SVG.js';
export { renderTerritoryMap3x3SvgString };

/**
 * Componente interactivo React: TerritoryMap3x3
 */
export const TerritoryMap3x3 = ({
  analytics: propAnalytics = null,
  matchData = {},
  events = [],
  players = [],
  teamName = 'Mi Equipo',
  rivalName = 'Rival',
  initialMode = 'intensity', // 'intensity' | 'detail'
  onSwitchToPassNetwork = null,
  showPassNetworkButton = false
}) => {
  const { isEn, t } = useTranslation();
  const { darkMode } = useTheme();
  const isDark = Boolean(darkMode);
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;

  const containerRef = useRef(null);
  const { isFullscreen, isTheater, toggle: toggleFullscreen, exit } = useTheaterFullscreen(containerRef);
  const isExpanded = isFullscreen || isTheater;

  // Estados de control interno
  const [viewMode, setViewMode] = useState(initialMode); // 'intensity' | 'detail'
  const [teamFilter, setTeamFilter] = useState('home'); // 'home' | 'away' | 'both'
  const [actionFilter, setActionFilter] = useState('all'); // 'all' | 'recoveries' | 'duels' | 'shots' | 'fouls' | 'passes'
  const [selectedPlayerId, setSelectedPlayerId] = useState('all');
  const [showTacticalGuide, setShowTacticalGuide] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Analítica canónica consolidada
  const canonicalAnalytics = useMemo(() => {
    return propAnalytics || getMatchAnalytics(matchData, events, { isEn });
  }, [propAnalytics, matchData, events, isEn]);

  // Filtrado de eventos reactivo
  const filteredEvents = useMemo(() => {
    const rawEvents = Array.isArray(events) && events.length > 0
      ? events
      : (matchData.events || []);

    return rawEvents.filter(e => {
      if (!e || e.isValid === false) return false;

      // Filtro de equipo
      const isRival = e.team === 'rival' || e.team === 'away' || String(e.type || '').includes('rival');
      if (teamFilter === 'home' && isRival) return false;
      if (teamFilter === 'away' && !isRival) return false;

      // Filtro de jugador
      if (selectedPlayerId !== 'all') {
        const pId = String(e.playerId || e.jugadorId || '');
        if (pId !== String(selectedPlayerId)) return false;
      }

      // Filtro de acción
      const type = String(e.type || '').toLowerCase();
      if (actionFilter === 'recoveries' && !(type.includes('recov') || type.includes('recuperacion'))) return false;
      if (actionFilter === 'duels' && !(type.includes('duel') || type.includes('duelo'))) return false;
      if (actionFilter === 'shots' && !(type.includes('shot') || type.includes('tiro') || type.includes('gol') || type.includes('goal'))) return false;
      if (actionFilter === 'fouls' && !(type.includes('foul') || type.includes('falta'))) return false;
      if (actionFilter === 'passes' && !(type.includes('pass') || type.includes('pase'))) return false;

      return true;
    });
  }, [events, matchData.events, teamFilter, actionFilter, selectedPlayerId]);

  // Recálculo canónico de las 9 zonas para los filtros activos
  const computedZones = useMemo(() => {
    const stats = {};
    ZONE_9_DEFINITIONS.forEach(z => {
      stats[z.id] = { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0, passes: 0 };
    });

    let total = 0;
    filteredEvents.forEach(e => {
      const zoneId = normalizeEventTo9Zone(e);
      if (!stats[zoneId]) stats[zoneId] = { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0, passes: 0 };

      stats[zoneId].total += 1;
      total += 1;

      const type = String(e.type || '').toLowerCase();
      if (type === 'duel_won' || type === 'duelo_ganado') stats[zoneId].duelsWon += 1;
      else if (type === 'duel_lost' || type === 'duelo_perdido') stats[zoneId].duelsLost += 1;
      else if (type === 'recovery' || type === 'recuperacion') stats[zoneId].recoveries += 1;
      else if (type.includes('shot') || type.includes('tiro') || type.includes('gol') || type.includes('goal')) stats[zoneId].shots += 1;
      else if (type.includes('foul') || type.includes('falta')) stats[zoneId].fouls += 1;
      else if (type.includes('pass') || type.includes('pase')) stats[zoneId].passes += 1;
    });

    const max = Math.max(1, ...Object.values(stats).map(s => s.total));

    // Detección de zona dominante (>= 40%)
    let dominant = null;
    if (total > 0) {
      for (const z of ZONE_9_DEFINITIONS) {
        const count = stats[z.id]?.total || 0;
        const pct = Math.round((count / total) * 100);
        if (pct >= 40) {
          dominant = { id: z.id, nameEs: z.nameEs, nameEn: z.nameEn, pct };
          break;
        }
      }
    }

    return {
      definitions: ZONE_9_DEFINITIONS,
      stats,
      maxZoneEvents: max,
      totalEvents: total,
      dominantZone: dominant
    };
  }, [filteredEvents]);

  // Dimensiones reglamentarias de la rejilla 3x3 en 1050x680
  const pitchX = 25;
  const pitchY = 25;
  const pitchW = 1000;
  const pitchH = 630;
  const colW = pitchW / 3;
  const rowH = pitchH / 3;

  const colPositions = [
    { startX: pitchX, width: colW, labelEs: 'DEFENSA (0-35m)', labelEn: 'DEFENSE (0-35m)' },
    { startX: pitchX + colW, width: colW, labelEs: 'MEDIO (35-70m)', labelEn: 'MIDFIELD (35-70m)' },
    { startX: pitchX + colW * 2, width: colW, labelEs: 'ATAQUE (70-105m)', labelEn: 'ATTACK (70-105m)' },
  ];

  const rowPositions = [
    { startY: pitchY, height: rowH, labelEs: 'BANDA IZQUIERDA (0-33%)', labelEn: 'LEFT FLANK (0-33%)' },
    { startY: pitchY + rowH, height: rowH, labelEs: 'PASILLO CENTRAL (33-66%)', labelEn: 'CENTER CHANNEL (33-66%)' },
    { startY: pitchY + rowH * 2, height: rowH, labelEs: 'BANDA DERECHA (66-100%)', labelEn: 'RIGHT FLANK (66-100%)' },
  ];

  // Helper de color según modo
  const getZoneColor = (count, isHotspot) => {
    if (count === 0) return 'rgba(0, 0, 0, 0.05)';
    const ratio = count / computedZones.maxZoneEvents;

    if (viewMode === 'intensity') {
      // Modo Intensidad: escala alfa dorada/esmeralda noble
      if (isHotspot) return `rgba(212, 168, 67, ${0.45 + ratio * 0.45})`;
      if (ratio > 0.6) return `rgba(228, 200, 120, ${0.35 + ratio * 0.4})`;
      if (ratio > 0.3) return `rgba(76, 175, 125, ${0.25 + ratio * 0.35})`;
      return `rgba(76, 175, 125, ${0.15 + ratio * 0.25})`;
    } else {
      // Modo Detalle: cuadrantes limpios con realce del hotspot
      if (isHotspot) return 'rgba(212, 168, 67, 0.28)';
      return `rgba(76, 175, 125, ${0.10 + ratio * 0.35})`;
    }
  };

  const renderInnerContent = (inModal = false) => (
    <div className="territory-map-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ── CABECERA Y SELECTOR DE VISTAS ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutGrid size={22} color={theme.accentText} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.ink }}>
            {isEn ? `Territorial Map (3x3)` : `Mapa Territorial (3x3)`}
          </h3>
          <span style={{ fontSize: '11px', background: 'rgba(212, 168, 67, 0.15)', color: theme.accentText, padding: '3px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid rgba(212, 168, 67, 0.3)' }}>
            {computedZones.totalEvents} {isEn ? 'actions' : 'acciones'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Conmutador de Modos [Intensidad] | [Detalle] */}
          <div style={{ display: 'flex', background: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(27, 58, 45, 0.08)', borderRadius: '8px', padding: '3px', border: `1px solid ${isDark ? 'rgba(76, 175, 125, 0.25)' : 'rgba(27, 58, 45, 0.15)'}` }}>
            <button
              type="button"
              onClick={() => setViewMode('intensity')}
              style={{
                background: viewMode === 'intensity' ? '#D4A843' : 'transparent',
                color: viewMode === 'intensity' ? '#1B3A2D' : theme.inkMuted,
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Flame size={14} />
              <span>{isEn ? 'Intensity' : 'Intensidad'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detail')}
              style={{
                background: viewMode === 'detail' ? '#4CAF7D' : 'transparent',
                color: viewMode === 'detail' ? '#FFFFFF' : theme.inkMuted,
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={14} />
              <span>{isEn ? 'Detail' : 'Detalle'}</span>
            </button>
          </div>

          {/* Botón Red de Pases integrada (si existen pases) */}
          {(showPassNetworkButton || onSwitchToPassNetwork) && (
            <button
              type="button"
              onClick={() => onSwitchToPassNetwork && onSwitchToPassNetwork()}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(27, 58, 45, 0.05)',
                border: `1px solid ${isDark ? 'rgba(242, 237, 228, 0.15)' : 'rgba(27, 58, 45, 0.15)'}`,
                color: theme.ink,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Share2 size={14} />
              <span>{t('charts.view.pass_network', isEn ? 'Pass Network' : 'Red de Pases')}</span>
            </button>
          )}

          {/* Botón Pantalla Completa / Teatro */}
          {!inModal && (
            <button
              type="button"
              className="btn-fullscreen-match-card"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              style={{ minHeight: '48px', minWidth: '48px' }}
              title={isExpanded ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isExpanded ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── BARRA DE CONTROLES: EQUIPO, ACCIONES Y JUGADOR ──────────────────── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Selector de Equipo */}
        <div style={{ display: 'flex', background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(27, 58, 45, 0.06)', borderRadius: '6px', padding: '2px', border: `1px solid ${isDark ? 'rgba(76, 175, 125, 0.2)' : 'rgba(27, 58, 45, 0.15)'}` }}>
          {[
            { key: 'home', label: teamName || (isEn ? 'My Team' : 'Mi Equipo') },
            { key: 'away', label: rivalName || (isEn ? 'Opponent' : 'Rival') },
            { key: 'both', label: isEn ? 'Both' : 'Ambos' },
          ].map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTeamFilter(opt.key)}
              style={{
                background: teamFilter === opt.key ? (isDark ? 'rgba(76, 175, 125, 0.3)' : '#1B3A2D') : 'transparent',
                color: teamFilter === opt.key ? (isDark ? '#4CAF7D' : '#FFFFFF') : theme.inkMuted,
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '36px'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Chips de Filtro de Acción */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {[
            { key: 'all', label: isEn ? 'All' : 'Todo' },
            { key: 'recoveries', label: isEn ? 'Recoveries' : 'Recuperaciones' },
            { key: 'duels', label: isEn ? 'Duels' : 'Duelos' },
            { key: 'shots', label: isEn ? 'Shots' : 'Tiros' },
            { key: 'fouls', label: isEn ? 'Fouls' : 'Faltas' },
            { key: 'passes', label: isEn ? 'Passes' : 'Pases' },
          ].map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActionFilter(chip.key)}
              style={{
                background: actionFilter === chip.key ? (isDark ? 'rgba(212, 168, 67, 0.2)' : '#D4A843') : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(27, 58, 45, 0.04)'),
                color: actionFilter === chip.key ? (isDark ? '#D4A843' : '#1B3A2D') : theme.inkMuted,
                border: actionFilter === chip.key ? '1px solid rgba(212, 168, 67, 0.5)' : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(27, 58, 45, 0.1)'}`,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: actionFilter === chip.key ? 800 : 600,
                cursor: 'pointer',
                minHeight: '36px'
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Selector de Jugador */}
        {players.length > 0 && (
          <div style={{ minWidth: '160px' }}>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              style={{
                width: '100%',
                background: isDark ? '#152C22' : '#FFFFFF',
                color: theme.ink,
                border: `1px solid ${isDark ? 'rgba(212, 168, 67, 0.3)' : 'rgba(27, 58, 45, 0.2)'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                minHeight: '40px'
              }}
            >
              <option value="all">{isEn ? 'All Players' : 'Toda la plantilla'}</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.dorsal || p.number || '•'} {p.nombre || p.name || (isEn ? 'Player' : 'Jugador')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── LÍNEA DE INSIGHT TÁCTICO AUTOMÁTICO ─────────────────────────────── */}
      {computedZones.dominantZone && (
        <div
          style={{
            background: isDark ? 'rgba(212, 168, 67, 0.14)' : 'rgba(212, 168, 67, 0.1)',
            border: '1px solid rgba(212, 168, 67, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: theme.accentText,
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <Flame size={16} style={{ flexShrink: 0 }} />
          <span>
            {isEn
              ? `Dominant Zone: ${computedZones.dominantZone.pct}% of interventions concentrated in ${computedZones.dominantZone.nameEn}.`
              : `Zona dominante: El ${computedZones.dominantZone.pct}% de las intervenciones se concentraron en ${computedZones.dominantZone.nameEs}.`}
          </span>
        </div>
      )}

      {/* ── CAMPO REGLAMENTARIO PITCHFRAME (105:68) ─────────────────────────── */}
      <PitchFrame isDark={true} showTacticalCorridors={false} showGoals={true} showStripes={true}>
        {/* Renderizado interactivo de las 9 Zonas */}
        {computedZones.definitions.map((zone, idx) => {
          const colIdx = idx >= 6 ? 2 : (idx >= 3 ? 1 : 0); // def (0-2), med (3-5), att (6-8)
          const rowIdx = idx % 3; // izq (0), centro (1), der (2)

          const zX = colPositions[colIdx].startX;
          const zY = rowPositions[rowIdx].startY;
          const zStats = computedZones.stats[zone.id] || { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0, passes: 0 };
          const isHotspot = zStats.total > 0 && zStats.total === computedZones.maxZoneEvents;

          const centerX = zX + colW / 2;
          const centerY = zY + rowH / 2;
          const zoneName = isEn ? zone.nameEn : zone.nameEs;

          const pct = computedZones.totalEvents > 0 ? Math.round((zStats.total / computedZones.totalEvents) * 100) : 0;

          return (
            <g
              key={zone.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredCell({ zone, stats: zStats, pct })}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {/* Cuadrante de zona */}
              <rect
                x={zX}
                y={zY}
                width={colW}
                height={rowH}
                fill={getZoneColor(zStats.total, isHotspot)}
                stroke={isHotspot ? '#D4A843' : 'rgba(242, 237, 228, 0.3)'}
                strokeWidth={isHotspot ? 2.5 : 1}
                strokeDasharray={isHotspot ? 'none' : '4,4'}
              />

              {/* Nombre de la zona */}
              <text
                x={centerX}
                y={zY + 32}
                textAnchor="middle"
                fill={isHotspot ? '#D4A843' : '#F2EDE4'}
                fontSize="15"
                fontWeight="700"
                letterSpacing="0.4"
              >
                {zoneName.toUpperCase()}
              </text>

              {/* Modo Intensidad vs Modo Detalle */}
              {viewMode === 'intensity' ? (
                <>
                  {/* Círculo de calor central en modo Intensidad */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={Math.min(50, Math.max(18, (zStats.total / (computedZones.maxZoneEvents || 1)) * 50))}
                    fill={isHotspot ? 'rgba(212, 168, 67, 0.4)' : 'rgba(76, 175, 125, 0.4)'}
                  />
                  <text
                    x={centerX}
                    y={centerY + 12}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="36"
                    fontWeight="900"
                  >
                    {zStats.total}
                  </text>
                  <text
                    x={centerX}
                    y={centerY + 34}
                    textAnchor="middle"
                    fill="#C9D4CC"
                    fontSize="13"
                    fontWeight="700"
                  >
                    {pct}%
                  </text>
                </>
              ) : (
                <>
                  {/* Modo Detalle: Recuento Grande + Micro-desglose */}
                  <text
                    x={centerX}
                    y={centerY + 16}
                    textAnchor="middle"
                    fill={isHotspot ? '#D4A843' : '#FFFFFF'}
                    fontSize="42"
                    fontWeight="900"
                  >
                    {zStats.total}
                  </text>
                  {zStats.total > 0 && (
                    <text
                      x={centerX}
                      y={centerY + 48}
                      textAnchor="middle"
                      fill="#C9D4CC"
                      fontSize="13"
                      fontWeight="700"
                    >
                      {zStats.recoveries > 0 && `↑${zStats.recoveries} `}
                      {zStats.duelsWon > 0 && `✊${zStats.duelsWon} `}
                      {zStats.shots > 0 && `🎯${zStats.shots} `}
                      {zStats.fouls > 0 && `⚡${zStats.fouls} `}
                      {zStats.passes > 0 && `👟${zStats.passes}`}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </PitchFrame>

      {/* ── LEYENDA Y FOOTER DE CONTRASTE ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: theme.inkMuted, padding: '4px 0' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span>↑ {isEn ? 'Recoveries' : 'Recuperaciones'}</span>
          <span>✊ {isEn ? 'Duels Won' : 'Duelos Ganados'}</span>
          <span>🎯 {isEn ? 'Shots' : 'Tiros'}</span>
          <span>⚡ {isEn ? 'Fouls' : 'Faltas'}</span>
          <span>👟 {isEn ? 'Passes' : 'Pases'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isEn ? 'Intensity:' : 'Intensidad:'}</span>
          <span style={{ width: '12px', height: '12px', background: 'rgba(76, 175, 125, 0.25)', border: '1px solid rgba(76, 175, 125, 0.5)', borderRadius: '2px' }} />
          <span>{isEn ? 'Low' : 'Baja'}</span>
          <span style={{ width: '12px', height: '12px', background: '#D4A843', borderRadius: '2px' }} />
          <span>{isEn ? 'Hotspot' : 'Zona Reina'}</span>
        </div>
      </div>

      {/* ── GUÍA TÁCTICA COLAPSABLE PEDAGÓGICA (CONTRASTE AA GARANTIZADO) ──── */}
      {!isExpanded && (
        <div
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(27, 58, 45, 0.04)',
            border: `1px solid ${isDark ? 'rgba(212, 168, 67, 0.25)' : 'rgba(27, 58, 45, 0.12)'}`,
            borderRadius: '10px',
            padding: '12px 14px',
            marginTop: '4px'
          }}
        >
          <div
            onClick={() => setShowTacticalGuide(prev => !prev)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <strong style={{ fontSize: '12.5px', color: theme.ink }}>
                {isEn ? 'Tactical Guide: How to read and interpret this Territorial Map?' : 'Guía Táctica: ¿Cómo interpretar y usar este Mapa Territorial?'}
              </strong>
            </div>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.accentText,
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <span>{showTacticalGuide ? (isEn ? 'Hide Guide' : 'Ocultar Guía') : (isEn ? 'View Methodology' : 'Ver Metodología')}</span>
              {showTacticalGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11.5px', color: theme.inkMuted }}>
            <span>📍 <strong>{isEn ? 'Thirds:' : 'Tercios:'}</strong> {isEn ? 'Def (0-35m) · Mid (35-70m) · Att (70-105m)' : 'Defensa (0-35m) · Medio (35-70m) · Ataque (70-105m)'}</span>
            <span>⚡ <strong>{isEn ? 'Channels:' : 'Pasillos:'}</strong> {isEn ? 'Left (0-33%) · Center (33-66%) · Right (66-100%)' : 'Banda Izq (0-33%) · Pasillo Central (33-66%) · Banda Der (66-100%)'}</span>
          </div>

          {showTacticalGuide && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '12px' }}>
              <div style={{ background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#FFFFFF', padding: '10px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(27, 58, 45, 0.08)'}` }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: theme.ink }}>
                  📖 {isEn ? 'What is this map?' : '¿Qué representa?'}
                </h4>
                <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.45', color: theme.inkMuted }}>
                  {isEn
                    ? 'A 3x3 territorial matrix (9 FIFA regulation sectors) showing where actions (recoveries, duels, shots, fouls, passes) were focused throughout the match.'
                    : 'Es una matriz territorial 3×3 (9 zonas reglamentarias) que muestra la concentración espacial e intervenciones del equipo o jugador en cada zona del campo.'}
                </p>
              </div>

              <div style={{ background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#FFFFFF', padding: '10px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(27, 58, 45, 0.08)'}` }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: theme.ink }}>
                  ⚖️ {isEn ? 'Offensive Asymmetries' : 'Asimetrías Ofensivas'}
                </h4>
                <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.45', color: theme.inkMuted }}>
                  {isEn
                    ? 'Detect whether the team attacks preferentially down one wing and whether the opponent exploits the opposite weak side.'
                    : 'Permite identificar si el equipo vuelca su ataque obsesivamente por una banda o si explota el pasillo interior para filtrar pases.'}
                </p>
              </div>

              <div style={{ background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#FFFFFF', padding: '10px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(27, 58, 45, 0.08)'}` }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: theme.ink }}>
                  🛡️ {isEn ? 'Block Height' : 'Altura del Bloque'}
                </h4>
                <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.45', color: theme.inkMuted }}>
                  {isEn
                    ? 'High volume in mid/defensive third indicates a low/medium block, while presence in attack third confirms effective high press.'
                    : 'Si el mayor volumen está en tercio medio y defensivo, el bloque fue medio-bajo; si predomina en tercio ofensivo, la presión alta tuvo éxito.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="territory-map-3x3-container"
      style={{
        width: '100%',
        background: theme.bgCard,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${theme.border}`,
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {renderInnerContent(false)}

      {/* Modo Teatro / Pantalla Completa mediante Portal */}
      <TheaterOverlay
        isOpen={isTheater}
        onClose={exit}
        title={isEn ? `Territorial Map 3x3 (${teamName})` : `Mapa Territorial 3x3 (${teamName})`}
      >
        {renderInnerContent(true)}
      </TheaterOverlay>
    </div>
  );
};

export default TerritoryMap3x3;
