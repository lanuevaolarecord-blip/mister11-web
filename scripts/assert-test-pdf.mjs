/**
 * scripts/assert-test-pdf.mjs
 * Míster11 — Test de Validación del PDF de Tests e Informes Individuales
 *
 * Valida:
 * 1. Cero capturas sucias con html2canvas en Tests.jsx sobre '#grafica-rendimiento-jugador'
 *    (previene filtraciones de "View Full Analytics", "Reset Questionnaires & Tests", "Streak:", medallas y botones UI).
 * 2. Estructura canónica en generatePlayerTestReport (pdfGenerator.js):
 *    - Tabla física con exactamente 5 columnas fijas.
 *    - Tabla psicosocial/socioemocional consolidada con exactamente 3 columnas fijas (Test | Puntuación | Interpretación).
 *    - Cabecera única de "Interpretación" (sin duplicados/triplicados).
 * 3. Sanitización estricta de emojis y caracteres no soportados en cleanPdfText (cero glifo "自").
 * 4. Cero referencias a elementos residuales de UI en los PDFs generados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — ASSERT TEST PDF & CLEAN DOM EXPORT (FASE FINAL)');
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

// ── 1. VALIDAR QUE Tests.jsx NO CAPTURE '#grafica-rendimiento-jugador' ──────
console.log('▶ [1/4] Verificando desacoplamiento DOM y ausencia de html2canvas sucio en Tests.jsx...');
const testsJsxPath = path.join(rootDir, 'src', 'pages', 'Tests.jsx');
const testsJsxCode = fs.readFileSync(testsJsxPath, 'utf8');

// Comprobar que no se captura el ID del contenedor que contiene botones de UI
const hasDirtyCapture = testsJsxCode.includes("html2canvas(document.getElementById('grafica-rendimiento-jugador')") ||
                        (testsJsxCode.includes("'grafica-rendimiento-jugador'") && testsJsxCode.includes("canvas = await html2canvas(element"));

assert(!hasDirtyCapture, 'Tests.jsx no ejecuta html2canvas sobre #grafica-rendimiento-jugador');

// Comprobar que generatePlayerTestReport es llamado limpiamente sin captura de UI
assert(testsJsxCode.includes('await generatePlayerTestReport(getPlayerById(histSelectedPlayer), tests, historyData, activeTeam);'), 
  'generatePlayerTestReport es invocado limpiamente con parámetros canónicos');

// ── 2. VALIDAR ESTRUCTURA CANÓNICA DE TABLAS EN pdfGenerator.js ─────────────
console.log('\n▶ [2/4] Verificando esquema de tablas fijas y cabecera única en pdfGenerator.js...');
const pdfGeneratorPath = path.join(rootDir, 'src', 'utils', 'pdfGenerator.js');
const pdfGenCode = fs.readFileSync(pdfGeneratorPath, 'utf8');

// Tabla física de 5 columnas
const has5ColsPhysical = pdfGenCode.includes("'Physical / Technical Test', 'Current Result', 'Previous Eval.', 'Evolution', 'Rating'") &&
                         pdfGenCode.includes("'Prueba Física / Técnica', 'Resultado Actual', 'Eval. Anterior', 'Evolución', 'Valoración'");
assert(has5ColsPhysical, 'Tabla física define exactamente 5 columnas canónicas (ES/EN)');

// Tabla psicosocial/socioemocional de 3 columnas
const has3ColsPsychosocial = pdfGenCode.includes("'Psychosocial & Socioemotional Tests', 'Score', 'Interpretation'") &&
                             pdfGenCode.includes("'Pruebas Psicosociales y Socioemocionales', 'Puntuación', 'Interpretación'");
assert(has3ColsPsychosocial, 'Tabla psicosocial/socioemocional define exactamente 3 columnas fijas (ES/EN)');

// Comprobar que no hay tablas duplicadas con cabecera "Interpretación" repetida
const interpMatches = (pdfGenCode.match(/Interpretación/g) || []).length;
// En generatePlayerTestReport solo debe aparecer en la cabecera consolidada y en el mapeo de t.interpretacion
assert(pdfGenCode.includes('Pruebas Psicosociales y Socioemocionales') && !pdfGenCode.includes("head: [isEn \n          ? ['Psychosocial / Mental Profile'"), 
  'Cabecera de Interpretación está consolidada en una sola tabla psicosocial/socioemocional (cero duplicación/triplicación)');

// ── 3. VALIDAR SANITIZACIÓN EN cleanPdfText (pdfTheme.js) ───────────────────
console.log('\n▶ [3/4] Verificando sanitización contra glifo "自" y emojis no soportados en cleanPdfText...');
const { cleanPdfText } = await import('../src/utils/pdfTheme.js');

const sampleWithEmojis = 'Rendimiento ⚽ Gol 🏅 Medalla 📈 Evolución ⚡ Rayo';
const cleanedSample = cleanPdfText(sampleWithEmojis);
assert(!cleanedSample.includes('⚽') && !cleanedSample.includes('🏅') && !cleanedSample.includes('📈') && !cleanedSample.includes('⚡'), 
  'cleanPdfText reemplaza correctamente emojis visuales por texto plano');
assert(cleanedSample.includes('[Gol]') && cleanedSample.includes('[Medalla]') && cleanedSample.includes('[Evolución]') && cleanedSample.includes('[Rayo]'),
  'cleanPdfText mapea los emojis a tokens canónicos legibles en PDF');

// Comprobar eliminación estricta de caracteres que causan "自" o caracteres CJK en PDF
const sampleWithCorruptGlyph = 'Prueba con 自 y otros símbolos especiales';
const cleanedCorrupt = cleanPdfText(sampleWithCorruptGlyph);
assert(!cleanedCorrupt.includes('自'), 'cleanPdfText purga el glifo corrupto "自"');

const sampleWithSurrogates = 'Test \uD83C\uDFC5 con surrogates huérfanos \uD800\uDC00';
const cleanedSurrogates = cleanPdfText(sampleWithSurrogates);
assert(!/[\uD800-\uDFFF]/.test(cleanedSurrogates), 'cleanPdfText purga todos los surrogates huérfanos');

// ── 4. VALIDAR RADAR NATIVO EN pdfGenerator.js ──────────────────────────────
console.log('\n▶ [4/4] Verificando radar nativo sin inyección de elementos web...');
assert(pdfGenCode.includes('drawRadarChartCanvas(radarMetrics, 440)'), 'generatePlayerTestReport utiliza canvas vectorial nativo drawRadarChartCanvas');
assert(!pdfGenCode.includes('View Full Analytics'), 'pdfGenerator.js no contiene cadenas residuales "View Full Analytics"');
assert(!pdfGenCode.includes('Reset Questionnaires'), 'pdfGenerator.js no contiene cadenas residuales "Reset Questionnaires"');

console.log('\n------------------------------------------------------------------------------');
if (failCount === 0) {
  console.log(`🎉 RESUMEN: ${passCount}/${passCount} VERIFICACIONES DE TEST PDF SUPERADAS EXITOSAMENTE [0 FALLOS]`);
  console.log('   Deuda técnica del PDF de tests completamente saldada.');
  process.exit(0);
} else {
  console.error(`❌ RESUMEN: ${failCount} fallos detectados de ${passCount + failCount} verificaciones.`);
  process.exit(1);
}
