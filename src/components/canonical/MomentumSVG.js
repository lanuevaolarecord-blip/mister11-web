/**
 * src/components/canonical/MomentumSVG.jsx
 * Míster11 — Renderizador Canónico de Curva de Momentum y Tramos 15' (App + PDF)
 *
 * Características:
 *  - Curva temporal con línea base de equilibrio.
 *  - Áreas rellenas de dominancia propia (verde esmeralda) y rival (rojo carmesí).
 *  - División reglamentaria por bloques de 15 minutos (0-15', 15-30', 30-45' | 45-60', 60-75', 75-90').
 *  - Hitos del partido con iconos visuales: Goles (⚽), Tarjetas (🟨🟥), Remates y Cambios.
 */

import React from 'react';

export function renderMomentumSvgString({
  events = [],
  matchDuration = 90,
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 660,
  height = 180
}) {
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();
  const rawEvents = Array.isArray(events) ? events.filter(Boolean) : [];
  const totalMin = Math.max(90, Number(matchDuration) || 90);

  const padLeft = 24;
  const padRight = 20;
  const padTop = 32;
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
        milestones.push({ minute: e.minute || m, isHome, icon: '⚽', label: isHome ? 'GOL' : 'GOL RIVAL', color: isHome ? '#10B981' : '#EF4444' });
      } else if (t.includes('shot_on') || t.includes('puerta')) {
        weight = 1.8;
      } else if (t.includes('shot') || t.includes('tiro')) {
        weight = 0.9;
      } else if (t.includes('corner')) {
        weight = 0.8;
      } else if (t.includes('card_red') || t.includes('roja')) {
        weight = -2.5;
        milestones.push({ minute: e.minute || m, isHome, icon: '🟥', label: 'ROJA', color: '#EF4444' });
      } else if (t.includes('card_yellow') || t.includes('amarilla')) {
        weight = -0.6;
        milestones.push({ minute: e.minute || m, isHome, icon: '🟨', label: 'AMARILLA', color: '#F59E0B' });
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
      <line x1="${sx.toFixed(1)}" y1="${padTop}" x2="${sx.toFixed(1)}" y2="${padTop + plotH}" stroke="${isHalfTime ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.08)'}" stroke-width="${isHalfTime ? '1.5' : '0.8'}" stroke-dasharray="${isHalfTime ? 'none' : '2 2'}" />
      <text x="${sx.toFixed(1)}" y="${height - 10}" fill="${isHalfTime ? '#D4A843' : '#64748B'}" font-size="7.5" font-weight="${isHalfTime ? '800' : '600'}" font-family="Arial, sans-serif" text-anchor="middle">${min}'</text>
    `;
  }).join('');

  // Iconos de Hitos
  const milestonesSvg = milestones.slice(0, 12).map((ms, idx) => {
    const mx = padLeft + (Math.min(totalMin, Math.max(0, ms.minute)) / totalMin) * plotW;
    const my = ms.isHome ? padTop + 8 : padTop + plotH - 8;
    return `
      <g key="milestone-${idx}" transform="translate(${mx.toFixed(1)}, ${my.toFixed(1)})">
        <circle cx="0" cy="0" r="6" fill="#0F172A" stroke="${ms.color}" stroke-width="1.2" />
        <text x="0" y="3" text-anchor="middle" font-size="7">${ms.icon}</text>
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0F172A" rx="8" />

  <!-- Cabecera -->
  <text x="14" y="20" fill="#F8FAFC" font-size="11" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '📈 MATCH MOMENTUM & 15-MINUTE SEGMENTS' : '📈 MOMENTUM DEL PARTIDO & TRAMOS DE 15 MINUTOS'}
  </text>

  <!-- Indicadores de Dominio -->
  <text x="${width - 160}" y="19" fill="#10B981" font-size="8" font-weight="700" font-family="Arial, sans-serif">▲ ${safeHome}</text>
  <text x="${width - 70}" y="19" fill="#EF4444" font-size="8" font-weight="700" font-family="Arial, sans-serif">▼ ${safeAway}</text>

  <!-- Rejilla de Fondo y Tramos -->
  <g id="grid-segments">
    ${segmentLines}
    <!-- Línea Cero de Equilibrio -->
    <line x1="${padLeft}" y1="${zeroY}" x2="${padLeft + plotW}" y2="${zeroY}" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
  </g>

  <!-- Áreas Rellenas de Dominio -->
  <path d="${areaHomeD}" fill="rgba(16, 185, 129, 0.18)" />
  <path d="${areaAwayD}" fill="rgba(239, 68, 68, 0.18)" />

  <!-- Línea Principal de Curva de Momentum -->
  <path d="${linePathD}" fill="none" stroke="#D4A843" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />

  <!-- Puntos Clave en la Curva -->
  ${points.filter((_, i) => i % 2 === 0).map(p => `
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="#FFFFFF" stroke="#D4A843" stroke-width="1" />
  `).join('')}

  <!-- Hitos Relevantes (Goles, Tarjetas) -->
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
