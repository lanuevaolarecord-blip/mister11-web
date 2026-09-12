/**
 * src/components/canonical/ShotMapSVG.js
 * Míster11 — Renderizador Canónico de Mapa de Tiros Profesional 105:68 (App + PDF)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Césped Táctico: #152C22
 *  - Goles: #D4A843 (halo blanco + sombra)
 *  - A puerta: #4CAF7D
 *  - Fuera / Bloqueado: #94A3B8 (gris neutro)
 *  - Tiros Rivales: #EF4444 (espejado a la portería que ataca)
 *  - Proporción Reglamentaria 105:68 (viewBox 0 0 1050 680, 1.544:1)
 *  - Cero números o textos de xG dentro de los puntos
 *  - Jitter determinista con anti-colisión
 */

import React from 'react';
import { CHART_THEME } from '../../config/chartTheme.js';
import { getPitchFrameSvgMarkup } from './pitchMarkup.js';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveShotCollisions(shots, pitchW = 1000, pitchH = 630, pitchX = 25, pitchY = 25) {
  const items = shots.map((s, idx) => {
    const isRival = s.team === 'rival' || String(s.type || '').includes('rival') || s.isRival === true;
    const isGoal = s.outcome === 'goal' || s.isGoal || String(s.type || '').startsWith('gol') || String(s.type || '').startsWith('goal');
    const isOnTarget = isGoal || s.outcome === 'on_target' || String(s.type || '').includes('on_target') || String(s.type || '').includes('puerta');

    const xgVal = Number(s.xG ?? s.xg ?? 0.15);
    // Radio proporcional al xG: 6px (mínimo) a 16px (máximo)
    const radius = Math.max(6, Math.min(16, Math.round(6 + Math.min(1, xgVal) * 10)));

    let normX = typeof s.x === 'number' ? s.x : (isRival ? 18 : 82);
    let normY = typeof s.y === 'number' ? s.y : 50;

    // Rival ataca hacia la portería izquierda (espejado)
    if (isRival && normX > 50) {
      normX = 100 - normX;
    }

    const seed = hashString(String(s.id || idx) + (s.minute || '0'));
    const jitterAngle = (seed % 360) * (Math.PI / 180);
    const jitterDist = ((seed % 10) / 10) * 10;

    let x = pitchX + (Math.max(5, Math.min(95, normX)) / 100) * pitchW + Math.cos(jitterAngle) * jitterDist;
    let y = pitchY + (Math.max(6, Math.min(94, normY)) / 100) * pitchH + Math.sin(jitterAngle) * jitterDist;

    return {
      ...s,
      idx,
      isRival,
      isGoal,
      isOnTarget,
      radius,
      x,
      y
    };
  });

  // Relajación anti-colisión determinista (mínimo = r1 + r2 + 2px)
  for (let iter = 0; iter < 15; iter++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius + 3;

        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dist === 0 ? 1 : dx / dist;
          const ny = dist === 0 ? 0 : dy / dist;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          a.x = Math.max(pitchX + a.radius + 4, Math.min(pitchX + pitchW - a.radius - 4, a.x));
          a.y = Math.max(pitchY + a.radius + 4, Math.min(pitchY + pitchH - a.radius - 4, a.y));
          b.x = Math.max(pitchX + b.radius + 4, Math.min(pitchX + pitchW - b.radius - 4, b.x));
          b.y = Math.max(pitchY + b.radius + 4, Math.min(pitchY + pitchH - b.radius - 4, b.y));

          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  return items;
}

export function renderShotMapSvgString({
  shots = [],
  ownXg = 0,
  rivalXg = 0,
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  isDark = true,
  width = 1050,
  height = 680
}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const safeShots = Array.isArray(shots) ? shots.filter(Boolean) : [];
  const safeOwnXg = Number(ownXg || 0).toFixed(2);
  const safeRivalXg = Number(rivalXg || 0).toFixed(2);
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  // Resolver tiros con jitter determinista y anti-colisión sobre el marco 1050x680
  const resolvedShots = resolveShotCollisions(safeShots, 1000, 630, 25, 25);

  // Conteos para la leyenda
  let countGoals = 0;
  let countOnTarget = 0;
  let countOffTarget = 0;
  let countRival = 0;

  resolvedShots.forEach(s => {
    if (s.isRival) {
      countRival++;
    } else if (s.isGoal) {
      countGoals++;
    } else if (s.isOnTarget) {
      countOnTarget++;
    } else {
      countOffTarget++;
    }
  });

  const shotMarkersSvg = resolvedShots.map((s) => {
    let dotFill = theme.teamHome;
    let dotStroke = '#FFFFFF';

    if (s.isRival) {
      dotFill = theme.teamAway; // #EF4444
    } else if (s.isGoal) {
      dotFill = theme.gold; // #D4A843
    } else if (!s.isOnTarget) {
      dotFill = '#94A3B8'; // Gris neutro
    }

    const comfortRing = s.shooterComfort === 'comodo'
      ? `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(s.radius + 3).toFixed(1)}" fill="none" stroke="${theme.gold}" stroke-width="1.8" stroke-dasharray="3 2" />`
      : '';

    const goalRing = s.isGoal
      ? `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(s.radius + 4.5).toFixed(1)}" fill="none" stroke="${theme.gold}" stroke-width="2.2" />`
      : '';

    return `
      <g key="shot-${s.idx}">
        ${comfortRing}
        ${goalRing}
        <!-- Halo blanco 2px + punto limpio sin texto encima -->
        <circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(s.radius + 1.8).toFixed(1)}" fill="#FFFFFF" opacity="0.9" />
        <circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.radius}" fill="${dotFill}" stroke="${dotStroke}" stroke-width="1.2" />
      </g>
    `;
  }).join('');

  const pitchMarkings = getPitchFrameSvgMarkup({
    isDark,
    showTacticalCorridors: true,
    showGoals: true,
    showStripes: true,
    corridorsLabel: true,
    isEn
  });

  const titleText = isEn
    ? 'TARGET SHOT MAPS &amp; xG-LITE MODEL'
    : 'MAPA DE TIROS Y MODELO xG-LITE';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1050 680" preserveAspectRatio="xMidYMid meet">
  <!-- Fondo y Marcado Canónico 105:68 -->
  <g id="pitch-base">
    ${pitchMarkings}
  </g>

  <!-- Puntos de Remates sin texto encima y con anti-colisión -->
  <g id="shot-markers">
    ${shotMarkersSvg}
  </g>

  <!-- Barra Superior: Título y Badges de xG sin colisión -->
  <rect x="25" y="8" width="1000" height="38" fill="#152C22" rx="7" stroke="rgba(212, 168, 67, 0.6)" stroke-width="1.2" />
  <text x="42" y="32" fill="${theme.gold}" font-size="16" font-weight="900" font-family="Arial, sans-serif" letter-spacing="0.5">
    🎯 ${titleText}
  </text>

  <!-- Badges xG -->
  <rect x="715" y="14" width="150" height="26" fill="rgba(76, 175, 125, 0.35)" stroke="${theme.teamHome}" stroke-width="1.5" rx="5" />
  <text x="790" y="31" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="900" font-family="Arial, sans-serif">
    ${safeHome.slice(0, 11)} xG: <tspan fill="${theme.teamHome}">${safeOwnXg}</tspan>
  </text>

  <rect x="875" y="14" width="145" height="26" fill="rgba(239, 68, 68, 0.35)" stroke="${theme.teamAway}" stroke-width="1.5" rx="5" />
  <text x="947" y="31" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="900" font-family="Arial, sans-serif">
    ${safeAway.slice(0, 11)} xG: <tspan fill="${theme.teamAway}">${safeRivalXg}</tspan>
  </text>

  <!-- Barra Inferior: Leyenda Oficial con Conteos y Cómo se lee -->
  <rect x="25" y="634" width="1000" height="38" fill="rgba(15, 30, 23, 0.98)" rx="7" stroke="rgba(76, 175, 125, 0.5)" stroke-width="1.2" />
  
  <g transform="translate(45, 653)">
    <!-- Gol -->
    <circle cx="0" cy="0" r="7" fill="${theme.gold}" stroke="#FFFFFF" stroke-width="1.5" />
    <text x="14" y="5" fill="#FFFFFF" font-size="12.5" font-weight="800" font-family="Arial, sans-serif">
      ${isEn ? `Goal (${countGoals})` : `Gol (${countGoals})`}
    </text>

    <!-- A puerta -->
    <circle cx="120" cy="0" r="7" fill="${theme.teamHome}" stroke="#FFFFFF" stroke-width="1.5" />
    <text x="134" y="5" fill="#FFFFFF" font-size="12.5" font-weight="800" font-family="Arial, sans-serif">
      ${isEn ? `On Target (${countOnTarget})` : `A puerta (${countOnTarget})`}
    </text>

    <!-- Fuera / Bloqueado -->
    <circle cx="260" cy="0" r="6" fill="#94A3B8" stroke="#FFFFFF" stroke-width="1.2" />
    <text x="274" y="5" fill="#FFFFFF" font-size="12.5" font-weight="800" font-family="Arial, sans-serif">
      ${isEn ? `Off Target (${countOffTarget})` : `Fuera / Bloqueado (${countOffTarget})`}
    </text>

    <!-- Tiro Rival -->
    <circle cx="470" cy="0" r="7" fill="${theme.teamAway}" stroke="#FFFFFF" stroke-width="1.5" />
    <text x="484" y="5" fill="#FFFFFF" font-size="12.5" font-weight="800" font-family="Arial, sans-serif">
      ${isEn ? `Opponent Shot (${countRival})` : `Tiro Rival (${countRival})`}
    </text>

    <!-- Frase explicativa Cómo se lee -->
    <text x="960" y="5" text-anchor="end" fill="#CBD5E1" font-size="11" font-weight="700" font-family="Arial, sans-serif">
      💡 ${isEn ? 'Dot size indicates shot xG probability; rival shots mirrored towards attacking goal.' : 'Radio según valor xG (6-16px); tiros rivales orientados a su portería de ataque.'}
    </text>
  </g>
</svg>
  `.trim();
}

export const ShotMapSVG = (props) => {
  const svgString = renderShotMapSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper shot-map-svg-wrapper',
    style: { width: '100%', maxWidth: '1050px', margin: '0 auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default ShotMapSVG;
