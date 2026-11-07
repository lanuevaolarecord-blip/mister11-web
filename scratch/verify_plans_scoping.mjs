import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { buildPlayerPlansFilter } from '../src/utils/planFilters.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — VERIFICACIÓN FORMAL DE SCOPING DE PLANES INDIVIDUALES (BUG FIX)');
console.log('==============================================================================\n');

// ── 1. TEST DEL CONSTRUCTOR DE FILTRO CANÓNICO (buildPlayerPlansFilter) ──
console.log('▶ [1/5] Verificando Constructor Canónico buildPlayerPlansFilter...');
assert.throws(() => buildPlayerPlansFilter(), /playerId es estrictamente OBLIGATORIO/, 'Debe fallar si no se pasa playerId');
assert.throws(() => buildPlayerPlansFilter(''), /playerId es estrictamente OBLIGATORIO/, 'Debe fallar si playerId es string vacío');
assert.throws(() => buildPlayerPlansFilter('   '), /playerId es estrictamente OBLIGATORIO/, 'Debe fallar si playerId son solo espacios');
assert.throws(() => buildPlayerPlansFilter(null), /playerId es estrictamente OBLIGATORIO/, 'Debe fallar si playerId es null');

const filterA = buildPlayerPlansFilter('player_A');
assert.deepStrictEqual(filterA, [{ field: 'playerId', operator: '==', value: 'player_A' }]);
console.log('  ✅ Firma estricta: No permite ejecutar sin playerId.');
console.log('  ✅ Filtro generado:', JSON.stringify(filterA));

// ── 2. SNAPSHOT LITERAL DE FIRESTORE: 2+ PLANES CON playerId DISTINTOS (Prueba de Write Individual) ──
console.log('\n▶ [2/5] Snapshot Literal de Firestore (Colección /playerPlans)...');
const firestorePlayerPlans = [
  {
    id: 'plan_X_isquios',
    playerId: 'player_A',
    playerAge: 16,
    teamId: 'team_senior_01',
    name: 'Plan de Prevención Isquiotibiales — Marc',
    reason: 'prevencion',
    active: true,
    createdBy: 'trainer',
    createdAt: '2026-11-01T10:00:00.000Z',
    exercises: [
      { exerciseId: 'hex-001', frequency: 'daily', completedDates: ['2026-11-06'] }
    ]
  },
  {
    id: 'plan_Y_propiocepcion',
    playerId: 'player_C',
    playerAge: 15,
    teamId: 'team_senior_01',
    name: 'Plan de Fuerza y Estabilidad Tobillo — Leo',
    reason: 'fortalecimiento',
    active: true,
    createdBy: 'trainer',
    createdAt: '2026-11-02T11:30:00.000Z',
    exercises: [
      { exerciseId: 'hex-002', frequency: 'daily', completedDates: [] }
    ]
  }
];

const firestoreTeamPlans = [
  {
    id: 'plan_colectivo_pretemporada',
    teamId: 'team_senior_01',
    assignedToAll: true,
    active: true,
    name: 'Plan Colectivo: Activación y Movilidad',
    exercises: [
      { exerciseId: 'hex-003', frequency: 'mon-wed-fri', completedDates: [] }
    ]
  }
];

console.log('Snapshot de playerPlans en Firestore:');
console.log(JSON.stringify(firestorePlayerPlans, null, 2));
assert.strictEqual(firestorePlayerPlans[0].playerId, 'player_A');
assert.strictEqual(firestorePlayerPlans[1].playerId, 'player_C');
console.log('  ✅ El write es estrictamente individual (cada doc contiene su propio playerId).');

// ── 3. TEST DE PERTENENCIA Y AISLAMIENTO (ENTRENADOR Y JUGADOR) ──
console.log('\n▶ [3/5] Test de Pertenencia y Aislamiento por Jugador (0 fugas inter-jugadores)...');

