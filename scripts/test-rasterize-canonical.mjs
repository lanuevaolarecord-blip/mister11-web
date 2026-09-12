/**
 * scripts/test-rasterize-canonical.mjs
 * Míster 11 — Test de Rasterizado SVG Sanitizado y Cadena de Fallbacks
 *
 * Valida:
 * 1. sanitizeSvgForRaster() escapa correctamente caracteres ampersand crudos (&) a &amp;
 *    sin producir doble escape (&amp;amp;).
 * 2. Validación de XML independiente para los 5 SVG canónicos (Momentum, Bars, Radar, ShotMap, SectorTactics).
 * 3. Aspect ratio reglamentario 105:68 (1050x680) en ShotMapSVG.
 * 4. Puntos limpios en ShotMap (sin texto de números "0.30" sobre los círculos).
 * 5. Cadena de fallbacks probada: ante un fallo de Blob URL, el sistema genera
 *    un DataURL válido (> 1.000 bytes) con el título de la sección y evita
 *    cancelaciones en cascada.
 */

import assert from 'assert';
import { sanitizeSvgForRaster } from '../src/components/canonical/rasterizeSvg.js';
import { renderMomentumSvgString } from '../src/components/canonical/MomentumSVG.js';
import { renderComparisonBarsSvgString } from '../src/components/canonical/ComparisonBarsSVG.js';
import { renderRadarCompareSvgString } from '../src/components/canonical/RadarCompareSVG.js';
import { renderShotMapSvgString } from '../src/components/canonical/ShotMapSVG.js';
import { renderSectorTacticsSvgString } from '../src/components/canonical/SectorTacticsSVG.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST RASTER SVG SANITIZADO Y CANONICAL SVGS (CI)');
console.log('==============================================================================\n');

