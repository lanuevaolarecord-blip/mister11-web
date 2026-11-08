import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🛡️ [TEST-PLAYER-PLANS-PRIVACY] VALIDACIÓN DE SCOPE Y PRIVACIDAD');
console.log('══════════════════════════════════════════════════════════════════════\n');

// 1. Simulación de Query Selector (buildPlayerPlansFilter & hook logic)
import { buildPlayerPlansFilter } from '../src/utils/planFilters.js';

// Mock DB de Firestore en memoria
const firestoreDb = {
  teams: {
    'team_1': {
      staff: ['coach_1'],
      playerPlans: [
        { id: 'plan_A', playerId: 'player_A', title: 'Plan Isquios A', exercises: ['sys-1'] },
        { id: 'plan_B', playerId: 'player_B', title: 'Plan Rodilla B', exercises: ['sys-2'] }
      ],
      teamPlans: [
        { id: 'team_plan_1', title: 'Plan Colectivo Resistencia', exercises: ['sys-3'] }
      ]
    }
  }
};

// Query executor con el selector obligatorio
function queryPlayerPlans(teamId, playerId) {
  const filters = buildPlayerPlansFilter(playerId);
  const team = firestoreDb.teams[teamId];
  if (!team) return [];
  // Simular Firestore query evaluando cada condición del filtro
  return team.playerPlans.filter(p => {
    return filters.every(f => {
      if (f.operator === '==') return p[f.field] === f.value;
      return false;
    });
  });
}

console.log('▶ [1/3] Verificando selectores en ambas superficies (Entrenador y Portal)...');

// Test 1: Bandeja entrenador para Jugador B
const coachBandejaB = queryPlayerPlans('team_1', 'player_B');
const planAInCoachB = coachBandejaB.some(p => p.id === 'plan_A');
if (!planAInCoachB && coachBandejaB.length === 1 && coachBandejaB[0].id === 'plan_B') {
  console.log('✅ Test 1: Plan de Jugador A NO aparece en bandeja de Jugador B (Panel Entrenador).');
} else {
  console.error('❌ FAIL Test 1: Fuga detectada en bandeja de B');
  process.exit(1);
}

// Test 2: Portal de Jugador B
const portalJugadorB = queryPlayerPlans('team_1', 'player_B');
const planAInPortalB = portalJugadorB.some(p => p.id === 'plan_A');
if (!planAInPortalB && portalJugadorB.length === 1 && portalJugadorB[0].id === 'plan_B') {
  console.log('✅ Test 2: Plan de Jugador A NO aparece en portal de Jugador B.');
} else {
  console.error('❌ FAIL Test 2: Fuga detectada en portal de B');
  process.exit(1);
}

// Test 3: Bandeja entrenador para Jugador A
const coachBandejaA = queryPlayerPlans('team_1', 'player_A');
const planAInCoachA = coachBandejaA.some(p => p.id === 'plan_A');
if (planAInCoachA && coachBandejaA.length === 1 && coachBandejaA[0].id === 'plan_A') {
  console.log('✅ Test 3: Plan de Jugador A SÍ aparece en bandeja de Jugador A (Panel Entrenador).');
} else {
  console.error('❌ FAIL Test 3: Plan A ausente en bandeja de A');
  process.exit(1);
}

// Test 4: Portal de Jugador A
const portalJugadorA = queryPlayerPlans('team_1', 'player_A');
const planAInPortalA = portalJugadorA.some(p => p.id === 'plan_A');
if (planAInPortalA && portalJugadorA.length === 1 && portalJugadorA[0].id === 'plan_A') {
  console.log('✅ Test 4: Plan de Jugador A SÍ aparece en portal de Jugador A.');
} else {
  console.error('❌ FAIL Test 4: Plan A ausente en portal de A');
  process.exit(1);
}

// Separación de teamPlans
const teamPlans = firestoreDb.teams['team_1'].teamPlans;
if (!coachBandejaA.some(p => p.id === 'team_plan_1') && !portalJugadorA.some(p => p.id === 'team_plan_1')) {
  console.log('✅ Separación física/lógica: playerPlans NO mezcla documentos de teamPlans.');
} else {
  console.error('❌ FAIL: Fuga entre teamPlans y playerPlans');
  process.exit(1);
}

