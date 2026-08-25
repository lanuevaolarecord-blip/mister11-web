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

  // Caso de 1 sola evaluación: renderizar gráfico con punto focal y línea de referencia
  if (data.length === 1) {
    const entry = data[0];
    const rawDate = String(entry.displayDate || entry.date || '');
    let displayDate = rawDate;
    if (rawDate.includes('-')) {
      const parts = rawDate.split('T')[0].split('-');
      if (parts.length >= 3) displayDate = `${parts[2]}/${parts[1]}`;
    }

    return (
      <div style={{
        width: '100%',
        background: bgCard,
        border: `1px solid ${borderCard}`,
        borderRadius: 12,
        padding: '16px 12px 12px',
        boxSizing: 'border-box'
      }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          style={{ display: 'block' }}
        >
          {/* Ejes y rejilla base */}
          <line x1={40} y1={height / 2} x2={width - 20} y2={height / 2}
            stroke={gridLineColor} strokeWidth={1} strokeDasharray="3,3" />
          
          <line x1={40} y1={height - 35} x2={width - 20} y2={height - 35}
            stroke={gridLineColor} strokeWidth={1} />

          {/* Línea horizontal de referencia */}
          <line x1={width / 2 - 40} y1={height / 2} x2={width / 2 + 40} y2={height / 2}
            stroke={COLOR_GREEN} strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />

          {/* Halo y Punto central */}
          <circle cx={width / 2} cy={height / 2} r={14} fill={COLOR_GREEN} fillOpacity={0.15} />
          <circle cx={width / 2} cy={height / 2} r={6} fill={COLOR_GREEN} stroke={darkMode ? '#111B21' : '#FFFFFF'} strokeWidth={2.5} />

          {/* Valor superior */}
          <text x={width / 2} y={height / 2 - 18} textAnchor="middle" fontSize={13} fontWeight="900" fill={COLOR_GREEN}>
            {entry.val} {isTime ? 's' : 'pts'}
          </text>

          {/* Fecha en el eje X */}
          <text x={width / 2} y={height - 18} textAnchor="middle" fontSize={10.5} fontWeight="700" fill={textMuted}>
            {displayDate}
          </text>

          <text x={width / 2} y={height - 4} textAnchor="middle" fontSize={9.5} fontWeight="600" fill={COLOR_ACCENT}>
            Evaluación inicial registrada
          </text>
        </svg>
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

  const pts = data.map((d, i) => ({ 
    x: xOf(i), 
    y: yOf(Number(d.val) || 0), 
    val: d.val, 
    date: d.displayDate || d.date 
  }));
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
          
          let dateStr = String(p.date || '');
          if (dateStr.includes('-')) {
            const parts = dateStr.split('T')[0].split('-');
            if (parts.length >= 3) {
              dateStr = `${parts[2]}/${parts[1]}`;
            }
          }

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
