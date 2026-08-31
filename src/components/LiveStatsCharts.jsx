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
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeContext?.darkMode ?? true);

  const total = value1 + value2;
  const pct1 = total > 0 ? Math.round((value1 / total) * 100) : 0;

  const size = 110;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct1 / 100) * circumference;

  // Colores de alto contraste según tema
  const bgTrack = darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1';
  const textColor = darkMode ? '#FFFFFF' : '#0F172A';
  const subTextColor = darkMode ? '#E2E8F0' : '#334155';

  // Proteger contra colores transparentes o blancos sobre fondo blanco en modo claro
  const isColor2Faint = !color2 || String(color2).includes('rgba(255,255,255') || String(color2).includes('transparent');
  const safeColor2 = isColor2Faint ? (darkMode ? 'rgba(212, 168, 67, 0.35)' : '#94A3B8') : color2;
  const legendColor2 = isColor2Faint ? (darkMode ? '#CBD5E1' : '#475569') : color2;

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
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', overflow: 'visible' }}>
          {/* Pista base neutra siempre visible */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={bgTrack}
            strokeWidth={strokeWidth}
            style={{
              stroke: bgTrack,
              strokeWidth: `${strokeWidth}px`,
              fill: 'none'
            }}
          />
          {/* Pista secundaria si total > 0 */}
          {total > 0 && safeColor2 !== bgTrack && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={safeColor2}
              strokeWidth={strokeWidth}
              style={{
                stroke: safeColor2,
                strokeWidth: `${strokeWidth}px`,
                fill: 'none'
              }}
            />
          )}
          {/* Arco primario (color1) */}
          {total > 0 && pct1 > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color1}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              style={{
                stroke: color1,
                strokeWidth: `${strokeWidth}px`,
                strokeDasharray: `${circumference} ${circumference}`,
                strokeDashoffset: `${offset}`,
                fill: 'none'
              }}
            />
          )}

          {/* Porcentaje en el centro como elemento <text> del SVG */}
          <text
            x={center}
            y={center}
            dy="0.35em"
            textAnchor="middle"
            fill={textColor}
            fontSize="20"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, Roboto, sans-serif"
            style={{ fill: textColor, fontSize: '20px', fontWeight: '900' }}
          >
            {total > 0 ? `${pct1}%` : '—'}
          </text>
        </svg>
      </div>

      {/* Título de métrica */}
      <span style={{ fontSize: '12.5px', fontWeight: 900, color: textColor, textAlign: 'center' }}>
        {title}
      </span>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: subTextColor, fontWeight: 800 }}>
        {total > 0 ? (
          <>
            <span style={{ color: color1 }}>{value1} {label1}</span>
            <span style={{ color: subTextColor }}>/</span>
            <span style={{ color: legendColor2 }}>{value2} {label2}</span>
          </>
        ) : (
          <span style={{ color: subTextColor, fontStyle: 'italic' }}>Sin datos</span>
        )}
      </div>
    </div>
  );
};