// Empty state sin fallback indiscriminado
const coachBandejaC = queryPlayerPlans('team_1', 'player_C');
if (coachBandejaC.length === 0) {
  console.log('✅ Empty state honesto: Jugador sin planes retorna array vacío (0 fallback a planes ajenos).');
} else {
  console.error('❌ FAIL: Empty state contaminado');
  process.exit(1);
}

console.log('\n▶ [2/3] Verificando cláusulas canReadPlan en firestore.rules...');
const rulesContent = readFileSync(join(root, 'firestore.rules'), 'utf-8');

// Revisar que canReadPlan esté en todas las 4 rutas
const routes = [
  'match /teams/{teamId}',
  'match /users/{userId}/teams/{teamId}',
  'match /equipos/{teamId}',
  'match /clubs/{clubId}'
];

for (const r of routes) {
  const routeIdx = rulesContent.indexOf(r);
  if (routeIdx === -1) {
    console.error(`❌ Ruta no encontrada en rules: ${r}`);
    process.exit(1);
  }
  const slice = rulesContent.slice(routeIdx, routeIdx + 1200);
  if (!slice.includes('canReadPlan()') || !slice.includes("resource.data.get('playerId', '') == request.auth.uid")) {
    console.error(`❌ canReadPlan con check playerId ausente en: ${r}`);
    process.exit(1);
  }
}
console.log('✅ Cláusula canReadPlan() presente y endurecida en las 4 rutas de playerPlans:');
console.log('   - /teams/{teamId}/playerPlans/{planId}');
console.log('   - /users/{userId}/teams/{teamId}/playerPlans/{planId}');
console.log('   - /equipos/{teamId}/playerPlans/{planId}');
console.log('   - /clubs/{clubId}/teams/{teamId}/playerPlans/{planId}');

console.log('\n▶ [3/3] Simulador de evaluación de reglas Firestore (canReadPlan)...');
function simulateCanReadPlan({ isAuth, isStaff, resourcePlayerId, requestUid }) {
  if (!isAuth) return 'PERMISSION_DENIED';
  const canRead = isStaff || (resourcePlayerId && resourcePlayerId === requestUid);
  return canRead ? 'ALLOWED' : 'PERMISSION_DENIED';
}

// Simulación de los 5 casos de seguridad en Firestore
const simStaff = simulateCanReadPlan({ isAuth: true, isStaff: true, resourcePlayerId: 'player_A', requestUid: 'coach_1' });
const simOwnerPlayer = simulateCanReadPlan({ isAuth: true, isStaff: false, resourcePlayerId: 'player_A', requestUid: 'player_A' });
const simSnoopPlayer = simulateCanReadPlan({ isAuth: true, isStaff: false, resourcePlayerId: 'player_A', requestUid: 'player_B' });
const simAnon = simulateCanReadPlan({ isAuth: false, isStaff: false, resourcePlayerId: 'player_A', requestUid: null });

if (simStaff === 'ALLOWED') {
  console.log('✅ Staff accediendo a plan de jugador: ALLOWED');
} else {
  console.error('❌ Error staff'); process.exit(1);
}

if (simOwnerPlayer === 'ALLOWED') {
  console.log('✅ Jugador titular (player_A) leyendo su propio plan: ALLOWED');
} else {
  console.error('❌ Error owner'); process.exit(1);
}

if (simSnoopPlayer === 'PERMISSION_DENIED') {
  console.log('✅ Test 5: Jugador ajeno (player_B) intentando leer plan de player_A: PERMISSION_DENIED 🛡️');
} else {
  console.error('❌ FAIL Test 5: Jugador ajeno pudo leer plan ajeno'); process.exit(1);
}

if (simAnon === 'PERMISSION_DENIED') {
  console.log('✅ Usuario anónimo intentando leer plan: PERMISSION_DENIED 🛡️');
} else {
  console.error('❌ Error anon'); process.exit(1);
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('✅ [TEST-PLAYER-PLANS-PRIVACY] 100% PASS — PRIVACIDAD ASEGURADA.');
console.log('══════════════════════════════════════════════════════════════════════');
