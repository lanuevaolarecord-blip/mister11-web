/**
 * scripts/test-score-and-anas-card.mjs
 * Míster 11 — Certificación de Score y Tarjeta de Jugador Scoped (OLEADA 5)
 *
 * Valida:
 * 1. Informe de partido 0-3 con deduplicación estricta de eventos:
 *    - Goles rivales unificados y deduplicados exactamente a 3 (descartando duplicados de LiveStats).
 *    - Goles locales estrictamente a 0.
 * 2. Tarjeta de jugador (Anas Barhoun) scoped al acta cerrada:
 *    - En partidos con 0 goles del equipo o 0 goles propios en acta, goals === 0 (cero contaminación).
 *    - Ignora aggregates residuales o corruptos en playerStats o documentos persistidos.
 *    - Si jugó 0 minutos en acta cerrada como suplente, matchesPlayed === 0.
 *    - Respeta overrides oficiales del acta cerrada (goalsOverride, minutesOverride).
 */

import assert from 'assert';
import { getUnifiedMatchEvents } from '../src/utils/minutesEngine.js';
import { calculatePlayerMatchStats } from '../src/utils/playerMatchStats.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — CERTIFICACIÓN DE SCORE Y TARJETA SCOPED ANAS BARHOUN (OLEADA 5)');
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

// ── 1. INFORME DE PARTIDO CON MARCADOR 0-3 Y DEDUPLICACIÓN ESTRICTA ─────────
console.log('▶ [1/2] Verificando deduplicación estricta en partido 0-3...');

const matchReal03 = {
  id: 'match_fixture_0_3',
  rival: 'Rival Potente',
  date: '2026-10-02',
  duration: 90,
  goalsFor: 0,
  goalsAgainst: 3,
  actaOficial: {
    closed: true,
    goalsFor: 0,
    goalsAgainst: 3,
    golesLocal: 0,
    golesVisita: 3,
    totalDuration: 90,
    actual: {
      'p_anas': { status: 'presente', minutesOverride: 0, minuteSource: 'acta' }
    }
  },
  events: [
    { id: 'ev_own_shot', type: 'shot_on_target_own', minute: 12, isGoal: false },
    { id: 'ev_riv_g1', type: 'gol_rival', minute: 18, isGoal: true },
    { id: 'ev_riv_g2', type: 'gol_rival', minute: 42, isGoal: true },
    { id: 'ev_riv_g3', type: 'goal_rival', minute: 75, isGoal: true }
  ],
  liveStatsEvents: [
    // Simula evento duplicado emitido concurrentemente por LiveStats en min 75
    { id: 'ls_dup_g3', type: 'gol_rival', minute: 75, isGoal: true }
  ]
};

check('getUnifiedMatchEvents deduplica fielmente a 3 goles rivales y 0 locales', () => {
  const unifiedEvents = getUnifiedMatchEvents(matchReal03);
  const ownGoals = unifiedEvents.filter(e => e && (e.type === 'gol_local' || e.type === 'goal_own' || e.type === 'gol'));
  const rivalGoals = unifiedEvents.filter(e => e && (e.type === 'gol_rival' || e.type === 'goal_rival'));

  assert.strictEqual(ownGoals.length, 0, 'Goles propios debe ser estrictamente 0');
  assert.strictEqual(rivalGoals.length, 3, 'Goles rivales deduplicados debe ser exactamente 3');
});

// ── 2. TARJETA DE ANAS BARHOUN Y JUGADORES SCOPED AL ACTA CERRADA ──────────
console.log('\n▶ [2/2] Verificando tarjeta de jugador Anas Barhoun con estadísticas verídicas...');

const anasMatches = [
  // Partido 1: Burriana B vs Xilxes (0-1) - Anas suplente 0 min
  {
    id: 'm_burriana_xilxes',
    rival: 'Xilxes',
    date: '2026-09-09',
    duration: 90,
    goalsFor: 0,
    goalsAgainst: 1,
    titulares: ['p_gk', 'p_def1'],
    suplentes: ['p_anas'],
    convocados: ['p_gk', 'p_def1', 'p_anas'],
    actaOficial: {
      closed: true,
      goalsFor: 0,
      goalsAgainst: 1,
      totalDuration: 90,
      actual: {
        'p_anas': { status: 'presente', minutesOverride: 0, minuteSource: 'acta' }
      }
    },
    // Contaminación simulada en aggregates residuales
    playerStats: {
      'p_anas': { goals: 2, assists: 1 }
    },
    events: [
      { id: 'ev_shot', type: 'shot_on_target_own', playerId: 'p_anas', isGoal: false },
      { id: 'ev_gol_riv', type: 'gol_rival', minute: 48 }
    ]
  },
  // Partido 2: Partido 0-3 - Anas convocado 0 min
  matchReal03,
  // Partido 3: Partido futuro pendiente (no debe computar en estadísticas cerradas)
  {
    id: 'm_future_match',
    rival: 'Villarreal C',
    date: '2026-11-15',
    status: 'Pendiente',
    goalsFor: 0,
    goalsAgainst: 0,
    titulares: ['p_anas'],
    actaOficial: { closed: false },
    events: []
  }
];

check('Tarjeta de Anas Barhoun refleja 0 GOL y 0 PJ cuando el acta refleja 0 goles y 0 min', () => {
  const anasStats = calculatePlayerMatchStats('p_anas', anasMatches);

  assert.strictEqual(anasStats.goals, 0, 'Anas Barhoun debe tener exactamente 0 goles');
  assert.strictEqual(anasStats.assists, 0, 'Anas Barhoun debe tener exactamente 0 asistencias');
  assert.strictEqual(anasStats.matchesPlayed, 0, 'Anas Barhoun debe tener 0 PJ por no disputar minutos');
  assert.strictEqual(anasStats.minutesPlayed, 0, 'Anas Barhoun debe tener 0 minutos en temporada');
});

check('Overrides oficiales del acta cerrada se aplican determinísticamente', () => {
  const matchWithOverride = {
    id: 'm_override_test',
    rival: 'Castellón B',
    date: '2026-09-20',
    duration: 90,
    goalsFor: 1,
    goalsAgainst: 0,
    titulares: ['p_anas'],
    suplentes: [],
    actaOficial: {
      closed: true,
      goalsFor: 1,
      goalsAgainst: 0,
      actual: {
        'p_anas': { status: 'titular', minutesOverride: 45, goalsOverride: 1, minuteSource: 'acta' }
      }
    },
    events: []
  };

  const statsWithOverride = calculatePlayerMatchStats('p_anas', [matchWithOverride]);
  assert.strictEqual(statsWithOverride.goals, 1, 'goalsOverride del acta debe reflejarse');
  assert.strictEqual(statsWithOverride.minutesPlayed, 45, 'minutesOverride del acta debe reflejarse');
  assert.strictEqual(statsWithOverride.matchesPlayed, 1, 'Partidos jugados debe ser 1 con 45 min');
});

console.log(`\n==============================================================================`);
console.log(`TODAS LAS PRUEBAS DE SCORE Y TARJETA SCOPED PASARON EXITOSAMENTE (${passCount}/${passCount})`);
console.log(`==============================================================================\n`);