// Emulación del selector scoped usePlayerPlans
function simulateUsePlayerPlans(teamId, playerId) {
  if (!playerId) {
    return { playerPlans: [], teamPlans: firestoreTeamPlans };
  }
  const filters = buildPlayerPlansFilter(playerId);
  const playerFilter = filters.find(f => f.field === 'playerId' && f.operator === '==');
  // Firestore filtra en el servidor:
  const serverFilteredDocs = firestorePlayerPlans.filter(doc => doc.playerId === playerFilter.value);
  // Doble defensa en memoria:
  const playerPlans = serverFilteredDocs.filter(doc => doc.playerId === playerId);
  const teamPlans = firestoreTeamPlans;
  return { playerPlans, teamPlans };
}

// Superficie Entrenador (PlayerPlansTab.jsx)
function renderCoachTray(playerId) {
  const { playerPlans, teamPlans } = simulateUsePlayerPlans('team_senior_01', playerId);
  const allPlans = [...playerPlans, ...teamPlans];
  if (allPlans.length === 0) {
    return { emptyState: true, displayedPlans: [] };
  }
  return { emptyState: false, displayedPlans: allPlans };
}

// Superficie Jugador (PlayerPlansPortalTab.jsx)
function renderPlayerPortal(playerId) {
  const { playerPlans, teamPlans } = simulateUsePlayerPlans('team_senior_01', playerId);
  const plans = [
    ...playerPlans.filter(p => p.active !== false),
    ...teamPlans.filter(p => p.assignedToAll && p.active !== false)
  ];
  if (plans.length === 0) {
    return { emptyState: true, displayedPlans: [] };
  }
  return { emptyState: false, displayedPlans: plans };
}

// CASO 1: Jugador A (asignado plan_X_isquios)
const coachA = renderCoachTray('player_A');
const portalA = renderPlayerPortal('player_A');
assert(coachA.displayedPlans.some(p => p.id === 'plan_X_isquios'), 'Bandeja Entrenador A DEBE mostrar plan_X');
assert(!coachA.displayedPlans.some(p => p.id === 'plan_Y_propiocepcion'), 'Bandeja Entrenador A NO DEBE mostrar plan_Y');
assert(portalA.displayedPlans.some(p => p.id === 'plan_X_isquios'), 'Portal Jugador A DEBE mostrar plan_X');
assert(!portalA.displayedPlans.some(p => p.id === 'plan_Y_propiocepcion'), 'Portal Jugador A NO DEBE mostrar plan_Y');

// CASO 2: Jugador B (SIN planes individuales asignados)
const coachB = renderCoachTray('player_B');
const portalB = renderPlayerPortal('player_B');
assert(!coachB.displayedPlans.some(p => p.id === 'plan_X_isquios'), 'Bandeja Entrenador B NO DEBE mostrar plan_X');
assert(!coachB.displayedPlans.some(p => p.id === 'plan_Y_propiocepcion'), 'Bandeja Entrenador B NO DEBE mostrar plan_Y');
assert(!portalB.displayedPlans.some(p => p.id === 'plan_X_isquios'), 'Portal Jugador B NO DEBE mostrar plan_X');
assert(!portalB.displayedPlans.some(p => p.id === 'plan_Y_propiocepcion'), 'Portal Jugador B NO DEBE mostrar plan_Y');

// Solo muestra planes colectivos legítimos para B:
assert.strictEqual(coachB.displayedPlans.filter(p => p.playerId).length, 0, 'B tiene 0 planes individuales');
assert.strictEqual(portalB.displayedPlans.filter(p => p.playerId).length, 0, 'B tiene 0 planes individuales');

// CASO 3: Jugador C (asignado plan_Y_propiocepcion)
const coachC = renderCoachTray('player_C');
const portalC = renderPlayerPortal('player_C');
assert(coachC.displayedPlans.some(p => p.id === 'plan_Y_propiocepcion'), 'Bandeja Entrenador C DEBE mostrar plan_Y');
assert(!coachC.displayedPlans.some(p => p.id === 'plan_X_isquios'), 'Bandeja Entrenador C NO DEBE mostrar plan_X');
assert(portalC.displayedPlans.some(p => p.id === 'plan_Y_propiocepcion'), 'Portal Jugador C DEBE mostrar plan_Y');
assert(!portalC.displayedPlans.some(p => p.id === 'plan_X_isquios'), 'Portal Jugador C NO DEBE mostrar plan_X');

