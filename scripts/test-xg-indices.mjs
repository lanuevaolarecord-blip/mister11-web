/**
 * scripts/test-xg-indices.mjs
 * Míster11 — Suite de Validación Unitario para xG-Lite e Índices Derivados (Fase 2)
 */

import {
  calculateShotXg,
  calculateMatchDerivedIndices,
  XG_BASE_WEIGHTS,
  XG_COMFORT_MULTIPLIERS,
  XG_PLAY_TYPE_MULTIPLIERS
} from '../src/config/xgWeights.js';

console.log('🧪 Iniciando tests unitarios para xG-Lite e Índices Derivados...');

let passed = 0;
let failed = 0;

function assert(cond, desc, actual = null) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${desc}`);
  } else {
    failed++;
    console.error(`  ❌ FALLO: ${desc} ${actual !== null ? `(obtenido: ${JSON.stringify(actual)})` : ''}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tests Unitarios de xG por Tiro Individual
// ─────────────────────────────────────────────────────────────────────────────

// Caso A: Penalti en jugada normal (0.76 * 1.0 * 1.0 = 0.76)
const xgPenalti = calculateShotXg({ zone: 'penalti', shooterComfort: 'normal', playType: 'penalti' });
assert(xgPenalti === 0.76, 'Penalti tiene xG base = 0.76', xgPenalti);

// Caso B: Remate dentro área central, cómodo, en contragolpe
// Base 0.30 * 1.15 (cómodo) * 1.10 (contra) = 0.3795 -> 0.38
const xgCenterCounterComfortable = calculateShotXg({
  zone: 'centro_dentro',
  shooterComfort: 'comodo',
  playType: 'contra'
});
assert(xgCenterCounterComfortable === 0.38, 'Área central + cómodo + contra = 0.38', xgCenterCounterComfortable);

// Caso C: Remate dentro área central, muy presionado, balón parado
// Base 0.30 * 0.65 (muy presionado) * 0.90 (balón parado) = 0.1755 -> 0.18
const xgCenterPressedSetPiece = calculateShotXg({
  zone: 'centro_dentro',
  shooterComfort: 'muy presionado',
  playType: 'balon parado'
});
assert(xgCenterPressedSetPiece === 0.18, 'Área central + muy presionado + balón parado = 0.18', xgCenterPressedSetPiece);

// Caso D: Remate dentro área lateral, presionado, jugada
// Base 0.12 * 0.85 (presionado) * 1.00 (jugada) = 0.102 -> 0.10
const xgLateralPressed = calculateShotXg({
  zone: 'der_dentro',
  shooterComfort: 'presionado',
  playType: 'jugada'
});
assert(xgLateralPressed === 0.10, 'Área lateral + presionado + jugada = 0.10', xgLateralPressed);

// Caso E: Remate fuera del área, cómodo, jugada
// Base 0.04 * 1.15 (cómodo) * 1.00 (jugada) = 0.046 -> 0.05
const xgOutsideComfortable = calculateShotXg({
  zone: 'centro_fuera',
  shooterComfort: 'comodo',
  playType: 'jugada'
});
assert(xgOutsideComfortable === 0.05, 'Fuera de área + cómodo + jugada = 0.05', xgOutsideComfortable);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Tests de Índices Derivados con Dataset Fijo de Partido
// ─────────────────────────────────────────────────────────────────────────────

// Dataset de prueba:
// - Propios:
//   1. Tiro dentro centro, cómodo, jugada (0.30 * 1.15 = 0.35 xG)
//   2. Tiro lateral der, presionado, jugada (0.12 * 0.85 = 0.10 xG)
//   3. Tiro penalti (0.76 xG)
//   Total xG propio = 0.35 + 0.10 + 0.76 = 1.21
// - Rivales:
//   1. Tiro rival dentro centro, cómodo -> Parada Decisiva (0.35 xG)
//   2. Tiro rival dentro centro, cómodo -> Parada Decisiva (0.35 xG)
//   3. Tiro rival lateral izq, presionado -> Parada Normal (0.10 xG)
//   4. Tiro rival fuera, presionado -> Gol Rival encajado (0.04 * 0.85 = 0.03 xG)
//   Total xG rival = 0.35 + 0.35 + 0.10 + 0.03 = 0.83
//   Tiros rivales cómodos: 2 de 4 = 50%
//   Exigencia GK: 1 normal + 2 * (2 decisivas) = 1 + 4 = 5. Con 2 decisivas.
//   Si añadimos 1 parada normal más: total 2 normales + 2 decisivas = 2 + 4 = 6 ("Tarde Exigente")

