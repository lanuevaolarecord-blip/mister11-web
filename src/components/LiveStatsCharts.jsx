/**
 * LiveStatsCharts.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente de visualización de estadísticas en tiempo real con SVG puro.
 *
 * MEJORAS DE CONTRASTE Y CAPTURA HTML2CANVAS:
 *  • Texto del porcentaje inyectado como elemento <text> nativo del SVG para garantizar
 *    su visibilidad en capturas PDF (html2canvas) y en todas las pantallas.
 *  • Alto contraste (WCAG AAA) en títulos y etiquetas (#0F172A en modo claro, #FFFFFF en oscuro).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';

// ── 1. SVG Donut Chart (Gráfica de Eficiencia) ────────────────────────────────
export const SvgDonut = ({
  value1,
  value2,
  label1,
  label2,
  title,
  color1 = '#4CAF7D',
  color2 = '#EF4444',
  darkMode: darkModeProp,
}) => {
  const themeContext = useTheme();
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeContext?.darkMode ?? false);

  const total = value1 + value2;
  const pct1 = total > 0 ? Math.round((value1 / total) * 100) : 0;

  const size = 110;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct1 / 100) * circumference;

  // Colores de alto contraste según tema
  const bgTrack = darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1';
  const textColor = darkMode ? '#FFFFFF' : '#0F172A';
  const subTextColor = darkMode ? '#E2E8F0' : '#334155';

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
            fill="none"
            stroke={total > 0 ? color2 : bgTrack}
            strokeWidth={strokeWidth}
          />
          {/* Arco primario */}
          {total > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color1}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          )}

          {/* Porcentaje en el centro como elemento <text> del SVG */}
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="21"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {total > 0 ? `${pct1}%` : '0%'}
          </text>
        </svg>
      </div>

      {/* Título de métrica */}
      <span style={{ fontSize: '12.5px', fontWeight: 900, color: textColor, textAlign: 'center' }}>
        {title}
      </span>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: subTextColor, fontWeight: 800 }}>
        <span style={{ color: color1 }}>{value1} {label1}</span>
        <span style={{ color: subTextColor }}>/</span>
        <span style={{ color: color2 }}>{value2} {label2}</span>
      </div>
    </div>
  );
};

// ── 2. Comparativa Propio vs Rival (Barras Horizontales) ──────────────────────
export const SvgComparisonBars = ({ events, darkMode: darkModeProp }) => {
  const themeContext = useTheme();
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeContext?.darkMode ?? false);

  const labelColor = darkMode ? '#FFFFFF' : '#0F172A';
  const bgBar = darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1';

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
          <div key={m.title} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800 }}>
              <span style={{ color: '#4CAF7D', fontWeight: 900 }}>{m.own} (Propio)</span>
              <span style={{ color: labelColor, fontWeight: 900, fontSize: '12.5px' }}>{m.title}</span>
              <span style={{ color: '#EF4444', fontWeight: 900 }}>{m.rival} (Rival)</span>
            </div>

            {/* Barra bicolor comparativa */}
            <div style={{
              height: '11px',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              background: bgBar,
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
export const HalfBreakdown = ({ events, darkMode: darkModeProp }) => {
  const themeContext = useTheme();
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeContext?.darkMode ?? false);

  const labelColor = darkMode ? '#FFFFFF' : '#0F172A';
  const subLabelColor = darkMode ? '#CBD5E1' : '#334155';
  const cardBg = darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const borderColor = darkMode ? 'rgba(255,255,255,0.12)' : '#CBD5E1';

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
          <span style={{ fontSize: '11px', fontWeight: 900, color: labelColor }}>{item.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 900 }}>
            <span style={{ color: '#D4A843' }}>1T: {item.t1}</span>
            <span style={{ color: subLabelColor }}>/</span>
            <span style={{ color: '#4CAF7D' }}>2T: {item.t2}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
