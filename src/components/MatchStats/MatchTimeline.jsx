import React, { useMemo } from 'react';
import { Clock, TrendingUp } from 'lucide-react';

export const MatchTimeline = ({
  events = [],
  homeTeamName = 'Local',
  awayTeamName = 'Visitante',
  matchDuration = 90
}) => {
  // Construir curva de momentum acumulado por minuto (0 a 90)
  const { timelineData, keyEvents } = useMemo(() => {
    const points = [];
    const eventsList = [];
    let currentHomeMomentum = 50;

    for (let m = 0; m <= matchDuration; m += 5) {
      // Calcular eventos ocurridos en esta ventana de minutos
      const minuteEvents = events.filter(e => {
        const min = Number(e.minute || e.time || 0);
        return min >= m - 5 && min <= m;
      });

      let delta = 0;
      minuteEvents.forEach(e => {
        const isHome = e.team === 'home' || e.isHome !== false;
        const weight = (e.type === 'gol' || e.type === 'goal') ? 15 :
                       (e.type === 'tiro' || e.type === 'shot') ? 6 :
                       (e.type === 'corner') ? 4 :
                       (e.type === 'falta' || e.type === 'foul') ? -3 : 2;
        delta += isHome ? weight : -weight;
      });

      currentHomeMomentum = Math.max(15, Math.min(85, currentHomeMomentum + delta * 0.4));
      points.push({ minute: m, homeMomentum: currentHomeMomentum, awayMomentum: 100 - currentHomeMomentum });
    }

    events.forEach((e, idx) => {
      const min = Number(e.minute || e.time || 0);
      if (['gol', 'goal', 'tarjeta_amarilla', 'yellow_card', 'tarjeta_roja', 'red_card', 'cambio', 'substitution'].includes(e.type)) {
        eventsList.push({
          id: e.id || `event-${idx}`,
          minute: min,
          type: e.type,
          player: e.playerName || e.player || 'Jugador',
          team: e.team || 'home'
        });
      }
    });

    return { timelineData: points, keyEvents: eventsList };
  }, [events, matchDuration]);

  // Dimensiones SVG
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Generar path SVG para la curva de momentum local
  const getPath = () => {
    if (timelineData.length === 0) return '';
    return timelineData.map((d, i) => {
      const x = padding.left + (d.minute / matchDuration) * graphWidth;
      const y = padding.top + ((100 - d.homeMomentum) / 100) * graphHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'gol':
      case 'goal':
        return '⚽';
      case 'tarjeta_amarilla':
      case 'yellow_card':
        return '🟨';
      case 'tarjeta_roja':
      case 'red_card':
        return '🟥';
      case 'cambio':
      case 'substitution':
        return '🔄';
      default:
        return '📍';
    }
  };

  return (
    <div className="match-timeline-container">
      <div className="timeline-header">
        <div className="timeline-title">
          <TrendingUp size={20} className="timeline-icon" />
          <h3>Línea Temporal de Presión & Momentum</h3>
        </div>
        <div className="timeline-teams-legend">
          <span className="legend-badge gold">{homeTeamName}</span>
          <span className="vs-divider">vs</span>
          <span className="legend-badge green">{awayTeamName}</span>
        </div>
      </div>

      <div className="timeline-svg-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="timeline-svg" preserveAspectRatio="none">
          {/* Fondo y líneas de referencia */}
          <rect x={padding.left} y={padding.top} width={graphWidth} height={graphHeight} fill="rgba(255,255,255,0.02)" />
          
          {/* Línea central de equilibrio (50% momentum) */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight / 2}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight / 2}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* División 1T / 2T (45 min) */}
          <line
            x1={padding.left + (45 / matchDuration) * graphWidth}
            y1={padding.top}
            x2={padding.left + (45 / matchDuration) * graphWidth}
            y2={padding.top + graphHeight}
            stroke="rgba(212, 168, 67, 0.4)"
            strokeWidth="1.2"
          />
          <text
            x={padding.left + (45 / matchDuration) * graphWidth}
            y={padding.top - 6}
            textAnchor="middle"
            fill="#D4A843"
            fontSize="9"
            fontWeight="bold"
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
          />

          {/* Marcadores de eventos clave sobre la línea de tiempo */}
          {keyEvents.map(e => {
            const x = padding.left + (Math.min(matchDuration, e.minute) / matchDuration) * graphWidth;
            const isHome = e.team === 'home';
            const y = isHome ? padding.top + 15 : padding.top + graphHeight - 15;

            return (
              <g key={e.id} transform={`translate(${x}, ${y})`} className="timeline-event-node">
                <circle r="9" fill="#1B3A2D" stroke={isHome ? '#D4A843' : '#4CAF7D'} strokeWidth="1.5" />
                <text textAnchor="middle" dy="0.35em" fontSize="10">
                  {getEventIcon(e.type)}
                </text>
              </g>
            );
          })}

          {/* Eje X (Minutos) */}
          {[0, 15, 30, 45, 60, 75, 90].map(m => {
            const x = padding.left + (m / matchDuration) * graphWidth;
            return (
              <g key={m}>
                <line x1={x} y1={padding.top + graphHeight} x2={x} y2={padding.top + graphHeight + 5} stroke="rgba(255,255,255,0.4)" />
                <text
                  x={x}
                  y={padding.top + graphHeight + 16}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.6)"
                  fontSize="9.5"
                >
                  {m}′
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Lista de Hitos Clave */}
      {keyEvents.length > 0 && (
        <div className="timeline-events-list">
          <div className="events-list-title">Hitos y Eventos del Partido:</div>
          <div className="events-chips-scroll">
            {keyEvents.map(e => (
              <div key={e.id} className={`event-chip ${e.team}`}>
                <span className="event-icon">{getEventIcon(e.type)}</span>
                <span className="event-minute">{e.minute}′</span>
                <span className="event-player">{e.player}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
