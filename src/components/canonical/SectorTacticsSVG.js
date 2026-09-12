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
 * Diseño 100% Campo de Fútbol Reglamentario FIFA (105m x 68m, Ratio 1.544:1)
 * con 3 Pasillos Tácticos longitudinales, ABP y Bloque Territorial.
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
  width = 700,
  height = 480
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

  // ── DIMENSIONES REGLAMENTARIAS FIFA 105:68 (1.5441) ──────────────────────
  // Pitch canónico: 490px de largo x 317px de ancho (proporción exacta 1.545:1)
  const pW = 490;
  const pH = 317;
  const pX = 105; // Centrado en viewBox ancho 700
  const pY = 44;
  const corrH = pH / 3; // ~105.7px cada carril horizontal

  const lineStroke = 'rgba(242, 237, 228, 0.55)';
  const goldColor = '#D4A843';

  // Franjas de corte de césped (10 franjas proporcionales)
  const stripeW = pW / 10;
  const stripes = Array.from({ length: 10 }).map((_, i) => {
    const fill = i % 2 === 0 ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.025)';
    return `<rect x="${pX + i * stripeW}" y="${pY}" width="${stripeW}" height="${pH}" fill="${fill}" />`;
  }).join('');

  // Medidas a escala FIFA (105m de largo x 68m de ancho):
  // Radio círculo central = 9.15m -> 42.6px
  const centerRadius = (9.15 / 68) * pH;
  // Área grande: 16.5m largo x 40.32m ancho -> 77px x 188px
  const penaltyW = (16.5 / 105) * pW;
  const penaltyH = (40.32 / 68) * pH;
  const penaltyY = pY + (pH - penaltyH) / 2;
  // Área chica: 5.5m largo x 18.32m ancho -> 25.7px x 85.4px
  const goalAreaW = (5.5 / 105) * pW;
  const goalAreaH = (18.32 / 68) * pH;
  const goalAreaY = pY + (pH - goalAreaH) / 2;
  // Punto de penalti: 11m -> 51.3px
  const penDist = (11 / 105) * pW;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 480" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="background:${theme.bgCard}; border-radius:10px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Fondo Institucional de la Tarjeta -->
      <rect x="0" y="0" width="700" height="480" fill="${theme.bgCard}" rx="10" stroke="${theme.border}" stroke-width="1" />

      <!-- Cabecera Oficial -->
      <text x="24" y="24" fill="${theme.gold}" font-size="12" font-weight="900" letter-spacing="0.5">${isEn ? 'FIELD &amp; TACTICAL ANALYSIS: CHANNELS &amp; SET PIECES' : 'CAMPO Y TÁCTICA: PASILLOS DE ATAQUE Y TERRITORIO'}</text>
      <text x="676" y="24" text-anchor="end" fill="${theme.textSecondary}" font-size="11" font-weight="700">${safeHome} vs ${safeAway}</text>
      <line x1="24" y1="32" x2="676" y2="32" stroke="rgba(242,237,228,0.12)" stroke-width="1" />

      <!-- ── 1. TERRENO DE JUEGO REGLAMENTARIO COMPLETO FIFA (105:68) ──────── -->
      <g id="full-pitch-tactics">
        <!-- Césped Base -->
        <rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" fill="#152C22" rx="4" />
        ${stripes}

        <!-- Perímetro Reglamentario -->
        <rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" fill="none" stroke="${lineStroke}" stroke-width="2" rx="2" />

        <!-- Línea de Medio Campo y Círculo Central -->
        <line x1="${pX + pW / 2}" y1="${pY}" x2="${pX + pW / 2}" y2="${pY + pH}" stroke="${lineStroke}" stroke-width="1.8" />
        <circle cx="${pX + pW / 2}" cy="${pY + pH / 2}" r="${centerRadius.toFixed(1)}" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
        <circle cx="${pX + pW / 2}" cy="${pY + pH / 2}" r="3" fill="${lineStroke}" />

        <!-- Arcos de Córner (4 esquinas) -->
        <path d="M ${pX} ${pY + 8} A 8 8 0 0 0 ${pX + 8} ${pY}" fill="none" stroke="${lineStroke}" stroke-width="1.5" />
        <path d="M ${pX + pW - 8} ${pY} A 8 8 0 0 0 ${pX + pW} ${pY + 8}" fill="none" stroke="${lineStroke}" stroke-width="1.5" />
        <path d="M ${pX} ${pY + pH - 8} A 8 8 0 0 1 ${pX + 8} ${pY + pH}" fill="none" stroke="${lineStroke}" stroke-width="1.5" />
        <path d="M ${pX + pW - 8} ${pY + pH} A 8 8 0 0 1 ${pX + pW} ${pY + pH - 8}" fill="none" stroke="${lineStroke}" stroke-width="1.5" />

        <!-- Portería Izquierda (dorada reglamentaria fuera de la línea) -->
        <rect x="${pX - 10}" y="${pY + (pH - 50) / 2}" width="10" height="50" fill="rgba(212,168,67,0.18)" stroke="${goldColor}" stroke-width="2" rx="1" />

        <!-- Portería Derecha (dorada reglamentaria fuera de la línea) -->
        <rect x="${pX + pW}" y="${pY + (pH - 50) / 2}" width="10" height="50" fill="rgba(212,168,67,0.18)" stroke="${goldColor}" stroke-width="2" rx="1" />

        <!-- Semicírculo de penalti Izquierdo -->
        <path d="M ${pX + penaltyW} ${pY + pH / 2 - 28} A ${centerRadius.toFixed(1)} ${centerRadius.toFixed(1)} 0 0 1 ${pX + penaltyW} ${pY + pH / 2 + 28}" fill="none" stroke="${lineStroke}" stroke-width="1.6" />

        <!-- Semicírculo de penalti Derecho -->
        <path d="M ${pX + pW - penaltyW} ${pY + pH / 2 - 28} A ${centerRadius.toFixed(1)} ${centerRadius.toFixed(1)} 0 0 0 ${pX + pW - penaltyW} ${pY + pH / 2 + 28}" fill="none" stroke="${lineStroke}" stroke-width="1.6" />

        <!-- Área de Penalti y Meta Izquierda -->
        <rect x="${pX}" y="${penaltyY.toFixed(1)}" width="${penaltyW.toFixed(1)}" height="${penaltyH.toFixed(1)}" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
        <rect x="${pX}" y="${goalAreaY.toFixed(1)}" width="${goalAreaW.toFixed(1)}" height="${goalAreaH.toFixed(1)}" fill="none" stroke="${lineStroke}" stroke-width="1.6" />
        <circle cx="${(pX + penDist).toFixed(1)}" cy="${(pY + pH / 2).toFixed(1)}" r="2.5" fill="${lineStroke}" />

        <!-- Área de Penalti y Meta Derecha -->
        <rect x="${(pX + pW - penaltyW).toFixed(1)}" y="${penaltyY.toFixed(1)}" width="${penaltyW.toFixed(1)}" height="${penaltyH.toFixed(1)}" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
        <rect x="${(pX + pW - goalAreaW).toFixed(1)}" y="${goalAreaY.toFixed(1)}" width="${goalAreaW.toFixed(1)}" height="${goalAreaH.toFixed(1)}" fill="none" stroke="${lineStroke}" stroke-width="1.6" />
        <circle cx="${(pX + pW - penDist).toFixed(1)}" cy="${(pY + pH / 2).toFixed(1)}" r="2.5" fill="${lineStroke}" />

        <!-- ── 3 PASILLOS LONGITUDINALES TÁCTICOS ── -->
        <!-- Líneas divisorias de carriles (horizontales punteadas) -->
        <line x1="${pX}" y1="${pY + corrH}" x2="${pX + pW}" y2="${pY + corrH}" stroke="rgba(212, 168, 67, 0.45)" stroke-width="1.5" stroke-dasharray="6,4" />
        <line x1="${pX}" y1="${pY + corrH * 2}" x2="${pX + pW}" y2="${pY + corrH * 2}" stroke="rgba(212, 168, 67, 0.45)" stroke-width="1.5" stroke-dasharray="6,4" />

        <!-- Shading de calor por pasillo -->
        <!-- Carril Superior (Banda Izquierda) -->
        <rect x="${pX + 1}" y="${pY + 1}" width="${pW - 2}" height="${corrH - 1}" fill="${theme.teamHome}" fill-opacity="${0.06 + (leftPct / 100) * 0.25}" rx="2" />
        <!-- Carril Central (Pasillo Central) -->
        <rect x="${pX + 1}" y="${pY + corrH}" width="${pW - 2}" height="${corrH}" fill="${theme.teamHome}" fill-opacity="${0.06 + (centerPct / 100) * 0.25}" />
        <!-- Carril Inferior (Banda Derecha) -->
        <rect x="${pX + 1}" y="${pY + corrH * 2}" width="${pW - 2}" height="${corrH - 1}" fill="${theme.teamHome}" fill-opacity="${0.06 + (rightPct / 100) * 0.25}" rx="2" />

        <!-- Indicador de Dirección de Ataque -->
        <rect x="${pX + pW - 85}" y="${pY + 8}" width="75" height="18" rx="4" fill="rgba(21,44,34,0.85)" stroke="rgba(212,168,67,0.4)" stroke-width="1" />
        <text x="${pX + pW - 47}" y="${pY + 21}" text-anchor="middle" fill="${theme.gold}" font-size="9.5" font-weight="800">
          ${isEn ? 'ATTACK →' : 'ATAQUE →'}
        </text>

        <!-- Etiquetas de Pasillos Tácticos en el campo -->
        <!-- Banda Izquierda -->
        <rect x="${pX + pW * 0.30}" y="${pY + corrH * 0.5 - 13}" width="${pW * 0.40}" height="26" rx="13" fill="rgba(15,30,23,0.92)" stroke="rgba(76,175,125,0.6)" stroke-width="1.2" />
        <text x="${pX + pW * 0.5}" y="${pY + corrH * 0.5 + 4}" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="800">
          ${isEn ? 'LEFT WING' : 'BANDA IZQUIERDA'}: <tspan fill="${theme.gold}" font-weight="900">${leftPct}%</tspan>
        </text>

        <!-- Pasillo Central -->
        <rect x="${pX + pW * 0.28}" y="${pY + corrH * 1.5 - 14}" width="${pW * 0.44}" height="28" rx="14" fill="rgba(15,30,23,0.95)" stroke="rgba(212,168,67,0.7)" stroke-width="1.5" />
        <text x="${pX + pW * 0.5}" y="${pY + corrH * 1.5 + 5}" text-anchor="middle" fill="#FFFFFF" font-size="12.5" font-weight="900">
          ${isEn ? 'CENTRAL CHANNEL' : 'PASILLO CENTRAL'}: <tspan fill="${theme.gold}" font-weight="900">${centerPct}%</tspan>
        </text>

        <!-- Banda Derecha -->
        <rect x="${pX + pW * 0.30}" y="${pY + corrH * 2.5 - 13}" width="${pW * 0.40}" height="26" rx="13" fill="rgba(15,30,23,0.92)" stroke="rgba(76,175,125,0.6)" stroke-width="1.2" />
        <text x="${pX + pW * 0.5}" y="${pY + corrH * 2.5 + 4}" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="800">
          ${isEn ? 'RIGHT WING' : 'BANDA DERECHA'}: <tspan fill="${theme.gold}" font-weight="900">${rightPct}%</tspan>
        </text>
      </g>

      <!-- ── 2. TARJETAS INFERIORES: ABP Y TERRITORIO / BLOQUE ───────────────── -->
      <!-- Tarjeta 1: Balance ABP (Izquierda) -->
      <g transform="translate(24, 374)">
        <rect x="0" y="0" width="318" height="92" rx="8" fill="#152C22" stroke="rgba(76,175,125,0.35)" stroke-width="1" />
        <text x="14" y="19" fill="${theme.gold}" font-size="11" font-weight="900">${isEn ? 'SET PIECES BALANCE (ABP)' : 'BALANCE A BALÓN PARADO (ABP)'}</text>

        <!-- Fila Córners -->
        <text x="14" y="40" fill="#FFFFFF" font-size="10" font-weight="700">${isEn ? 'Corners' : 'Córners'}</text>
        <text x="210" y="40" text-anchor="end" fill="${theme.teamHome}" font-size="11.5" font-weight="900">${cornersHome}</text>
        <text x="222" y="40" text-anchor="middle" fill="${theme.textMuted}" font-size="9.5">vs</text>
        <text x="234" y="40" text-anchor="start" fill="${theme.teamAway}" font-size="11.5" font-weight="900">${cornersAway}</text>
        <rect x="14" y="45" width="290" height="5" rx="2.5" fill="rgba(242,237,228,0.12)" />
        <rect x="14" y="45" width="${cornersHome + cornersAway > 0 ? (cornersHome / (cornersHome + cornersAway)) * 290 : 145}" height="5" rx="2.5" fill="${theme.teamHome}" />

        <!-- Fila Faltas -->
        <text x="14" y="67" fill="#FFFFFF" font-size="10" font-weight="700">${isEn ? 'Fouls' : 'Faltas'}</text>
        <text x="210" y="67" text-anchor="end" fill="${theme.teamHome}" font-size="11.5" font-weight="900">${faltasHome}</text>
        <text x="222" y="67" text-anchor="middle" fill="${theme.textMuted}" font-size="9.5">vs</text>
        <text x="234" y="67" text-anchor="start" fill="${theme.teamAway}" font-size="11.5" font-weight="900">${faltasAway}</text>
        <rect x="14" y="72" width="290" height="5" rx="2.5" fill="rgba(242,237,228,0.12)" />
        <rect x="14" y="72" width="${faltasHome + faltasAway > 0 ? (faltasHome / (faltasHome + faltasAway)) * 290 : 145}" height="5" rx="2.5" fill="${theme.teamHome}" />

        <!-- Fila Penaltis -->
        <text x="14" y="86" fill="${theme.textMuted}" font-size="9.5">${isEn ? 'Penalties' : 'Penaltis'}: <tspan fill="${theme.teamHome}" font-weight="800">${penaltisHome}</tspan> vs <tspan fill="${theme.teamAway}" font-weight="800">${penaltisAway}</tspan></text>
      </g>

      <!-- Tarjeta 2: Territorio y Bloque (Derecha) -->
      <g transform="translate(358, 374)">
        <rect x="0" y="0" width="318" height="92" rx="8" fill="#152C22" stroke="rgba(76,175,125,0.35)" stroke-width="1" />
        <text x="14" y="19" fill="${theme.gold}" font-size="11" font-weight="900">${isEn ? 'TERRITORIAL BLOCK &amp; HEIGHT' : 'BLOQUE Y ALTURA TERRITORIAL'}</text>

        <!-- Porcentajes Ofensivo / Defensivo -->
        <g transform="translate(14, 26)">
          <text x="0" y="16" fill="${theme.teamHome}" font-size="18" font-weight="900">${safeOffHome}%</text>
          <text x="0" y="27" fill="${theme.textMuted}" font-size="9">${isEn ? 'Opponent Half (Attacking)' : 'Campo Rival (Ofensivo)'}</text>

          <text x="290" y="16" text-anchor="end" fill="${theme.textSecondary}" font-size="18" font-weight="900">${defHome}%</text>
          <text x="290" y="27" text-anchor="end" fill="${theme.textMuted}" font-size="9">${isEn ? 'Own Half (Defensive)' : 'Campo Propio (Defensivo)'}</text>

          <!-- Barra Territorial Bicolor -->
          <rect x="0" y="32" width="290" height="7" rx="3.5" fill="rgba(242,237,228,0.15)" />
          <rect x="0" y="32" width="${(safeOffHome / 100) * 290}" height="7" rx="3.5" fill="${theme.teamHome}" />
        </g>

        <!-- Comportamiento táctico -->
        <text x="14" y="85" fill="${theme.textMuted}" font-size="9.5">${isEn ? 'Style' : 'Comportamiento'}: <tspan fill="${safeOffHome >= 50 ? theme.teamHome : theme.gold}" font-weight="800">${safeOffHome >= 50 ? (isEn ? 'High Press / Proactive' : 'Presión Alta / Proactivo') : (isEn ? 'Mid Block / Direct' : 'Bloque Medio / Repliegue')}</tspan></text>
      </g>
    </svg>
  `;
}

export const SectorTacticsSVG = (props) => {
  const svgString = renderSectorTacticsSvgString(props);
  return React.createElement('div', {
    className: 'canonical-svg-wrapper sector-tactics-svg-wrapper',
    style: { width: '100%', maxWidth: '720px', margin: '0 auto', display: 'flex', justifyContent: 'center' },
    dangerouslySetInnerHTML: { __html: svgString }
  });
};

export default SectorTacticsSVG;
