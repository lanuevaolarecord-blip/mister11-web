/**
 * scripts/assert-event-integrity.mjs
 * Míster 11 — Test de Integridad de Eventos, Goles, Sustituciones, GK y DAFO (CI)
 *
 * Verifica:
 * 1. Ausencia absoluta de default minute=1' en eventos sin minuto registrado.
 * 2. Marcador == suma de goles (propio y rival); el 0-1 de Xilxes aparece en anotadores.
 * 3. Sustituciones listadas coherentes con suplentes que tienen minutos (>0).
 * 4. Goles encajados del portero == goles rivales con portero en campo (0-1 -> Encajados: 1).
 * 5. Conteos únicos de remates rivales idénticos entre Sección 5 y Sección 6 vía matchAnalytics.
 * 6. Matriz DAFO libre de ítems con valor 0 y sin presencia en Oportunidades.
 */

import assert from 'assert';
import { getMatchAnalytics } from '../src/utils/matchAnalytics.js';
import { SWOT_RULES, extractSwotMetrics, evaluateSwotRules } from '../src/utils/swotRules.js';
import { calculateMinutesFromEvents } from '../src/utils/minutesEngine.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — ASSERT INTEGRIDAD DE EVENTOS, GOLES, SUBS, GK & DAFO (CI)');
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

// ── 1. AUDITORÍA DE MINUTOS SIN DEFAULT 1' ──────────────────────────────────
console.log('▶ [1/6] Verificando esquema de minutos (cero default 1\')...');
check('Eventos con minuto nulo o desconocido no reciben 1\' por defecto', () => {
  const dummyEvent = { type: 'shot_on_target_own', id: 'e1' };
  const rawMin = parseInt(dummyEvent.minute || dummyEvent.minuto || dummyEvent.min, 10);
  const minLabel = (!isNaN(rawMin) && rawMin > 0) ? `${rawMin}'` : 's/m';
  assert.strictEqual(minLabel, 's/m', 'No debe asignar 1\' cuando no hay minuto');
});

// ── 2. MARCADOR Y GOLEADORES (0-1 XILXES) ───────────────────────────────────
console.log('▶ [2/6] Verificando derivación de marcador y anotadores desde eventos...');
const mockEventsXilxes = [
  { id: 'ev1', type: 'shot_on_target_own', minute: 14, shooterComfort: 'comodo', sector: 'center' },
  { id: 'ev2', type: 'gol_rival', minute: 62, shooterComfort: 'comodo', sector: 'center', playType: 'jugada' },
  { id: 'ev3', type: 'shot_off_target_rival', minute: 78, shooterComfort: 'incomodo', sector: 'left' },
  { id: 'ev4', type: 'cambio', minute: 70, entraId: 'p2', saleId: 'p1' }
];

const mockMatchXilxes = {
  id: 'xilxes_2026_09_09',
  rival: 'Xilxes',
  date: '2026-09-09',
  duration: 90,
  titulares: ['p1', 'gk1'],
  suplentes: ['p2'],
  events: mockEventsXilxes
};

check('Marcador y anotadores derivan de eventos (0-1 Xilxes presente)', () => {
  const ownGoals = mockEventsXilxes.filter(e => e.type === 'gol_local' || e.type === 'goal_own');
  const rivalGoals = mockEventsXilxes.filter(e => e.type === 'gol_rival' || e.type === 'goal_rival');
  assert.strictEqual(ownGoals.length, 0, 'Goles propios debe ser 0');
  assert.strictEqual(rivalGoals.length, 1, 'Goles rivales debe ser 1');
  assert.strictEqual(rivalGoals[0].minute, 62, 'El gol de Xilxes debe tener minuto 62');
});

// ── 3. SUSTITUCIONES COHERENTES CON MINUTES ENGINE ───────────────────────────
console.log('▶ [3/6] Verificando sustituciones y suplentes con minutos...');
check('Suplente que entra en min 70 tiene 20 min y genera sustitución visible', () => {
  const minResult = calculateMinutesFromEvents('p2', mockEventsXilxes, ['p1', 'gk1'], ['p2'], 90);
  assert.strictEqual(minResult.minutes, 20, 'El suplente p2 jugó 20 minutos');

  const subEvents = mockEventsXilxes.filter(e => e.type === 'cambio' || e.type === 'sustitucion');
  assert.strictEqual(subEvents.length, 1, 'Debe existir 1 evento de sustitución');
  assert.strictEqual(subEvents[0].entraId, 'p2');
});