const matchEvents = [
  // Tiros Propios:
  // 1. Centro dentro, cómodo, jugada: 0.30 * 1.15 * 1.00 = 0.35 xG
  { type: 'shot_on_target_own', zone: 'centro_dentro', shooterComfort: 'comodo', playType: 'jugada' },
  // 2. Lateral der, presionado, jugada: 0.12 * 0.85 * 1.00 = 0.10 xG
  { type: 'shot_off_target_own', zone: 'der_dentro', shooterComfort: 'presionado', playType: 'jugada' },
  // 3. Penalti, normal, penalti: 0.76 * 1.00 * 1.00 = 0.76 xG
  { type: 'shot_on_target_own', zone: 'penalti', shooterComfort: 'normal', playType: 'penalti' },
  // Total xG propio = 0.35 + 0.10 + 0.76 = 1.21

  // Tiros Rivales y Paradas:
  // 1. Centro dentro, cómodo, jugada: 0.35 xG -> Parada Decisiva
  { type: 'shot_on_target_rival', zone: 'centro_dentro', shooterComfort: 'comodo', playType: 'jugada' },
  { type: 'save_own', saveDifficulty: 'decisiva' },

  // 2. Centro dentro, cómodo, jugada: 0.35 xG -> Parada Decisiva
  { type: 'shot_on_target_rival', zone: 'centro_dentro', shooterComfort: 'comodo', playType: 'jugada' },
  { type: 'save_own', saveDifficulty: 'decisiva' },

  // 3. Lateral izq dentro, presionado, jugada: 0.10 xG -> Parada Normal
  { type: 'shot_on_target_rival', zone: 'izq_dentro', shooterComfort: 'presionado', playType: 'jugada' },
  { type: 'save_own', saveDifficulty: 'normal' },

  // 4. Lateral der fuera, presionado, jugada: 0.03 xG -> Parada Normal
  { type: 'shot_on_target_rival', zone: 'der_fuera', shooterComfort: 'presionado', playType: 'jugada' },
  { type: 'save_own', saveDifficulty: 'normal' },

  // 5. Centro fuera, presionado, jugada: 0.03 xG -> Gol Rival
  { type: 'shot_on_target_rival', zone: 'centro_fuera', shooterComfort: 'presionado', playType: 'jugada', outcome: 'goal', isGoal: true },
  { type: 'gol_rival' }
  // Total xG rival = 0.35 + 0.35 + 0.10 + 0.03 + 0.03 = 0.86
];

const indices = calculateMatchDerivedIndices(matchEvents);

assert(indices.ownXg === 1.21, `xG propio acumulado esperado 1.21`, indices.ownXg);
assert(indices.rivalXg === 0.86, `xG rival acumulado esperado 0.86`, indices.rivalXg);
assert(indices.normalSaves === 2, `Paradas normales = 2`, indices.normalSaves);
assert(indices.decisiveSaves === 2, `Paradas decisivas = 2`, indices.decisiveSaves);
assert(indices.totalSaves === 4, `Total paradas = 4`, indices.totalSaves);
assert(indices.gkExertionIndex === 6, `Índice de Exigencia GK = 2 + 2*2 = 6`, indices.gkExertionIndex);
assert(indices.isDemandingMatch === true, `isDemandingMatch es true cuando exigencia >= 6`, indices.isDemandingMatch);
assert(indices.concededGoals === 1, `Goles encajados = 1`, indices.concededGoals);
assert(indices.shotsFaced === 5, `Tiros a puerta recibidos = 4 paradas + 1 gol = 5`, indices.shotsFaced);
assert(indices.totalSavePct === 80, `% paradas total = 4/5 = 80%`, indices.totalSavePct);
assert(indices.rivalComfortPct === 40, `% tiros rivales cómodos = 2/5 = 40%`, indices.rivalComfortPct);

// Validar Mapa de Exposición Defensiva
assert(indices.defensiveExposureMap.dentro_centro.comodo === 2, 'Exposición centro cómodo = 2', indices.defensiveExposureMap.dentro_centro.comodo);
assert(indices.defensiveExposureMap.dentro_lateral.presionado === 1, 'Exposición lateral presionado = 1', indices.defensiveExposureMap.dentro_lateral.presionado);
assert(indices.defensiveExposureMap.fuera.presionado === 2, 'Exposición fuera presionado = 2', indices.defensiveExposureMap.fuera.presionado);

console.log(`\n📊 Resumen Tests xG e Índices: ${passed} pasados, ${failed} fallidos.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ¡Todos los tests de xG-Lite e Índices Derivados aprobados exitosamente!');
}
