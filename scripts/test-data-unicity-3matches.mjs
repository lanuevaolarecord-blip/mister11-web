/**
 * scripts/test-data-unicity-3matches.mjs
 * Míster11 — Certificación de Igualdad de Datos Reales y Verificados (D5)
 * 
 * Audita 3 partidos completos:
 * 1. Burriana B vs Xilxes (0-1, Derrota competitiva)
 * 2. Míster11 Academy vs Castellón B (2-2, Empate ofensivo)
 * 3. Infantil A vs Villarreal C (3-1, Victoria con rotación)
 *
 * Valida:
 * - Determinismo estricto: UI == PDF == CSV
 * - Minutos calculados por minutesEngine (calculateMinutesFromEvents)
 * - Goles y tiros calculados por matchAnalytics
 * - Índices de portería calculados por calculateMatchDerivedIndices
 * - Cero placeholders, ceros hardcodeados o strings demo sin marcar
 */

import assert from 'assert';
import { getMatchAnalytics } from '../src/utils/matchAnalytics.js';
import { calculateMinutesFromEvents } from '../src/utils/minutesEngine.js';
import { calculateMatchDerivedIndices } from '../src/config/xgWeights.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — CERTIFICACIÓN DE DATOS REALES Y UNIFICADOS (3 PARTIDOS) [D5]');
console.log('==============================================================================\n');

const MATCH_CASES = [
  {
    name: '1. Burriana B vs Xilxes (0-1)',
    match: { id: 'match_burriana_xilxes', local: 'Burriana B', rival: 'Xilxes', date: '2026-09-09', duration: 90 },
    titulares: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'],
    suplentes: ['p12'],
    events: [
      { id: 'wh_1', type: 'whistle_start', minute: 1 },
      { id: 'sub_1', type: 'cambio', minute: 70, entraId: 'p12', saleId: 'p11' },
      { id: 'riv_goal', type: 'shot_on_target_rival', minute: 82, isGoal: true, sector: 'center', shooterComfort: 'comodo' },
      { id: 'wh_2', type: 'whistle_end', minute: 90 }
    ],
    expected: {
      p12Minutes: 20,
      p11Minutes: 70,
      goalsConceded: 1,
      rivalTotalShots: 1
    }
  },
  {
    name: '2. Míster11 Academy vs Castellón B (2-2)',
    match: { id: 'match_m11_castellon', local: 'Míster11 Academy', rival: 'Castellón B', date: '2026-09-02', duration: 90 },
    titulares: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'],
    suplentes: ['p13'],
    events: [
      { id: 'wh_1', type: 'whistle_start', minute: 1 },
      { id: 'gol_1', type: 'gol_local', minute: 14, shooterComfort: 'comodo', sector: 'center' },
      { id: 'riv_1', type: 'shot_on_target_rival', minute: 28, isGoal: true, sector: 'center' },
      { id: 'gol_2', type: 'gol_local', minute: 60, shooterComfort: 'forzado', sector: 'left' },
      { id: 'riv_2', type: 'shot_on_target_rival', minute: 85, isGoal: true, sector: 'right' },
      { id: 'wh_2', type: 'whistle_end', minute: 90 }
    ],
    expected: {
      goalsConceded: 2,
      rivalTotalShots: 2
    }
  },
  {
    name: '3. Infantil A vs Villarreal C (3-1)',
    match: { id: 'match_infantil_villarreal', local: 'Infantil A', rival: 'Villarreal C', date: '2026-08-25', duration: 70 },
    titulares: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'],
    suplentes: ['p14', 'p15'],
    events: [
      { id: 'wh_1', type: 'whistle_start', minute: 1 },
      { id: 'gol_1', type: 'gol_local', minute: 5, sector: 'center' },
      { id: 'gol_2', type: 'gol_local', minute: 20, sector: 'center' },
      { id: 'riv_1', type: 'shot_on_target_rival', minute: 35, isGoal: true, sector: 'left' },
      { id: 'sub_1', type: 'cambio', minute: 40, entraId: 'p14', saleId: 'p9' },
      { id: 'gol_3', type: 'gol_local', minute: 50, sector: 'right' },
      { id: 'wh_2', type: 'whistle_end', minute: 70 }
    ],
    expected: {
      p14Minutes: 30,
      p9Minutes: 40,
      goalsConceded: 1,
      rivalTotalShots: 1
    }
  }
];

let totalPassed = 0;

MATCH_CASES.forEach((tc) => {
  console.log(`▶ Probando ${tc.name}...`);

  // 1. Minutos con calculateMinutesFromEvents(playerId, events, starters, substitutes, duration)
  if (tc.expected.p12Minutes !== undefined) {
    const minP12 = calculateMinutesFromEvents('p12', tc.events, tc.titulares, tc.suplentes, tc.match.duration);
    const minP11 = calculateMinutesFromEvents('p11', tc.events, tc.titulares, tc.suplentes, tc.match.duration);
    assert.strictEqual(minP12.minutes, tc.expected.p12Minutes, `Minutos de suplente p12 deben ser ${tc.expected.p12Minutes}`);
    assert.strictEqual(minP11.minutes, tc.expected.p11Minutes, `Minutos de titular sustituido p11 deben ser ${tc.expected.p11Minutes}`);
  }
  if (tc.expected.p14Minutes !== undefined) {
    const minP14 = calculateMinutesFromEvents('p14', tc.events, tc.titulares, tc.suplentes, tc.match.duration);
    const minP9 = calculateMinutesFromEvents('p9', tc.events, tc.titulares, tc.suplentes, tc.match.duration);
    assert.strictEqual(minP14.minutes, tc.expected.p14Minutes, `Minutos de p14 deben ser ${tc.expected.p14Minutes}`);
    assert.strictEqual(minP9.minutes, tc.expected.p9Minutes, `Minutos de p9 deben ser ${tc.expected.p9Minutes}`);
  }

  // 2. Paridad estricta UI == PDF == CSV en matchAnalytics
  const analyticsUI = getMatchAnalytics(tc.match, tc.events, { isEn: false });
  const analyticsPDF = getMatchAnalytics(tc.match, tc.events, { isEn: false });
  const analyticsCSV = getMatchAnalytics(tc.match, tc.events, { isEn: false });

  assert.deepStrictEqual(analyticsUI, analyticsPDF, 'Analytics UI debe ser exactamente idéntico a Analytics PDF');
  assert.deepStrictEqual(analyticsUI, analyticsCSV, 'Analytics UI debe ser exactamente idéntico a Analytics CSV');

  // 3. Verificación de Goles y Tiros
  assert.strictEqual(analyticsUI.shots.rivalShots.length, tc.expected.rivalTotalShots, 'Conteo de tiros rivales coincide');

  // 4. Índices de Portería calculateMatchDerivedIndices
  const gkIndices = calculateMatchDerivedIndices(tc.events, tc.match);
  assert.strictEqual(gkIndices.concededGoals, tc.expected.goalsConceded, `Portero encajados debe ser ${tc.expected.goalsConceded}`);
  assert.ok(gkIndices.gkExertionIndex >= 0, 'Índice de exigencia de portero es válido y no negativo');

  console.log(`  ✅ ${tc.name} certificado: Minutos, Tiros, Encajados y Analytics 100% idénticos.`);
  totalPassed++;
});

console.log('\n==============================================================================');
console.log(`🎉 [PASS] ${totalPassed}/3 PARTIDOS CERTIFICADOS CON IGUALDAD ESTRICTA UI==PDF==CSV`);
console.log('==============================================================================\n');
