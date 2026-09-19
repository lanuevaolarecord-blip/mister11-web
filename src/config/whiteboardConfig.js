/**
 * whiteboardConfig.js
 * MÍSTER11 — Centralized Whiteboard Configuration & Sizing (FIX 3)
 * 
 * Centraliza los tamaños de tokens y elementos interactivos de la pizarra táctica,
 * aplicando una reducción del 30% respecto al baseline previo para mejorar la
 * visibilidad táctica y el espaciado sobre el césped, garantizando al mismo tiempo
 * un touch target mínimo de 48dp en dispositivos táctiles / móviles (Android First).
 */

// ==============================================================================
// DIMENSIONES & ESCALAS (REDUCCIÓN DEL 30%)
// ==============================================================================

/**
 * Baseline anterior documentado:
 * - ANTES playerCircleRadius:
 *     createPlayer: Math.max(8.5, Math.min(15.5, Math.round(canvasWidth * 0.021)))
 *     normalizarTamañoJugadores: Math.max(10, Math.min(18, Math.round(canvasWidth * 0.025)))
 * - AHORA (-30%):
 *     min: 6.0px (antes 8.5px)
 *     max: 11.0px (antes 15.5px)
 *     factor: 0.0147 (antes 0.021, reducción exacta de 30%)
 */
export const WHITEBOARD_CONFIG = {
  // Jugadores (+25% sobre escala previa para visibilidad óptima)
  player: {
    // Escala dinámica según ancho de canvas (+25%)
    radiusFactor: 0.0184, // ANTES: 0.0147 (+25%)
    minRadius: 7.5,       // ANTES: 6.0 (+25%)
    maxRadius: 13.75,     // ANTES: 11.0 (+25%)
    borderFactor: 0.18,
    minBorderWidth: 1.9,  // ANTES: 1.5 (+25%)
    // Tipografía del dorsal
    fontFactor: 0.82,
    minFontSize: 7.5,     // ANTES: 6 (+25%)
    // Foto / Avatar dentro del token
    photoSizeFactor: 1.8, // 90% del diámetro (radius * 2)
  },

  // Materiales
  material: {
    // Reducción del 30% sobre el baseline de materiales
    scaleFactor: 0.70,    // Multiplicador -30%
    defaultSize: 22,      // ANTES: 32 (32 * 0.7 = 22.4)
    fontSize: 10,         // ANTES: 14 (14 * 0.7 = 9.8)
    coneSize: 8.5,        // ANTES: 12 (12 * 0.7 = 8.4)
  },

  // Touch Target mínimo estricto Android (48dp)
  touchTarget: {
    minTargetSize: 48,    // 48x48 dp mínimo
    // Calcula el padding necesario para que el área táctil alcance al menos 48dp
    getPadding: (radius) => Math.max(10, Math.round((48 - (radius * 2)) / 2)),
  },

  // Paleta oficial de la pizarra táctica (Cero azules institucionales)
  palette: {
    localDefault: '#4CAF7D',  // Verde Campo
    rivalDefault: '#D4A843',  // Oro trigo
    stroke: '#FFFFFF',
    selectionBorder: '#4CAF7D',
    coneDefault: '#D4A843',
  },

  // Tipos canónicos de terreno soportados
  fieldTypes: [
    'full',
    'half_attack',
    'half_defense',
    'third_attack',
    'third_defense',
    'third_middle',
    'penalty_area',
    'f7',
    'f8',
    'futsal',
    'reduced',
    'blank'
  ]
};

/**
 * Calcula el radio del jugador dado el ancho actual del canvas
 * @param {number} canvasWidth 
 * @returns {number}
 */
export function getPlayerCircleRadius(canvasWidth) {
  if (!canvasWidth || canvasWidth <= 0) return WHITEBOARD_CONFIG.player.minRadius;
  const raw = Math.round(canvasWidth * WHITEBOARD_CONFIG.player.radiusFactor);
  return Math.max(WHITEBOARD_CONFIG.player.minRadius, Math.min(WHITEBOARD_CONFIG.player.maxRadius, raw));
}

/**
 * Calcula el tamaño de fuente del dorsal
 * @param {number} radius 
 * @returns {number}
 */
export function getPlayerFontSize(radius) {
  return Math.max(WHITEBOARD_CONFIG.player.minFontSize, Math.round(radius * WHITEBOARD_CONFIG.player.fontFactor));
}

/**
 * Calcula el grosor del borde
 * @param {number} radius 
 * @returns {number}
 */
export function getPlayerBorderWidth(radius) {
  return Math.max(WHITEBOARD_CONFIG.player.minBorderWidth, Math.round(radius * WHITEBOARD_CONFIG.player.borderFactor));
}

/**
 * Calcula el tamaño del avatar / foto dentro del token
 * @param {number} radius 
 * @returns {number}
 */
export function getPlayerPhotoSize(radius) {
  return Math.round(radius * WHITEBOARD_CONFIG.player.photoSizeFactor);
}

/**
 * Calcula el radio de un material escalado (-30%)
 * @param {number} baselineSize 
 * @returns {number}
 */
export function getMaterialCircleRadius(baselineSize = WHITEBOARD_CONFIG.material.defaultSize) {
  return Math.round(baselineSize * WHITEBOARD_CONFIG.material.scaleFactor);
}

/**
 * Calcula el tamaño de fuente de un material (-30%)
 * @param {number} baselineFontSize 
 * @returns {number}
 */
export function getMaterialFontSize(baselineFontSize = 14) {
  return Math.max(8, Math.round(baselineFontSize * WHITEBOARD_CONFIG.material.scaleFactor));
}

export default WHITEBOARD_CONFIG;
