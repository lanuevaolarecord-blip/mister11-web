import React, { useState, useMemo } from 'react';
import { TrendingUp, Clock, Info } from 'lucide-react';

export const MatchTimeline = ({
  events = [],
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  matchDuration = 90
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalizar nombres de equipos con espacios correctos
  const cleanHomeName = (homeTeamName || 'Mi Equipo').trim();
  const cleanAwayName = (awayTeamName || 'Rival').trim();

  // Calcular curva de momentum por tramos de 5 minutos (Fórmula profesional)
  const { timelineData, keyEvents, hasRealEvents } = useMemo(() => {
    const rawEventsList = Array.isArray(events) ? events.filter(Boolean) : [];
    if (rawEventsList.length === 0) {
      return { timelineData: [], keyEvents: [], hasRealEvents: false };
    }

    const points = [];
    const eventsList = [];
    let accumulatedMomentum = 50; // Punto neutro central

    const totalMinutes = Math.max(90, Number(matchDuration) || 90);

    for (let m = 0; m <= totalMinutes; m += 5) {
      // Eventos ocurridos en este tramo de 5 minutos (ej: 0-5, 5-10, ...)
      const intervalEvents = rawEventsList.filter(e => {
        const min = Number(e.minute ?? e.time ?? 0);
        return m === 0 ? min === 0 : (min > m - 5 && min <= m);
      });

      let homeScore = 0;
      let awayScore = 0;
      const eventDescriptions = [];

      intervalEvents.forEach(e => {
        const isHome = e.team === 'home' || e.isHome === true || e.isOwn === true || e.team === 'own' || (!e.team && !e.isRival);
        const t = e.type || '';
        let weight = 0;
        let label = '';

        if (t === 'gol_local' || t === 'gol' || t === 'goal') {
          weight = 3.5;
          label = '⚽ Gol';
        } else if (t === 'gol_rival') {
          weight = -3.5;
          label = '⚽ Gol rival';
        } else if (t === 'shot_on_target_own' || (t.includes('shot') && t.includes('on') && isHome)) {
          weight = 2.0;
          label = '🟢 Tiro a puerta';
        } else if (t === 'shot_on_target_rival' || (t.includes('shot') && t.includes('on') && !isHome)) {
          weight = -2.0;
          label = '🔴 Tiro a puerta rival';
        } else if (t === 'shot_off_target_own' || (t.includes('shot') && t.includes('off') && isHome)) {
          weight = 1.0;
          label = '⬜ Tiro fuera';
        } else if (t === 'shot_off_target_rival' || (t.includes('shot') && t.includes('off') && !isHome)) {
          weight = -1.0;
          label = '🔲 Tiro fuera rival';
        } else if (t === 'corner_favor' || t === 'corner_own' || (t === 'corner' && isHome)) {
          weight = 1.0;
          label = '🚩 Córner favor';
        } else if (t === 'corner_against' || t === 'corner_rival' || (t === 'corner' && !isHome)) {
          weight = -1.0;
          label = '🚩 Córner contra';
        } else if (t === 'foul_favor' || t === 'falta_favor') {
          weight = 0.5;
          label = '⚡ Falta a favor';
        } else if (t === 'foul_against' || t === 'falta_contra' || (t === 'falta' && !isHome)) {
          weight = -0.5;
          label = '⚡ Falta en contra';
        } else if (t === 'duel_won') {
          weight = isHome ? 0.5 : -0.5;
          label = isHome ? '⚔️ Duelo ganado' : '⚔️ Duelo rival';
        } else if (t === 'recovery') {
          weight = isHome ? 0.5 : -0.5;
          label = isHome ? '🛡️ Recuperación' : '🛡️ Recup. rival';
        } else if (t === 'key_pass' || t === 'pase_clave') {
          weight = isHome ? 1.0 : -1.0;
          label = isHome ? '🎯 Pase clave' : '🎯 Pase clave rival';
        }

        if (isHome) {
          homeScore += Math.max(0, weight);
        } else {
          awayScore += Math.max(0, -weight);
        }

        if (label) {
          eventDescriptions.push(`${label} (${e.playerName || e.player || (isHome ? cleanHomeName : cleanAwayName)})`);
        }
      });

      // Balance delta del tramo
      const delta = homeScore - awayScore;
      // Suavizado acumulativo con retorno a la media (inercia deportiva)
      accumulatedMomentum = Math.max(10, Math.min(90, (accumulatedMomentum * 0.7 + 50 * 0.3) + delta * 3.5));

      points.push({
        minute: m,
        momentum: Number(accumulatedMomentum.toFixed(1)),
        delta: Number(delta.toFixed(1)),
        eventsCount: intervalEvents.length,
        descriptions: eventDescriptions
      });
    }

    // Extraer hitos clave para marcadores visuales
    rawEventsList.forEach((e, idx) => {
      const min = Number(e.minute ?? e.time ?? 0);
      const isHome = e.team === 'home' || e.isHome === true || e.isOwn === true || e.team === 'own' || (!e.team && !e.isRival);
      if (['gol', 'goal', 'gol_local', 'gol_rival', 'yellow_card', 'tarjeta_amarilla', 'red_card', 'tarjeta_roja', 'card_yellow_own', 'card_red_own', 'card_yellow_rival', 'card_red_rival', 'cambio', 'substitution'].includes(e.type)) {
        eventsList.push({
          id: e.id || `evt-${idx}`,
          minute: min,
          type: e.type,
          player: e.playerName || e.player || (isHome ? cleanHomeName : cleanAwayName),
          team: isHome ? 'home' : 'away'
        });
      }
    });

    return {
      timelineData: points,
      keyEvents: eventsList,
      hasRealEvents: rawEventsList.length > 0
    };
  }, [events, matchDuration, cleanHomeName, cleanAwayName]);

  // Dimensiones SVG
  const width = 640;
  const height = 190;
  const padding = { top: 25, right: 20, bottom: 35, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const totalMins = Math.max(90, Number(matchDuration) || 90);

  // Generar curva Bezier suave
  const getPath = () => {
    if (timelineData.length === 0) return '';
    return timelineData.map((d, i) => {
      const x = padding.left + (d.minute / totalMins) * graphWidth;
      const y = padding.top + ((100 - d.momentum) / 100) * graphHeight;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const getEventIcon = (type) => {
    if (type.includes('gol') || type.includes('goal')) return '⚽';
    if (type.includes('yellow') || type.includes('amarilla')) return '🟨';
    if (type.includes('red') || type.includes('roja')) return '🟥';
    if (type.includes('cambio') || type.includes('substitution')) return '🔄';
    return '📍';
  };

  return (
    <div className="match-timeline-container" style={{ position: 'relative' }}>
      <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="timeline-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} className="timeline-icon" style={{ color: '#D4A843' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>
            Momentum & Presión por Tramos (5')
          </h3>
        </div>
        
        {/* Título normalizado con espacios y capitalización estricta */}
        <div className="timeline-teams-legend" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="legend-badge gold" style={{ background: '#D4A843', color: '#000', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
            {cleanHomeName}
          </span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }}>vs</span>
          <span className="legend-badge green" style={{ background: '#4CAF7D', color: '#FFF', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
            {cleanAwayName}
          </span>
        </div>
      </div>

      {!hasRealEvents ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--partidos-text-muted, #888)' }}>
          <Info size={32} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--partidos-text-primary, #fff)' }}>Sin datos de momentum</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Inicia el cronómetro y registra eventos durante el partido para visualizar la curva de dominio.</div>
        </div>
      ) : (
        <>
          <div className="timeline-svg-wrapper" style={{ marginTop: '14px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="timeline-svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Fondo del gráfico */}
              <rect x={padding.left} y={padding.top} width={graphWidth} height={graphHeight} fill="rgba(255,255,255,0.02)" rx="6" />

              {/* Zona superior (Dominio Local) / Zona inferior (Dominio Rival) */}
              <text x={padding.left + 8} y={padding.top + 14} fill="rgba(212, 168, 67, 0.6)" fontSize="9" fontWeight="800">
                ▲ DOMINIO {cleanHomeName.toUpperCase()}
              </text>
              <text x={padding.left + 8} y={padding.top + graphHeight - 8} fill="rgba(76, 175, 125, 0.6)" fontSize="9" fontWeight="800">
                ▼ DOMINIO {cleanAwayName.toUpperCase()}
              </text>

              {/* Línea central de equilibrio (50% momentum neutro) */}
              <line
                x1={padding.left}
                y1={padding.top + graphHeight / 2}
                x2={padding.left + graphWidth}
                y2={padding.top + graphHeight / 2}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Marcador DESCANSO (45') */}
              <line
                x1={padding.left + (45 / totalMins) * graphWidth}
                y1={padding.top}
                x2={padding.left + (45 / totalMins) * graphWidth}
                y2={padding.top + graphHeight}
                stroke="#D4A843"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <rect 
                x={padding.left + (45 / totalMins) * graphWidth - 44} 
                y={padding.top - 18} 
                width="88" 
                height="16" 
                rx="4" 
                fill="#1B3A2D" 
                stroke="#D4A843" 
                strokeWidth="1"
              />
              <text
                x={padding.left + (45 / totalMins) * graphWidth}
                y={padding.top - 7}
                textAnchor="middle"
                fill="#D4A843"
                fontSize="8.5"
                fontWeight="800"
              >
                DESCANSO (45′)
              </text>

              {/* Curva de Momentum */}
              <path
                d={getPath()}
                fill="none"
                stroke="#D4A843"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Puntos interactivos por tramo de 5 min */}
              {timelineData.map((pt) => {
                const x = padding.left + (pt.minute / totalMins) * graphWidth;
                const y = padding.top + ((100 - pt.momentum) / 100) * graphHeight;
                const isHovered = hoveredPoint?.minute === pt.minute;

                return (
                  <circle
                    key={pt.minute}
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 3.5}
                    fill={pt.momentum >= 50 ? '#D4A843' : '#4CAF7D'}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 2 : 1}
                    style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => setHoveredPoint(pt)}
                  />
                );
              })}

              {/* Marcadores de eventos clave */}
              {keyEvents.map(e => {
                const x = padding.left + (Math.min(totalMins, e.minute) / totalMins) * graphWidth;
                const isHome = e.team === 'home';
                const y = isHome ? padding.top + 18 : padding.top + graphHeight - 18;

                return (
                  <g key={e.id} transform={`translate(${x}, ${y})`} className="timeline-event-node" style={{ cursor: 'pointer' }}>
                    <circle r="9" fill="#1B3A2D" stroke={isHome ? '#D4A843' : '#4CAF7D'} strokeWidth="1.5" />
                    <text textAnchor="middle" dy="0.35em" fontSize="10">
                      {getEventIcon(e.type)}
                    </text>
                  </g>
                );
              })}

              {/* Eje X (Minutos) */}
              {[0, 15, 30, 45, 60, 75, 90].map(m => {
                const x = padding.left + (m / totalMins) * graphWidth;
                return (
                  <g key={m}>
                    <line x1={x} y1={padding.top + graphHeight} x2={x} y2={padding.top + graphHeight + 5} stroke="rgba(255,255,255,0.4)" />
                    <text
                      x={x}
                      y={padding.top + graphHeight + 16}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.7)"
                      fontSize="9.5"
                      fontWeight="700"
                    >
                      {m}′
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tooltip de tramo interactivo */}
          {hoveredPoint && (
            <div style={{
              background: 'rgba(27, 58, 45, 0.95)',
              border: '1px solid #D4A843',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <strong style={{ color: '#D4A843' }}>Minuto {hoveredPoint.minute}′:</strong>{' '}
                <span>
                  {hoveredPoint.momentum >= 50
                    ? `Dominio de ${cleanHomeName} (${hoveredPoint.momentum}%)`
                    : `Dominio de ${cleanAwayName} (${(100 - hoveredPoint.momentum).toFixed(1)}%)`}
                </span>
                {hoveredPoint.descriptions && hoveredPoint.descriptions.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px' }}>
                    Eventos: {hoveredPoint.descriptions.join(' · ')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setHoveredPoint(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Lista de hitos clave */}
          {keyEvents.length > 0 && (
            <div className="timeline-events-list" style={{ marginTop: '12px' }}>
              <div className="events-list-title" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--partidos-text-muted, #888)', marginBottom: '6px' }}>
                Hitos y Eventos del Partido:
              </div>
              <div className="events-chips-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {keyEvents.map(e => (
                  <div key={e.id} className={`event-chip ${e.team}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: e.team === 'home' ? 'rgba(212, 168, 67, 0.15)' : 'rgba(76, 175, 125, 0.15)',
                    border: `1px solid ${e.team === 'home' ? '#D4A843' : '#4CAF7D'}`,
                    fontSize: '11px',
                    fontWeight: '700',
                    whiteSpace: 'nowrap'
                  }}>
                    <span>{getEventIcon(e.type)}</span>
                    <span style={{ color: '#D4A843' }}>{e.minute}′</span>
                    <span>{e.player}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
