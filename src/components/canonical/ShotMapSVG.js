/**
 * src/components/canonical/ShotMapSVG.jsx
 * Míster11 — Renderizador Canónico de Mapa de Tiros y xG (App + PDF)
 *
 * Características de élite:
 *  - Campo de fútbol COMPLETO con proporción táctica real (105m x 68m).
 *  - Franjas de césped de estadio, líneas reglamentarias y pasillos tácticos (3 bandas).
 *  - Puntos de tiro coloreados por comodidad (verde = cómodo, ámbar/rojo = presionado),
 *    diferenciando remates propios y del rival.
 *  - Cabecera con resumen xG-Lite de ambos equipos.
 *  - Exporta componente React y generador puro de cadena SVG para rasterizado 3x en PDF.
 */

import React from 'react';

export function renderShotMapSvgString({
  shots = [],
  ownXg = 0,
  rivalXg = 0,
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 660,
  height = 240
}) {
  const safeShots = Array.isArray(shots) ? shots.filter(Boolean) : [];
  const safeOwnXg = Number(ownXg || 0).toFixed(2);
  const safeRivalXg = Number(rivalXg || 0).toFixed(2);
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  // Dimensiones del campo dentro del SVG
  const padX = 14;
  const padY = 32;
  const pW = width - padX * 2;
  const pH = height - padY - 14;

  // Franjas de césped (10 franjas alternadas)
  const stripeWidth = pW / 10;
  const stripes = Array.from({ length: 10 }).map((_, i) => {
    const fill = i % 2 === 0 ? '#1B4D24' : '#17421E';
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

    // Normalizar sector si no hay coordenadas x,y precisas
    if (s.x === undefined && s.sector) {
      const sec = String(s.sector).toLowerCase();
      if (sec.includes('izq') || sec === 'left') sy = 22;
      else if (sec.includes('der') || sec === 'right') sy = 78;
      else sy = 50;
      sx = isRival ? 22 : 78;
    }

    const posX = padX + (Math.max(4, Math.min(96, sx)) / 100) * pW;
    const posY = padY + (Math.max(4, Math.min(96, sy)) / 100) * pH;

    // Colores según resultado y comodidad
    const comfort = s.shooterComfort || 'normal';
    let dotFill = '#3B82F6'; // On target propio
    let dotStroke = '#FFFFFF';
    let radius = isGoal ? 6.5 : 4.5;

    if (isRival) {
      dotFill = isGoal ? '#EF4444' : '#F97316';
      dotStroke = '#7F1D1D';
    } else {
      if (isGoal) {
        dotFill = '#10B981';
        dotStroke = '#064E3B';
      } else if (!isOnTarget) {
        dotFill = '#94A3B8';
        dotStroke = '#334155';
      }
    }

    const comfortRing = comfort === 'comodo'
      ? `<circle cx="${posX.toFixed(1)}" cy="${posY.toFixed(1)}" r="${(radius + 2.5).toFixed(1)}" fill="none" stroke="#FACC15" stroke-width="1.2" stroke-dasharray="2 1" />`
      : '';

    const labelText = s.xG !== undefined ? Number(s.xG).toFixed(2) : (isGoal ? 'GOL' : '');
    const labelSvg = labelText ? `
      <text x="${posX.toFixed(1)}" y="${(posY - radius - 2).toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="7" font-weight="800" font-family="Arial, sans-serif" stroke="#000000" stroke-width="0.3" style="paint-order: stroke fill;">${labelText}</text>
    ` : '';

    return `
      <g key="shot-${idx}">
        ${comfortRing}
        <circle cx="${posX.toFixed(1)}" cy="${posY.toFixed(1)}" r="${radius}" fill="${dotFill}" stroke="${dotStroke}" stroke-width="1.5" />
        ${labelSvg}
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo Contenedor -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0F172A" rx="8" />

  <!-- Cabecera Superior -->
  <text x="14" y="19" fill="#F8FAFC" font-size="11" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '🎯 SHOT MAPS & xG-LITE MODEL' : '🎯 MAPA DE TIROS & MODELO xG-LITE'}
  </text>
  
  <!-- Badges de xG -->
  <rect x="${width - 230}" y="7" width="105" height="18" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" stroke-width="0.8" rx="4" />
  <text x="${width - 178}" y="19" text-anchor="middle" fill="#34D399" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
    ${safeHome} xG: ${safeOwnXg}
  </text>

  <rect x="${width - 118}" y="7" width="105" height="18" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" stroke-width="0.8" rx="4" />
  <text x="${width - 66}" y="19" text-anchor="middle" fill="#F87171" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
    ${safeAway} xG: ${safeRivalXg}
  </text>

  <!-- Terreno de Juego Completo (105m x 68m) -->
  <g id="pitch-field">
    <!-- Césped con franjas -->
    <rect x="${padX}" y="${padY}" width="${pW}" height="${pH}" fill="#1B4D24" rx="4" />
    ${stripes}

    <!-- Pasillos Tácticos Sutiles -->
    <line x1="${corridor1.toFixed(1)}" y1="${padY}" x2="${corridor1.toFixed(1)}" y2="${padY + pH}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3 3" />
    <line x1="${corridor2.toFixed(1)}" y1="${padY}" x2="${corridor2.toFixed(1)}" y2="${padY + pH}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3 3" />
    
    <text x="${(padX + corridor1 / 2).toFixed(1)}" y="${padY + 10}" fill="rgba(255,255,255,0.3)" font-size="6.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">${isEn ? 'LEFT' : 'IZQ'}</text>
    <text x="${((corridor1 + corridor2) / 2).toFixed(1)}" y="${padY + 10}" fill="rgba(255,255,255,0.3)" font-size="6.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">${isEn ? 'CENTER' : 'CENTRO'}</text>
    <text x="${((corridor2 + padX + pW) / 2).toFixed(1)}" y="${padY + 10}" fill="rgba(255,255,255,0.3)" font-size="6.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">${isEn ? 'RIGHT' : 'DER'}</text>

    <!-- Líneas Perimetrales de Juego -->
    <rect x="${padX}" y="${padY}" width="${pW}" height="${pH}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />

    <!-- Línea de Medio Campo y Círculo Central -->
    <line x1="${(padX + pW / 2).toFixed(1)}" y1="${padY}" x2="${(padX + pW / 2).toFixed(1)}" y2="${padY + pH}" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
    <circle cx="${(padX + pW / 2).toFixed(1)}" cy="${(padY + pH / 2).toFixed(1)}" r="${(pH * 0.18).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
    <circle cx="${(padX + pW / 2).toFixed(1)}" cy="${(padY + pH / 2).toFixed(1)}" r="1.8" fill="rgba(255,255,255,0.9)" />

    <!-- Área de Penalti Izquierda (Rival Defendiendo o Local según dirección) -->
    <rect x="${padX}" y="${(padY + pH * 0.22).toFixed(1)}" width="${(pW * 0.16).toFixed(1)}" height="${(pH * 0.56).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
    <rect x="${padX}" y="${(padY + pH * 0.35).toFixed(1)}" width="${(pW * 0.06).toFixed(1)}" height="${(pH * 0.30).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
    <circle cx="${(padX + pW * 0.11).toFixed(1)}" cy="${(padY + pH / 2).toFixed(1)}" r="1.5" fill="rgba(255,255,255,0.9)" />

    <!-- Área de Penalti Derecha (Objetivo Ataque Propio) -->
    <rect x="${(padX + pW - pW * 0.16).toFixed(1)}" y="${(padY + pH * 0.22).toFixed(1)}" width="${(pW * 0.16).toFixed(1)}" height="${(pH * 0.56).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
    <rect x="${(padX + pW - pW * 0.06).toFixed(1)}" y="${(padY + pH * 0.35).toFixed(1)}" width="${(pW * 0.06).toFixed(1)}" height="${(pH * 0.30).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
    <circle cx="${(padX + pW - pW * 0.11).toFixed(1)}" cy="${(padY + pH / 2).toFixed(1)}" r="1.5" fill="rgba(255,255,255,0.9)" />

    <!-- Porterías -->
    <rect x="${(padX - 3.5).toFixed(1)}" y="${(padY + pH * 0.42).toFixed(1)}" width="3.5" height="${(pH * 0.16).toFixed(1)}" fill="none" stroke="#D4A843" stroke-width="1" />
    <rect x="${(padX + pW).toFixed(1)}" y="${(padY + pH * 0.42).toFixed(1)}" width="3.5" height="${(pH * 0.16).toFixed(1)}" fill="none" stroke="#D4A843" stroke-width="1" />
  </g>

  <!-- Puntos de Remates Graficados -->
  <g id="shots-layer">
    ${shotMarkers}
  </g>

  <!-- Leyenda Inferior -->
  <g id="legend" transform="translate(${padX}, ${height - 6})">
    <circle cx="5" cy="-2" r="3.5" fill="#10B981" />
    <text x="12" y="1" fill="#94A3B8" font-size="7" font-family="Arial, sans-serif">${isEn ? 'Goal (Own)' : 'Gol Propio'}</text>

    <circle cx="75" cy="-2" r="3.5" fill="#3B82F6" />
    <text x="82" y="1" fill="#94A3B8" font-size="7" font-family="Arial, sans-serif">${isEn ? 'On Target' : 'A Puerta'}</text>

    <circle cx="145" cy="-2" r="3.5" fill="#94A3B8" />
    <text x="152" y="1" fill="#94A3B8" font-size="7" font-family="Arial, sans-serif">${isEn ? 'Off Target' : 'Tiro Fuera'}</text>

    <circle cx="215" cy="-2" r="3.5" fill="#EF4444" />
    <text x="222" y="1" fill="#94A3B8" font-size="7" font-family="Arial, sans-serif">${isEn ? 'Rival Shot' : 'Tiro Rival'}</text>

    <circle cx="285" cy="-2" r="4.5" fill="none" stroke="#FACC15" stroke-width="1" stroke-dasharray="2 1" />
    <circle cx="285" cy="-2" r="2.5" fill="#3B82F6" />
    <text x="294" y="1" fill="#94A3B8" font-size="7" font-family="Arial, sans-serif">${isEn ? 'Comfortable Chance' : 'Tiro Cómodo'}</text>
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