// ── 2. Comparativa Propio vs Rival (Barras Horizontales) ──────────────────────
export const SvgComparisonBars = ({ events, darkMode: darkModeProp }) => {
  const themeContext = useTheme();
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeContext?.darkMode ?? true);

  const labelColor = darkMode ? '#FFFFFF' : '#0F172A';
  const subLabelColor = darkMode ? '#CBD5E1' : '#64748B';

  const countByType = (type) => events.filter((e) => e.type === type).length;

  const metrics = [
    { label: 'Tiros a puerta', own: countByType('shot_on_target_own'), rival: countByType('shot_on_target_rival') },
    { label: 'Tiros fuera', own: countByType('shot_off_target_own'), rival: countByType('shot_off_target_rival') },
    { label: 'Duelos', own: countByType('duel_won'), rival: countByType('duel_lost') },
    { label: 'Faltas', own: countByType('foul_against'), rival: countByType('foul_favor') },
    { label: 'Tarjetas amarillas', own: countByType('card_yellow_own'), rival: countByType('card_yellow_rival') },
    { label: 'Tarjetas rojas', own: countByType('card_red_own'), rival: countByType('card_red_rival') },
    { label: 'Córners', own: countByType('corner_favor'), rival: countByType('corner_against') },
    { label: 'Fueras de juego', own: countByType('offside_own'), rival: countByType('offside_rival') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {metrics.map((m) => {
        const total = m.own + m.rival;
        const ownPct = total > 0 ? Math.round((m.own / total) * 100) : 50;
        const rivalPct = total > 0 ? 100 - ownPct : 50;

        return (
          <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900 }}>
              <span style={{ color: '#4CAF7D' }}>{m.own}</span>
              <span style={{ color: labelColor }}>{m.label}</span>
              <span style={{ color: '#EF4444' }}>{m.rival}</span>
            </div>
            <div style={{
              display: 'flex',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
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
export const HalfBreakdown = ({ events = [], darkMode: darkModeProp }) => {
  const themeContext = useTheme();
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeContext?.darkMode ?? true);

  const labelColor = darkMode ? '#FFFFFF' : '#0F172A';
  const subLabelColor = darkMode ? '#CBD5E1' : '#334155';
  const cardBg = darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const borderColor = darkMode ? 'rgba(255,255,255,0.12)' : '#CBD5E1';

  // Lógica robusta de detección de mitad:
  // 1) half explícito como número o string "1"/"2"
  // 2) Fallback: minuto > 45 => 2T, ≤ 45 => 1T
  const isT2 = (e) => {
    if (!e) return false;
    // Evaluar half como número independientemente del tipo almacenado
    if (e.half !== undefined && e.half !== null && e.half !== '') {
      const h = Number(e.half);
      if (!isNaN(h) && h > 0) return h === 2;
    }
    // Fallback por minuto
    const m = Number(e.minute || e.minuto || e.time || 0);
    return m > 45;
  };
  const isT1 = (e) => {
    if (!e) return false;
    if (e.half !== undefined && e.half !== null && e.half !== '') {
      const h = Number(e.half);
      if (!isNaN(h) && h > 0) return h === 1;
    }
    const m = Number(e.minute || e.minuto || e.time || 0);
    return m <= 45;
  };

  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
  const t1Events = safeEvents.filter(isT1);
  const t2Events = safeEvents.filter(isT2);
  const totalEvents = t1Events.length + t2Events.length;

  const getCount = (list, types) => list.filter((e) => types.includes(e.type)).length;

  const items = [
    {
      label: 'Eventos totales',
      icon: '📊',
      t1: t1Events.length,
      t2: t2Events.length,
    },
    {
      label: 'Remates propios',
      icon: '🎯',
      t1: getCount(t1Events, ['shot_on_target_own', 'shot_off_target_own', 'gol_local']),
      t2: getCount(t2Events, ['shot_on_target_own', 'shot_off_target_own', 'gol_local']),
    },
    {
      label: 'Recuperaciones',
      icon: '🔄',
      t1: getCount(t1Events, ['recovery']),
      t2: getCount(t2Events, ['recovery']),
    },
    {
      label: 'Goles propios',
      icon: '⚽',
      t1: getCount(t1Events, ['gol_local', 'goal_own']),
      t2: getCount(t2Events, ['gol_local', 'goal_own']),
    },
    {
      label: 'Faltas cometidas',
      icon: '⚡',
      t1: getCount(t1Events, ['foul_against']),
      t2: getCount(t2Events, ['foul_against']),
    },
    {
      label: 'Tarjetas',
      icon: '🟨',
      t1: getCount(t1Events, ['amarilla', 'roja', 'card_yellow_own', 'card_red_own']),
      t2: getCount(t2Events, ['amarilla', 'roja', 'card_yellow_own', 'card_red_own']),
    },
    {
      label: 'Córners a favor',
      icon: '🚩',
      t1: getCount(t1Events, ['corner_favor']),
      t2: getCount(t2Events, ['corner_favor']),
    },
    {
      label: 'Duelos ganados',
      icon: '✊',
      t1: getCount(t1Events, ['duel_won']),
      t2: getCount(t2Events, ['duel_won']),
    },
  ];

  if (totalEvents === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: subLabelColor, fontSize: '13px', fontStyle: 'italic' }}>
        Sin eventos registrados para el desglose por mitades.
      </div>
    );
  }

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
          <span style={{ fontSize: '11px', fontWeight: 900, color: labelColor }}>
            {item.icon} {item.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 900 }}>
            <span style={{ color: '#D4A843' }}>1T: {item.t1}</span>
            <span style={{ color: subLabelColor }}>/</span>
            <span style={{ color: '#4CAF7D' }}>2T: {item.t2}</span>
          </div>
          {/* Barra mini de progreso por mitad */}
          {(item.t1 + item.t2) > 0 && (
            <div style={{ display: 'flex', height: '3px', borderRadius: '2px', overflow: 'hidden', background: borderColor, marginTop: '2px' }}>
              <div style={{ width: `${Math.round((item.t1 / (item.t1 + item.t2)) * 100)}%`, background: '#D4A843', transition: 'width 0.4s ease' }} />
              <div style={{ flex: 1, background: '#4CAF7D' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
