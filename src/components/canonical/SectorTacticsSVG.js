/**
 * src/components/canonical/SectorTacticsSVG.js
 * Míster11 — Renderizador Canónico de Campo y Táctica (Sectores, ABP, Bloques)
 *
 * Paleta Oficial Tierra y Campo:
 *  - Fondo institucional: #1B3A2D
 *  - Césped Táctico: #152C22
 *  - Serie Propia / Canales: #4CAF7D
 *  - Serie Rival: #EF4444
 *  - Títulos y Acentos: #D4A843
 *  - Tipografía: #F2EDE4
 */

import React from 'react';
import { CHART_THEME } from '../../config/chartTheme.js';

export function renderSectorTacticsSvgString({
  homeStats = {},
  awayStats = {},
  tacticsData = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  isDark = true,
  width = 660,
  height = 240
}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:${theme.bgCard}; border-radius:10px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Fondo Institucional -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

      <!-- Fila 1: Título de cabecera -->
      <text x="20" y="24" fill="${theme.gold}" font-size="12" font-weight="800" letter-spacing="0.5">${isEn ? 'FIELD &amp; TACTICAL ANALYSIS' : 'CAMPO Y TÁCTICA: SECTORES Y ABP'}</text>
      <text x="${width - 20}" y="24" text-anchor="end" fill="${theme.textSecondary}" font-size="10" font-weight="700">${safeHome} vs ${safeAway}</text>
      <line x1="20" y1="34" x2="${width - 20}" y2="34" stroke="rgba(242,237,228,0.12)" stroke-width="1" />

      <!-- COLUMNA 1: DISTRIBUCIÓN POR PASILLOS (Ataque) -->
      <g transform="translate(20, 48)">
        <text x="0" y="14" fill="${theme.teamHome}" font-size="11" font-weight="700">${isEn ? 'ATTACK CHANNELS' : 'PASILLOS DE ATAQUE'}</text>
        
        <!-- Mini campo esquemático 180x140 -->
        <rect x="0" y="24" width="180" height="140" rx="6" fill="${theme.bgPitch}" stroke="rgba(76,175,125,0.25)" stroke-width="1.5" />
        <line x1="60" y1="24" x2="60" y2="164" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3" stroke-width="1" />
        <line x1="120" y1="24" x2="120" y2="164" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3" stroke-width="1" />
        <circle cx="90" cy="94" r="24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <line x1="0" y1="94" x2="180" y2="94" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

        <!-- Overlay de calor por pasillo -->
        <rect x="2" y="26" width="56" height="136" rx="4" fill="${theme.teamHome}" fill-opacity="${(leftPct / 100) * 0.45}" />
        <rect x="62" y="26" width="56" height="136" rx="4" fill="${theme.teamHome}" fill-opacity="${(centerPct / 100) * 0.45}" />
        <rect x="122" y="26" width="56" height="136" rx="4" fill="${theme.teamHome}" fill-opacity="${(rightPct / 100) * 0.45}" />

        <!-- Textos pasillos -->
        <text x="30" y="85" text-anchor="middle" fill="${theme.textPrimary}" font-size="12" font-weight="700">${leftPct}%</text>
        <text x="30" y="102" text-anchor="middle" fill="${theme.textMuted}" font-size="9">${isEn ? 'Left' : 'Izq'}</text>

        <text x="90" y="85" text-anchor="middle" fill="${theme.textPrimary}" font-size="13" font-weight="800">${centerPct}%</text>
        <text x="90" y="102" text-anchor="middle" fill="${theme.gold}" font-size="9.5" font-weight="800">${isEn ? 'Center' : 'Centro'}</text>

        <text x="150" y="85" text-anchor="middle" fill="${theme.textPrimary}" font-size="12" font-weight="700">${rightPct}%</text>
        <text x="150" y="102" text-anchor="middle" fill="${theme.textMuted}" font-size="9">${isEn ? 'Right' : 'Der'}</text>
      </g>

      <!-- COLUMNA 2: ACCIONES A BALÓN PARADO (ABP) -->
      <g transform="translate(230, 48)">
        <text x="0" y="14" fill="${theme.gold}" font-size="11" font-weight="700">${isEn ? 'SET PIECES BALANCE (ABP)' : 'BALANCE A BALÓN PARADO (ABP)'}</text>

        <!-- Filas ABP -->
        <!-- Corners -->
        <g transform="translate(0, 32)">
          <text x="0" y="12" fill="${theme.textPrimary}" font-size="10.5">${isEn ? 'Corners' : 'Córners'}</text>
          <text x="110" y="12" fill="${theme.teamHome}" font-size="11" font-weight="800">${cornersHome}</text>
          <text x="130" y="12" fill="${theme.textMuted}" font-size="10">vs</text>
          <text x="155" y="12" fill="${theme.teamAway}" font-size="11" font-weight="800">${cornersAway}</text>
          <rect x="0" y="18" width="180" height="6" rx="3" fill="rgba(242,237,228,0.1)" />
          <rect x="0" y="18" width="${cornersHome + cornersAway > 0 ? (cornersHome / (cornersHome + cornersAway)) * 180 : 90}" height="6" rx="3" fill="${theme.teamHome}" />
        </g>

        <!-- Faltas -->
        <g transform="translate(0, 72)">
          <text x="0" y="12" fill="${theme.textPrimary}" font-size="10.5">${isEn ? 'Fouls' : 'Faltas'}</text>
          <text x="110" y="12" fill="${theme.teamHome}" font-size="11" font-weight="800">${faltasHome}</text>
          <text x="130" y="12" fill="${theme.textMuted}" font-size="10">vs</text>
          <text x="155" y="12" fill="${theme.teamAway}" font-size="11" font-weight="800">${faltasAway}</text>
          <rect x="0" y="18" width="180" height="6" rx="3" fill="rgba(242,237,228,0.1)" />
          <rect x="0" y="18" width="${faltasHome + faltasAway > 0 ? (faltasHome / (faltasHome + faltasAway)) * 180 : 90}" height="6" rx="3" fill="${theme.teamHome}" />
        </g>

        <!-- Penaltis -->
        <g transform="translate(0, 112)">
          <text x="0" y="12" fill="${theme.textPrimary}" font-size="10.5">${isEn ? 'Penalties' : 'Penaltis'}</text>
          <text x="110" y="12" fill="${theme.teamHome}" font-size="11" font-weight="800">${penaltisHome}</text>
          <text x="130" y="12" fill="${theme.textMuted}" font-size="10">vs</text>
          <text x="155" y="12" fill="${theme.teamAway}" font-size="11" font-weight="800">${penaltisAway}</text>
          <rect x="0" y="18" width="180" height="6" rx="3" fill="rgba(242,237,228,0.1)" />
          <rect x="0" y="18" width="${penaltisHome + penaltisAway > 0 ? (penaltisHome / (penaltisHome + penaltisAway)) * 180 : 90}" height="6" rx="3" fill="${theme.gold}" />
        </g>
      </g>

      <!-- COLUMNA 3: TERRITORIO / BLOQUE OFENSIVO VS DEFENSIVO -->
      <g transform="translate(440, 48)">
        <text x="0" y="14" fill="${theme.teamHome}" font-size="11" font-weight="700">${isEn ? 'TERRITORIAL BLOCK' : 'BLOQUE Y TERRITORIO'}</text>

        <rect x="0" y="32" width="200" height="70" rx="8" fill="${theme.bgPitch}" stroke="rgba(76,175,125,0.25)" />
        
        <text x="14" y="55" fill="${theme.teamHome}" font-size="16" font-weight="800">${safeOffHome}%</text>
        <text x="14" y="70" fill="${theme.textMuted}" font-size="9">${isEn ? 'Offensive / Middle 3rd' : 'Ofensivo / Campo Rival'}</text>

        <text x="120" y="55" fill="${theme.textSecondary}" font-size="16" font-weight="800">${defHome}%</text>
        <text x="120" y="70" fill="${theme.textMuted}" font-size="9">${isEn ? 'Defensive 3rd' : 'Bloque Defensivo'}</text>

        <!-- Barra segmentada -->
        <rect x="14" y="80" width="172" height="8" rx="4" fill="rgba(242,237,228,0.1)" />
        <rect x="14" y="80" width="${(safeOffHome / 100) * 172}" height="8" rx="4" fill="${theme.teamHome}" />

        <!-- Etiqueta táctica inferior -->
        <text x="0" y="125" fill="${theme.textPrimary}" font-size="10" font-weight="600">${isEn ? 'Style' : 'Comportamiento'}:</text>
        <text x="95" y="125" fill="${safeOffHome >= 50 ? theme.teamHome : theme.gold}" font-size="10" font-weight="700">${safeOffHome >= 50 ? (isEn ? 'High Press / Dominant' : 'Presión Alta / Proactivo') : (isEn ? 'Direct / Counter' : 'Bloque Medio / Repliegue')}</text>
      </g>
    </svg>
  `;
}

export const SectorTacticsSVG = (props) => {
  const svgString = renderSectorTacticsSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper sector-tactics-svg-wrapper',
    style: { width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default SectorTacticsSVG;
