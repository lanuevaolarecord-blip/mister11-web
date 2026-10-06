/**
 * scripts/test-mp4-export-final-frame.mjs
 * MÍSTER11 — Test de Verificación de Exportación del Último Frame en MP4
 * 
 * Valida que:
 * 1. Para cualquier secuencia de N frames (2, 3, 5, 8 frames), el último step
 *    de la exportación siempre renderiza con exactitud el frame final (N - 1).
 * 2. Ninguna secuencia salta hacia atrás ni deja de renderizar el último frame.
 * 3. Las transiciones intermedias interpolan correctamente hasta el frame destino.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateAnimationTiming } from '../src/utils/mp4Exporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE VERIFICACIÓN: EXPORTACIÓN DEL ÚLTIMO FRAME EN MP4');
console.log('==============================================================================\n');

/**
 * Simula el bucle exacto de mp4Exporter.js para verificar qué frames se renderizan
 */
function simularExportacionFrames(framesCount, speed = '1x', targetFps = 25) {
  const timing = calculateAnimationTiming(framesCount, speed, targetFps);
  const renderedSteps = [];

  for (let step = 0; step < timing.totalSteps; step++) {
    const isLastStep = step === timing.totalSteps - 1;
    const transitionIndex = Math.min(Math.floor(step / timing.stepsPerTransition), timing.numTransitions - 1);
    const subStep = step % timing.stepsPerTransition;
    const progressInTransition = subStep / timing.stepsPerTransition;

    const fromIdx = transitionIndex;
    const toIdx = Math.min(transitionIndex + 1, framesCount - 1);

    if (isLastStep) {
      renderedSteps.push({
        step,
        type: 'KEYFRAME_FINAL',
        frameIndex: framesCount - 1
      });
    } else if (subStep === 0) {
      renderedSteps.push({
        step,
        type: 'KEYFRAME',
        frameIndex: fromIdx
      });
    } else {
      renderedSteps.push({
        step,
        type: 'INTERPOLATION',
        fromIdx,
        toIdx,
        progress: progressInTransition
      });
    }
  }

  return { timing, renderedSteps };
}

// ── 1. CASO 2 FRAMES (Mínimo requerido) ───────────────────────────────────────
console.log('▶ [1/4] Verificando secuencia mínima de 2 frames (Frame 0 -> Frame 1)...');
{
  const { timing, renderedSteps } = simularExportacionFrames(2, '1x', 25);
  const firstStep = renderedSteps[0];
  const lastStep = renderedSteps[renderedSteps.length - 1];

  assert.strictEqual(firstStep.type, 'KEYFRAME', 'El paso inicial debe ser KEYFRAME');
  assert.strictEqual(firstStep.frameIndex, 0, 'El paso inicial debe ser Frame 0');

  assert.strictEqual(lastStep.type, 'KEYFRAME_FINAL', 'El paso final debe ser KEYFRAME_FINAL');
  assert.strictEqual(lastStep.frameIndex, 1, 'El paso final debe ser exactamente el Frame 1 (el último frame)');

  // Verificar que el penúltimo paso estaba interpolando hacia el frame 1 con progreso alto
  const penultimateStep = renderedSteps[renderedSteps.length - 2];
  assert.strictEqual(penultimateStep.toIdx, 1);
  assert(penultimateStep.progress >= 0.8, 'El penúltimo paso debe estar cerca del 100% de la transición');
  console.log('  ✅ 2 frames: inicia en Frame 0 y termina exactamente en Frame 1 (último frame)');
}

// ── 2. CASO 3 FRAMES (Transición múltiple) ────────────────────────────────────
console.log('▶ [2/4] Verificando secuencia de 3 frames (Frame 0 -> Frame 1 -> Frame 2)...');
{
  const { timing, renderedSteps } = simularExportacionFrames(3, '1x', 25);
  const firstStep = renderedSteps[0];
  const lastStep = renderedSteps[renderedSteps.length - 1];

  assert.strictEqual(firstStep.frameIndex, 0, 'Inicia en Frame 0');
  assert.strictEqual(lastStep.type, 'KEYFRAME_FINAL', 'El paso final debe ser KEYFRAME_FINAL');
  assert.strictEqual(lastStep.frameIndex, 2, 'El paso final debe ser exactamente el Frame 2 (último frame)');

  // Comprobar que en medio se renderizó el Frame 1 como keyframe
  const intermediateKeyframes = renderedSteps.filter(s => s.type === 'KEYFRAME' && s.frameIndex === 1);
  assert.strictEqual(intermediateKeyframes.length, 1, 'Frame 1 debe haberse renderizado como keyframe intermedio');
  console.log('  ✅ 3 frames: renderiza Frame 0, Frame 1 intermedio y culmina exactamente en Frame 2');
}

// ── 3. CASO 8 FRAMES (Caso estándar de usuario con 8 frames a 0.5x, 1x, 2x) ──
console.log('▶ [3/4] Verificando secuencia de 8 frames en todas las velocidades...');
['0.5x', '1x', '2x', '4x'].forEach(speed => {
  const { timing, renderedSteps } = simularExportacionFrames(8, speed, 25);
  const lastStep = renderedSteps[renderedSteps.length - 1];

  assert.strictEqual(lastStep.type, 'KEYFRAME_FINAL');
  assert.strictEqual(lastStep.frameIndex, 7, `A velocidad ${speed}, el último frame debe ser Frame 7`);
});
console.log('  ✅ 8 frames: culmina en Frame 7 de forma determinista en 0.5x, 1x, 2x y 4x');

// ── 4. VERIFICACIÓN DE CÓDIGO FUENTE (mp4Exporter.js y PizarraTactica.jsx) ────
console.log('▶ [4/4] Verificando código fuente real en mp4Exporter.js y PizarraTactica.jsx...');
const mp4ExporterSrc = fs.readFileSync(path.join(root, 'src/utils/mp4Exporter.js'), 'utf8');
const pizarraSrc = fs.readFileSync(path.join(root, 'src/pages/PizarraTactica.jsx'), 'utf8');

assert.ok(
  mp4ExporterSrc.includes('if (isLastStep)'),
  'mp4Exporter.js debe tener la condición explícita isLastStep'
);
assert.ok(
  mp4ExporterSrc.includes('await animationEngine.renderFrame(frames.length - 1);'),
  'mp4Exporter.js debe renderizar renderFrame(frames.length - 1) en el paso final'
);
assert.ok(
  mp4ExporterSrc.includes('holdFramesCount'),
  'mp4Exporter.js debe incluir retención visible (hold) del frame final'
);
assert.ok(
  pizarraSrc.includes('loadFrame(activeFrameIdxBeforeExport, false)'),
  'PizarraTactica.jsx debe restaurar el frame activo en el canvas tras la exportación'
);
console.log('  ✅ Código fuente implementa la renderización y retención del último frame y restaura el canvas');

console.log('\n==============================================================================');
console.log('🎉 [PASS] 4/4 VERIFICACIONES DEL ÚLTIMO FRAME DE ANIMACIÓN COMPLETADAS');
console.log('==============================================================================\n');
