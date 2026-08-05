/**
 * LiveStatsCharts.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente de visualización de estadísticas en tiempo real con SVG puro.
 *
 * INCLUYE:
 *  1. Gráficas de Dona SVG (Duelos ganados/perdidos, Tiros a puerta/fuera, Recuperaciones/Pérdidas)
 *  2. Comparativa Propio vs Rival (Barras comparativas horizontales)
 *  3. Desglose por Mitades (1T: X eventos / 2T: Y eventos)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

// ── 1. SVG Donut Chart (Gráfica de Eficiencia) ────────────────────────────────
export const SvgDonut = ({
  value1,
  value2,
  label1,
  label2,
  title,
  color1 = '#4CAF7D',
  color2 = '#EF4444',
  darkMode,
}) => {
  const total = value1 + value2;
  const pct1 = total > 0 ? Math.round((value1 / total) * 100) : 0;

  const size = 110;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct1 / 100) * circumference;

  const bgTrack = darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const textColor = darkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 8px',
      gap: '8px',
      flex: '1 1 120px',
      minWidth: '120px',
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Pista base */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={total > 0 ? color2 : bgTrack}
            strokeWidth={strokeWidth}
          />
          {/* Arco primario */}
          {total > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={color1}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          )}
        </svg>

        {/* Porcentaje en el centro */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '20px', fontWeight: 900, color: textColor, lineHeight: 1 }}>
            {total > 0 ? `${pct1}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Título de métrica */}
      <span style={{ fontSize: '12px', fontWeight: 800, color: textColor, textAlign: 'center' }}>
        {title}
      </span>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '6px', fontSize: '10.5px', color: subTextColor, fontWeight: 700 }}>
        <span style={{ color: color1 }}>{value1} {label1}</span>
        <span>/</span>
        <span style={{ color: color2 }}>{value2} {label2}</span>
      </div>
    </div>
  );
};

// ── 2. Comparativa Propio vs Rival (Barras Horizontales) ──────────────────────
export const SvgComparisonBars = ({ events, darkMode }) => {
  const textColor = darkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';

  const metrics = [
    {
      title: 'Tiros a puerta',
      own: events.filter((e) => e.type === 'shot_on_target_own').length,
      rival: events.filter((e) => e.type === 'shot_on_target_rival').length,
    },
    {
      title: 'Córners',
      own: events.filter((e) => e.type === 'corner_favor').length,
      rival: events.filter((e) => e.type === 'corner_against').length,
    },
    {
      title: 'Tarjetas',
      own: events.filter((e) => e.type === 'card_own').length,
      rival: events.filter((e) => e.type === 'card_rival').length,
    },
    {
      title: 'Fueras de juego',
      own: events.filter((e) => e.type === 'offside_own').length,
      rival: events.filter((e) => e.type === 'offside_rival').length,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {metrics.map((m) => {
        const total = m.own + m.rival;
        const ownPct = total > 0 ? (m.own / total) * 100 : 50;
        const rivalPct = total > 0 ? (m.rival / total) * 100 : 50;

        return (
          <div key={m.title} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ color: '#4CAF7D' }}>{m.own} (Propio)</span>
              <span style={{ color: textColor, fontWeight: 800 }}>{m.title}</span>
              <span style={{ color: '#EF4444' }}>{m.rival} (Rival)</span>
            </div>

            {/* Barra bicolor comparativa */}
            <div style={{
              height: '10px',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              background: darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            }}>
              <div style={{
                width: `${ownPct}%`,
                background: '#4CAF7D',
                transition: 'width 0.4s ease',
              }} />
              <div style={{
                width: `${rivalPct}%`,
                background: '#EF4444',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── 3. Desglose por Mitades (1T: X / 2T: Y) ──────────────────────────────────
export const HalfBreakdown = ({ events, darkMode }) => {
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? 'rgba(255,255,255,0.03)' : '#F1F5F9';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0';

  const t1Events = events.filter((e) => e.half === 1);
  const t2Events = events.filter((e) => e.half === 2);

  const getCount = (list, types) => list.filter((e) => types.includes(e.type)).length;

  const items = [
    { label: 'Eventos totales', t1: t1Events.length, t2: t2Events.length },
    { label: 'Remates propios', t1: getCount(t1Events, ['shot_on_target_own', 'shot_off_target_own']), t2: getCount(t2Events, ['shot_on_target_own', 'shot_off_target_own']) },
    { label: 'Recuperaciones', t1: getCount(t1Events, ['recovery']), t2: getCount(t2Events, ['recovery']) },
    { label: 'Faltas cometidas', t1: getCount(t1Events, ['foul_against']), t2: getCount(t2Events, ['foul_against']) },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
      gap: '10px',
      width: '100%',
    }}>
      {items.map((item) => (
        <div key={item.label} style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor }}>{item.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800 }}>
            <span style={{ color: '#D4A843' }}>1T: {item.t1}</span>
            <span style={{ color: subTextColor }}>/</span>
            <span style={{ color: '#4CAF7D' }}>2T: {item.t2}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
