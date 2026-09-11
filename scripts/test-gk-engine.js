import { calcGkPerformanceScore, GK_RATING_WEIGHTS } from '../src/utils/testScoreEngine.js';
import { deriveStatsFromEvents, calcPerformanceScore } from '../src/utils/ratingFormula.js';
import { calculatePlayerGlobalXP } from '../src/utils/attendanceStatsHelper.js';

console.log('🧤 Iniciando suite de validación del motor de métricas de portero (POR)...');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// 1. Test baseline score for GK with minutes and clean sheet
// Base 5.0 + cleanSheet 1.0 = 6.0
const baseScore = calcGkPerformanceScore({ minutes: 90, conceded: 0 });
assert(baseScore === 6.0, `GK con 90 min y 0 goles recibe 5.0 base + 1.0 clean sheet = 6.0 (obtenido: ${baseScore})`);

// 2. Test GK with saves, penalty save and clean sheet
// 5.0 + (5 * 0.15 = 0.75) + 1.0 (cleanSheet) + (1 * 0.5 = 0.5) + (2 * 0.05 = 0.10) = 7.35
const greatMatch = calcGkPerformanceScore({
  minutes: 90,
  saves: 5,
  conceded: 0,
  penaltySaves: 1,
  claims: 2
});
assert(greatMatch === 7.35, `GK con paradas y clean sheet recibe 7.35 (obtenido: ${greatMatch})`);

// 3. Test GK with conceded goals and error leading to goal
// 5.0 + (1 * 0.15 = 0.15) - (4 * 0.10 = 0.40) - (1 * 0.50 = 0.50) = 4.25
const roughMatch = calcGkPerformanceScore({
  minutes: 90,
  saves: 1,
  conceded: 4,
  errorGoal: 1
});
assert(roughMatch === 4.25, `GK con 4 goles encajados y 1 error recibe 4.25 (obtenido: ${roughMatch})`);

// 4. Test deriveStatsFromEvents for role 'POR'
const events = [
  { type: 'save', playerId: 'gk1' },
  { type: 'save', playerId: 'gk1' },
  { type: 'penaltySave', playerId: 'gk1' },
  { type: 'claim', playerId: 'gk1' },
  { type: 'conceded', playerId: 'gk1' }
];

const derived = deriveStatsFromEvents('gk1', events, 'POR');
assert(derived.saves === 2, `derived.saves == 2 (obtenido: ${derived.saves})`);
assert(derived.penaltySaves === 1, `derived.penaltySaves == 1 (obtenido: ${derived.penaltySaves})`);
assert(derived.claims === 1, `derived.claims == 1 (obtenido: ${derived.claims})`);
assert(derived.conceded === 1, `derived.conceded == 1 (obtenido: ${derived.conceded})`);
assert(derived.isGoalkeeper === true, `isGoalkeeper es true para role POR`);

// 5. Test calcPerformanceScore routing for role 'POR'
const perfScore = calcPerformanceScore(derived, 'POR');
assert(typeof perfScore === 'number' && perfScore > 0, `calcPerformanceScore para POR calcula nota válida: ${perfScore}`);

// 6. Test calculatePlayerGlobalXP awards GK bonuses
// GK XP: (10 saves * 2 = 20) + (2 cleanSheets * 15 = 30) + (1 penaltySave * 10 = 10) = 60 GK XP
// Minutes: 90 * 0.2 = 18 XP
// Attendance: 50 XP
// Total matchXP: 18 + 60 = 78 XP, totalXP = 128
const xpResult = calculatePlayerGlobalXP({
  attendanceXP: 50,
  playerMatchStats: {
    isGoalkeeper: true,
    minutesPlayed: 90,
    yellowCards: 0,
    redCards: 0,
    gkStats: {
      saves: 10,
      cleanSheets: 2,
      penaltySaves: 1
    }
  }
});

assert(xpResult.matchXP === 78, `calculatePlayerGlobalXP calcula 78 matchXP incluyendo 60 XP de portero (obtenido: ${xpResult.matchXP})`);
assert(xpResult.totalXP === 128, `calculatePlayerGlobalXP calcula 128 totalXP (obtenido: ${xpResult.totalXP})`);

// 7. Test calcGkPerformanceScore con paradas decisivas (ponderación doble)
// Normal: 2 paradas, Decisivas: 2 paradas -> weightedSaves = 2 + 2*2 = 6
// 5.0 + (6 * 0.15 = 0.90) + 1.0 (cleanSheet) = 6.90
const decisiveMatchScore = calcGkPerformanceScore({
  minutes: 90,
  saves: 4,
  decisiveSaves: 2,
  conceded: 0
});
assert(decisiveMatchScore === 6.90, `GK con 2 normales y 2 decisivas pondera 6 paradas equivalentes = 6.90 (obtenido: ${decisiveMatchScore})`);

// 8. Test calculatePlayerGlobalXP con paradas decisivas (+2 extra XP por decisiva)
// 4 saves * 2 = 8 XP + 2 decisive * 2 = 4 XP extra + 1 clean sheet * 15 = 15 XP -> 27 GK XP
// Minutes: 90 * 0.2 = 18 XP -> total matchXP = 18 + 27 = 45 XP
const xpDecisiveResult = calculatePlayerGlobalXP({
  attendanceXP: 50,
  playerMatchStats: {
    isGoalkeeper: true,
    minutesPlayed: 90,
    yellowCards: 0,
    redCards: 0,
    gkStats: {
      saves: 4,
      decisiveSaves: 2,
      cleanSheets: 1,
      penaltySaves: 0
    }
  }
});
assert(xpDecisiveResult.matchXP === 45, `calculatePlayerGlobalXP calcula 45 matchXP con bonus de decisivas (obtenido: ${xpDecisiveResult.matchXP})`);

console.log(`\n🧤 Resumen GK Engine Test: ${passed} pasados, ${failed} fallidos.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ¡Todas las pruebas del motor de portero superadas con éxito!');
}
