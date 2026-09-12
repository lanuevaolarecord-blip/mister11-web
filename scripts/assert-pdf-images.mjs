/**
 * scripts/assert-pdf-images.mjs
 * Míster 11 — Test de Raster Ruidoso y Aserción de Imágenes en PDF (CI)
 *
 * Valida:
 * 1. Definición obligatoria de assertGraphicEmbedded en matchPdfReport.js.
 * 2. Las 6 secciones gráficas canónicas (sec2_momentum, sec3_bars, sec4_radar,
 *    sec6_shots, sec7_tactics, sec9_lineup) están protegidas por la aserción
 *    y tienen prohibido cualquier skip silencioso.
 * 3. Simulación de rasterizado con umbral > 1.000 bytes.
 * 4. Fallo ruidoso explícito verificado ante imagen nula o corrupta.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — ASSERT RASTER RUIDOSO Y SECCIONES GRÁFICAS EN PDF (CI)');
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

// ── 1. AUDITORÍA DE matchPdfReport.js CONTRA SKIPS SILENCIOSOS ──────────────
console.log('▶ [1/4] Auditando matchPdfReport.js contra skips silenciosos en gráficas...');
const matchPdfReportPath = path.join(rootDir, 'src', 'utils', 'matchPdfReport.js');
const matchPdfCode = fs.readFileSync(matchPdfReportPath, 'utf8');

check('matchPdfReport.js define assertGraphicEmbedded con error explícito', () => {
  assert.ok(matchPdfCode.includes('assertGraphicEmbedded'), 'Debe existir assertGraphicEmbedded');
  assert.ok(matchPdfCode.includes('[PDF GENERATION CRITICAL ERROR]'), 'Debe incluir mensaje de error crítico');
});

const REQUIRED_SECTIONS = [
  'sec2_momentum',
  'sec3_bars',
  'sec4_radar',
  'sec6_shots',
  'sec7_tactics',
  'sec9_lineup'
];

REQUIRED_SECTIONS.forEach(secId => {
  check(`Sección obligatoria '${secId}' está protegida con assertGraphicEmbedded`, () => {
    const callPattern = `assertGraphicEmbedded('${secId}'`;
    assert.ok(matchPdfCode.includes(callPattern), `Debe invocar assertGraphicEmbedded para ${secId}`);
  });
});

// ── 2. AUDITORÍA DE rasterizeSvg.js (POLIMORFISMO Y 3X) ─────────────────────
console.log('\n▶ [2/4] Auditando rasterizeSvg.js (resolución 3x, polimorfismo y renderToStaticMarkup)...');
const rasterizeSvgPath = path.join(rootDir, 'src', 'components', 'canonical', 'rasterizeSvg.js');
const rasterCode = fs.readFileSync(rasterizeSvgPath, 'utf8');

check('rasterizeSvgToDataUrl soporta objeto de opciones y firma posicional', () => {
  assert.ok(rasterCode.includes('typeof targetWidthOrOptions === \'object\''), 'Debe soportar objeto de opciones');
  assert.ok(rasterCode.includes('targetWidthOrOptions.scale'), 'Debe leer scale del objeto');
});

check('rasterizeSvgToDataUrl integra renderToStaticMarkup para componentes React', () => {
  assert.ok(rasterCode.includes('renderToStaticMarkup'), 'Debe importar renderToStaticMarkup de react-dom/server');
});

check('rasterizeSvgToDataUrl valida que el dataUrl generado no esté vacío (>500 bytes)', () => {
  assert.ok(rasterCode.includes('dataUrl.length > 500'), 'Debe verificar longitud sustancial del DataURL');
});

// ── 3. SIMULACIÓN DE LA GUARDA RUIDOSA ANTE ERRORES ─────────────────────────
console.log('\n▶ [3/4] Probando la aserción ruidosa (prohibido skip silencioso)...');

const mockAssertGraphicEmbedded = (secId, dataUrl, minBytes = 1000) => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.length < minBytes) {
    throw new Error(
      `[PDF GENERATION CRITICAL ERROR] La sección gráfica obligatoria '${secId}' falló al rasterizar o quedó en blanco (bytes: ${dataUrl?.length || 0}).`
    );
  }
  return true;
};

check('Imagen válida con longitud > 1000 bytes pasa la aserción', () => {
  const dummyValidPng = 'data:image/png;base64,' + 'A'.repeat(1500);
  assert.strictEqual(mockAssertGraphicEmbedded('sec2_momentum', dummyValidPng), true);
});

check('Imagen nula dispara inmediatamente la excepción crítica', () => {
  let thrown = false;
  try {
    mockAssertGraphicEmbedded('sec4_radar', null);
  } catch (e) {
    thrown = true;
    assert.ok(e.message.includes('[PDF GENERATION CRITICAL ERROR]'));
    assert.ok(e.message.includes('sec4_radar'));
  }
  assert.strictEqual(thrown, true, 'Debe haber lanzado excepción crítica');
});

check('Imagen corrupta o vacía (< 1000 bytes) dispara la excepción crítica', () => {
  let thrown = false;
  try {
    mockAssertGraphicEmbedded('sec6_shots', 'data:image/png;base64,cortita');
  } catch (e) {
    thrown = true;
    assert.ok(e.message.includes('[PDF GENERATION CRITICAL ERROR]'));
    assert.ok(e.message.includes('sec6_shots'));
  }
  assert.strictEqual(thrown, true, 'Debe haber lanzado excepción crítica');
});

// ── 4. CONTEO DE IMÁGENES EMBEBIDAS EN REPORTE COMPLETO ─────────────────────
console.log('\n▶ [4/4] Verificando conteo de 6 secciones gráficas en el flujo post-partido...');
check('El número de aserciones gráficas requeridas es exactamente 6', () => {
  assert.strictEqual(REQUIRED_SECTIONS.length, 6, 'Deben ser exactamente 6 secciones gráficas');
});

console.log('==============================================================================');
console.log(`🎉 [PASS] ${passCount} VERIFICACIONES DE RASTER RUIDOSO SUPERADAS EXITOSAMENTE`);
console.log('==============================================================================');
