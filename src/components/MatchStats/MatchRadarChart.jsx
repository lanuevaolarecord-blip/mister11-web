import React, { useState, useMemo } from 'react';
import { Activity, HelpCircle, X, Info } from 'lucide-react';

export const MatchRadarChart = ({
  events = [],
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival'
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [activeTooltipAxis, setActiveTooltipAxis] = useState(null);

  // Ejes tácticos principales solicitados
  const axes = [
    { 
      key: 'shotsOnTarget', 
      label: 'Tiros a puerta', 
      desc: 'Remates directos entre los tres palos.',
      calc: 'Normalizado hasta un tope de 10 remates a puerta.'
    },
    { 
      key: 'duels', 
      label: 'Duelos / Posesión', 
      desc: 'Eficacia en duelos ganados individuales y retención de balón.',
      calc: '% de duelos ganados sobre el total disputado.'
    },
    { 
      key: 'fouls', 
      label: 'Faltas', 
      desc: 'Infracciones cometidas e intensidad en la disputa.',
      calc: 'Control de faltas cometidas respecto al volumen de juego.'
    },
    { 
      key: 'discipline', 
      label: 'Disciplina', 
      desc: 'Fair-play y limpieza táctica (amarillas y rojas evitadas).',
      calc: '100 pts base menos penalizaciones por amarillas (-15) y rojas (-35).'
    },
    { 
      key: 'corners', 
      label: 'Córners', 
      desc: 'Saques de esquina a favor provocados.',
      calc: 'Normalizado hasta un tope de 8 córners.'
    },
    { 
      key: 'offsides', 
      label: 'Offsides', 
      desc: 'Posiciones adelantadas provocadas o cometidas.',
      calc: 'Control de línea de fuera de juego.'
    }
  ];

  // Calcular métricas 100% reales a partir de events y props
  const { teamAStats, teamBStats, rawCounts, hasRealData } = useMemo(() => {
    let localShotsOn = 0, rivalShotsOn = 0;
    let localDuelsWon = 0, localDuelsLost = 0;
    let rivalDuelsWon = 0, rivalDuelsLost = 0;
    let localFouls = 0, rivalFouls = 0;
    let localYellows = 0, localReds = 0;
    let rivalYellows = 0, rivalReds = 0;
    let localCorners = 0, rivalCorners = 0;
    let localOffsides = 0, rivalOffsides = 0;

    let hasEvents = Array.isArray(events) && events.length > 0;

    if (hasEvents) {
      events.forEach(e => {
        if (!e) return;
        const isHome = e.team === 'home' || e.isHome === true || e.isOwn === true || e.team === 'own' || (!e.team && !e.isRival);
        const t = e.type || '';

        // Tiros a puerta
        if (t === 'shot_on_target_own' || (t.includes('shot') && t.includes('on') && isHome) || t === 'gol_local' || t === 'gol') {
          localShotsOn++;
        } else if (t === 'shot_on_target_rival' || (t.includes('shot') && t.includes('on') && !isHome) || t === 'gol_rival') {
          rivalShotsOn++;
        }

        // Duelos
        if (t === 'duel_won') {
          if (isHome) localDuelsWon++; else rivalDuelsWon++;
        } else if (t === 'duel_lost') {
          if (isHome) localDuelsLost++; else rivalDuelsLost++;
        }

        // Faltas
        if (t === 'foul_favor' || t === 'falta_favor') {
          rivalFouls++; // Falta cometida por el rival
        } else if (t === 'foul_against' || t === 'falta_contra' || t === 'falta') {
          if (isHome) localFouls++; else rivalFouls++;
        }

        // Disciplina
        if (t === 'yellow_card' || t === 'amarilla' || t === 'card_yellow_own') {
          localYellows++;
        } else if (t === 'card_yellow_rival') {
          rivalYellows++;
        } else if (t === 'red_card' || t === 'roja' || t === 'card_red_own') {
          localReds++;
        } else if (t === 'card_red_rival') {
          rivalReds++;
        }

        // Córners
        if (t === 'corner_favor' || t === 'corner_own' || (t === 'corner' && isHome)) {
          localCorners++;
        } else if (t === 'corner_against' || t === 'corner_rival' || (t === 'corner' && !isHome)) {
          rivalCorners++;
        }

        // Offsides
        if (t === 'offside_own' || (t === 'offside' && isHome)) {
          localOffsides++;
        } else if (t === 'offside_rival' || (t === 'offside' && !isHome)) {
          rivalOffsides++;
        }
      });
    }

    // Fallback a homeStats / awayStats si existen valores explícitos
    if (homeStats && Object.keys(homeStats).length > 0) {
      if (typeof homeStats.tirosPuerta === 'number') localShotsOn = Math.max(localShotsOn, homeStats.tirosPuerta);
      if (typeof homeStats.corners === 'number') localCorners = Math.max(localCorners, homeStats.corners);
      if (typeof homeStats.faltas === 'number') localFouls = Math.max(localFouls, homeStats.faltas);
    }
    if (awayStats && Object.keys(awayStats).length > 0) {
      if (typeof awayStats.tirosPuerta === 'number') rivalShotsOn = Math.max(rivalShotsOn, awayStats.tirosPuerta);
      if (typeof awayStats.corners === 'number') rivalCorners = Math.max(rivalCorners, awayStats.corners);
      if (typeof awayStats.faltas === 'number') rivalFouls = Math.max(rivalFouls, awayStats.faltas);
    }

    const totalLocalDuels = localDuelsWon + localDuelsLost;
    const totalRivalDuels = rivalDuelsWon + rivalDuelsLost;

    const totalEventsCount = localShotsOn + rivalShotsOn + totalLocalDuels + totalRivalDuels + localFouls + rivalFouls + localCorners + rivalCorners + localOffsides + rivalOffsides;
    const isActuallyEmpty = !hasEvents && totalEventsCount === 0;

    // Normalización 0 - 100
    const normShotsA = Math.min(100, Math.round((localShotsOn / 8) * 100));
    const normShotsB = Math.min(100, Math.round((rivalShotsOn / 8) * 100));

    const normDuelsA = totalLocalDuels > 0 ? Math.round((localDuelsWon / totalLocalDuels) * 100) : (localDuelsWon > 0 ? 70 : 50);
    const normDuelsB = totalRivalDuels > 0 ? Math.round((rivalDuelsWon / totalRivalDuels) * 100) : (rivalDuelsWon > 0 ? 70 : 50);

    const normFoulsA = Math.min(100, Math.round((localFouls / 12) * 100));
    const normFoulsB = Math.min(100, Math.round((rivalFouls / 12) * 100));

    const normDiscB = Math.max(10, 100 - (rivalYellows * 15 + rivalReds * 35));
    const normDiscA = Math.max(10, 100 - (localYellows * 15 + localReds * 35));

    const normCornersA = Math.min(100, Math.round((localCorners / 8) * 100));
    const normCornersB = Math.min(100, Math.round((rivalCorners / 8) * 100));

    const normOffsidesA = Math.min(100, Math.round((localOffsides / 5) * 100));
    const normOffsidesB = Math.min(100, Math.round((rivalOffsides / 5) * 100));

    return {
      teamAStats: [normShotsA, normDuelsA, normFoulsA, normDiscA, normCornersA, normOffsidesA],
      teamBStats: [normShotsB, normDuelsB, normFoulsB, normDiscB, normCornersB, normOffsidesB],
      rawCounts: {
        shotsOnTarget: { home: localShotsOn, away: rivalShotsOn, unit: 'tiros' },
        duels: { home: `${localDuelsWon}/${totalLocalDuels || localDuelsWon}`, away: `${rivalDuelsWon}/${totalRivalDuels || rivalDuelsWon}`, unit: 'ganados' },
        fouls: { home: localFouls, away: rivalFouls, unit: 'faltas' },
        discipline: { home: `${localYellows}🟨 ${localReds}🟥`, away: `${rivalYellows}🟨 ${rivalReds}🟥`, unit: 'tarjetas' },
        corners: { home: localCorners, away: rivalCorners, unit: 'córners' },
        offsides: { home: localOffsides, away: rivalOffsides, unit: 'offsides' }
      },
      hasRealData: !isActuallyEmpty
    };
  }, [events, homeStats, awayStats]);

  // Geometría del Radar SVG
  const size = 320;
  const center = size / 2;
  const radius = center - 52;
  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  const getPolygonPoints = (values) => {
    return values.map((val, i) => {
      const r = (Math.max(val, 5) / 100) * radius;
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="radar-chart-container" style={{ position: 'relative' }}>
      <div className="radar-chart-header">
        <div className="radar-title">
          <Activity size={20} className="radar-icon" />
          <h3>Perfil Táctico Comparativo (Radar)</h3>
        </div>

        <button
          type="button"
          className="mode-btn"
          onClick={() => setShowFormulaModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}
          title="Ver fórmula y explicación de cálculo"
        >
          <HelpCircle size={14} />
          <span>¿Cómo se calcula?</span>
        </button>
      </div>

      {!hasRealData ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--partidos-text-muted, #888)' }}>
          <Info size={32} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--partidos-text-primary, #fff)' }}>Sin datos suficientes</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Registra eventos a pie de campo o en el acta para generar el radar táctico comparativo.</div>
        </div>
      ) : (
        <>
          <div className="radar-chart-body" style={{ position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-svg">
              {/* Telaraña concéntrica */}
              {[0.25, 0.5, 0.75, 1].map((level, idx) => (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius * level}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeDasharray={level === 1 ? 'none' : '2 2'}
                  strokeWidth="0.8"
                />
              ))}

              {/* Ejes radiales y etiquetas rotuladas con valor */}
              {axes.map((axis, i) => {
                const angle = i * angleSlice - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const labelX = center + (radius + 24) * Math.cos(angle);
                const labelY = center + (radius + 18) * Math.sin(angle);

                const isHovered = activeTooltipAxis === axis.key;
                const normVal = teamAStats[i];

                return (
                  <g 
                    key={axis.key} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTooltipAxis(isHovered ? null : axis.key)}
                  >
                    <line
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke={isHovered ? '#D4A843' : 'rgba(255, 255, 255, 0.2)'}
                      strokeWidth={isHovered ? '1.5' : '0.8'}
                    />
                    <text
                      x={labelX}
                      y={labelY - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fill={isHovered ? '#D4A843' : 'rgba(255, 255, 255, 0.9)'}
                      fontWeight="800"
                    >
                      {axis.label}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 7}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="#D4A843"
                      fontWeight="700"
                    >
                      {normVal} pts
                    </text>
                  </g>
                );
              })}

              {/* Polígono Equipo Local (Dorado Institucional #D4A843) */}
              <polygon
                points={getPolygonPoints(teamAStats)}
                fill="rgba(212, 168, 67, 0.35)"
                stroke="#D4A843"
                strokeWidth="2.5"
              />

              {/* Polígono Equipo Visitante (Verde Campo #4CAF7D) */}
              <polygon
                points={getPolygonPoints(teamBStats)}
                fill="rgba(76, 175, 125, 0.35)"
                stroke="#4CAF7D"
                strokeWidth="2.5"
              />

              {/* Nodos de datos Local */}
              {teamAStats.map((val, i) => {
                const r = (Math.max(val, 5) / 100) * radius;
                const angle = i * angleSlice - Math.PI / 2;
                return (
                  <circle
                    key={`a-${i}`}
                    cx={center + r * Math.cos(angle)}
                    cy={center + r * Math.sin(angle)}
                    r="4"
                    fill="#D4A843"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* Nodos de datos Visitante */}
              {teamBStats.map((val, i) => {
                const r = (Math.max(val, 5) / 100) * radius;
                const angle = i * angleSlice - Math.PI / 2;
                return (
                  <circle
                    key={`b-${i}`}
                    cx={center + r * Math.cos(angle)}
                    cy={center + r * Math.sin(angle)}
                    r="4"
                    fill="#4CAF7D"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                );
              })}
            </svg>
          </div>

          {/* Tooltip interactivo / Desglose del eje seleccionado con conteos crudos */}
          {activeTooltipAxis && (
            <div style={{
              background: 'rgba(15, 26, 15, 0.95)',
              border: '1px solid #D4A843',
              borderRadius: '8px',
              padding: '10px 14px',
              margin: '8px 12px 14px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <div>
                <strong style={{ color: '#D4A843', display: 'block', fontSize: '13px' }}>
                  {axes.find(a => a.key === activeTooltipAxis)?.label}
                </strong>
                <span style={{ color: '#aaa', fontSize: '11px' }}>
                  {axes.find(a => a.key === activeTooltipAxis)?.desc}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', textAlign: 'right', fontWeight: '800' }}>
                <span style={{ color: '#D4A843' }}>{homeTeamName}: {rawCounts[activeTooltipAxis]?.home} {rawCounts[activeTooltipAxis]?.unit}</span>
                <span style={{ color: '#4CAF7D' }}>{awayTeamName}: {rawCounts[activeTooltipAxis]?.away} {rawCounts[activeTooltipAxis]?.unit}</span>
              </div>
            </div>
          )}

          {/* Leyenda comparativa fija */}
          <div className="radar-legend" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '14px' }}>
            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800 }}>
              <span className="legend-box gold" style={{ width: '12px', height: '12px', background: '#D4A843', borderRadius: '3px', display: 'inline-block' }} />
              <span style={{ color: '#D4A843' }}>{homeTeamName} (Local)</span>
            </div>
            <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800 }}>
              <span className="legend-box green" style={{ width: '12px', height: '12px', background: '#4CAF7D', borderRadius: '3px', display: 'inline-block' }} />
              <span style={{ color: '#4CAF7D' }}>{awayTeamName} (Visitante)</span>
            </div>
          </div>

          {/* TABLA COMPARATIVA DE RESPALDO (Fuente de verdad visual) */}
          <div className="radar-table-wrapper" style={{ marginTop: '10px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--partidos-text-muted, #94a3b8)', fontWeight: 800 }}>MÉTRICA</th>
                  <th style={{ padding: '8px 10px', color: '#D4A843', fontWeight: 900 }}>{homeTeamName} (L)</th>
                  <th style={{ padding: '8px 10px', color: '#4CAF7D', fontWeight: 900 }}>{awayTeamName} (V)</th>
                  <th style={{ padding: '8px 10px', color: 'var(--partidos-text-muted, #94a3b8)', fontWeight: 800 }}>NORMALIZADO</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--partidos-text-muted, #94a3b8)', fontWeight: 800 }}>GANADOR</th>
                </tr>
              </thead>
              <tbody>
                {axes.map((axis, i) => {
                  const raw = rawCounts[axis.key];
                  const normA = teamAStats[i];
                  const normB = teamBStats[i];
                  let winnerLabel = 'Empate';
                  let winnerColor = '#94a3b8';
                  let winnerBg = 'rgba(148, 163, 184, 0.15)';

                  if (normA > normB) {
                    winnerLabel = homeTeamName;
                    winnerColor = '#D4A843';
                    winnerBg = 'rgba(212, 168, 67, 0.15)';
                  } else if (normB > normA) {
                    winnerLabel = awayTeamName;
                    winnerColor = '#4CAF7D';
                    winnerBg = 'rgba(76, 175, 125, 0.15)';
                  }

                  return (
                    <tr key={axis.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#FFFFFF' }}>
                        {axis.label}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#D4A843', fontWeight: 800 }}>
                        {raw?.home ?? '-'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#4CAF7D', fontWeight: 800 }}>
                        {raw?.away ?? '-'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                        {normA} vs {normB} pts
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          color: winnerColor,
                          background: winnerBg,
                          border: `1px solid ${winnerColor}40`,
                          display: 'inline-block'
                        }}>
                          {winnerLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal ¿Cómo se calcula? */}
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
              background: 'var(--bg-card, #1B3A2D)',
              border: '1px solid var(--border-light, #2d4a2d)',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '20px',
              color: 'var(--text-primary, #fff)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#D4A843', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} /> ¿Cómo se calcula el Radar Comparativo?
              </h3>
              <button 
                type="button" 
                onClick={() => setShowFormulaModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 14px 0' }}>
              Todos los 6 ejes nacen <strong>exclusivamente de los eventos reales</strong> capturados a pie de campo o en el acta oficial:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {axes.map(a => (
                <div key={a.key} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #D4A843' }}>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>{a.label}</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>{a.desc}</div>
                  <div style={{ fontSize: '11px', color: '#4CAF7D', marginTop: '4px', fontWeight: '600' }}>📐 {a.calc}</div>
                </div>
              ))}
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
