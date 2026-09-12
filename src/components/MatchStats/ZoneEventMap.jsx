import React, { useMemo, useRef } from 'react';
import { LayoutGrid, Maximize2, Minimize2, Info } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';
import { TheaterOverlay } from '../common/TheaterOverlay';

const ZONE_DEFINITIONS = [
  { id: 'izq_def', nameEs: 'Izq. Defensiva', nameEn: 'Def. Left', x: [0, 35], y: [0, 22] },
  { id: 'centro_def', nameEs: 'Centro Defensivo', nameEn: 'Def. Center', x: [0, 35], y: [22, 46] },
  { id: 'der_def', nameEs: 'Der. Defensiva', nameEn: 'Def. Right', x: [0, 35], y: [46, 68] },
  { id: 'izq_med', nameEs: 'Medio Izquierdo', nameEn: 'Mid Left', x: [35, 70], y: [0, 22] },
  { id: 'centro_med', nameEs: 'Centro del Campo', nameEn: 'Midfield', x: [35, 70], y: [22, 46] },
  { id: 'der_med', nameEs: 'Medio Derecho', nameEn: 'Mid Right', x: [35, 70], y: [46, 68] },
  { id: 'izq_att', nameEs: 'Izq. Ofensiva', nameEn: 'Att. Left', x: [70, 105], y: [0, 22] },
  { id: 'centro_att', nameEs: 'Centro Ofensivo', nameEn: 'Att. Center', x: [70, 105], y: [22, 46] },
  { id: 'der_att', nameEs: 'Der. Ofensiva', nameEn: 'Att. Right', x: [70, 105], y: [46, 68] },
];

export const normalizeEventToZone = (e) => {
  if (!e) return 'centro_med';
  const z2 = String(e.zone2D || e.zone || e.sector || '').toLowerCase();

  if (z2.includes('izq_def') || (z2.includes('left') && z2.includes('def'))) return 'izq_def';
  if (z2.includes('der_def') || (z2.includes('right') && z2.includes('def'))) return 'der_def';
  if (z2.includes('centro_def') || (z2.includes('cent') && z2.includes('def'))) return 'centro_def';

  if (z2.includes('izq_att') || (z2.includes('left') && (z2.includes('att') || z2.includes('ataq')))) return 'izq_att';
  if (z2.includes('der_att') || (z2.includes('right') && (z2.includes('att') || z2.includes('ataq')))) return 'der_att';
  if (z2.includes('centro_att') || (z2.includes('cent') && (z2.includes('att') || z2.includes('ataq')))) return 'centro_att';

  if (z2.includes('izq_med') || (z2.includes('left') && z2.includes('med'))) return 'izq_med';
  if (z2.includes('der_med') || (z2.includes('right') && z2.includes('med'))) return 'der_med';
  if (z2.includes('centro_med') || (z2.includes('cent') && z2.includes('med'))) return 'centro_med';

  // Coordenadas x (0..100 o 0..105) e y (0..100 o 0..68)
  if (typeof e.x === 'number' && typeof e.y === 'number') {
    const normX = e.x > 70 ? 'att' : (e.x < 35 ? 'def' : 'med');
    const normY = e.y > 66 ? 'der' : (e.y < 33 ? 'izq' : 'centro');
    return `${normY}_${normX}`;
  }

  // Fallbacks por sector simple
  if (z2.includes('left') || z2.includes('izq')) return 'izq_med';
  if (z2.includes('right') || z2.includes('der')) return 'der_med';
  return 'centro_med';
};

