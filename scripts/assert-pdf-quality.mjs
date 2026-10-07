/**
 * scripts/assert-pdf-quality.mjs
 * Míster11 — Test de Calidad de PDF (PDF-Q)
 * 
 * Valida:
 * 1. Footer canónico en pdfTheme.js:
 *    - Ausencia del glifo bullet que causa el salto de espaciado 'mister11.a pp' -> 'mister11.app'
 *    - Sustitución de 'Página' con diacrítico por 'Pagina' para evitar 'Pá g ina' en Helvetica
 * 2. Resolución nativa y precedencia de 2 capas:
 *    - Prioridad estricta de fullDataUrl y boardCaptureUrl sobre thumbnails en preloadSessionImages
 *    - Inserción en PNG nativo sin compresión destructiva JPEG en diagramas y capturas
 * 3. Simulación funcional de renderizado con jsPDF verificando footer y textos limpios.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — ASSERT PDF QUALITY (OLEADA 4: RESOLUCIÓN NATIVA + FOOTER LIMPIO)');
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

// ── 1. AUDITORÍA DE FOOTER EN pdfTheme.js ─────────────────────────────────────
console.log('▶ [1/4] Auditando footer institucional en pdfTheme.js contra espaciado roto...');
const pdfThemePath = path.join(rootDir, 'src', 'utils', 'pdfTheme.js');
const pdfThemeCode = fs.readFileSync(pdfThemePath, 'utf8');

check('pdfTheme.js usa "Mister11 Platform - mister11.app" (sin bullet que rompe espaciado)', () => {
  assert.ok(pdfThemeCode.includes("doc.text('Mister11 Platform - mister11.app'"), 'Debe usar guión plano para mister11.app');
  assert.ok(!pdfThemeCode.includes("'Míster11 Platform • mister11.app'"), 'No debe contener el bullet que genera mister11.a pp');
});

check('pdfTheme.js usa "Pagina" sin tilde para evitar espaciado roto en Helvetica (Pá g ina -> Pagina)', () => {
  assert.ok(pdfThemeCode.includes('`Pagina ${cur} de ${total}`'), 'Debe usar Pagina sin tilde en drawPdfFooter');
  assert.ok(!pdfThemeCode.includes('`Página ${currentPage} de ${totalPages}`'), 'No debe contener Página que genera Pá g ina');
});

check('drawPdfFooter maneja polimorfismo de argumentos con opciones', () => {
  assert.ok(pdfThemeCode.includes("typeof pageW === 'object'"), 'Debe soportar paso de objeto en lugar de números');
});

// ── 2. AUDITORÍA DE PRECEDENCIA DE RESOLUCIÓN NATIVA EN pdfGenerator.js ───────
console.log('\n▶ [2/4] Auditando precedencia de resolución nativa (2 capas) en pdfGenerator.js...');
const pdfGenPath = path.join(rootDir, 'src', 'utils', 'pdfGenerator.js');
const pdfGenCode = fs.readFileSync(pdfGenPath, 'utf8');

check('preloadSessionImages prioriza fullDataUrl y boardCaptureUrl sobre thumbnail para diagrama principal', () => {
  const match = pdfGenCode.match(/const rawMainDiagram\s*=\s*([^;]+);/);
  assert.ok(match, 'Debe existir rawMainDiagram');
  const expr = match[1];
  const idxFull = expr.indexOf('session.fullDataUrl');
  const idxThumb = expr.indexOf('session.thumbnail');
  assert.ok(idxFull !== -1, 'fullDataUrl debe estar en la expresión');
  assert.ok(idxThumb !== -1, 'thumbnail debe estar en la expresión');
  assert.ok(idxFull < idxThumb, 'fullDataUrl debe evaluarse ANTES que thumbnail');
});

check('preloadSessionImages prioriza fullDataUrl y boardCaptureUrl sobre thumbnail en bloques', () => {
  const match = pdfGenCode.match(/let rawImg\s*=\s*([^;]+);/);
  assert.ok(match, 'Debe existir rawImg');
  const expr = match[1];
  const idxFull = expr.indexOf('b.fullDataUrl');
  const idxThumb = expr.indexOf('b.thumbnail');
  assert.ok(idxFull !== -1 && idxThumb !== -1, 'fullDataUrl y thumbnail deben estar en la expresión');
  assert.ok(idxFull < idxThumb, 'b.fullDataUrl debe evaluarse ANTES que b.thumbnail');
});

check('Inserción de diagrama principal usa PNG nativo sin compresión destructiva', () => {
  assert.ok(pdfGenCode.includes("!sessionDiagramBase64.includes('png')"), 'Debe dar precedencia a PNG si no es estrictamente JPEG');
});

check('Inserción de capturas de pizarra usa PNG nativo', () => {
  assert.ok(pdfGenCode.includes("!b64.includes('png')"), 'Capturas deben priorizar PNG');
});

check('generatePizarraPDF usa PNG nativo para diagramas tácticos', () => {
  assert.ok(pdfGenCode.includes("!imgData.includes('png')"), 'generatePizarraPDF debe priorizar PNG');
});

// ── 3. AUDITORÍA DE OTROS GENERADORES DE REPORTES ─────────────────────────────
console.log('\n▶ [3/4] Auditando reportes adicionales contra footer roto...');
const indReportPath = path.join(rootDir, 'src', 'utils', 'individualPerformancePdfReport.js');
const indCode = fs.readFileSync(indReportPath, 'utf8');

check('individualPerformancePdfReport.js usa "mister11.app" y "Pagina" sin caracteres rotos', () => {
  assert.ok(indCode.includes("mister11.app - Rendimiento Individual Verificable"), 'Debe usar guión limpio para mister11.app');
  assert.ok(indCode.includes("`Pagina ${pageNumber} de ${totalPages}`"), 'Debe usar Pagina sin tilde');
  assert.ok(!indCode.includes("• mister11.app •"), 'No debe tener bullets que rompen espaciado');
});

const anaReportPath = path.join(rootDir, 'src', 'utils', 'analysisPdfReport.js');
const anaCode = fs.readFileSync(anaReportPath, 'utf8');

check('analysisPdfReport.js usa "Pagina" sin tilde en el pie de página', () => {
  assert.ok(anaCode.includes("`Pagina ${p} de ${totalPages}`"), 'Debe usar Pagina sin tilde');
});

// ── 4. SIMULACIÓN FUNCIONAL CON jsPDF EN MEMORIA ──────────────────────────────
console.log('\n▶ [4/4] Probando simulación funcional de generación con jsPDF...');

import { jsPDF } from 'jspdf';
import { drawPdfFooter } from '../src/utils/pdfTheme.js';

check('drawPdfFooter dibuja en jsPDF y genera texto continuo sin romper "mister11.app" ni "Pagina"', () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawPdfFooter(doc, 210, 297, 1, 3);
  
  // Extraer texto generado
  const output = doc.output();
  assert.ok(output.includes('mister11.app'), 'El PDF debe contener mister11.app continuo');
  assert.ok(output.includes('Pagina 1 de 3'), 'El PDF debe contener Pagina 1 de 3');
  assert.ok(!output.includes('mister11.a pp'), 'El PDF NO debe contener "mister11.a pp"');
  assert.ok(!output.includes('Pá g ina'), 'El PDF NO debe contener "Pá g ina"');
});

console.log(`\n==============================================================================`);
console.log(`TODAS LAS PRUEBAS DE CALIDAD PDF (PDF-Q) PASARON EXITOSAMENTE (${passCount}/${passCount})`);
console.log(`==============================================================================\n`);
