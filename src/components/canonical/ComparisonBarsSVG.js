/**
 * src/components/canonical/ComparisonBarsSVG.js
 * Míster11 — Renderizador Canónico de Barras Comparativas (10 Métricas)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - Equipo Local: #4CAF7D
 *  - Equipo Rival: #EF4444
 *  - Títulos y Acentos: #D4A843
 *  - Tipografía: #F2EDE4
 */

import React from 'react';
import { CHART_THEME } from '../../config/chartTheme.js';

export function renderComparisonBarsSvgString({
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  isDark = true,
  width = 660,
  height = 300
}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const safeHomeName = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAwayName = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  const metrics = [
    { label: isEn ? 'Possession' : 'Posesión', homeVal: homeStats.posesion || 50, awayVal: awayStats.posesion || 50, isPercent: true },
    { label: isEn ? 'Total Shots' : 'Tiros Totales', homeVal: homeStats.tiros || 0, awayVal: awayStats.tiros || 0 },
    { label: isEn ? 'Shots on Target' : 'Tiros a Puerta', homeVal: homeStats.tirosPuerta || 0, awayVal: awayStats.tirosPuerta || 0 },
    { label: isEn ? 'Goalkeeper Saves' : 'Paradas de Portero', homeVal: homeStats.paradas || 0, awayVal: awayStats.paradas || 0 },
    { label: isEn ? 'Completed Passes' : 'Pases Completados', homeVal: homeStats.pasesExitosos || 0, awayVal: awayStats.pasesExitosos || 0 },
    { label: isEn ? 'Pass Accuracy' : 'Precisión de Pase', homeVal: homeStats.pasesTotales > 0 ? Math.round(((homeStats.pasesExitosos || 0) / homeStats.pasesTotales) * 100) : 0, awayVal: awayStats.pasesTotales > 0 ? Math.round(((awayStats.pasesExitosos || 0) / awayStats.pasesTotales) * 100) : 0, isPercent: true },
    { label: isEn ? 'Recoveries' : 'Recuperaciones', homeVal: homeStats.recuperaciones || 0, awayVal: awayStats.recuperaciones || 0 },
    { label: isEn ? 'Corners (Set Pieces)' : 'Córners (ABP)', homeVal: homeStats.corners || 0, awayVal: awayStats.corners || 0 },
    { label: isEn ? 'Fouls Committed' : 'Faltas Cometidas', homeVal: homeStats.faltas || 0, awayVal: awayStats.faltas || 0 },
    { label: isEn ? 'Yellow Cards' : 'Tarjetas Amarillas', homeVal: homeStats.amarillas || 0, awayVal: awayStats.amarillas || 0 }
  ];

  const rowHeight = 22;
  const startY = 56;
  const padX = 16;
  const availW = width - padX * 2;
  const labelWidth = 140;
  const valueWidth = 45;
  const halfBarWidth = (availW - labelWidth - valueWidth * 2) / 2;
  const centerX = width / 2;

  const rows = metrics.map((m, idx) => {
    const y = startY + idx * rowHeight;
    const hVal = Number(m.homeVal) || 0;
    const aVal = Number(m.awayVal) || 0;
    const sum = hVal + aVal;

    let hPct = 50;
    let aPct = 50;
    if (m.isPercent) {
      hPct = Math.min(100, Math.max(0, hVal));
      aPct = Math.min(100, Math.max(0, aVal));
    } else if (sum > 0) {
      hPct = Math.min(100, Math.max(0, (hVal / sum) * 100));
      aPct = Math.min(100, Math.max(0, (aVal / sum) * 100));
    } else {
      hPct = 0;
      aPct = 0;
    }

    const homeBarW = (hPct / 100) * halfBarWidth;
    const awayBarW = (aPct / 100) * halfBarWidth;

    const homeValStr = `${m.homeVal}${m.isPercent ? '%' : ''}`;
    const awayValStr = `${m.awayVal}${m.isPercent ? '%' : ''}`;

    return `
      <g key="row-${idx}">
        <!-- Fondo de fila alternada -->
        <rect x="${padX}" y="${y - 2}" width="${availW}" height="${rowHeight - 2}" fill="${idx % 2 === 0 ? 'rgba(76, 175, 125, 0.05)' : 'transparent'}" rx="3" />

        <!-- Valor Local (Holgado, nunca cortado) -->
        <text x="${padX + valueWidth - 6}" y="${y + 11}" fill="${theme.teamHome}" font-size="9" font-weight="900" font-family="Arial, sans-serif" text-anchor="end">
          ${homeValStr}
        </text>

        <!-- Barra Local (crece hacia la izquierda hacia el centro) -->
        <rect x="${centerX - (labelWidth / 2) - halfBarWidth}" y="${y + 5}" width="${halfBarWidth}" height="8" fill="rgba(242, 237, 228, 0.08)" rx="3" />
        <rect x="${centerX - (labelWidth / 2) - homeBarW}" y="${y + 5}" width="${homeBarW}" height="8" fill="${theme.teamHome}" rx="3" />

        <!-- Etiqueta Central Métrica -->
        <text x="${centerX}" y="${y + 11}" fill="${theme.textPrimary}" font-size="8.5" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">
          ${m.label}
        </text>

        <!-- Barra Visitante (crece hacia la derecha desde el centro) -->
        <rect x="${centerX + (labelWidth / 2)}" y="${y + 5}" width="${halfBarWidth}" height="8" fill="rgba(242, 237, 228, 0.08)" rx="3" />
        <rect x="${centerX + (labelWidth / 2)}" y="${y + 5}" width="${awayBarW}" height="8" fill="${theme.teamAway}" rx="3" />

        <!-- Valor Visitante (Holgado, nunca cortado) -->
        <text x="${width - padX - valueWidth + 6}" y="${y + 11}" fill="${theme.teamAway}" font-size="9" font-weight="900" font-family="Arial, sans-serif" text-anchor="start">
          ${awayValStr}
        </text>
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo Contenedor Institucional Tierra y Campo -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

  <!-- Fila 1: Título Institucional (Línea limpia superior) -->
  <text x="${padX}" y="22" fill="${theme.gold}" font-size="11.5" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '📊 COMPARATIVE MATCH STATISTICS (10 CANONICAL METRICS)' : '📊 ESTADÍSTICAS COMPARATIVAS DE PARTIDO (10 MÉTRICAS CANÓNICAS)'}
  </text>

  <!-- Fila 2: Badges de Equipo (Línea separada para erradicar cualquier solape) -->
  <g transform="translate(${padX}, 34)">
    <!-- Badge Equipo Local -->
    <rect x="0" y="0" width="120" height="15" fill="rgba(76, 175, 125, 0.2)" stroke="${theme.teamHome}" stroke-width="0.8" rx="3" />
    <text x="60" y="10.5" text-anchor="middle" fill="${theme.teamHome}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
      🟢 ${safeHomeName.slice(0, 16)}
    </text>

    <!-- Separador VS -->
    <text x="${centerX - padX}" y="11" text-anchor="middle" fill="${theme.textMuted}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">VS</text>

    <!-- Badge Equipo Visitante -->
    <rect x="${width - padX * 2 - 120}" y="0" width="120" height="15" fill="rgba(239, 68, 68, 0.2)" stroke="${theme.teamAway}" stroke-width="0.8" rx="3" />
    <text x="${width - padX * 2 - 60}" y="10.5" text-anchor="middle" fill="${theme.teamAway}" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
      🔴 ${safeAwayName.slice(0, 16)}
    </text>
  </g>

  <!-- Filas de Métricas Comparativas -->
  <g id="bars-list">
    ${rows}
  </g>
</svg>
  `.trim();
}

export const ComparisonBarsSVG = (props) => {
  const svgString = renderComparisonBarsSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper comparison-bars-svg-wrapper',
    style: { width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default ComparisonBarsSVG;
