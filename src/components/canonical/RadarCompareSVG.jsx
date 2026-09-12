/**
 * src/components/canonical/RadarCompareSVG.jsx
 * Míster11 — Renderizador Canónico de Radar Comparativo (6 Ejes) (App + PDF)
 *
 * Normaliza las 6 dimensiones tácticas de ambos equipos:
 *  1. Tiros a puerta / Shots on target
 *  2. Duelos ganados / Duels won
 *  3. Control de faltas / Low infractions
 *  4. Disciplina y tarjetas / Disciplinary balance
 *  5. Saques de esquina / Corners
 *  6. Producción ofensiva xG / Expected Goals
 */

import React from 'react';

export function renderRadarCompareSvgString({
  events = [],
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 540,
  height = 290
}) {
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();
  const evts = Array.isArray(events) ? events.filter(Boolean) : [];

  // Calcular métricas derivadas si no se pasan en homeStats/awayStats
  const count = (types) => {
    const arr = Array.isArray(types) ? types : [types];
    return evts.filter(e => e && arr.includes(e.type)).length;
  };

  const ownShotsOn = homeStats.tirosPuerta ?? count(['shot_on_target_own', 'shot_on_target', 'gol_local', 'gol']);
  const rivalShotsOn = awayStats.tirosPuerta ?? count(['shot_on_target_rival', 'gol_rival']);

  const ownDuels = homeStats.duelosGanados ?? count(['duel_won', 'duelo_ganado', 'recovery', 'recuperacion']);
  const rivalDuels = awayStats.duelosGanados ?? count(['duel_lost', 'duelo_perdido']);

  const ownFouls = homeStats.faltas ?? count(['foul_against', 'falta_contra', 'foul', 'falta']);
  const rivalFouls = awayStats.faltas ?? count(['foul_favor', 'falta_favor']);

  const ownCards = (homeStats.amarillas ?? count(['card_yellow_own', 'card_own', 'amarilla'])) + (count(['card_red_own', 'roja']) * 2);
  const rivalCards = (awayStats.amarillas ?? count(['card_yellow_rival', 'card_rival'])) + (count(['card_red_rival']) * 2);

  const ownCorners = homeStats.corners ?? count(['corner_favor', 'corner_own']);
  const rivalCorners = awayStats.corners ?? count(['corner_against', 'corner_rival']);

  const ownXg = Number(homeStats.xg ?? 1.2);
  const rivalXg = Number(awayStats.xg ?? 0.8);

  // Normalización a escala 0-100
  const axes = [
    {
      label: isEn ? 'Shots on Target' : 'Tiros a Puerta',
      homeVal: Math.min(100, Math.max(10, Math.round((ownShotsOn / 8) * 100))),
      awayVal: Math.min(100, Math.max(10, Math.round((rivalShotsOn / 8) * 100))),
      homeRaw: ownShotsOn,
      awayRaw: rivalShotsOn
    },
    {
      label: isEn ? 'Duels / Possession' : 'Duelos / Posesión',
      homeVal: Math.min(100, Math.max(10, Math.round((ownDuels / 12) * 100))),
      awayVal: Math.min(100, Math.max(10, Math.round((rivalDuels / 12) * 100))),
      homeRaw: ownDuels,
      awayRaw: rivalDuels
    },
    {
      label: isEn ? 'Foul Control' : 'Control Faltas',
      homeVal: Math.min(100, Math.max(10, 100 - Math.min(90, ownFouls * 7))),
      awayVal: Math.min(100, Math.max(10, 100 - Math.min(90, rivalFouls * 7))),
      homeRaw: ownFouls,
      awayRaw: rivalFouls
    },
    {
      label: isEn ? 'Discipline' : 'Disciplina',
      homeVal: Math.min(100, Math.max(10, 100 - Math.min(90, ownCards * 20))),
      awayVal: Math.min(100, Math.max(10, 100 - Math.min(90, rivalCards * 20))),
      homeRaw: ownCards,
      awayRaw: rivalCards
    },
    {
      label: isEn ? 'Corners (SP)' : 'Córners (ABP)',
      homeVal: Math.min(100, Math.max(10, Math.round((ownCorners / 8) * 100))),
      awayVal: Math.min(100, Math.max(10, Math.round((rivalCorners / 8) * 100))),
      homeRaw: ownCorners,
      awayRaw: rivalCorners
    },
    {
      label: isEn ? 'xG Production' : 'Producción xG',
      homeVal: Math.min(100, Math.max(10, Math.round((ownXg / 2.5) * 100))),
      awayVal: Math.min(100, Math.max(10, Math.round((rivalXg / 2.5) * 100))),
      homeRaw: ownXg.toFixed(1),
      awayRaw: rivalXg.toFixed(1)
    }
  ];

  const cX = width / 2;
  const cY = height / 2 + 10;
  const radius = Math.min(95, height / 2 - 35);
  const totalAxes = axes.length;

  // Círculos/polígonos concéntricos de referencia (20, 40, 60, 80, 100)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = levels.map(lvl => {
    const pts = axes.map((_, i) => {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const x = cX + Math.cos(angle) * radius * lvl;
      const y = cY + Math.sin(angle) * radius * lvl;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,${lvl === 1.0 ? '0.25' : '0.08'})" stroke-width="${lvl === 1.0 ? '1' : '0.6'}" />`;
  }).join('');

  // Radios de cada eje y etiquetas de texto
  const spokes = axes.map((a, i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const x2 = cX + Math.cos(angle) * radius;
    const y2 = cY + Math.sin(angle) * radius;

    // Etiqueta en el extremo
    const labelDist = radius + 18;
    const lx = cX + Math.cos(angle) * labelDist;
    const ly = cY + Math.sin(angle) * labelDist + 3;

    return `
      <line x1="${cX}" y1="${cY}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" />
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#CBD5E1" font-size="7.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">
        ${a.label}
      </text>
    `;
  }).join('');

  // Polígono Equipo Local
  const homePoints = axes.map((a, i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const r = (a.homeVal / 100) * radius;
    const x = cX + Math.cos(angle) * r;
    const y = cY + Math.sin(angle) * r;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Polígono Equipo Visitante
  const awayPoints = axes.map((a, i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const r = (a.awayVal / 100) * radius;
    const x = cX + Math.cos(angle) * r;
    const y = cY + Math.sin(angle) * r;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0F172A" rx="8" />

  <!-- Título y Leyenda -->
  <text x="14" y="20" fill="#F8FAFC" font-size="11" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '🕸️ NORMALIZED COMPARATIVE RADAR (6 AXES)' : '🕸️ RADAR COMPARATIVO PROPIO VS RIVAL (6 EJES)'}
  </text>

  <!-- Leyenda Equipos -->
  <g transform="translate(${width - 240}, 10)">
    <rect x="0" y="0" width="12" height="12" fill="#10B981" rx="2" />
    <text x="18" y="9" fill="#10B981" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">${safeHome.slice(0, 14)}</text>

    <rect x="120" y="0" width="12" height="12" fill="#EF4444" rx="2" />
    <text x="138" y="9" fill="#EF4444" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">${safeAway.slice(0, 14)}</text>
  </g>

  <!-- Telaraña de fondo -->
  <g id="radar-grid">
    ${gridPolygons}
    ${spokes}
  </g>

  <!-- Polígono Rival (Rojo) -->
  <polygon points="${awayPoints}" fill="rgba(239, 68, 68, 0.25)" stroke="#EF4444" stroke-width="1.6" />

  <!-- Polígono Propio (Verde Esmeralda) -->
  <polygon points="${homePoints}" fill="rgba(16, 185, 129, 0.35)" stroke="#10B981" stroke-width="2" />

  <!-- Vértices con puntos resaltados -->
  ${axes.map((a, i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const hr = (a.homeVal / 100) * radius;
    const hx = cX + Math.cos(angle) * hr;
    const hy = cY + Math.sin(angle) * hy;
    return `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="3" fill="#10B981" stroke="#FFFFFF" stroke-width="0.8" />`;
  }).join('')}
</svg>
  `.trim();
}

export const RadarCompareSVG = (props) => {
  const svgString = renderRadarCompareSvgString(props);
  return (
    <div
      className="canonical-svg-wrapper radar-compare-svg-wrapper"
      style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};

export default RadarCompareSVG;
