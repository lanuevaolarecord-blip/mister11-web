/**
 * src/components/canonical/MomentumSVG.js
 * Míster11 — Renderizador Canónico de Curva de Momentum y Tramos 15' (App + PDF)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - Dominio Propio: #4CAF7D
 *  - Dominio Rival: #EF4444
 *  - Hitos y Descanso: #D4A843
 *  - Tipografía: #F2EDE4
 */

import React from 'react';
import { CHART_THEME } from '../../config/chartTheme.js';

export function renderMomentumSvgString({
  events = [],
  matchDuration = 90,
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  isDark = true,
  width = 660,
  height = 190
}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();
  const rawEvents = Array.isArray(events) ? events.filter(Boolean) : [];
  const totalMin = Math.max(90, Number(matchDuration) || 90);

  const padLeft = 24;
  const padRight = 20;
  const padTop = 38;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const zeroY = padTop + plotH / 2;

  // Calcular curva de momentum por intervalos de 5 minutos
  const points = [];
  const milestones = [];
  let currentMomentum = 0; // -10 (Rival domina) a +10 (Propio domina)

  for (let m = 0; m <= totalMin; m += 5) {
    const minEvents = rawEvents.filter(e => {
      const em = Number(e.minute ?? e.minuto ?? 0);
      return m === 0 ? em === 0 : (em > m - 5 && em <= m);
    });

    let homeScore = 0;
    let awayScore = 0;

    minEvents.forEach(e => {
      const isHome = e.team === 'own' || e.team === 'home' || String(e.type || '').includes('own') || e.type === 'gol_local' || (!e.team && !String(e.type || '').includes('rival'));
      const t = String(e.type || '').toLowerCase();
      let weight = 0;

      if (t.includes('gol') || t.includes('goal')) {
        weight = 3.5;
        milestones.push({ minute: e.minute || m, isHome, icon: '⚽', label: isHome ? 'GOL' : 'GOL RIVAL', color: isHome ? theme.gold : theme.teamAway });
      } else if (t.includes('shot_on') || t.includes('puerta')) {
        weight = 1.8;
      } else if (t.includes('shot') || t.includes('tiro')) {
        weight = 0.9;
      } else if (t.includes('corner')) {
        weight = 0.8;
      } else if (t.includes('card_red') || t.includes('roja')) {
        weight = -2.5;
        milestones.push({ minute: e.minute || m, isHome, icon: '🟥', label: 'ROJA', color: theme.teamAway });
      } else if (t.includes('card_yellow') || t.includes('amarilla')) {
        weight = -0.6;
        milestones.push({ minute: e.minute || m, isHome, icon: '🟨', label: 'AMARILLA', color: theme.gold });
      } else if (t.includes('recovery') || t.includes('duel_won')) {
        weight = 0.5;
      }

      if (isHome) homeScore += weight;
      else awayScore += weight;
    });

    // Inercia suave del momentum
    currentMomentum = currentMomentum * 0.45 + (homeScore - awayScore) * 1.6;
    currentMomentum = Math.max(-8, Math.min(8, currentMomentum));

    const px = padLeft + (m / totalMin) * plotW;
    const py = zeroY - (currentMomentum / 8) * (plotH * 0.44);
    points.push({ m, x: px, y: py, momentum: currentMomentum });
  }

  // Generar path SVG suavizado para el área y la línea
  const linePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaHomeD = `M ${padLeft} ${zeroY} ` + points.map(p => `L ${p.x.toFixed(1)} ${Math.min(zeroY, p.y).toFixed(1)}`).join(' ') + ` L ${padLeft + plotW} ${zeroY} Z`;
  const areaAwayD = `M ${padLeft} ${zeroY} ` + points.map(p => `L ${p.x.toFixed(1)} ${Math.max(zeroY, p.y).toFixed(1)}`).join(' ') + ` L ${padLeft + plotW} ${zeroY} Z`;

  // Segmentos de 15 minutos (0, 15, 30, 45, 60, 75, 90)
  const segments = [15, 30, 45, 60, 75, 90];
  const segmentLines = segments.map(min => {
    const sx = padLeft + (min / totalMin) * plotW;
    const isHalfTime = min === 45;
    return `
      <line x1="${sx.toFixed(1)}" y1="${padTop}" x2="${sx.toFixed(1)}" y2="${padTop + plotH}" stroke="${isHalfTime ? 'rgba(212,168,67,0.55)' : 'rgba(242,237,228,0.1)'}" stroke-width="${isHalfTime ? '1.5' : '0.8'}" stroke-dasharray="${isHalfTime ? 'none' : '2 2'}" />
      <text x="${sx.toFixed(1)}" y="${height - 8}" fill="${isHalfTime ? theme.gold : theme.textMuted}" font-size="8" font-weight="${isHalfTime ? '800' : '600'}" font-family="Arial, sans-serif" text-anchor="middle">${min}'</text>
    `;
  }).join('');

  // Iconos de Hitos
  const milestonesSvg = milestones.slice(0, 12).map((ms, idx) => {
    const mx = padLeft + (Math.min(totalMin, Math.max(0, ms.minute)) / totalMin) * plotW;
    const my = ms.isHome ? padTop + 8 : padTop + plotH - 8;
    return `
      <g key="milestone-${idx}" transform="translate(${mx.toFixed(1)}, ${my.toFixed(1)})">
        <circle cx="0" cy="0" r="6" fill="${theme.bgCard}" stroke="${ms.color}" stroke-width="1.2" />
        <text x="0" y="3" text-anchor="middle" font-size="7">${ms.icon}</text>
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo Institucional Tierra y Campo -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

  <!-- Fila 1: Cabecera y Nombres -->
  <text x="16" y="22" fill="${theme.gold}" font-size="11.5" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '📈 MATCH MOMENTUM &amp; 15-MINUTE SEGMENTS' : '📈 MOMENTUM DEL PARTIDO Y TRAMOS DE 15 MINUTOS'}
  </text>

  <!-- Indicadores de Dominio alineados a la derecha -->
  <g transform="translate(${width - 220}, 12)">
    <rect x="0" y="0" width="8" height="8" fill="${theme.teamHome}" rx="2" />
    <text x="12" y="7.5" fill="${theme.teamHome}" font-size="8.5" font-weight="700" font-family="Arial, sans-serif">▲ ${safeHome.slice(0, 12)}</text>

    <rect x="110" y="0" width="8" height="8" fill="${theme.teamAway}" rx="2" />
    <text x="122" y="7.5" fill="${theme.teamAway}" font-size="8.5" font-weight="700" font-family="Arial, sans-serif">▼ ${safeAway.slice(0, 12)}</text>
  </g>

  <!-- Rejilla de Fondo y Tramos -->
  <g id="grid-segments">
    ${segmentLines}
    <!-- Línea Cero de Equilibrio -->
    <line x1="${padLeft}" y1="${zeroY}" x2="${padLeft + plotW}" y2="${zeroY}" stroke="rgba(242,237,228,0.25)" stroke-width="1" />
  </g>

  <!-- Áreas Rellenas de Dominio -->
  <path d="${areaHomeD}" fill="rgba(76, 175, 125, 0.22)" />
  <path d="${areaAwayD}" fill="rgba(239, 68, 68, 0.22)" />

  <!-- Línea Principal de Curva de Momentum -->
  <path d="${linePathD}" fill="none" stroke="${theme.gold}" stroke-width="2.2" stroke-linejoin="round" />

  <!-- Puntos Clave de Muestreo -->
  ${points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" fill="${theme.gold}" />`).join('')}

  <!-- Hitos de Eventos -->
  <g id="milestones">
    ${milestonesSvg}
  </g>
</svg>
  `.trim();
}

export const MomentumSVG = (props) => {
  const svgString = renderMomentumSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper momentum-svg-wrapper',
    style: { width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default MomentumSVG;