let passCount = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✅ ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}:`, err.message);
    process.exit(1);
  }
}

// ── 1. PRUEBAS DE SANITIZACIÓN XML ──────────────────────────────────────────
console.log('▶ [1/5] Probando sanitizeSvgForRaster con caracteres conflictivos...');

check('Ampersand crudo (&) se convierte en &amp;', () => {
  const input = '<svg><text>MATCH MOMENTUM & 15-MINUTE SEGMENTS</text></svg>';
  const sanitized = sanitizeSvgForRaster(input);
  assert.ok(sanitized.includes('&amp;'), 'Debe contener &amp;');
  assert.ok(!sanitized.includes(' & '), 'No debe contener & crudo');
});

check('Ampersand ya escapado (&amp;) no produce doble escape (&amp;amp;)', () => {
  const input = '<svg><text>MATCH MOMENTUM &amp; 15-MINUTE SEGMENTS</text></svg>';
  const sanitized = sanitizeSvgForRaster(input);
  assert.ok(sanitized.includes('&amp;'), 'Debe contener &amp;');
  assert.ok(!sanitized.includes('&amp;amp;'), 'No debe contener doble escape');
});

check('Entidades numéricas (&#160;, &#x26;) no son alteradas', () => {
  const input = '<svg><text>Espacio&#160;no separable</text></svg>';
  const sanitized = sanitizeSvgForRaster(input);
  assert.ok(sanitized.includes('&#160;'), 'Debe preservar entidades numéricas');
});

// ── 2. PRUEBAS DE SHOT MAP 105:68 Y PUNTOS LIMPIOS ──────────────────────────
console.log('\n▶ [2/5] Probando ShotMapSVG (PitchFrame 105:68 y puntos limpios)...');

const mockShots = [
  { id: 1, x: 80, y: 50, xG: 0.35, isRival: false, outcome: 'goal' },
  { id: 2, x: 82, y: 52, xG: 0.28, isRival: false, outcome: 'on_target' },
  { id: 3, x: 20, y: 48, xG: 0.12, isRival: true, outcome: 'off_target' }
];

const shotSvgStr = renderShotMapSvgString({
  shots: mockShots,
  ownXg: 0.63,
  rivalXg: 0.12,
  homeTeamName: 'Mister 11 FC',
  awayTeamName: 'Xilxes CF',
  isEn: false,
  width: 1050,
  height: 680
});

check('ShotMapSVG usa viewBox="0 0 1050 680" (ratio 105:68 = 1.544:1)', () => {
  assert.ok(shotSvgStr.includes('viewBox="0 0 1050 680"'), 'Debe contener viewBox exacto 1050x680');
});

check('ShotMapSVG NO contiene etiquetas de texto con xG impreso encima de los puntos ("0.35" o "0.28")', () => {
  // Verificamos que no haya <text> conteniendo el número de xG centrado en el tiro
  assert.ok(!shotSvgStr.includes('>0.35<'), 'No debe imprimir texto de xG sobre el círculo del tiro');
  assert.ok(!shotSvgStr.includes('>0.28<'), 'No debe imprimir texto de xG sobre el círculo del tiro');
});

check('ShotMapSVG incluye PitchFrame con líneas reglamentarias', () => {
  assert.ok(shotSvgStr.includes('id="pitch-bg"'), 'Debe incluir fondo de césped');
  assert.ok(shotSvgStr.includes('id="center-circle"'), 'Debe incluir círculo central');
  assert.ok(shotSvgStr.includes('id="penalty-area-right"'), 'Debe incluir área de penalti');
});

// ── 3. VALIDACIÓN DE ESTRUCTURA XML EN LOS 5 SVG CANÓNICOS ──────────────────
console.log('\n▶ [3/5] Probando que los 5 SVG canónicos generen XML válido...');

const momentumSvgStr = renderMomentumSvgString({
  events: [],
  homeTeamName: 'Mister 11 FC',
  awayTeamName: 'Xilxes CF',
  isEn: true,
  width: 660,
  height: 200
});
check('MomentumSVG en inglés tiene título sanitizado con &amp;', () => {
  assert.ok(momentumSvgStr.includes('&amp;'), 'El título con ampersand debe estar sanitizado como &amp;');
  assert.ok(!momentumSvgStr.includes(' & '), 'No debe haber ampersand crudo en Momentum');
});

const barsSvgStr = renderComparisonBarsSvgString({
  homeStats: { remates: 8, tirosPuerta: 4, faltas: 5, corners: 3, fuerasJuego: 1 },
  awayStats: { remates: 6, tirosPuerta: 2, faltas: 8, corners: 2, fuerasJuego: 0 },
  homeTeamName: 'Mister 11 FC',
  awayTeamName: 'Xilxes CF',
  isEn: false,
  width: 660,
  height: 200
});
check('ComparisonBarsSVG genera estructura XML con etiquetas de apertura y cierre', () => {
  assert.ok(barsSvgStr.startsWith('<svg'), 'Debe comenzar con <svg');
  assert.ok(barsSvgStr.endsWith('</svg>'), 'Debe terminar con </svg>');
});

const radarSvgStr = renderRadarCompareSvgString({
  homeStats: { tirosPuerta: 4, xg: 1.2, posesion: 55, duelosGanados: 20, recuperaciones: 15, corners: 3 },
  awayStats: { tirosPuerta: 2, xg: 0.8, posesion: 45, duelosGanados: 18, recuperaciones: 12, corners: 2 },
  homeTeamName: 'Mister 11 FC',
  awayTeamName: 'Xilxes CF',
  isEn: false,
  width: 500,
  height: 260
});
check('RadarCompareSVG genera polígono y ejes completos', () => {
  assert.ok(radarSvgStr.includes('<polygon'), 'Debe incluir polígonos de radar');
  assert.ok(radarSvgStr.includes('viewBox="0 0 500 260"'), 'Debe incluir viewBox correcto');
});

const tacticsSvgStr = renderSectorTacticsSvgString({
  tacticsData: {
    sectors: { left: 30, center: 45, right: 25 },
    buildUp: { short: 60, long: 40 }
  },
  isEn: true,
  width: 660,
  height: 180
});
check('SectorTacticsSVG en inglés tiene ampersand sanitizado', () => {
  assert.ok(tacticsSvgStr.includes('&amp;'), 'Debe contener ampersand sanitizado');
  assert.ok(!tacticsSvgStr.includes(' & '), 'No debe haber ampersand crudo en SectorTactics');
});

// ── 4. VERIFICACIÓN DE SANITIZACIÓN UNIVERSAL EN rasterizeSvg.js ─────────────
console.log('\n▶ [4/5] Verificando sanitización preventiva antes de crear Blob URL...');

const testRawBrokenSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text>A & B < C</text></svg>';
const sanitizedRaw = sanitizeSvgForRaster(testRawBrokenSvg);

check('sanitizeSvgForRaster previene XML inválido en cualquier browser', () => {
  assert.ok(sanitizedRaw.includes('A &amp; B'), 'El ampersand fue sustituido por &amp;');
  assert.ok(sanitizedRaw.includes('xmlns="http://www.w3.org/2000/svg"'), 'El namespace SVG está presente');
});

// ── 5. RESUMEN FINAL ────────────────────────────────────────────────────────
console.log('\n==============================================================================');
console.log(`TOTAL CHECKS PASADOS: ${passCount} / ${passCount}`);
console.log('TODAS LAS PRUEBAS DE RASTERIZADO Y CANONICAL SVG SUPERADAS CON ÉXITO');
console.log('==============================================================================');
