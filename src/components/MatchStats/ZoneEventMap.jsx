/**
 * src/components/MatchStats/ZoneEventMap.jsx
 * Míster11 — Mapa de Eventos e Intervenciones por Zona (9 Zonas 3x3)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - Césped Táctico: #152C22
 *  - Calor de Intervenciones: #4CAF7D (esmeralda según volumen, cero mostaza)
 *  - Zona Reina / Hotspot: #D4A843 (dorado noble)
 *  - Selector condicional [Red de Pases] | [Mapa Territorial]
 */

import React, { useState, useMemo, useRef } from 'react';
import { LayoutGrid, Maximize2, Minimize2, Info, Share2, Flame } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';
import { TheaterOverlay } from '../common/TheaterOverlay';
import { getMatchAnalytics } from '../../utils/matchAnalytics';
import { CHART_THEME } from '../../config/chartTheme';

export const ZoneEventMap = ({
  events = [],
  matchData = {},
  teamName = 'Local',
  isSubstitute = false,
  onSwitchToPassNetwork = null
}) => {
  const containerRef = useRef(null);
  const { t, isEn } = useTranslation();
  const { isFullscreen, isTheater, toggle, exit } = useTheaterFullscreen(containerRef);

  const analytics = useMemo(() => {
    return getMatchAnalytics(matchData, events, { isEn });
  }, [matchData, events, isEn]);

  const { zones, narrative, passNetwork } = analytics;
  const { definitions, stats: zoneStats, maxZoneEvents, dominantZone } = zones;

  const renderContent = () => (
    <div className="zone-event-map-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Selector de Vistas Tácticas y Controles de Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutGrid size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#F2EDE4' }}>
            {isEn ? `Territorial Event Map (3x3)` : `Mapa de Eventos por Zona (3x3)`}
          </h3>
          <span style={{ fontSize: '11px', background: 'rgba(212,168,67,0.15)', color: '#D4A843', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            {analytics.zones.totalOwnEvents} {isEn ? 'actions' : 'acciones'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Selector de Pestañas Tácticas [Red de Pases] | [Mapa Territorial] */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(76,175,125,0.2)' }}>
            <button
              type="button"
              disabled={!passNetwork.available}
              onClick={() => {
                if (passNetwork.available && onSwitchToPassNetwork) onSwitchToPassNetwork();
              }}
              title={!passNetwork.available ? (isEn ? passNetwork.tooltipEn : passNetwork.tooltipEs) : ''}
              style={{
                background: 'transparent',
                border: 'none',
                color: passNetwork.available ? '#CBD5E1' : '#64748B',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: passNetwork.available ? 'pointer' : 'not-allowed',
                opacity: passNetwork.available ? 1 : 0.45
              }}
            >
              {t('charts.view.pass_network', isEn ? 'Pass Network' : 'Red de Pases')}
            </button>
            <button
              type="button"
              style={{
                background: '#4CAF7D',
                border: 'none',
                color: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'default'
              }}
            >
              {t('charts.view.territorial_map', isEn ? 'Territorial Map' : 'Mapa Territorial')}
            </button>
          </div>

          <button
            type="button"
            className="btn-fullscreen-match-card"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            style={{ minHeight: '48px', minWidth: '48px' }}
          >
            {isFullscreen || isTheater ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen || isTheater ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
          </button>
        </div>
      </div>

      {/* Insight de Narrativa Táctica Automática (Regla: zona > 40% eventos) */}
      {dominantZone && (
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
          <Flame size={16} style={{ flexShrink: 0 }} />
          <span>{isEn ? narrative.dominantZoneTextEn : narrative.dominantZoneTextEs}</span>
        </div>
      )}

      {/* Guía Metodológica */}
      <div
        style={{
          fontSize: '11.5px',
          color: '#CBD5E1',
          lineHeight: '1.4',
          background: 'rgba(242, 237, 228, 0.04)',
          borderLeft: '3px solid #4CAF7D',
          padding: '6px 10px',
          borderRadius: '0 6px 6px 0'
        }}
      >
        <strong style={{ color: '#F2EDE4' }}>{t('stats.eventMap.title')}: </strong>
        {t('stats.eventMap.guide')}
      </div>

      {/* Campo táctico SVG con las 9 zonas interactivas */}
      <div
        className="zone-map-pitch-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '105 / 68',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1.5px solid rgba(76, 175, 125, 0.3)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          background: '#152C22'
        }}
      >
        <svg
          viewBox="0 0 105 68"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="none"
        >
          {/* Fondo césped táctico */}
          <rect x="0" y="0" width="105" height="68" fill="#152C22" />

          {/* Franjas corte césped */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect
              key={i}
              x={i * (105 / 9)}
              y="0"
              width={105 / 9}
              height="68"
              fill={i % 2 === 0 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'}
            />
          ))}

          {/* Líneas reglamentarias */}
          <rect x="3" y="3" width="99" height="62" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <line x1="52.5" y1="3" x2="52.5" y2="65" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="0.8" fill="rgba(255, 255, 255, 0.85)" />
          <rect x="3" y="14" width="16.5" height="40" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <rect x="85.5" y="14" width="16.5" height="40" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />

          {/* Renderizado de las 9 zonas con calor Verde Campo y Hotspot Dorado */}
          {definitions.map(zone => {
            const stats = zoneStats[zone.id] || { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0 };
            const intensity = maxZoneEvents > 0 ? (stats.total / maxZoneEvents) : 0;
            const isHotspot = stats.total > 0 && stats.total === maxZoneEvents;

            const width = zone.x[1] - zone.x[0];
            const height = zone.y[1] - zone.y[0];
            const centerX = zone.x[0] + width / 2;
            const centerY = zone.y[0] + height / 2;

            // Intensidad de calor en Verde Campo (cero mostaza)
            const fillColor = stats.total > 0
              ? (isHotspot ? `rgba(212, 168, 67, 0.28)` : `rgba(76, 175, 125, ${0.12 + intensity * 0.45})`)
              : 'rgba(0, 0, 0, 0.08)';

            return (
              <g key={zone.id}>
                {/* Cuadrante de zona */}
                <rect
                  x={zone.x[0]}
                  y={zone.y[0]}
                  width={width}
                  height={height}
                  fill={fillColor}
                  stroke={isHotspot ? '#D4A843' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth={isHotspot ? '1.2' : '0.5'}
                  strokeDasharray={isHotspot ? 'none' : '2 2'}
                />

                {/* Etiqueta de la zona */}
                <text
                  x={centerX}
                  y={zone.y[0] + 5}
                  textAnchor="middle"
                  fill={isHotspot ? '#D4A843' : 'rgba(242, 237, 228, 0.85)'}
                  fontSize="2.9"
                  fontWeight="700"
                >
                  {isEn ? zone.nameEn : zone.nameEs}
                </text>

                {/* Volumen total de intervenciones en la zona */}
                <text
                  x={centerX}
                  y={centerY + 1.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="7.8"
                  fontWeight="900"
                >
                  {stats.total}
                </text>

                {/* Micro-indicadores tácticos de eventos */}
                {stats.total > 0 && (
                  <g transform={`translate(${centerX}, ${centerY + 6.5})`}>
                    <text
                      textAnchor="middle"
                      fill="rgba(242, 237, 228, 0.9)"
                      fontSize="2.4"
                      fontWeight="700"
                    >
                      {stats.recoveries > 0 && `↑${stats.recoveries} `}
                      {stats.duelsWon > 0 && `✊${stats.duelsWon} `}
                      {stats.shots > 0 && `🎯${stats.shots} `}
                      {stats.fouls > 0 && `⚡${stats.fouls}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda Inferior Limpia */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#CBD5E1', padding: '2px 0' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span>↑ {isEn ? 'Recoveries' : 'Recuperaciones'}</span>
          <span>✊ {isEn ? 'Duels Won' : 'Duelos Ganados'}</span>
          <span>🎯 {isEn ? 'Shots' : 'Tiros'}</span>
          <span>⚡ {isEn ? 'Fouls' : 'Faltas'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isEn ? 'Intensity:' : 'Intensidad:'}</span>
          <span style={{ width: '12px', height: '12px', background: 'rgba(76, 175, 125, 0.2)', border: '1px solid rgba(76, 175, 125, 0.4)', borderRadius: '2px' }} />
          <span>{isEn ? 'Low' : 'Baja'}</span>
          <span style={{ width: '12px', height: '12px', background: '#D4A843', borderRadius: '2px' }} />
          <span>{isEn ? 'Hotspot' : 'Alta (Hotspot)'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="zone-event-map-container"
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
      <TheaterOverlay isOpen={isTheater} onClose={exit} title={isEn ? 'Territorial Event Map' : 'Mapa de Eventos por Zona'}>
        {renderContent()}
      </TheaterOverlay>
    </div>
  );
};

export default ZoneEventMap;
