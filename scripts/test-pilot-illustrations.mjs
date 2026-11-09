import { PILOT_VECTOR_ILLUSTRATIONS, getPilotIllustration } from '../src/data/vectorIllustrations.js';
import { canPrescribeAtHome } from '../src/utils/exerciseSafety.js';
import { SYSTEM_CORE_EXERCISES } from '../src/data/systemCoreExercises.js';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../src/data/exerciseSafetyMap.js';

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🎨 [TEST-PILOT-ILLUSTRATIONS] VALIDACIÓN PILOTO VECTORIAL B5-A');
console.log('══════════════════════════════════════════════════════════════════════\n');

let failed = false;
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌ FALLÓ:'} ${msg}`);
  if (!cond) failed = true;
};

// 1. Verificación de catálogo y selección bajo riesgo
console.log('▶ [1/4] Verificando selección de ejercicios bajo riesgo (sin fisio)...');
const pilotIds = Object.keys(PILOT_VECTOR_ILLUSTRATIONS);
ok(pilotIds.length >= 3 && pilotIds.length <= 5, `Piloto contiene ${pilotIds.length} ejercicios (esperado 3-5): [${pilotIds.join(', ')}]`);

for (const id of pilotIds) {
  const safety = CANONICAL_EXERCISE_SAFETY_MAP[id];
  const catalogEx = SYSTEM_CORE_EXERCISES.find(e => e.id === id);
  ok(safety && safety.tier_riesgo === 'bajo', `${id} tiene tier_riesgo === 'bajo' en mapa de seguridad`);
  ok(safety && safety.edadMin <= 10, `${id} tiene edadMin <= 10 (edadMin=${safety?.edadMin})`);
  ok(safety && safety.supervision === false, `${id} requiere_supervision_presencial === false`);
  ok(catalogEx && catalogEx.illustration.type === 'vector_svg', `${id} en catálogo tiene illustration.type === 'vector_svg'`);
  ok(catalogEx && catalogEx.illustration.status === 'rejected_by_owner', `${id} en catálogo tiene status === 'rejected_by_owner'`);
  ok(catalogEx && typeof catalogEx.illustration.rejection_note === 'string', `${id} en catálogo tiene rejection_note formal`);
}

// 2. Integridad de los SVGs vectoriales y clínica
console.log('\n▶ [2/4] Verificando pureza vectorial SVG y clínica derivada...');
for (const id of pilotIds) {
  const item = PILOT_VECTOR_ILLUSTRATIONS[id];
  ok(item.svg.startsWith('<svg') && item.svg.endsWith('</svg>'), `${id}: Formato SVG válido y completo`);
  ok(!item.svg.includes('<image') && !item.svg.includes('data:image/'), `${id}: 0 fotos ni bitmaps incrustados (100% vectorial)`);
  ok(item.svg.includes('#1B3A2D') || item.svg.includes('#4CAF7D') || item.svg.includes('#D4A843'), `${id}: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)`);
  ok(item.clinicalData.targetZones.length > 0, `${id}: targetZones anatómicas declaradas: ${item.clinicalData.targetZones.join(', ')}`);
  ok(item.clinicalData.coachingPoints.length >= 3, `${id}: Coaching points clínicos presentes (${item.clinicalData.coachingPoints.length})`);
  ok(item.clinicalData.mistakesToAvoid.length >= 2, `${id}: Errores comunes a evitar presentes (${item.clinicalData.mistakesToAvoid.length})`);
}

// 3. Comportamiento Fail-Closed en canPrescribeAtHome (D2 — Rechazo del Dueño)
console.log('\n▶ [3/4] Verificando comportamiento FAIL-CLOSED en prescripción (D2)...');

for (const id of pilotIds) {
  const catalogEx = SYSTEM_CORE_EXERCISES.find(e => e.id === id);
  const resRejected = canPrescribeAtHome(catalogEx);
  ok(resRejected.prescribable === false, `${id}: Bloqueado fail-closed por rechazo del dueño (prescribable === false)`);
  ok(resRejected.reason === 'illustration_rejected_by_owner', `${id}: Razón de bloqueo correcta ('illustration_rejected_by_owner')`);
  ok(resRejected.badge.includes('rechazada por el dueño'), `${id}: Badge informativo correcto ("${resRejected.badge}")`);
}

// Caso B: Intento de forzar reviewed_by_human en estado rejected_by_owner -> Sigue bloqueado
const forcedEx = {
  ...SYSTEM_CORE_EXERCISES.find(e => e.id === 'sys-1'),
  illustration: {
    status: 'rejected_by_owner',
    reviewed_by_human: true
  }
};
const resForced = canPrescribeAtHome(forcedEx);
ok(resForced.prescribable === false, 'Forzar reviewed_by_human: true en estado rejected_by_owner NO desbloquea la prescripción (Fail-Closed estricto)');

// 4. Verificación de ausencia de IA alucinada
console.log('\n▶ [4/4] Verificando trazabilidad y ausencia de IA alucinada...');
for (const id of pilotIds) {
  const item = PILOT_VECTOR_ILLUSTRATIONS[id];
  ok(item.author === 'agent' && item.reviewed_by_human === false, `${id}: Marcado explícito de revisión humana pendiente`);
}

if (failed) {
  console.error('\n❌ [FAIL] Fallos detectados en test de ilustraciones del piloto.');
  process.exit(1);
} else {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('✅ [TEST-PILOT-ILLUSTRATIONS] 100% PASS — PILOTO B5-A CERTIFICADO.');
  console.log('══════════════════════════════════════════════════════════════════════');
}
