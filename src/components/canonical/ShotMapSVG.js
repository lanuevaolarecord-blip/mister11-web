/**
 * src/components/canonical/ShotMapSVG.js
 * Míster11 — Renderizador Canónico de Mapa de Tiros y xG (App + PDF)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - Césped Táctico: #152C22
 *  - Tiros Propios a Puerta: #4CAF7D
 *  - Goles: #D4A843
 *  - Tiros Fuera / Bloqueados: #A3B5AD / #64748B
 *  - Tiros Rivales: #EF4444
 *  - Tipografía: #F2EDE4
 */

import React from 'react';
import { CHART_THEME } from '../../config/chartTheme.js';

export function renderShotMapSvgString({
  shots = [],
  ownXg = 0,
  rivalXg = 0,
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  isDark = true,
  width = 660,
  height = 240
}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const safeShots = Array.isArray(shots) ? shots.filter(Boolean) : [];
  const safeOwnXg = Number(ownXg || 0).toFixed(2);
  const safeRivalXg = Number(rivalXg || 0).toFixed(2);
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  // Dimensiones del campo dentro del SVG
  const padX = 14;
  const padY = 36;
  const pW = width - padX * 2;
  const pH = height - padY - 24;

  // Franjas de césped (10 franjas alternadas)
  const stripeWidth = pW / 10;
  const stripes = Array.from({ length: 10 }).map((_, i) => {
    const fill = i % 2 === 0 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)';
    return `<rect x="${padX + i * stripeWidth}" y="${padY}" width="${stripeWidth}" height="${pH}" fill="${fill}" />`;
  }).join('');

  // Pasillos tácticos verticales (33% y 66%)
  const corridor1 = padX + pW * 0.33;
  const corridor2 = padX + pW * 0.66;

  // Marcadores de tiro
  const shotMarkers = safeShots.map((s, idx) => {
    const isRival = s.team === 'rival' || String(s.type || '').includes('rival') || s.isRival === true;
    const isGoal = s.outcome === 'goal' || s.isGoal || String(s.type || '').startsWith('gol') || String(s.type || '').startsWith('goal');
    const isOnTarget = isGoal || s.outcome === 'on_target' || String(s.type || '').includes('on_target') || String(s.type || '').includes('puerta');

    // Mapeo de coordenadas (x: 0-100 largo campo, y: 0-100 ancho campo)
    let sx = typeof s.x === 'number' ? s.x : (isRival ? 25 : 75);
    let sy = typeof s.y === 'number' ? s.y : 50;

    const posX = padX + (Math.max(4, Math.min(96, sx)) / 100) * pW;
    const posY = padY + (Math.max(4, Math.min(96, sy)) / 100) * pH;

    // Colores según resultado y comodidad
    const comfort = s.shooterComfort || 'normal';
    let dotFill = theme.teamHome; // On target propio
    let dotStroke = '#FFFFFF';
    let radius = isGoal ? 6 : 4;

    if (isRival) {
      dotFill = isGoal ? theme.teamAway : '#F97316';
      dotStroke = '#7F1D1D';
    } else {
      if (isGoal) {
        dotFill = theme.gold;
        dotStroke = '#FFFFFF';
      } else if (!isOnTarget) {
        dotFill = theme.textMuted;
        dotStroke = 'rgba(255,255,255,0.4)';
      }
    }

    const comfortRing = comfort === 'comodo'
      ? `<circle cx="${posX.toFixed(1)}" cy="${posY.toFixed(1)}" r="${(radius + 2.5).toFixed(1)}" fill="none" stroke="${theme.gold}" stroke-width="1.2" stroke-dasharray="2 1" />`
      : '';

    const labelText = isGoal ? '⚽' : (s.xG !== undefined ? Number(s.xG).toFixed(2) : '');
    const labelSvg = labelText ? `
      <text x="${posX.toFixed(1)}" y="${(posY - radius - 2).toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="7" font-weight="800" font-family="Arial, sans-serif" stroke="#000000" stroke-width="0.3" style="paint-order: stroke fill;">${labelText}</text>
    ` : '';

    return `
      <g key="shot-${idx}">
        ${comfortRing}
        <circle cx="${posX.toFixed(1)}" cy="${posY.toFixed(1)}" r="${radius}" fill="${dotFill}" stroke="${dotStroke}" stroke-width="1.2" />
        ${labelSvg}
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo Contenedor Institucional Tierra y Campo -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

  <!-- Cabecera Superior -->
  <text x="14" y="20" fill="${theme.gold}" font-size="11.5" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '🎯 SHOT MAPS & xG-LITE MODEL' : '🎯 MAPA DE TIROS & MODELO xG-LITE'}
  </text>
  
  <!-- Badges de xG sin colisión -->
  <rect x="${width - 230}" y="8" width="105" height="18" fill="rgba(76, 175, 125, 0.2)" stroke="${theme.teamHome}" stroke-width="0.8" rx="4" />
  <text x="${width - 178}" y="20" text-anchor="middle" fill="${theme.teamHome}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
    ${safeHome.slice(0, 10)} xG: ${safeOwnXg}
  </text>

  <rect x="${width - 118}" y="8" width="105" height="18" fill="rgba(239, 68, 68, 0.2)" stroke="${theme.teamAway}" stroke-width="0.8" rx="4" />
  <text x="${width - 66}" y="20" text-anchor="middle" fill="${theme.teamAway}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
    ${safeAway.slice(0, 10)} xG: ${safeRivalXg}
  </text>

  <!-- Terreno de Juego Completo (105m x 68m) -->
  <g id="pitch-field">
    <!-- Césped con franjas -->
    <rect x="${padX}" y="${padY}" width="${pW}" height="${pH}" fill="${theme.bgPitch}" rx="4" />
    ${stripes}

    <!-- Pasillos Tácticos Sutiles -->
    <line x1="${corridor1.toFixed(1)}" y1="${padY}" x2="${corridor1.toFixed(1)}" y2="${padY + pH}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3 3" />
    <line x1="${corridor2.toFixed(1)}" y1="${padY}" x2="${corridor2.toFixed(1)}" y2="${padY + pH}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3 3" />
    
    <text x="${(padX + (corridor1 - padX) / 2).toFixed(1)}" y="${padY + 10}" fill="rgba(255,255,255,0.3)" font-size="6.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">${isEn ? 'LEFT' : 'IZQ'}</text>
    <text x="${((corridor1 + corridor2) / 2).toFixed(1)}" y="${padY + 10}" fill="rgba(255,255,255,0.3)" font-size="6.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">${isEn ? 'CENTER' : 'CENTRO'}</text>
    <text x="${(corridor2 + (width - padX - corridor2) / 2).toFixed(1)}" y="${padY + 10}" fill="rgba(255,255,255,0.3)" font-size="6.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">${isEn ? 'RIGHT' : 'DER'}</text>

    <!-- Líneas reglamentarias -->
    <rect x="${padX}" y="${padY}" width="${pW}" height="${pH}" fill="none" stroke="${theme.pitchLines}" stroke-width="1" />
    <line x1="${(padX + pW / 2).toFixed(1)}" y1="${padY}" x2="${(padX + pW / 2).toFixed(1)}" y2="${padY + pH}" stroke="${theme.pitchLines}" stroke-width="1" />
    <circle cx="${(padX + pW / 2).toFixed(1)}" cy="${(padY + pH / 2).toFixed(1)}" r="${(pH * 0.22).toFixed(1)}" fill="none" stroke="${theme.pitchLines}" stroke-width="1" />
    <circle cx="${(padX + pW / 2).toFixed(1)}" cy="${(padY + pH / 2).toFixed(1)}" r="1.5" fill="${theme.pitchLines}" />

    <!-- Áreas Grandes -->
    <rect x="${padX}" y="${(padY + pH * 0.2).toFixed(1)}" width="${(pW * 0.16).toFixed(1)}" height="${(pH * 0.6).toFixed(1)}" fill="none" stroke="${theme.pitchLines}" stroke-width="1" />
    <rect x="${(padX + pW * 0.84).toFixed(1)}" y="${(padY + pH * 0.2).toFixed(1)}" width="${(pW * 0.16).toFixed(1)}" height="${(pH * 0.6).toFixed(1)}" fill="none" stroke="${theme.pitchLines}" stroke-width="1" />

    <!-- Porterías -->
    <rect x="${padX - 4}" y="${(padY + pH * 0.38).toFixed(1)}" width="4" height="${(pH * 0.24).toFixed(1)}" fill="rgba(212,168,67,0.3)" stroke="${theme.gold}" stroke-width="1" />
    <rect x="${padX + pW}" y="${(padY + pH * 0.38).toFixed(1)}" width="4" height="${(pH * 0.24).toFixed(1)}" fill="rgba(212,168,67,0.3)" stroke="${theme.gold}" stroke-width="1" />
  </g>

  <!-- Puntos de Remates -->
  <g id="shot-markers">
    ${shotMarkers}
  </g>

  <!-- Leyenda Inferior -->
  <g transform="translate(${padX}, ${height - 10})">
    <circle cx="5" cy="-2" r="3.5" fill="${theme.gold}" />
    <text x="12" y="1" fill="${theme.textSecondary}" font-size="7.5" font-family="Arial, sans-serif">${isEn ? 'Goal' : 'Gol'}</text>

    <circle cx="75" cy="-2" r="3.5" fill="${theme.teamHome}" />
    <text x="82" y="1" fill="${theme.textSecondary}" font-size="7.5" font-family="Arial, sans-serif">${isEn ? 'On Target' : 'A puerta'}</text>

    <circle cx="150" cy="-2" r="3" fill="${theme.textMuted}" />
    <text x="156" y="1" fill="${theme.textSecondary}" font-size="7.5" font-family="Arial, sans-serif">${isEn ? 'Off Target / Blocked' : 'Fuera / Bloqueado'}</text>

    <circle cx="240" cy="-2" r="3.5" fill="${theme.teamAway}" />
    <text x="248" y="1" fill="${theme.textSecondary}" font-size="7.5" font-family="Arial, sans-serif">${isEn ? 'Opponent Shot' : 'Tiro Rival'}</text>
  </g>
</svg>
  `.trim();
}

export const ShotMapSVG = (props) => {
  const svgString = renderShotMapSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper shot-map-svg-wrapper',
    style: { width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default ShotMapSVG;
