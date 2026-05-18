import React from 'react';

// Colores institucionales
const COLOR_PRIMARY = '#1B3A2D';
const COLOR_ACCENT  = '#D4A843';
const COLOR_GREEN   = '#4CAF7D';
const COLOR_BORDER  = '#E0DACA';
const COLOR_BEIGE   = '#F5F0E8';

// ── SVG Line Chart puro (sin ResponsiveContainer) ────────────────────────────
export const SvgLineChart = ({ data, isTime, width = 320, height = 200 }) => {
  if (!data || data.length === 0) return null;

  // Single data point: show stat card fallback
  if (data.length === 1) {
    const entry = data[0];
    const displayDate = (entry.date || '').split('-').reverse().slice(0, 2).join('/');
    return (
      <div style={{
        width: '100%', height,
        background: COLOR_BEIGE, borderRadius: 12,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: COLOR_PRIMARY, lineHeight: 1 }}>
          {entry.val}
        </div>
        <div style={{ fontSize: 13, color: '#7A7065' }}>Primera evaluación · {displayDate}</div>
        <div style={{
          marginTop: 4, padding: '4px 12px', borderRadius: 20,
          background: COLOR_ACCENT, color: '#FFF', fontSize: 11, fontWeight: 600
        }}>
          Registra más resultados para ver la evolución
        </div>
      </div>
    );
  }

  const vals = data.map(d => d.val);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const range  = maxVal - minVal || 1;

  const pad = { top: 14, right: 14, bottom: 30, left: 38 };
  const cW  = width  - pad.left - pad.right;
  const cH  = height - pad.top  - pad.bottom;

  const xOf = i => pad.left + (i / (data.length - 1)) * cW;
  const yOf = v => {
    const pct = (v - minVal) / range;
    return isTime
      ? pad.top + pct * cH          // lower = better (reversed)
      : pad.top + (1 - pct) * cH;   // higher = better (normal)
  };

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.val), val: d.val, date: d.date }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Fill area under line
  const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + cH).toFixed(1)} L${pad.left.toFixed(1)},${(pad.top + cH).toFixed(1)} Z`;

  // Y-axis grid lines (3 ticks)
  const yTicks = [0, 50, 100].map(pct => {
    const v = minVal + (range * pct / 100);
    return { y: yOf(v), label: Math.round(v) };
  });

  return (
    <div style={{ width: '100%', background: COLOR_BEIGE, borderRadius: 12, padding: '12px 8px 8px', boxSizing: 'border-box' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block' }}
      >
        {/* Grid + Y labels */}
        {yTicks.map(t => (
          <g key={t.y}>
            <line x1={pad.left} y1={t.y} x2={pad.left + cW} y2={t.y}
              stroke={COLOR_BORDER} strokeWidth={0.8} strokeDasharray="4,4" />
            <text x={pad.left - 4} y={t.y} textAnchor="end"
              fontSize={9} fill="#7A7065" dominantBaseline="middle">
              {t.label}
            </text>
          </g>
        ))}

        {/* Fill */}
        <path d={fillD} fill={COLOR_GREEN} fillOpacity={0.12} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={COLOR_GREEN} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* X labels */}
        {pts.map((p, i) => {
          const show = data.length <= 5 || i === 0 || i === data.length - 1
            || i % Math.ceil(data.length / 4) === 0;
          const dateStr = (p.date || '').split('-').reverse().slice(0, 2).join('/');
          return show ? (
            <text key={i} x={p.x} y={height - 4}
              textAnchor="middle" fontSize={9} fill="#7A7065">
              {dateStr}
            </text>
          ) : null;
        })}

        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5}
              fill={COLOR_PRIMARY} stroke={COLOR_ACCENT} strokeWidth={2} />
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

export const GraficaResumen = () => null; // Deprecado — usar SvgRadar en PlayerAnalyticsModal
