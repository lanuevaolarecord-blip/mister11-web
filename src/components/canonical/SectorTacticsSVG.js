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
 *
 * Diseño 100% Campo de Fútbol Reglamentario con Pasillos Tácticos y Métricas Verificadas.
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
  height = 370
}) {
  const theme = isDark ? CHART_THEME.dark : CHART_THEME.light;
  const safeHome = String(homeTeamName || (isEn ? 'Home' : 'Local')).trim();
  const safeAway = String(awayTeamName || (isEn ? 'Away' : 'Rival')).trim();

  // Sectores (3 pasillos de ataque longitudinales)
  const leftPct = tacticsData.leftPct !== undefined ? tacticsData.leftPct : (tacticsData.bandaIzquierda || 20);
  const centerPct = tacticsData.centerPct !== undefined ? tacticsData.centerPct : (tacticsData.centro || 45);
  const rightPct = tacticsData.rightPct !== undefined ? tacticsData.rightPct : (tacticsData.bandaDerecha || 35);

  // ABP
  const cornersHome = homeStats.corners ?? homeStats.saquesEsquina ?? 0;
  const cornersAway = awayStats.corners ?? awayStats.saquesEsquina ?? 0;
  const faltasHome = homeStats.faltas ?? 0;
  const faltasAway = awayStats.faltas ?? 0;
  const penaltisHome = homeStats.penaltis ?? tacticsData.penaltisHome ?? 0;
  const penaltisAway = awayStats.penaltis ?? tacticsData.penaltisAway ?? 0;

  // Bloque / Territorio
  const offHome = tacticsData.territorioOfensivo || tacticsData.ataquePct || (homeStats.tiros > 0 ? Math.round(50 + (homeStats.tiros - (awayStats.tiros || 0)) * 2) : 68);
  const safeOffHome = Math.min(85, Math.max(15, offHome));
  const defHome = 100 - safeOffHome;

  // Dimensiones del campo integrado: 620 x 200 (aspecto ~ 3.1:1 sobre el canvas)
  const pX = 20;
  const pY = 44;
  const pW = width - 40; // 620
  const pH = 195;
  const corrH = pH / 3; // 65 cada carril horizontal (Banda Izq arriba, Centro en medio, Banda Dcha abajo)

  const lineStroke = 'rgba(242, 237, 228, 0.45)';
  const goldColor = '#D4A843';

  // Franjas de corte de césped
  const stripeW = pW / 10;
  const stripes = Array.from({ length: 10 }).map((_, i) => {
    const fill = i % 2 === 0 ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.025)';
    return `<rect x="${pX + i * stripeW}" y="${pY}" width="${stripeW}" height="${pH}" fill="${fill}" />`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:${theme.bgCard}; border-radius:10px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Fondo Institucional de la Tarjeta -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

      <!-- Cabecera Oficial -->
      <text x="20" y="24" fill="${theme.gold}" font-size="12" font-weight="800" letter-spacing="0.5">${isEn ? 'FIELD &amp; TACTICAL ANALYSIS: CHANNELS &amp; SET PIECES' : 'CAMPO Y TÁCTICA: PASILLOS DE ATAQUE Y TERRITORIO'}</text>
      <text x="${width - 20}" y="24" text-anchor="end" fill="${theme.textSecondary}" font-size="10.5" font-weight="700">${safeHome} vs ${safeAway}</text>
      <line x1="20" y1="32" x2="${width - 20}" y2="32" stroke="rgba(242,237,228,0.12)" stroke-width="1" />

      <!-- ── 1. TERRENO DE JUEGO REGLAMENTARIO COMPLETO CON PASILLOS ────────── -->
      <g id="full-pitch-tactics">
        <!-- Césped Base -->
        <rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" fill="#152C22" rx="6" />
        ${stripes}

        <!-- Perímetro Oficial -->
        <rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" fill="none" stroke="${lineStroke}" stroke-width="2" rx="4" />

        <!-- Línea de Medio Campo y Círculo Central -->
        <line x1="${pX + pW / 2}" y1="${pY}" x2="${pX + pW / 2}" y2="${pY + pH}" stroke="${lineStroke}" stroke-width="1.8" />
        <circle cx="${pX + pW / 2}" cy="${pY + pH / 2}" r="${pH * 0.22}" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
        <circle cx="${pX + pW / 2}" cy="${pY + pH / 2}" r="3" fill="${lineStroke}" />

        <!-- Áreas de Penalti y Meta Izquierda -->
        <rect x="${pX}" y="${pY + pH * 0.22}" width="${pW * 0.15}" height="${pH * 0.56}" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
        <rect x="${pX}" y="${pY + pH * 0.36}" width="${pW * 0.055}" height="${pH * 0.28}" fill="none" stroke="${lineStroke}" stroke-width="1.6" />
        <circle cx="${pX + pW * 0.1}" cy="${pY + pH / 2}" r="2.5" fill="${lineStroke}" />

        <!-- Áreas de Penalti y Meta Derecha -->
        <rect x="${pX + pW - pW * 0.15}" y="${pY + pH * 0.22}" width="${pW * 0.15}" height="${pH * 0.56}" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
        <rect x="${pX + pW - pW * 0.055}" y="${pY + pH * 0.36}" width="${pW * 0.055}" height="${pH * 0.28}" fill="none" stroke="${lineStroke}" stroke-width="1.6" />
        <circle cx="${pX + pW - pW * 0.1}" cy="${pY + pH / 2}" r="2.5" fill="${lineStroke}" />

        <!-- Porterías Canónicas fuera de la línea con postes dorados -->
        <rect x="${pX - 10}" y="${pY + pH * 0.40}" width="10" height="${pH * 0.20}" fill="rgba(212,168,67,0.15)" stroke="${goldColor}" stroke-width="2" rx="1" />
        <rect x="${pX + pW}" y="${pY + pH * 0.40}" width="10" height="${pH * 0.20}" fill="rgba(212,168,67,0.15)" stroke="${goldColor}" stroke-width="2" rx="1" />

        <!-- ── 3 PASILLOS LONGITUDINALES TÁCTICOS ── -->
        <!-- Líneas divisorias de carriles (horizontales) -->
        <line x1="${pX}" y1="${pY + corrH}" x2="${pX + pW}" y2="${pY + corrH}" stroke="rgba(212, 168, 67, 0.4)" stroke-width="1.5" stroke-dasharray="6,4" />
        <line x1="${pX}" y1="${pY + corrH * 2}" x2="${pX + pW}" y2="${pY + corrH * 2}" stroke="rgba(212, 168, 67, 0.4)" stroke-width="1.5" stroke-dasharray="6,4" />

        <!-- Shading de calor por pasillo -->
        <!-- Carril Superior (Banda Izquierda) -->
        <rect x="${pX + 2}" y="${pY + 2}" width="${pW - 4}" height="${corrH - 2}" fill="${theme.teamHome}" fill-opacity="${0.08 + (leftPct / 100) * 0.28}" rx="2" />
        <!-- Carril Central (Pasillo Central) -->
        <rect x="${pX + 2}" y="${pY + corrH}" width="${pW - 4}" height="${corrH}" fill="${theme.teamHome}" fill-opacity="${0.08 + (centerPct / 100) * 0.28}" />
        <!-- Carril Inferior (Banda Derecha) -->
        <rect x="${pX + 2}" y="${pY + corrH * 2}" width="${pW - 4}" height="${corrH - 2}" fill="${theme.teamHome}" fill-opacity="${0.08 + (rightPct / 100) * 0.28}" rx="2" />

        <!-- Etiquetas de Pasillos Tácticos en el campo -->
        <!-- Banda Izquierda -->
        <rect x="${pX + pW * 0.32}" y="${pY + 12}" width="${pW * 0.36}" height="24" rx="12" fill="rgba(21,44,34,0.85)" stroke="rgba(76,175,125,0.4)" stroke-width="1" />
        <text x="${pX + pW * 0.5}" y="${pY + 28}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="800">
          ${isEn ? 'LEFT WING' : 'BANDA IZQUIERDA'}: <tspan fill="${theme.gold}">${leftPct}%</tspan>
        </text>

        <!-- Pasillo Central -->
        <rect x="${pX + pW * 0.32}" y="${pY + corrH + 12}" width="${pW * 0.36}" height="24" rx="12" fill="rgba(21,44,34,0.92)" stroke="rgba(212,168,67,0.5)" stroke-width="1.2" />
        <text x="${pX + pW * 0.5}" y="${pY + corrH + 28}" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="900">
          ${isEn ? 'CENTRAL CHANNEL' : 'PASILLO CENTRAL'}: <tspan fill="${theme.gold}">${centerPct}%</tspan>
        </text>

        <!-- Banda Derecha -->
        <rect x="${pX + pW * 0.32}" y="${pY + corrH * 2 + 12}" width="${pW * 0.36}" height="24" rx="12" fill="rgba(21,44,34,0.85)" stroke="rgba(76,175,125,0.4)" stroke-width="1" />
        <text x="${pX + pW * 0.5}" y="${pY + corrH * 2 + 28}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="800">
          ${isEn ? 'RIGHT WING' : 'BANDA DERECHA'}: <tspan fill="${theme.gold}">${rightPct}%</tspan>
        </text>

        <!-- Indicador de Dirección de Ataque -->
        <text x="${pX + pW - 14}" y="${pY + 18}" text-anchor="end" fill="rgba(242,237,228,0.55)" font-size="9" font-weight="700">
          ${isEn ? 'ATTACK →' : 'ATAQUE →'}
        </text>
      </g>

      <!-- ── 2. TARJETAS INFERIORES: ABP Y TERRITORIO / BLOQUE ───────────────── -->
      <!-- Tarjeta 1: Balance ABP (Izquierda) -->
      <g transform="translate(20, 252)">
        <rect x="0" y="0" width="${(width - 50) / 2}" height="102" rx="8" fill="#152C22" stroke="rgba(76,175,125,0.25)" stroke-width="1" />
        <text x="14" y="20" fill="${theme.gold}" font-size="11" font-weight="800">${isEn ? 'SET PIECES BALANCE (ABP)' : 'BALANCE A BALÓN PARADO (ABP)'}</text>

        <!-- Fila Córners -->
        <text x="14" y="44" fill="${theme.textPrimary}" font-size="10" font-weight="600">${isEn ? 'Corners' : 'Córners'}</text>
        <text x="${(width - 50) / 2 - 80}" y="44" text-anchor="end" fill="${theme.teamHome}" font-size="11" font-weight="800">${cornersHome}</text>
        <text x="${(width - 50) / 2 - 68}" y="44" text-anchor="middle" fill="${theme.textMuted}" font-size="9.5">vs</text>
        <text x="${(width - 50) / 2 - 56}" y="44" text-anchor="start" fill="${theme.teamAway}" font-size="11" font-weight="800">${cornersAway}</text>
        <rect x="14" y="49" width="${(width - 50) / 2 - 28}" height="5" rx="2.5" fill="rgba(242,237,228,0.12)" />
        <rect x="14" y="49" width="${cornersHome + cornersAway > 0 ? (cornersHome / (cornersHome + cornersAway)) * ((width - 50) / 2 - 28) : ((width - 50) / 2 - 28) / 2}" height="5" rx="2.5" fill="${theme.teamHome}" />

        <!-- Fila Faltas -->
        <text x="14" y="74" fill="${theme.textPrimary}" font-size="10" font-weight="600">${isEn ? 'Fouls' : 'Faltas'}</text>
        <text x="${(width - 50) / 2 - 80}" y="74" text-anchor="end" fill="${theme.teamHome}" font-size="11" font-weight="800">${faltasHome}</text>
        <text x="${(width - 50) / 2 - 68}" y="74" text-anchor="middle" fill="${theme.textMuted}" font-size="9.5">vs</text>
        <text x="${(width - 50) / 2 - 56}" y="74" text-anchor="start" fill="${theme.teamAway}" font-size="11" font-weight="800">${faltasAway}</text>
        <rect x="14" y="79" width="${(width - 50) / 2 - 28}" height="5" rx="2.5" fill="rgba(242,237,228,0.12)" />
        <rect x="14" y="79" width="${faltasHome + faltasAway > 0 ? (faltasHome / (faltasHome + faltasAway)) * ((width - 50) / 2 - 28) : ((width - 50) / 2 - 28) / 2}" height="5" rx="2.5" fill="${theme.teamHome}" />

        <!-- Fila Penaltis (Texto en 1 línea compacta) -->
        <text x="14" y="96" fill="${theme.textMuted}" font-size="9.5">${isEn ? 'Penalties' : 'Penaltis'}: <tspan fill="${theme.teamHome}" font-weight="800">${penaltisHome}</tspan> vs <tspan fill="${theme.teamAway}" font-weight="800">${penaltisAway}</tspan></text>
      </g>

      <!-- Tarjeta 2: Territorio y Bloque (Derecha) -->
      <g transform="translate(${20 + (width - 50) / 2 + 10}, 252)">
        <rect x="0" y="0" width="${(width - 50) / 2}" height="102" rx="8" fill="#152C22" stroke="rgba(76,175,125,0.25)" stroke-width="1" />
        <text x="14" y="20" fill="${theme.gold}" font-size="11" font-weight="800">${isEn ? 'TERRITORIAL BLOCK &amp; HEIGHT' : 'BLOQUE Y ALTURA TERRITORIAL'}</text>

        <!-- Porcentajes Ofensivo / Defensivo -->
        <g transform="translate(14, 30)">
          <text x="0" y="16" fill="${theme.teamHome}" font-size="18" font-weight="900">${safeOffHome}%</text>
          <text x="0" y="28" fill="${theme.textMuted}" font-size="9">${isEn ? 'Opponent Half (Attacking)' : 'Campo Rival (Ofensivo)'}</text>

          <text x="${(width - 50) / 2 - 28}" y="16" text-anchor="end" fill="${theme.textSecondary}" font-size="18" font-weight="900">${defHome}%</text>
          <text x="${(width - 50) / 2 - 28}" y="28" text-anchor="end" fill="${theme.textMuted}" font-size="9">${isEn ? 'Own Half (Defensive)' : 'Campo Propio (Defensivo)'}</text>

          <!-- Barra Territorial Bicolor -->
          <rect x="0" y="34" width="${(width - 50) / 2 - 28}" height="8" rx="4" fill="rgba(242,237,228,0.15)" />
          <rect x="0" y="34" width="${(safeOffHome / 100) * ((width - 50) / 2 - 28)}" height="8" rx="4" fill="${theme.teamHome}" />
        </g>

        <!-- Comportamiento táctico verificado -->
        <text x="14" y="94" fill="${theme.textMuted}" font-size="9.5">${isEn ? 'Style' : 'Comportamiento'}: <tspan fill="${safeOffHome >= 50 ? theme.teamHome : theme.gold}" font-weight="800">${safeOffHome >= 50 ? (isEn ? 'High Press / Proactive' : 'Presión Alta / Proactivo') : (isEn ? 'Mid Block / Direct' : 'Bloque Medio / Repliegue')}</tspan></text>
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
