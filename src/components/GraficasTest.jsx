import React from 'react';
import { useTheme } from '../context/ThemeContext';

// Colores institucionales
const COLOR_PRIMARY = '#1B3A2D';
const COLOR_ACCENT  = '#D4A843';
const COLOR_GREEN   = '#4CAF7D';

// ── SVG Line Chart puro adaptativo a Modo Oscuro y Claro ──────────────────
export const SvgLineChart = ({ data, isTime, width = 320, height = 200 }) => {
  const { darkMode } = useTheme();

  if (!data || data.length === 0) return null;

  const bgCard = darkMode ? 'rgba(0, 0, 0, 0.35)' : '#F8FAFC';
  const borderCard = darkMode ? 'rgba(76, 175, 125, 0.25)' : '#E2E8F0';
  const textMuted = darkMode ? '#94A3B8' : '#64748B';
  const textMain = darkMode ? '#FFFFFF' : '#0F172A';
  const gridLineColor = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Single data point: show stat card fallback
  if (data.length === 1) {
    const entry = data[0];
    const displayDate = (entry.date || '').split('-').reverse().slice(0, 2).join('/');
    return (
      <div style={{
        width: '100%', height,
        background: bgCard,
        border: `1px solid ${borderCard}`,
        borderRadius: 12,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '16px', boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: COLOR_GREEN, lineHeight: 1 }}>
          {entry.val} {isTime ? 's' : ''}
        </div>
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>Primera evaluación · {displayDate}</div>
        <div style={{
          marginTop: 4, padding: '4px 12px', borderRadius: 20,
          background: 'rgba(201, 168, 76, 0.2)', color: COLOR_ACCENT, fontSize: 11, fontWeight: 700
        }}>
          Registra más resultados para ver la evolución
        </div>
      </div>
    );
  }

  const vals = data.map(d => Number(d.val) || 0);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const isFlat = minVal === maxVal;
  const effectiveMin = isFlat ? Math.max(0, minVal - (minVal > 0 ? 2 : 1)) : minVal;
  const effectiveMax = isFlat ? maxVal + 2 : maxVal;
  const range  = effectiveMax - effectiveMin || 1;

  const pad = { top: 18, right: 18, bottom: 32, left: 40 };
  const cW  = width  - pad.left - pad.right;
  const cH  = height - pad.top  - pad.bottom;

  const xOf = i => pad.left + (i / (data.length - 1)) * cW;
  const yOf = v => {
    const pct = (v - effectiveMin) / range;
    return isTime
      ? pad.top + pct * cH          // lower = better (reversed)
      : pad.top + (1 - pct) * cH;   // higher = better (normal)
  };

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(Number(d.val) || 0), val: d.val, date: d.date }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Fill area under line
  const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + cH).toFixed(1)} L${pad.left.toFixed(1)},${(pad.top + cH).toFixed(1)} Z`;

  // Y-axis grid lines (3 ticks sin redundancia)
  const yTicks = [0, 50, 100].map((pct, idx) => {
    const v = effectiveMin + (range * pct / 100);
    return { id: idx, y: yOf(v), label: Number(v.toFixed(1)) };
  });

  return (
    <div style={{
      width: '100%',
      background: bgCard,
      border: `1px solid ${borderCard}`,
      borderRadius: 12,
      padding: '12px 8px 8px',
      boxSizing: 'border-box'
    }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block' }}
      >
        {/* Grid + Y labels */}
        {yTicks.map(t => (
          <g key={t.id}>
            <line x1={pad.left} y1={t.y} x2={pad.left + cW} y2={t.y}
              stroke={gridLineColor} strokeWidth={1} strokeDasharray="3,3" />
            <text x={pad.left - 6} y={t.y} textAnchor="end"
              fontSize={10} fill={textMuted} fontWeight="700" dominantBaseline="middle">
              {t.label}
            </text>
          </g>
        ))}

        {/* Fill */}
        <path d={fillD} fill={COLOR_GREEN} fillOpacity={darkMode ? 0.2 : 0.12} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={COLOR_GREEN} strokeWidth={2.8}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* X labels */}
        {pts.map((p, i) => {
          const show = data.length <= 5 || i === 0 || i === data.length - 1
            || i % Math.ceil(data.length / 4) === 0;
          const dateStr = (p.date || '').split('-').reverse().slice(0, 2).join('/');
          return show ? (
            <text key={i} x={p.x} y={height - 6}
              textAnchor="middle" fontSize={10} fontWeight="700" fill={textMuted}>
              {dateStr}
            </text>
          ) : null;
        })}

        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4.5}
              fill={COLOR_GREEN} stroke={darkMode ? '#111B21' : '#FFFFFF'} strokeWidth={2} />
          </g>
        ))}
      </svg>
    </div>
  );
};

// Alias para compatibilidad con código existente
export const GraficaEvolucion = ({ data, isTime }) => (
  <SvgLineChart data={data} isTime={isTime} height={220} />
);

export const GraficaResumen = () => null;

export default SvgLineChart;
