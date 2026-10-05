/**
 * scripts/test-mp4-export-parameters.mjs
 * MÍSTER11 — Test de Verificación de Parámetros de Exportación MP4
 * Calidad (720p/1080p/2K/4K), Velocidad (0.5x, 1x, 2x, 4x) y Duración exacta.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getVideoDimensions, calculateAnimationTiming } from '../src/utils/mp4Exporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let pass = 0;
const test = (d, fn) => {
  try {
    fn();
    console.log(`  ✅ ${d}`);
    pass++;
  } catch (e) {
    console.error(`  ❌ ${d}: ${e.message}`);
    process.exit(1);
  }
};

console.log('==============================================================================');
console.log('MÍSTER 11 — VERIFICACIÓN PARÁMETROS MP4 (CALIDAD, VELOCIDAD, DURACIÓN)');
console.log('==============================================================================\n');

// ── 1. VERIFICACIÓN DE RESOLUCIÓN Y BITRATE POR CALIDAD (LANDSCAPE / PORTRAIT) ──
console.log('▶ [CALIDAD / RESOLUCIÓN] Mapeo de perfiles de video a dimensiones reales');

test('720p landscape -> 1280x720 @ 5 Mbps', () => {
  const d = getVideoDimensions('720p', 'landscape');
  assert.strictEqual(d.width, 1280);
  assert.strictEqual(d.height, 720);
  assert.strictEqual(d.bitrate, 5000000);
});

test('1080p landscape (Full HD) -> 1920x1080 @ 12 Mbps', () => {
  const d = getVideoDimensions('1080p', 'landscape');
  assert.strictEqual(d.width, 1920);
  assert.strictEqual(d.height, 1080);
  assert.strictEqual(d.bitrate, 12000000);
});

test('2K landscape (QHD) -> 2560x1440 @ 20 Mbps', () => {
  const d = getVideoDimensions('2K', 'landscape');
  assert.strictEqual(d.width, 2560);
  assert.strictEqual(d.height, 1440);
  assert.strictEqual(d.bitrate, 20000000);
});

test('4K landscape (UHD) -> 3840x2160 @ 35 Mbps', () => {
  const d = getVideoDimensions('4K', 'landscape');
  assert.strictEqual(d.width, 3840);
  assert.strictEqual(d.height, 2160);
  assert.strictEqual(d.bitrate, 35000000);
});

test('1080p portrait -> 1080x1920 (inversión de ejes para formato vertical)', () => {
  const d = getVideoDimensions('1080p', 'portrait');
  assert.strictEqual(d.width, 1080);
  assert.strictEqual(d.height, 1920);
});

// ── 2. VERIFICACIÓN DE VELOCIDAD Y DURACIÓN EXACTA (CASO CAPTURA: 8 FRAMES) ────
console.log('\n▶ [VELOCIDAD Y DURACIÓN] Correspondencia 1:1 con la ventana de exportación');

test('Caso Captura Dueño (8 frames, 0.5x): Duración estimada = 11.2 s exacta', () => {
  const t = calculateAnimationTiming(8, '0.5x', 25);
  assert.strictEqual(t.speedFactor, 0.5);
  assert.strictEqual(t.numTransitions, 7);
  assert.strictEqual(t.totalDurationSec, 11.2);
  assert.ok(Math.abs(t.transitionDurationSec - 1.6) < 1e-9);
  assert.strictEqual(t.stepsPerTransition, 40);
  // Intervalo por step: 11200ms / 280 steps = 40ms exactos (25 fps)
  assert.strictEqual(Math.round(t.stepIntervalMs), 40);
});

test('8 frames a 1x (velocidad normal): Duración = 5.6 s', () => {
  const t = calculateAnimationTiming(8, '1x', 25);
  assert.strictEqual(t.speedFactor, 1.0);
  assert.strictEqual(t.totalDurationSec, 5.6);
  assert.ok(Math.abs(t.transitionDurationSec - 0.8) < 1e-9);
  assert.strictEqual(t.stepsPerTransition, 20);
  assert.strictEqual(Math.round(t.stepIntervalMs), 40);
});

test('8 frames a 2x (velocidad rápida): Duración = 2.8 s', () => {
  const t = calculateAnimationTiming(8, '2x', 25);
  assert.strictEqual(t.speedFactor, 2.0);
  assert.strictEqual(t.totalDurationSec, 2.8);
  assert.ok(Math.abs(t.transitionDurationSec - 0.4) < 1e-9);
  assert.strictEqual(t.stepsPerTransition, 10);
  assert.strictEqual(Math.round(t.stepIntervalMs), 40);
});

test('8 frames a 4x (sprint): Duración = 1.4 s', () => {
  const t = calculateAnimationTiming(8, '4x', 25);
  assert.strictEqual(t.speedFactor, 4.0);
  assert.strictEqual(t.totalDurationSec, 1.4);
  assert.ok(Math.abs(t.transitionDurationSec - 0.2) < 1e-9);
  assert.strictEqual(t.stepsPerTransition, 5);
  assert.strictEqual(Math.round(t.stepIntervalMs), 40);
});

// ── 3. PROPAGACIÓN DE PARÁMETROS EN EL CÓDIGO REAL ───────────────────────────
console.log('\n▶ [INTEGRACIÓN] Verificación de paso de parámetros entre componentes');

const pizSrc = fs.readFileSync(path.join(root, 'src/pages/PizarraTactica.jsx'), 'utf8');
const animEngineSrc = fs.readFileSync(path.join(root, 'src/utils/animationEngine.js'), 'utf8');
const mp4ExporterSrc = fs.readFileSync(path.join(root, 'src/utils/mp4Exporter.js'), 'utf8');

test('PizarraTactica propaga quality, speed, orientation, zoom, panX, panY a exportAnimationMP4', () => {
  assert.ok(pizSrc.includes('quality: options?.quality || \'1080p\''));
  assert.ok(pizSrc.includes('speed: options?.speed || \'1x\''));
  assert.ok(pizSrc.includes('zoom: options?.zoom || 1'));
  assert.ok(pizSrc.includes('panX: options?.panX || 0'));
  assert.ok(pizSrc.includes('panY: options?.panY || 0'));
});

test('animationEngine configura outputCanvas con targetWidth y targetHeight seleccionados', () => {
  assert.ok(animEngineSrc.includes('outputCanvas.width = targetWidth;'));
  assert.ok(animEngineSrc.includes('outputCanvas.height = targetHeight;'));
  assert.ok(animEngineSrc.includes('fc.toCanvasElement(multiplier)'));
});

test('mp4Exporter utiliza timing y videoBitsPerSecond adaptados a la calidad', () => {
  assert.ok(mp4ExporterSrc.includes('calculateAnimationTiming(frames.length, speed, 25)'));
  assert.ok(mp4ExporterSrc.includes('videoBitsPerSecond: bitrate'));
  assert.ok(mp4ExporterSrc.includes('recCanvas.captureStream(timing.targetFps)'));
});

console.log(`\n🎉 [PASS] ${pass}/${pass} verificaciones de exportación MP4 pasadas con éxito\n`);
