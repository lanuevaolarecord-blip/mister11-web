/**
 * src/components/canonical/ComparisonBarsSVG.jsx
 * Míster11 — Renderizador Canónico de Barras Comparativas (10 Métricas)
 *
 * Muestra las 10 métricas esenciales de fútbol con barras divididas proporcionales
 * entre Local y Visitante, cabecera con nombres de equipo y estilo idéntico en App y PDF.
 */

import React from 'react';

export function renderComparisonBarsSvgString({
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 660,
  height = 280
}) {
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
  const startY = 40;
  const padX = 14;
  const availW = width - padX * 2;
  const halfW = (availW - 140) / 2; // ancho de cada barra izquierda/derecha
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
      hPct = (hVal / sum) * 100;
      aPct = (aVal / sum) * 100;
    } else {
      hPct = 0;
      aPct = 0;
    }

    const homeBarWidth = (hPct / 100) * halfW;
    const awayBarWidth = (aPct / 100) * halfW;

    const homeValStr = `${m.homeVal}${m.isPercent ? '%' : ''}`;
    const awayValStr = `${m.awayVal}${m.isPercent ? '%' : ''}`;

    return `
      <g key="row-${idx}">
        <!-- Fondo de fila alternada -->
        <rect x="${padX}" y="${y - 2}" width="${availW}" height="${rowHeight - 2}" fill="${idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}" rx="3" />

        <!-- Valor Local a la izquierda -->
        <text x="${padX + 22}" y="${y + 11}" fill="#10B981" font-size="8.5" font-weight="900" font-family="Arial, sans-serif" text-anchor="end">
          ${homeValStr}
        </text>

        <!-- Barra Local (crece hacia la izquierda desde el centro) -->
        <rect x="${centerX - 70 - halfW}" y="${y + 5}" width="${halfW}" height="8" fill="rgba(255,255,255,0.06)" rx="3" />
        <rect x="${centerX - 70 - homeBarWidth}" y="${y + 5}" width="${homeBarWidth}" height="8" fill="#10B981" rx="3" />

        <!-- Etiqueta Central Métrica -->
        <text x="${centerX}" y="${y + 11}" fill="#F1F5F9" font-size="8" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle">
          ${m.label}
        </text>

        <!-- Barra Visitante (crece hacia la derecha desde el centro) -->
        <rect x="${centerX + 70}" y="${y + 5}" width="${halfW}" height="8" fill="rgba(255,255,255,0.06)" rx="3" />
        <rect x="${centerX + 70}" y="${y + 5}" width="${awayBarWidth}" height="8" fill="#EF4444" rx="3" />

        <!-- Valor Visitante a la derecha -->
        <text x="${width - padX - 22}" y="${y + 11}" fill="#EF4444" font-size="8.5" font-weight="900" font-family="Arial, sans-serif" text-anchor="start">
          ${awayValStr}
        </text>
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Fondo Contenedor -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0F172A" rx="8" />

  <!-- Cabecera y Nombres de Equipo -->
  <text x="${padX}" y="20" fill="#F8FAFC" font-size="11" font-weight="800" font-family="Arial, sans-serif">
    ${isEn ? '📊 COMPARATIVE MATCH STATISTICS (10 METRICS)' : '📊 ESTADÍSTICAS COMPARATIVAS DE PARTIDO (10 MÉTRICAS)'}
  </text>

  <!-- Badge Equipo Local -->
  <rect x="${centerX - 190}" y="8" width="110" height="18" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" stroke-width="0.8" rx="4" />
  <text x="${centerX - 135}" y="20" text-anchor="middle" fill="#34D399" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
    🟢 ${safeHomeName.slice(0, 16)}
  </text>

  <!-- Separador VS -->
  <text x="${centerX}" y="20" text-anchor="middle" fill="#94A3B8" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">VS</text>

  <!-- Badge Equipo Visitante -->
  <rect x="${centerX + 80}" y="8" width="110" height="18" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" stroke-width="0.8" rx="4" />
  <text x="${centerX + 135}" y="20" text-anchor="middle" fill="#F87171" font-size="8.5" font-weight="800" font-family="Arial, sans-serif">
    🔴 ${safeAwayName.slice(0, 16)}
  </text>

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
