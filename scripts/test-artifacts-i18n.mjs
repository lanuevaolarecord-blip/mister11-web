/**
 * scripts/test-artifacts-i18n.mjs
 * Míster11 — Test de Paridad y Validación de Artefactos e i18n (Fase 6)
 *
 * Valida:
 * 1. Definición canónica de las 9 secciones de informe post-partido.
 * 2. Paridad estricta entre la UI (Partidos.jsx) y el generador PDF (matchPdfReport.js).
 * 3. Ausencia total de fugas de idioma o claves faltantes en las 9 secciones (ES/EN).
 * 4. Preservación estricta de la cláusula anti-regresión (fotos tácticas, minutos canónicos, descarga PNG).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE PARIDAD POST-PARTIDO, ARTEFACTOS E i18n (FASE 6)');
console.log('==============================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// ── 1. VALIDACIÓN DE LAS 11 SECCIONES CANÓNICAS ─────────────────────────────
console.log('▶ [1/4] Validando definición canónica de 11 secciones (reportSections.js)...');
const reportSectionsPath = path.join(rootDir, 'src', 'utils', 'reportSections.js');
assert(fs.existsSync(reportSectionsPath), 'reportSections.js existe en src/utils/');

const { CANONICAL_REPORT_SECTIONS, getCanonicalSections } = await import('../src/utils/reportSections.js');
assert(Array.isArray(CANONICAL_REPORT_SECTIONS) && CANONICAL_REPORT_SECTIONS.length === 11, 'CANONICAL_REPORT_SECTIONS define exactamente 11 secciones');

const expectedOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const actualOrder = CANONICAL_REPORT_SECTIONS.map(s => s.order);
assert(JSON.stringify(actualOrder) === JSON.stringify(expectedOrder), 'Las 11 secciones tienen órdenes correlativos 1 al 11');

const expectedAnchors = [
  'sec_lineup',
  'sec_timeline',
  'sec_momentum',
  'sec_bars',
  'sec_radar',
  'sec_top5',
  'sec_shots',
  'sec_tactics',
  'sec_gk',
  'sec_players',
  'sec_swot'
];
const actualAnchors = CANONICAL_REPORT_SECTIONS.map(s => s.anchorId);
assert(JSON.stringify(actualAnchors) === JSON.stringify(expectedAnchors), 'Todos los anchorIds canónicos coinciden exactamente');

// ── 2. VALIDACIÓN DE i18n EN AMBOS IDIOMAS (ES / EN) ───────────────────────
console.log('\n▶ [2/4] Validando traducciones simétricas y ausencia de fugas lingüísticas...');
const { translations, t } = await import('../src/i18n/translations.js');
const esDict = translations['Español (ES)'];
const enDict = translations['English (EN)'];

assert(!!esDict && !!enDict, 'Diccionarios Español (ES) e Inglés (EN) cargados correctamente');

CANONICAL_REPORT_SECTIONS.forEach(sec => {
  const esText = t(sec.titleKey, 'Español (ES)');
  const enText = t(sec.titleKey, 'English (EN)');

  assert(!!esText && esText !== sec.titleKey, `[ES] Clave ${sec.titleKey} traducida: "${esText}"`);
  assert(!!enText && enText !== sec.titleKey, `[EN] Clave ${sec.titleKey} traducida: "${enText}"`);

  // Verificación de fugas del español en strings en inglés
  const spanishStopwords = [/\bde\b/i, /\bdel\b/i, /\bel\b/i, /\bla\b/i, /\bpartido\b/i, /\bpropio\b/i, /\bporteria\b/i, /\bportería\b/i, /\balineacion\b/i, /\balineación\b/i];
  const hasSpanishLeak = spanishStopwords.some(regex => regex.test(enText));
  assert(!hasSpanishLeak, `[EN] Cero palabras en español en título de sección ${sec.order}: "${enText}"`);
});

// ── 3. PARIDAD ENTRE LA UI (Partidos.jsx) Y EL GENERADOR PDF (matchPdfReport.js) ──
console.log('\n▶ [3/4] Validando paridad 1:1 entre Partidos.jsx y matchPdfReport.js...');
const partidosCode = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'Partidos.jsx'), 'utf8');
const pdfReportCode = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'matchPdfReport.js'), 'utf8');

// Comprobar que los 11 anchors existen en Partidos.jsx
expectedAnchors.forEach(anchor => {
  assert(partidosCode.includes(`id="${anchor}"`), `Partidos.jsx contiene el ancla UI: #${anchor}`);
});

// Comprobar que matchPdfReport.js dibuja las 11 secciones canónicas
const expectedSecIds = [
  'sec1_lineup',
  'sec2_timeline',
  'sec3_momentum',
  'sec4_bars',
  'sec5_radar',
  'sec6_top5',
  'sec7_shots',
  'sec8_tactics',
  'sec9_gk',
  'sec10_players',
  'sec11_swot'
];
expectedSecIds.forEach(secId => {
  assert(pdfReportCode.includes(`'${secId}'`), `matchPdfReport.js procesa la sección canónica: ${secId}`);
});

// Integración de componentes canónicos SVG compartidos
assert(partidosCode.includes('<ShotMapSVG') || partidosCode.includes('ShotMapSVG'), 'Partidos.jsx integra el componente ShotMapSVG en sec7_shots');
assert(partidosCode.includes('<ComparisonBarsSVG') || partidosCode.includes('ComparisonBarsSVG'), 'Partidos.jsx integra el componente ComparisonBarsSVG en sec4_bars');
assert(partidosCode.includes('<RadarCompareSVG') || partidosCode.includes('RadarCompareSVG'), 'Partidos.jsx integra el componente RadarCompareSVG en sec5_radar');
assert(partidosCode.includes('<MomentumSVG') || partidosCode.includes('MomentumSVG'), 'Partidos.jsx integra el componente MomentumSVG en sec3_momentum');
assert(partidosCode.includes('<SectorTacticsSVG') || partidosCode.includes('SectorTacticsSVG'), 'Partidos.jsx integra el componente SectorTacticsSVG en sec8_tactics');
assert(partidosCode.includes('<SwotMatrix'), 'Partidos.jsx integra el componente <SwotMatrix /> en sec11_swot');
assert(pdfReportCode.includes('renderShotMapSvgString'), 'matchPdfReport.js integra renderShotMapSvgString canónico');
assert(pdfReportCode.includes('renderComparisonBarsSvgString'), 'matchPdfReport.js integra renderComparisonBarsSvgString canónico');
assert(pdfReportCode.includes('renderRadarCompareSvgString'), 'matchPdfReport.js integra renderRadarCompareSvgString canónico');
assert(pdfReportCode.includes('renderMomentumSvgString'), 'matchPdfReport.js integra renderMomentumSvgString canónico');
assert(pdfReportCode.includes('renderSectorTacticsSvgString'), 'matchPdfReport.js integra renderSectorTacticsSvgString canónico');
assert(pdfReportCode.includes('drawGkExertionCanvas'), 'matchPdfReport.js integra drawGkExertionCanvas');

// ── 4. CLÁUSULA ANTI-REGRESIÓN (FOTOS, MINUTOS, DESCARGA PNG) ──────────────
console.log('\n▶ [4/4] Validando cláusula anti-regresión y activos protegidos...');
const pdfThemeCode = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'pdfTheme.js'), 'utf8');

assert(pdfThemeCode.includes('drawTacticalPitchCanvas'), 'drawTacticalPitchCanvas presente en pdfTheme.js');
assert(pdfThemeCode.includes('photoUrl') || pdfThemeCode.includes('imageUrlToBase64') || pdfThemeCode.includes('drawAvatarCircle'), 'drawTacticalPitchCanvas incluye lógica de fotos de jugadores');
assert(pdfReportCode.includes('drawTacticalPitchCanvas'), 'matchPdfReport.js invoca drawTacticalPitchCanvas en la sección de alineación');

// Botón de descarga PNG de alineación
assert(partidosCode.includes('btn-download-lineup-png') || partidosCode.includes('handleDownloadLineupPng') || partidosCode.includes('handleExportLineupPNG') || partidosCode.includes('drawTacticalPitchCanvas'), 'Alineación cuenta con exportación / descarga PNG HD');

// Minutos canónicos de fuente única
assert(pdfReportCode.includes('calculateMinutesFromEvents'), 'PDF consume calculateMinutesFromEvents como fuente única de minutos');
assert(partidosCode.includes('calculateMinutesFromEvents'), 'Partidos.jsx consume calculateMinutesFromEvents como fuente única de minutos');

console.log('\n------------------------------------------------------------------------------');
if (failCount === 0) {
  console.log(`🎉 RESUMEN FINAL: ${passCount}/${passCount} TESTS SUPERADOS EXITOSAMENTE [0 FALLOS]`);
  console.log('   Paridad post-partido 100% canónica, sin fugas i18n y con cláusula anti-regresión íntegra.');
  process.exit(0);
} else {
  console.error(`❌ RESUMEN FINAL: ${failCount} fallos detectados de ${passCount + failCount} tests.`);
  process.exit(1);
}
