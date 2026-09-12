/**
 * src/components/canonical/SectorTacticsSVG.jsx
 * Míster11 — Renderizador Canónico de Campo y Táctica (Sectores, ABP, Bloques)
 *
 * Muestra:
 * 1. Mini-campo o representación visual de los 3 pasillos tácticos (Banda Izq, Centro, Banda Der) con porcentajes de ataque.
 * 2. Bloque ABP (Córners, Faltas y Penaltis comparados Local vs Rival).
 * 3. Balance de Presencia Territorial / Bloque Ofensivo vs Defensivo.
 *
 * Exporta renderSectorTacticsSvgString y el componente React SectorTacticsSVG.
 */

import React from 'react';

export function renderSectorTacticsSvgString({
  homeStats = {},
  awayStats = {},
  tacticsData = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 660,
  height = 240
}) {
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  // Sectores (3 pasillos de ataque)
  const leftPct = tacticsData.leftPct !== undefined ? tacticsData.leftPct : (tacticsData.bandaIzquierda || 32);
  const centerPct = tacticsData.centerPct !== undefined ? tacticsData.centerPct : (tacticsData.centro || 44);
  const rightPct = tacticsData.rightPct !== undefined ? tacticsData.rightPct : (tacticsData.bandaDerecha || 24);

  // ABP
  const cornersHome = homeStats.corners || 0;
  const cornersAway = awayStats.corners || 0;
  const faltasHome = homeStats.faltas || 0;
  const faltasAway = awayStats.faltas || 0;
  const penaltisHome = homeStats.penaltis || tacticsData.penaltisHome || 0;
  const penaltisAway = awayStats.penaltis || tacticsData.penaltisAway || 0;

  // Bloque / Territorio
  const offHome = tacticsData.territorioOfensivo || tacticsData.ataquePct || (homeStats.tiros > 0 ? Math.round(50 + (homeStats.tiros - (awayStats.tiros || 0)) * 2) : 52);
  const safeOffHome = Math.min(85, Math.max(15, offHome));
  const defHome = 100 - safeOffHome;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#0c121e; border-radius:10px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Título de cabecera -->
      <text x="20" y="24" fill="#ffffff" font-size="13" font-weight="700" letter-spacing="0.5">${isEn ? 'FIELD & TACTICAL ANALYSIS' : 'CAMPO Y TÁCTICA: SECTORES Y ABP'}</text>
      <text x="${width - 20}" y="24" text-anchor="end" fill="#94a3b8" font-size="11">${safeHome} vs ${safeAway}</text>
      <line x1="20" y1="34" x2="${width - 20}" y2="34" stroke="#1e293b" stroke-width="1" />

      <!-- COLUMNA 1: DISTRIBUCIÓN POR PASILLOS (Ataque) -->
      <g transform="translate(20, 48)">
        <text x="0" y="14" fill="#38bdf8" font-size="11" font-weight="700">${isEn ? 'ATTACK CHANNELS' : 'PASILLOS DE ATAQUE'}</text>
        
        <!-- Mini campo esquemático 180x140 -->
        <rect x="0" y="24" width="180" height="140" rx="6" fill="#142235" stroke="#334155" stroke-width="1.5" />
        <line x1="60" y1="24" x2="60" y2="164" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="1" />
        <line x1="120" y1="24" x2="120" y2="164" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="1" />
        <circle cx="90" cy="94" r="24" fill="none" stroke="#1e293b" stroke-width="1" />
        <line x1="0" y1="94" x2="180" y2="94" stroke="#1e293b" stroke-width="1" />

        <!-- Overlay de calor por pasillo -->
        <rect x="2" y="26" width="56" height="136" rx="4" fill="#38bdf8" fill-opacity="${(leftPct / 100) * 0.45}" />
        <rect x="62" y="26" width="56" height="136" rx="4" fill="#38bdf8" fill-opacity="${(centerPct / 100) * 0.45}" />
        <rect x="122" y="26" width="56" height="136" rx="4" fill="#38bdf8" fill-opacity="${(rightPct / 100) * 0.45}" />

        <!-- Textos pasillos -->
        <text x="30" y="85" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">${leftPct}%</text>
        <text x="30" y="102" text-anchor="middle" fill="#94a3b8" font-size="9">${isEn ? 'Left' : 'Izq'}</text>

        <text x="90" y="85" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="800">${centerPct}%</text>
        <text x="90" y="102" text-anchor="middle" fill="#38bdf8" font-size="9" font-weight="700">${isEn ? 'Center' : 'Centro'}</text>

        <text x="150" y="85" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">${rightPct}%</text>
        <text x="150" y="102" text-anchor="middle" fill="#94a3b8" font-size="9">${isEn ? 'Right' : 'Der'}</text>
      </g>

      <!-- COLUMNA 2: ACCIONES A BALÓN PARADO (ABP) -->
      <g transform="translate(230, 48)">
        <text x="0" y="14" fill="#f59e0b" font-size="11" font-weight="700">${isEn ? 'SET PIECES BALANCE (ABP)' : 'BALANCE A BALÓN PARADO (ABP)'}</text>

        <!-- Filas ABP -->
        <!-- Corners -->
        <g transform="translate(0, 32)">
          <text x="0" y="12" fill="#cbd5e1" font-size="11">${isEn ? 'Corners' : 'Córners'}</text>
          <text x="110" y="12" fill="#38bdf8" font-size="11" font-weight="700">${cornersHome}</text>
          <text x="130" y="12" fill="#64748b" font-size="10">vs</text>
          <text x="155" y="12" fill="#f43f5e" font-size="11" font-weight="700">${cornersAway}</text>
          <rect x="0" y="18" width="180" height="6" rx="3" fill="#1e293b" />
          <rect x="0" y="18" width="${cornersHome + cornersAway > 0 ? (cornersHome / (cornersHome + cornersAway)) * 180 : 90}" height="6" rx="3" fill="#38bdf8" />
        </g>

        <!-- Faltas -->
        <g transform="translate(0, 72)">
          <text x="0" y="12" fill="#cbd5e1" font-size="11">${isEn ? 'Fouls' : 'Faltas'}</text>
          <text x="110" y="12" fill="#38bdf8" font-size="11" font-weight="700">${faltasHome}</text>
          <text x="130" y="12" fill="#64748b" font-size="10">vs</text>
          <text x="155" y="12" fill="#f43f5e" font-size="11" font-weight="700">${faltasAway}</text>
          <rect x="0" y="18" width="180" height="6" rx="3" fill="#1e293b" />
          <rect x="0" y="18" width="${faltasHome + faltasAway > 0 ? (faltasHome / (faltasHome + faltasAway)) * 180 : 90}" height="6" rx="3" fill="#38bdf8" />
        </g>

        <!-- Penaltis -->
        <g transform="translate(0, 112)">
          <text x="0" y="12" fill="#cbd5e1" font-size="11">${isEn ? 'Penalties' : 'Penaltis'}</text>
          <text x="110" y="12" fill="#38bdf8" font-size="11" font-weight="700">${penaltisHome}</text>
          <text x="130" y="12" fill="#64748b" font-size="10">vs</text>
          <text x="155" y="12" fill="#f43f5e" font-size="11" font-weight="700">${penaltisAway}</text>
          <rect x="0" y="18" width="180" height="6" rx="3" fill="#1e293b" />
          <rect x="0" y="18" width="${penaltisHome + penaltisAway > 0 ? (penaltisHome / (penaltisHome + penaltisAway)) * 180 : 90}" height="6" rx="3" fill="#f59e0b" />
        </g>
      </g>

      <!-- COLUMNA 3: TERRITORIO / BLOQUE OFENSIVO VS DEFENSIVO -->
      <g transform="translate(440, 48)">
        <text x="0" y="14" fill="#22c55e" font-size="11" font-weight="700">${isEn ? 'TERRITORIAL BLOCK' : 'BLOQUE Y TERRITORIO'}</text>

        <rect x="0" y="32" width="200" height="70" rx="8" fill="#111c2e" stroke="#1e293b" />
        
        <text x="14" y="55" fill="#38bdf8" font-size="16" font-weight="800">${safeOffHome}%</text>
        <text x="14" y="70" fill="#94a3b8" font-size="9">${isEn ? 'Offensive / Middle 3rd' : 'Ofensivo / Campo Rival'}</text>

        <text x="120" y="55" fill="#64748b" font-size="16" font-weight="800">${defHome}%</text>
        <text x="120" y="70" fill="#94a3b8" font-size="9">${isEn ? 'Defensive 3rd' : 'Bloque Defensivo'}</text>

        <!-- Barra segmentada -->
        <rect x="14" y="80" width="172" height="8" rx="4" fill="#334155" />
        <rect x="14" y="80" width="${(safeOffHome / 100) * 172}" height="8" rx="4" fill="#22c55e" />

        <!-- Etiqueta táctica inferior -->
        <text x="0" y="125" fill="#cbd5e1" font-size="10" font-weight="600">${isEn ? 'Style' : 'Comportamiento'}:</text>
        <text x="90" y="125" fill="${safeOffHome >= 50 ? '#22c55e' : '#f59e0b'}" font-size="10" font-weight="700">${safeOffHome >= 50 ? (isEn ? 'High Press / Dominant' : 'Presión Alta / Proactivo') : (isEn ? 'Direct / Counter' : 'Bloque Medio / Repliegue')}</text>
      </g>
    </svg>
  `;
}

export default function SectorTacticsSVG(props) {
  const svgMarkup = renderSectorTacticsSvgString(props);
  return (
    <div
      className="m11-canonical-sectortactics-container"
      style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
export { SectorTacticsSVG };
