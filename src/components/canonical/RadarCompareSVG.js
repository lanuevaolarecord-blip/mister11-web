/**
 * src/components/canonical/RadarCompareSVG.js
 * Míster11 — Renderizador Canónico de Radar Comparativo (6 Ejes) (App + PDF)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - Equipo Local: #4CAF7D (#10B981)
 *  - Equipo Rival: #EF4444
 *  - Títulos y Acentos: #D4A843
 *  - Tipografía: #F2EDE4
 */

import React from 'react';
import { computeRadarAxes } from '../../config/radarConfig.js';
import { CHART_THEME } from '../../config/chartTheme.js';

export function renderRadarCompareSvgString({
  events = [],
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  isDark = true,
  width = 540,
  height = 310
} = {}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  // Cálculo resiliente y puro de los 6 ejes canónicos mediante radarConfig.js
  const axes = computeRadarAxes({
    homeStats,
    awayStats,
    events,
    isEn
  });

  const cX = width / 2;
  const cY = height / 2 + 20;
  const radius = Math.min(100, height / 2 - 45);
  const totalAxes = axes.length || 6;

  // Círculos/polígonos concéntricos de referencia (20, 40, 60, 80, 100)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = levels.map(lvl => {
    const pts = axes.map((_, i) => {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const x = cX + Math.cos(angle) * radius * lvl;
      const y = cY + Math.sin(angle) * radius * lvl;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${lvl === 1.0 ? 'rgba(212, 168, 67, 0.35)' : 'rgba(76, 175, 125, 0.18)'}" stroke-width="${lvl === 1.0 ? '1' : '0.6'}" />`;
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
      <line x1="${cX}" y1="${cY}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(242, 237, 228, 0.2)" stroke-width="0.8" />
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${theme.textPrimary}" font-size="9" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">
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
  <!-- Fondo Institucional Tierra y Campo -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

  <!-- Fila 1: Título Institucional (Sin colisiones) -->
  <text x="16" y="22" fill="${theme.gold}" font-size="11.5" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '🕸️ COMPARATIVE RADAR (6 CANONICAL AXES)' : '🕸️ RADAR COMPARATIVO (6 EJES CANÓNICOS)'}
  </text>

  <!-- Fila 2: Leyenda Dedicada (Debajo del título para evitar solapes) -->
  <g transform="translate(16, 32)">
    <rect x="0" y="0" width="10" height="10" fill="${theme.teamHome}" rx="2" />
    <text x="15" y="8.5" fill="${theme.teamHome}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">${safeHome.slice(0, 20)}</text>

    <rect x="160" y="0" width="10" height="10" fill="${theme.teamAway}" rx="2" />
    <text x="175" y="8.5" fill="${theme.teamAway}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">${safeAway.slice(0, 20)}</text>
  </g>

  <!-- Telaraña de fondo -->
  <g id="radar-grid">
    ${gridPolygons}
    ${spokes}
  </g>

  <!-- Polígono Rival (Rojo deportivo) -->
  <polygon points="${awayPoints}" fill="rgba(239, 68, 68, 0.25)" stroke="${theme.teamAway}" stroke-width="1.8" />

  <!-- Polígono Propio (Verde campo) -->
  <polygon points="${homePoints}" fill="rgba(76, 175, 125, 0.35)" stroke="${theme.teamHome}" stroke-width="2.2" />

  <!-- Vértices con puntos resaltados (Local - Verde) -->
  ${axes.map((a, i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const hr = (a.homeVal / 100) * radius;
    const hx = cX + Math.cos(angle) * hr;
    const hy = cY + Math.sin(angle) * hr;
    return `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="3" fill="${theme.teamHome}" stroke="#FFFFFF" stroke-width="0.8" />`;
  }).join('')}

  <!-- Vértices con puntos resaltados (Rival - Rojo) -->
  ${axes.map((a, i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const ar = (a.awayVal / 100) * radius;
    const ax = cX + Math.cos(angle) * ar;
    const ay = cY + Math.sin(angle) * ar;
    return `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.5" fill="${theme.teamAway}" stroke="#FFFFFF" stroke-width="0.6" />`;
  }).join('')}
</svg>
  `.trim();
}

export const RadarCompareSVG = (props) => {
  const svgString = renderRadarCompareSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper radar-compare-svg-wrapper',
    style: { width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default RadarCompareSVG;