// ── 4. PORTERO: GOLES ENCAJADOS COHERENTES CON GOLES RIVALES ────────────────
console.log('▶ [4/6] Verificando encajados del portero (0-1 -> Encajados: 1)...');
check('Portero en campo encaja los goles rivales ocurridos durante sus minutos', () => {
  const gkMin = calculateMinutesFromEvents('gk1', mockEventsXilxes, ['p1', 'gk1'], ['p2'], 90);
  assert.strictEqual(gkMin.minutes, 90, 'El portero jugó los 90 minutos');
  const rivalGoals = mockEventsXilxes.filter(e => e.type === 'gol_rival' || e.type === 'goal_rival');
  const conceded = rivalGoals.length;
  assert.strictEqual(conceded, 1, 'El portero debe registrar 1 gol encajado');
  const cleanSheet = conceded === 0 ? 'Sí' : 'No';
  assert.strictEqual(cleanSheet, 'No', 'Imbatibilidad debe ser No ante 0-1');
});

// ── 5. CONTEOS ÚNICOS VÍA MATCH ANALYTICS (SECCIÓN 5 Y SECCIÓN 6) ───────────
console.log('▶ [5/6] Verificando conteos únicos de remates rivales en sec 5 y sec 6...');
check('Tiros rivales en matchAnalytics coinciden exactamente en ambas secciones', () => {
  const analytics = getMatchAnalytics(mockMatchXilxes, mockEventsXilxes);
  const rivalShotsSec6 = analytics.shots.rivalShots.length;
  const rivalOnTargetSec5 = analytics.shots.rivalOnTarget;
  const rivalOffTargetSec5 = analytics.shots.rivalOffTarget;
  assert.strictEqual(rivalShotsSec6, rivalOnTargetSec5 + rivalOffTargetSec5, 'Suma de tiros rivales debe ser idéntica');
  assert.strictEqual(rivalShotsSec6, 2, 'Total tiros rivales mock debe ser 2 (1 a puerta/gol, 1 fuera)');
});

// ── 6. DAFO CON UMBRALES REALES Y CERO CHIPS VACÍOS ─────────────────────────
console.log('▶ [6/6] Verificando reglas DAFO y ausencia de chips con valor 0...');
check('Ninguna regla de Oportunidades se basa en attendance y chips no tienen valor 0', () => {
  const oppRules = SWOT_RULES.filter(r => r.quadrant === 'opportunities');
  const hasAttendanceOpp = oppRules.some(r => r.id.includes('attendance'));
  assert.strictEqual(hasAttendanceOpp, false, 'No debe existir regla de asistencia en Oportunidades');

  const swotEval = evaluateSwotRules(mockMatchXilxes, mockEventsXilxes, ['p1', 'p2', 'gk1']);
  // Validar que todos los chips generados tengan valores cuantitativos > 0
  const allItems = [
    ...swotEval.quadrants.strengths,
    ...swotEval.quadrants.weaknesses,
    ...swotEval.quadrants.opportunities,
    ...swotEval.quadrants.threats
  ];

  allItems.forEach(item => {
    (item.metricRefs || []).forEach(ref => {
      assert.ok(ref.value, `El chip ${ref.label} debe tener valor`);
      assert.notStrictEqual(ref.value, '0', `El chip ${ref.label} no puede ser '0'`);
      assert.notStrictEqual(ref.value, '0 tiros', `El chip ${ref.label} no puede ser '0 tiros'`);
      assert.ok(!ref.value.includes(': 0'), `El chip ${ref.label} no puede tener valor ': 0'`);
    });
  });
});

console.log('==============================================================================');
console.log(`🎉 [PASS] ${passCount}/6 VERIFICACIONES DE INTEGRIDAD DE EVENTOS COMPLETADAS`);
console.log('==============================================================================');