export const ZoneEventMap = ({
  events = [],
  teamName = 'Local',
  isSubstitute = false,
}) => {
  const containerRef = useRef(null);
  const { t, isEn } = useTranslation();
  const { isFullscreen, isTheater, toggle, exit } = useTheaterFullscreen(containerRef);

  // Filtrar eventos propios
  const ownEvents = useMemo(() => {
    return (events || []).filter(e => {
      if (!e) return false;
      const type = String(e.type || '').toLowerCase();
      if (e.team === 'rival' || e.team === 'away' || type.includes('rival')) return false;
      return true;
    });
  }, [events]);

  // Agrupar eventos por cada una de las 9 zonas
  const zoneStats = useMemo(() => {
    const stats = {};
    ZONE_DEFINITIONS.forEach(z => {
      stats[z.id] = {
        total: 0,
        duelsWon: 0,
        duelsLost: 0,
        recoveries: 0,
        shots: 0,
        fouls: 0,
      };
    });

    ownEvents.forEach(e => {
      const zoneId = normalizeEventToZone(e);
      if (!stats[zoneId]) stats[zoneId] = { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0 };

      stats[zoneId].total += 1;
      const type = String(e.type || '').toLowerCase();

      if (type === 'duel_won') stats[zoneId].duelsWon += 1;
      else if (type === 'duel_lost') stats[zoneId].duelsLost += 1;
      else if (type === 'recovery') stats[zoneId].recoveries += 1;
      else if (type.includes('shot') || type.includes('gol') || type.includes('goal')) stats[zoneId].shots += 1;
      else if (type.includes('foul') || type.includes('falta')) stats[zoneId].fouls += 1;
    });

    return stats;
  }, [ownEvents]);

  const maxZoneEvents = useMemo(() => {
    return Object.values(zoneStats).reduce((max, s) => Math.max(max, s.total), 1);
  }, [zoneStats]);

  const renderContent = () => (
    <div className="zone-event-map-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Aviso de sustitución de red de pases por datos insuficientes */}
      {isSubstitute && (
        <div
          className="zone-map-notice"
          style={{
            background: 'rgba(212, 168, 67, 0.12)',
            border: '1px solid rgba(212, 168, 67, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#D4A843'
          }}
        >
          <Info size={18} style={{ flexShrink: 0 }} />
          <span>{t('stats.eventMap.pass_insufficient')}</span>
        </div>
      )}

      {/* Guía metodológica en 2 líneas */}
      <div
        className="zone-map-guide"
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary, #94A3B8)',
          lineHeight: '1.45',
          background: 'rgba(255, 255, 255, 0.03)',
          borderLeft: '3px solid #4CAF7D',
          padding: '8px 12px',
          borderRadius: '0 6px 6px 0'
        }}
      >
        <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{t('stats.eventMap.title')}: </strong>
        {t('stats.eventMap.guide')}
      </div>

      {/* Campo táctico SVG con 9 zonas interactivas */}
      <div
        className="zone-map-pitch-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '105 / 68',
          maxHeight: isFullscreen || isTheater ? 'calc(100vh - 220px)' : '480px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          background: '#153e24'
        }}
      >
        <svg
          viewBox="0 0 105 68"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="none"
        >
          {/* Fondo césped */}
          <rect x="0" y="0" width="105" height="68" fill="#153e24" />

          {/* Franjas corte césped */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect
              key={i}
              x={i * (105 / 9)}
              y="0"
              width={105 / 9}
              height="68"
              fill={i % 2 === 0 ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)'}
            />
          ))}

          {/* Líneas reglamentarias de fútbol */}
          <rect x="3" y="3" width="99" height="62" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <line x1="52.5" y1="3" x2="52.5" y2="65" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="0.8" fill="rgba(255, 255, 255, 0.7)" />
          <rect x="3" y="14" width="16.5" height="40" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <rect x="85.5" y="14" width="16.5" height="40" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />

          {/* Renderizado de las 9 zonas con calor e indicadores */}
          {ZONE_DEFINITIONS.map(zone => {
            const stats = zoneStats[zone.id] || { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0 };
            const intensity = maxZoneEvents > 0 ? (stats.total / maxZoneEvents) : 0;
            const width = zone.x[1] - zone.x[0];
            const height = zone.y[1] - zone.y[0];
            const centerX = zone.x[0] + width / 2;
            const centerY = zone.y[0] + height / 2;

            // Intensidad de calor en la zona
            const fillColor = stats.total > 0
              ? `rgba(212, 168, 67, ${0.1 + intensity * 0.42})`
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
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                />

                {/* Etiqueta de la zona */}
                <text
                  x={centerX}
                  y={zone.y[0] + 4.5}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.65)"
                  fontSize="2.8"
                  fontWeight="600"
                >
                  {isEn ? zone.nameEn : zone.nameEs}
                </text>

                {/* Volumen total de intervenciones en la zona */}
                <text
                  x={centerX}
                  y={centerY + 1}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="7"
                  fontWeight="800"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {stats.total}
                </text>

                {/* Desglose compacto de acciones clave en la zona */}
                {stats.total > 0 && (
                  <text
                    x={centerX}
                    y={centerY + 7}
                    textAnchor="middle"
                    fill="#D4A843"
                    fontSize="2.4"
                    fontWeight="700"
                  >
                    {stats.recoveries > 0 ? `↑${stats.recoveries} ` : ''}
                    {stats.duelsWon > 0 ? `✊${stats.duelsWon} ` : ''}
                    {stats.shots > 0 ? `🎯${stats.shots} ` : ''}
                    {stats.fouls > 0 ? `⚡${stats.fouls}` : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda clara de acciones e intensidad */}
      <div
        className="zone-map-legend"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          fontSize: '11.5px',
          color: 'var(--text-secondary, #94A3B8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span><strong>↑</strong> {isEn ? 'Recoveries' : 'Recuperaciones'}</span>
          <span><strong>✊</strong> {isEn ? 'Duels Won' : 'Duelos Ganados'}</span>
          <span><strong>🎯</strong> {isEn ? 'Shots' : 'Tiros'}</span>
          <span><strong>⚡</strong> {isEn ? 'Fouls' : 'Faltas'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isEn ? 'Intensity:' : 'Intensidad:'}</span>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(212, 168, 67, 0.15)', borderRadius: '2px', border: '1px solid rgba(212,168,67,0.4)' }} />
          <span>{isEn ? 'Low' : 'Baja'}</span>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(212, 168, 67, 0.65)', borderRadius: '2px', border: '1px solid #D4A843' }} />
          <span>{isEn ? 'High' : 'Alta'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="zone-event-map-container"
      style={{
        background: 'var(--bg-card, #13241C)',
        border: '1px solid var(--border-color, rgba(212, 168, 67, 0.25))',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header del mapa */}
      <div
        className="zone-map-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutGrid size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary, #FFFFFF)' }}>
            {t('stats.eventMap.title')} ({teamName})
          </h3>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(212, 168, 67, 0.15)',
              color: '#D4A843',
              fontWeight: 700
            }}
          >
            {ownEvents.length} {ownEvents.length === 1 ? (isEn ? 'action' : 'acción') : (isEn ? 'actions' : 'acciones')}
          </span>
        </div>

        <button
          type="button"
          onClick={toggle}
          title={isFullscreen ? t('stats.theater.exit_fullscreen') : t('stats.theater.fullscreen')}
          aria-label={isFullscreen ? t('stats.theater.exit_fullscreen') : t('stats.theater.fullscreen')}
          style={{
            minWidth: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: 'var(--text-primary, #FFFFFF)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{isFullscreen ? t('stats.theater.exit_fullscreen') : t('stats.theater.fullscreen')}</span>
        </button>
      </div>

      {/* Contenido principal en vista normal */}
      {renderContent()}

      {/* Fallback de Modo Teatro si se activó */}
      <TheaterOverlay
        isOpen={isTheater}
        onClose={exit}
        title={`${t('stats.eventMap.title')} (${teamName})`}
      >
        {renderContent()}
      </TheaterOverlay>
    </div>
  );
};

export default ZoneEventMap;
