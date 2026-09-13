/**
 * src/components/canonical/TerritoryMap3x3SVG.js
 * Míster11 — Renderizador Puro de SVG de Mapa Territorial 3x3 (Node + Navegador)
 *
 * Módulo JavaScript puro (sin JSX) compatible con Node.js en CI y navegadores.
 */

import { getMatchAnalytics } from '../../utils/matchAnalytics.js';
import { CHART_THEME } from '../../config/chartTheme.js';

export function renderTerritoryMap3x3SvgString({
  analytics = null,
  matchData = {},
  events = [],
  teamFilter = 'home',
  actionFilter = 'all',
  isEn = false,
  isDark = true,
  width = 1050,
  height = 680
}) {
  const effAnalytics = analytics || getMatchAnalytics(matchData, events, { isEn });
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const { definitions, stats, maxZoneEvents } = effAnalytics.zones;

  // Medidas proporcionales en viewBox 1050x680 (Pitch: 1000x630, Margen: 25)
  const pitchX = 25;
  const pitchY = 25;
  const pitchW = 1000;
  const pitchH = 630;

  const colW = pitchW / 3;
  const rowH = pitchH / 3;

  const colPositions = [
    { startX: pitchX, width: colW, labelEs: 'DEFENSA', labelEn: 'DEFENSE' },
    { startX: pitchX + colW, width: colW, labelEs: 'MEDIO', labelEn: 'MIDFIELD' },
    { startX: pitchX + colW * 2, width: colW, labelEs: 'ATAQUE', labelEn: 'ATTACK' },
  ];

  const rowPositions = [
    { startY: pitchY, height: rowH, labelEs: 'BANDA IZQUIERDA', labelEn: 'LEFT FLANK' },
    { startY: pitchY + rowH, height: rowH, labelEs: 'PASILLO CENTRAL', labelEn: 'CENTER CHANNEL' },
    { startY: pitchY + rowH * 2, height: rowH, labelEs: 'BANDA DERECHA', labelEn: 'RIGHT FLANK' },
  ];

  const zoneElements = definitions.map((zone, idx) => {
    const colIdx = idx >= 6 ? 2 : (idx >= 3 ? 1 : 0); // def (0-2), med (3-5), att (6-8)
    const rowIdx = idx % 3; // izq (0), centro (1), der (2)

    const zX = colPositions[colIdx].startX;
    const zY = rowPositions[rowIdx].startY;
    const zStats = stats[zone.id] || { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0, passes: 0 };
    const isHotspot = zStats.total > 0 && zStats.total === maxZoneEvents;
    const intensity = maxZoneEvents > 0 ? (zStats.total / maxZoneEvents) : 0;

    const fillColor = zStats.total > 0
      ? (isHotspot ? 'rgba(212, 168, 67, 0.28)' : `rgba(76, 175, 125, ${0.12 + intensity * 0.42})`)
      : 'rgba(0, 0, 0, 0.05)';
    const strokeColor = isHotspot ? '#D4A843' : 'rgba(242, 237, 228, 0.3)';
    const strokeWidth = isHotspot ? 2 : 1;

    const centerX = zX + colW / 2;
    const centerY = zY + rowH / 2;
    const zoneName = isEn ? zone.nameEn : zone.nameEs;

    const iconsParts = [];
    if (zStats.recoveries > 0) iconsParts.push(`^${zStats.recoveries}`);
    if (zStats.duelsWon > 0) iconsParts.push(`D:${zStats.duelsWon}`);
    if (zStats.shots > 0) iconsParts.push(`T:${zStats.shots}`);
    if (zStats.fouls > 0) iconsParts.push(`F:${zStats.fouls}`);
    if (zStats.passes > 0) iconsParts.push(`P:${zStats.passes}`);
    const iconsText = iconsParts.slice(0, 4).join('  ');

    return `
      <g id="zone-${zone.id}">
        <rect x="${zX}" y="${zY}" width="${colW}" height="${rowH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${isHotspot ? 'none' : '4,4'}" />
        <text x="${centerX}" y="${zY + 32}" text-anchor="middle" fill="${isHotspot ? '#D4A843' : theme.ink}" font-size="16" font-family="-apple-system, sans-serif" font-weight="bold" letter-spacing="0.5">${zoneName.toUpperCase()}</text>
        <text x="${centerX}" y="${centerY + 16}" text-anchor="middle" fill="${isHotspot ? '#D4A843' : '#FFFFFF'}" font-size="44" font-family="-apple-system, sans-serif" font-weight="900">${zStats.total}</text>
        ${iconsText ? `<text x="${centerX}" y="${centerY + 54}" text-anchor="middle" fill="${theme.inkMuted}" font-size="14" font-family="-apple-system, sans-serif" font-weight="600">${iconsText}</text>` : ''}
      </g>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="background:#152C22; border-radius:10px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Terreno de juego base -->
      <rect id="pitch-bg" x="0" y="0" width="${width}" height="${height}" fill="#152C22" rx="8" />

      <!-- Franjas de siega -->
      ${Array.from({ length: 9 }).map((_, i) => {
        const fill = i % 2 === 0 ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.02)';
        return `<rect x="${25 + i * (1000 / 9)}" y="25" width="${1000 / 9}" height="630" fill="${fill}" />`;
      }).join('')}

      <!-- Líneas perimetrales reglamentarias -->
      <rect x="${pitchX}" y="${pitchY}" width="${pitchW}" height="${pitchH}" fill="none" stroke="rgba(242, 237, 228, 0.55)" stroke-width="2.2" rx="4" />
      <line x1="525" y1="25" x2="525" y2="655" stroke="rgba(242, 237, 228, 0.55)" stroke-width="2" />
      <circle cx="525" cy="340" r="91.5" fill="none" stroke="rgba(242, 237, 228, 0.55)" stroke-width="2" />
      <circle cx="525" cy="340" r="3.5" fill="rgba(242, 237, 228, 0.85)" />

      <!-- Áreas penales -->
      <rect x="25" y="138.5" width="165" height="403" fill="none" stroke="rgba(242, 237, 228, 0.55)" stroke-width="2" />
      <rect x="25" y="248.5" width="55" height="183" fill="none" stroke="rgba(242, 237, 228, 0.55)" stroke-width="1.8" />
      <rect x="860" y="138.5" width="165" height="403" fill="none" stroke="rgba(242, 237, 228, 0.55)" stroke-width="2" />
      <rect x="970" y="248.5" width="55" height="183" fill="none" stroke="rgba(242, 237, 228, 0.55)" stroke-width="1.8" />

      <!-- Rejilla y contenido de las 9 Zonas (Modo Detalle Canónico) -->
      ${zoneElements}
    </svg>
  `.trim();
}