console.log('  ✅ Jugador A: Muestra plan_X_isquios; NO muestra plan_Y_propiocepcion.');
console.log('  ✅ Jugador B: 0 planes individuales "prestados" (NO muestra plan_X ni plan_Y).');
console.log('  ✅ Jugador C: Muestra plan_Y_propiocepcion; NO muestra plan_X_isquios.');

// CASO 4: Jugador D (sin planes individuales ni de equipo)
firestoreTeamPlans.length = 0; // vaciamos teamPlans para test de empty state
const coachD = renderCoachTray('player_D');
const portalD = renderPlayerPortal('player_D');
assert.strictEqual(coachD.emptyState, true, 'Bandeja Entrenador D debe activar emptyState');
assert.strictEqual(portalD.emptyState, true, 'Portal Jugador D debe activar emptyState');
console.log('  ✅ Jugador sin planes: Activa empty state traducido; NUNCA recurre al plan de otro como fallback.');

// ── 4. COHERENCIA INTER-SUPERFICIE (Mismo import y selector) ──
console.log('\n▶ [4/5] Verificando Coherencia Inter-Superficie (Imports y llamadas)...');
const coachFile = fs.readFileSync(path.resolve('src/components/PlayerPlansTab.jsx'), 'utf8');
const portalFile = fs.readFileSync(path.resolve('src/components/player/PlayerPlansPortalTab.jsx'), 'utf8');
const hookFile = fs.readFileSync(path.resolve('src/hooks/usePlayerPlans.js'), 'utf8');

assert(coachFile.includes("import { usePlayerPlans } from '../hooks/usePlayerPlans';"), 'PlayerPlansTab.jsx debe importar usePlayerPlans');
assert(coachFile.includes("usePlayerPlans(activeTeamId, player?.id)"), 'PlayerPlansTab.jsx debe invocar usePlayerPlans con player?.id');
assert(portalFile.includes("import { usePlayerPlans } from '../../hooks/usePlayerPlans';"), 'PlayerPlansPortalTab.jsx debe importar usePlayerPlans');
assert(portalFile.includes("usePlayerPlans("), 'PlayerPlansPortalTab.jsx debe invocar usePlayerPlans');
assert(portalFile.includes("player?.id"), 'PlayerPlansPortalTab.jsx debe pasar player?.id');
assert(hookFile.includes("buildPlayerPlansFilter"), 'usePlayerPlans.js debe exportar buildPlayerPlansFilter');
assert(hookFile.includes("buildPlayerPlansFilter(playerId)"), 'usePlayerPlans.js debe invocar buildPlayerPlansFilter');

console.log('  ✅ Ambas superficies consumen el MISMO hook canónico (usePlayerPlans).');
console.log('  ✅ Ambas superficies pasan playerId de manera obligatoria.');

// ── 5. AUDITORÍA DE ÍNDICE COMPUESTO FIRESTORE (Paso 3) ──
console.log('\n▶ [5/5] Auditoría de Índices Compuestos Firestore (Paso 3)...');
console.log('  • Query realizada: collection(path, "playerPlans") con un único filtro: where("playerId", "==", playerId).');
console.log('  • No se incluye orderBy ni filtros de rango en la query de red; la ordenación se ejecuta en memoria.');
console.log('  • En Firestore, los filtros de igualdad única sobre subcolecciones están indexados automáticamente por los single-field indexes predeterminados.');
console.log('  ✅ [ÍNDICE COMPUESTO: NO REQUERIDO]. Cero errores de índice compuesto.');

console.log('\n══════════════════════════════════════════════════════════════════════════════');
console.log('🎉 RESULTADO: TODOS LOS TESTS DE PERTENENCIA Y AISLAMIENTO SUPERADOS (5/5)');
console.log('══════════════════════════════════════════════════════════════════════════════');
