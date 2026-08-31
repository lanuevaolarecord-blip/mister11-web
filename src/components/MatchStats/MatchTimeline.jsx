import React, { useState, useMemo } from 'react';
import { TrendingUp, Clock, Info, HelpCircle, ChevronDown, ChevronUp, X, BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const MatchTimeline = ({
  events = [],
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  matchDuration = 90
}) => {
  const { darkMode } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Normalizar nombres de equipos con espacios correctos
  const cleanHomeName = (homeTeamName || 'Mi Equipo').trim();
  const cleanAwayName = (awayTeamName || 'Rival').trim();

  const getEventLabel = (type) => {
    if (!type) return 'Acción';
    const t = type.toLowerCase();
    if (t.includes('gol_local') || t === 'gol' || t === 'goal') return 'Gol';
    if (t.includes('gol_rival')) return 'Gol rival';
    if (t.includes('yellow') || t.includes('amarilla')) return 'Tarjeta amarilla';
    if (t.includes('red') || t.includes('roja')) return 'Tarjeta roja';
    if (t.includes('cambio') || t.includes('substitution')) return 'Cambio';
    if (t.includes('shot_on')) return 'Tiro a puerta';
    if (t.includes('shot_off')) return 'Tiro fuera';
    if (t.includes('corner')) return 'Córner';
    return 'Evento';
  };

  // Calcular curva de momentum por tramos de 5 minutos (Fórmula profesional)
  const { timelineData, keyEvents, hasRealEvents } = useMemo(() => {
    const rawEventsList = Array.isArray(events) ? events.filter(Boolean) : [];
    if (rawEventsList.length === 0) {
      return { timelineData: [], keyEvents: [], hasRealEvents: false };
    }

    const points = [];
    const eventsList = [];
    const seenMilestones = new Set();
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
          label = '🟢 Tiro puerta';
        } else if (t === 'shot_on_target_rival' || (t.includes('shot') && t.includes('on') && !isHome)) {
          weight = -2.0;
          label = '🔴 Tiro puerta rival';
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
          label = '⚡ Falta favor';
        } else if (t === 'foul_against' || t === 'falta_contra' || (t === 'falta' && !isHome)) {
          weight = -0.5;
          label = '⚡ Falta contra';
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
          eventDescriptions.push(`${label}`);
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

    // Extraer hitos clave desduplicados
    rawEventsList.forEach((e, idx) => {
      const min = Number(e.minute ?? e.time ?? 0);
      const isHome = e.team === 'home' || e.isHome === true || e.isOwn === true || e.team === 'own' || (!e.team && !e.isRival);
      const t = e.type || '';
      
      const isMilestone = ['gol', 'goal', 'gol_local', 'gol_rival', 'yellow_card', 'tarjeta_amarilla', 'red_card', 'tarjeta_roja', 'card_yellow_own', 'card_red_own', 'card_yellow_rival', 'card_red_rival', 'cambio', 'substitution'].includes(t);

      if (isMilestone) {
        const playerLabel = e.playerName || e.player || (isHome ? cleanHomeName : cleanAwayName);
        const eventLabel = getEventLabel(t);
        const dedupeKey = `${min}_${eventLabel}_${playerLabel}`;

        if (!seenMilestones.has(dedupeKey)) {
          seenMilestones.add(dedupeKey);
          eventsList.push({
            id: e.id || `evt-${idx}`,
            minute: min,
            type: t,
            label: eventLabel,
            player: playerLabel,
            team: isHome ? 'home' : 'away'
          });
        }
      }
    });

    eventsList.sort((a, b) => a.minute - b.minute);

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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowGuide(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              background: 'rgba(212, 168, 67, 0.12)',
              color: '#D4A843',
              border: '1px solid rgba(212, 168, 67, 0.3)',
              cursor: 'pointer'
            }}
          >
            <BookOpen size={12} />
            <span>Cómo leer</span>
            {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setShowFormulaModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              background: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
              color: darkMode ? '#FFFFFF' : '#0F172A',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={12} />
            <span>¿Cómo se calcula?</span>
          </button>

          {/* Título normalizado con espacios y capitalización estricta */}
          <div className="timeline-teams-legend" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="legend-badge gold" style={{ background: darkMode ? '#FBBF24' : '#D4A843', color: '#000', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '900' }}>
              {cleanHomeName}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: darkMode ? 'rgba(255,255,255,0.6)' : '#64748B' }}>vs</span>
            <span className="legend-badge green" style={{ background: darkMode ? '#4ADE80' : '#059669', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '900' }}>
              {cleanAwayName}
            </span>
          </div>
        </div>
      </div>

      {/* Guía plegable para el entrenador */}
      {showGuide && (
        <div style={{
          background: darkMode ? 'rgba(0,0,0,0.3)' : '#F8FAFC',
          border: darkMode ? '1px solid rgba(212,168,67,0.3)' : '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '10px 14px',
          marginTop: '10px',
          fontSize: '11.5px',
          color: darkMode ? '#CBD5E1' : '#1E293B',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: 900, color: darkMode ? '#FBBF24' : '#B45309', marginBottom: '4px' }}>📖 Cómo leer esta gráfica (Lenguaje de Míster):</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>📈 <strong>Curva hacia arriba (por encima del 50%):</strong> Tramo donde tu equipo llevó la iniciativa, pisó área rival o generó tiros y córners.</div>
            <div>📉 <strong>Curva hacia abajo (por debajo del 50%):</strong> Tramo donde el rival tuvo mayor control, generó ocasiones o te encerró en tu campo.</div>
            <div>⚡ <strong>Hitos (Iconos sobre el minuto):</strong> Momentos que cambiaron la inercia (goles, tarjetas, cambios tácticos).</div>
          </div>
        </div>
      )}

      {!hasRealEvents ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: darkMode ? '#94A3B8' : '#64748B' }}>
          <Info size={32} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
          <div style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? '#FFFFFF' : '#0F172A' }}>Sin datos de momentum</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Inicia el cronómetro y registra eventos durante el partido para visualizar la curva de dominio.</div>
        </div>
      ) : (
        <>
          <div className="timeline-svg-wrapper" style={{ marginTop: '14px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="timeline-svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Fondo del gráfico */}
              <rect x={padding.left} y={padding.top} width={graphWidth} height={graphHeight} fill={darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} rx="6" />

              {/* Zona superior (Dominio Local) / Zona inferior (Dominio Rival) */}
              <text x={padding.left + 8} y={padding.top + 14} fill={darkMode ? '#FBBF24' : '#B45309'} fontSize="9.5" fontWeight="900">
                ▲ DOMINIO {cleanHomeName.toUpperCase()}
              </text>
              <text x={padding.left + 8} y={padding.top + graphHeight - 8} fill={darkMode ? '#4ADE80' : '#047857'} fontSize="9.5" fontWeight="900">
                ▼ DOMINIO {cleanAwayName.toUpperCase()}
              </text>

              {/* Línea central de equilibrio (50% momentum neutro) */}
              <line
                x1={padding.left}
                y1={padding.top + graphHeight / 2}
                x2={padding.left + graphWidth}
                y2={padding.top + graphHeight / 2}
                stroke={darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Marcador DESCANSO (45') */}
              <line
                x1={padding.left + (45 / totalMins) * graphWidth}
                y1={padding.top}
                x2={padding.left + (45 / totalMins) * graphWidth}
                y2={padding.top + graphHeight}
                stroke={darkMode ? '#FBBF24' : '#B45309'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <rect 
                x={padding.left + (45 / totalMins) * graphWidth - 44} 
                y={padding.top - 18} 
                width="88" 
                height="16" 
                rx="4" 
                fill={darkMode ? '#1B3A2D' : '#FEF3C7'} 
                stroke={darkMode ? '#FBBF24' : '#B45309'} 
                strokeWidth="1"
              />
              <text
                x={padding.left + (45 / totalMins) * graphWidth}
                y={padding.top - 7}
                textAnchor="middle"
                fill={darkMode ? '#FBBF24' : '#92400E'}
                fontSize="8.5"
                fontWeight="900"
              >
                DESCANSO (45′)
              </text>

              {/* Curva de Momentum */}
              <path
                d={getPath()}
                fill="none"
                stroke={darkMode ? '#FBBF24' : '#D4A843'}
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
                    fill={pt.momentum >= 50 ? (darkMode ? '#FBBF24' : '#D4A843') : (darkMode ? '#4ADE80' : '#059669')}
                    stroke={darkMode ? '#FFFFFF' : '#0F172A'}
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
                    <circle r="9" fill={darkMode ? '#1B3A2D' : '#FFFFFF'} stroke={isHome ? (darkMode ? '#FBBF24' : '#B45309') : (darkMode ? '#4ADE80' : '#059669')} strokeWidth="1.5" />
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
                    <line x1={x} y1={padding.top + graphHeight} x2={x} y2={padding.top + graphHeight + 5} stroke={darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                    <text
                      x={x}
                      y={padding.top + graphHeight + 16}
                      textAnchor="middle"
                      fill={darkMode ? '#CBD5E1' : '#1E293B'}
                      fontSize="9.5"
                      fontWeight="800"
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
              background: darkMode ? 'rgba(27, 58, 45, 0.95)' : '#FFFFFF',
              border: darkMode ? '1px solid #D4A843' : '1.5px solid #CBD5E1',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div>
                <strong style={{ color: darkMode ? '#FBBF24' : '#B45309' }}>Minuto {hoveredPoint.minute}′:</strong>{' '}
                <span style={{ color: darkMode ? '#FFFFFF' : '#0F172A', fontWeight: 600 }}>
                  {hoveredPoint.momentum >= 50
                    ? `Dominio de ${cleanHomeName} (${hoveredPoint.momentum}%)`
                    : `Dominio de ${cleanAwayName} (${(100 - hoveredPoint.momentum).toFixed(1)}%)`}
                </span>
                {hoveredPoint.descriptions && hoveredPoint.descriptions.length > 0 && (
                  <div style={{ fontSize: '11px', color: darkMode ? '#CBD5E1' : '#475569', marginTop: '3px' }}>
                    Acciones en este tramo: {hoveredPoint.descriptions.join(' · ')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setHoveredPoint(null)}
                style={{ background: 'transparent', border: 'none', color: darkMode ? '#94A3B8' : '#64748B', cursor: 'pointer', fontSize: '13px' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Lista de hitos clave explicados */}
          {keyEvents.length > 0 && (
            <div className="timeline-events-list" style={{ marginTop: '12px' }}>
              <div className="events-list-title" style={{ fontSize: '12px', fontWeight: '900', color: darkMode ? '#94A3B8' : '#334155', marginBottom: '6px' }}>
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
                    background: e.team === 'home' 
                      ? (darkMode ? 'rgba(212, 168, 67, 0.15)' : '#FEF3C7') 
                      : (darkMode ? 'rgba(76, 175, 125, 0.15)' : '#E8F5EE'),
                    border: `1px solid ${e.team === 'home' ? (darkMode ? '#D4A843' : '#B45309') : (darkMode ? '#4CAF7D' : '#059669')}`,
                    color: darkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '11px',
                    fontWeight: '800',
                    whiteSpace: 'nowrap'
                  }}>
                    <span>{getEventIcon(e.type)}</span>
                    <span style={{ color: e.team === 'home' ? (darkMode ? '#FBBF24' : '#B45309') : (darkMode ? '#4ADE80' : '#047857') }}>{e.minute}′</span>
                    <span>{e.label}: {e.player}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal ¿Cómo se calcula el Momentum? */}
      {showFormulaModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowFormulaModal(false)}
        >
          <div 
            style={{
              background: darkMode ? '#1B3A2D' : '#FFFFFF',
              border: darkMode ? '1px solid #2d4a2d' : '1px solid #CBD5E1',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '20px',
              color: darkMode ? '#FFFFFF' : '#0F172A',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: darkMode ? '#D4A843' : '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> ¿Cómo se calcula el Momentum (Tramos de 5')?
              </h3>
              <button 
                type="button" 
                onClick={() => setShowFormulaModal(false)}
                style={{ background: 'transparent', border: 'none', color: darkMode ? '#94A3B8' : '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: darkMode ? '#CBD5E1' : '#334155', lineHeight: '1.5', margin: '0 0 14px 0' }}>
              El Momentum representa el <strong>equilibrio dinámico de iniciativa y control</strong> en cada bloque de 5 minutos de juego:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: darkMode ? 'rgba(0,0,0,0.2)' : '#F8FAFC', padding: '10px 12px', borderRadius: '8px', borderLeft: `3px solid ${darkMode ? '#D4A843' : '#B45309'}` }}>
                <div style={{ fontWeight: '800', fontSize: '13px', color: darkMode ? '#FFFFFF' : '#0F172A' }}>⚖️ Línea de Equilibrio (50%)</div>
                <div style={{ fontSize: '11.5px', color: darkMode ? '#94A3B8' : '#475569', marginTop: '2px' }}>
                  Cuando el partido está igualado sin ocasiones de peligro o con juego trabado en mediocampo, la curva se sitúa en el 50%.
                </div>
              </div>

              <div style={{ background: darkMode ? 'rgba(0,0,0,0.2)' : '#F8FAFC', padding: '10px 12px', borderRadius: '8px', borderLeft: `3px solid ${darkMode ? '#4CAF7D' : '#059669'}` }}>
                <div style={{ fontWeight: '800', fontSize: '13px', color: darkMode ? '#FFFFFF' : '#0F172A' }}>🔥 Ponderación de Eventos Reales</div>
                <div style={{ fontSize: '11.5px', color: darkMode ? '#94A3B8' : '#475569', marginTop: '2px' }}>
                  Cada evento suma peso estadístico: Gol (+10 pts), Tiro a puerta (+4 pts), Córner (+2 pts), Duelo ganado (+1 pt). Los fallos y tarjetas rivales suman a la contra.
                </div>
              </div>

              <div style={{ background: darkMode ? 'rgba(0,0,0,0.2)' : '#F8FAFC', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                <div style={{ fontWeight: '800', fontSize: '13px', color: darkMode ? '#FFFFFF' : '#0F172A' }}>🔄 Inercia Deportiva (70% / 30%)</div>
                <div style={{ fontSize: '11.5px', color: darkMode ? '#94A3B8' : '#475569', marginTop: '2px' }}>
                  Para reflejar rachas tácticas reales, el momentum de cada bloque mantiene un 30% del tramo anterior y un 70% de las acciones del tramo presente.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFormulaModal(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '18px', padding: '10px', fontWeight: '800' }}
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchTimeline;
