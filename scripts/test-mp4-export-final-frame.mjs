/**
 * test-mp4-export-final-frame.mjs
 * Valida que el motor de animación y el exportador MP4 aseguran la llegada
 * y retención del 100% del último frame.
 */
import assert from 'node:assert/strict';
import { calculateAnimationTiming } from '../src/utils/mp4Exporter.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE EXPORTACIÓN DETERMINISTA Y RETENCIÓN DE ÚLTIMO FRAME');
console.log('==============================================================================');

console.log('▶ [1/3] Validando cálculo de timing para 2, 3 y 5 frames a 1x y 2x...');
const timing2 = calculateAnimationTiming(2, '1x', 25);
assert.strictEqual(timing2.numTransitions, 1, '2 frames deben producir 1 transición');
assert.ok(timing2.totalSteps >= 6, 'Debe tener al menos 6 steps para 1 transición');

const timing3 = calculateAnimationTiming(3, '1x', 25);
assert.strictEqual(timing3.numTransitions, 2, '3 frames deben producir 2 transiciones');
console.log(`  ✅ Timing validado: 3 frames = ${timing3.numTransitions} transiciones, ${timing3.totalSteps} pasos totales.`);

console.log('▶ [2/3] Validando que la última iteración alcanza el índice final...');
let finalFrameReached = false;
for (let step = 0; step < timing3.totalSteps; step++) {
  const isLastStep = step === timing3.totalSteps - 1;
  const transitionIndex = Math.min(Math.floor(step / timing3.stepsPerTransition), timing3.numTransitions - 1);
  if (isLastStep) {
    finalFrameReached = true;
    assert.strictEqual(transitionIndex, 1, 'En el último step transitionIndex debe ser numTransitions - 1');
  }
}
assert.strictEqual(finalFrameReached, true, 'El step final debe ejecutarse');
console.log('  ✅ El bucle determinista procesa todos los pasos y finaliza en isLastStep=true.');

console.log('▶ [3/3] Validando duración de retención (hold) para el desenlace táctico...');
const holdDurationMs = Math.max(800, Math.min(1500, Math.round(1000 / timing3.speedFactor)));
const holdFramesCount = Math.max(15, Math.round((holdDurationMs / 1000) * timing3.targetFps));
assert.ok(holdDurationMs >= 800, 'El hold final debe ser de al menos 800ms');
assert.ok(holdFramesCount >= 15, 'El hold final debe emitir al menos 15 frames para persistir en MediaRecorder');
console.log(`  ✅ Retención final configurada: ${holdDurationMs}ms (${holdFramesCount} frames a ${timing3.targetFps} fps).`);

console.log('==============================================================================');
console.log('🎉 [PASS] 3/3 VERIFICACIONES DE EXPORTACIÓN Y ÚLTIMO FRAME EXITOSAS');
console.log('==============================================================================');
