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
  ok(catalogEx && catalogEx.illustration.status === 'pilot_pending_review', `${id} en catálogo tiene status === 'pilot_pending_review'`);
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

// 3. Comportamiento Fail-Closed en canPrescribeAtHome
console.log('\n▶ [3/4] Verificando comportamiento FAIL-CLOSED en prescripción...');
const sampleEx = SYSTEM_CORE_EXERCISES.find(e => e.id === 'sys-1');

// Caso A: Sin aprobación humana (reviewed_by_human: false)
const unapprovedEx = {
  ...sampleEx,
  illustration: {
    ...sampleEx.illustration,
    status: 'pilot_pending_review',
    reviewed_by_human: false
  }
};
const resUnapproved = canPrescribeAtHome(unapprovedEx);
ok(resUnapproved.prescribable === false, 'Ejercicio en piloto sin revisión humana: Bloqueado en prescripción (prescribable === false)');
ok(resUnapproved.reason === 'pilot_illustration_pending_review', `Razón de bloqueo esperada: ${resUnapproved.reason}`);

// Caso B: Con aprobación humana (reviewed_by_human: true)
const approvedEx = {
  ...sampleEx,
  illustration: {
    ...sampleEx.illustration,
    status: 'pilot_pending_review',
    reviewed_by_human: true
  }
};
const resApproved = canPrescribeAtHome(approvedEx);
ok(resApproved.prescribable === true, 'Ejercicio en piloto con aprobación humana: Desbloqueado para prescripción (prescribable === true)');

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
