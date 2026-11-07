import assert from 'assert';

// Simulación de la estructura actual ANTES del fix

// Datos en Firestore (colección /teams/team_1/playerPlans y /teams/team_1/teamPlans)
const firestoreStore = {
  'teams/team_1/playerPlans': [
    {
      id: 'plan_X',
      playerId: 'player_A',
      teamId: 'team_1',
      name: 'Plan de Prevención Isquios — Jugador A',
      reason: 'prevencion',
      active: true,
      exercises: [{ exerciseId: 'hex-001', frequency: 'daily' }]
    },
    {
      id: 'plan_Y',
      playerId: 'player_C',
      teamId: 'team_1',
      name: 'Plan de Fuerza — Jugador C',
      reason: 'fortalecimiento',
      active: true,
      exercises: [{ exerciseId: 'hex-002', frequency: 'daily' }]
    }
  ],
  'teams/team_1/teamPlans': [
    {
      id: 'plan_T',
      teamId: 'team_1',
      assignedToAll: true,
      name: 'Plan Colectivo Pretemporada',
      active: true,
      exercises: [{ exerciseId: 'hex-003', frequency: 'mon-wed-fri' }]
    }
  ]
};

console.log('=== TEST DIFERENCIAL PASO 0 — ANTES DEL FIX ===');

// 1. Snapshot literal de Firestore de los documentos en playerPlans
console.log('\n--- 1. SNAPSHOT LITERAL DE FIRESTORE (/playerPlans) ---');
console.log(JSON.stringify(firestoreStore['teams/team_1/playerPlans'], null, 2));

// 2. Simulación de la lectura del Entrenador en "Mi Equipo" (PlayerPlansTab.jsx:13, 72) ANTES DEL FIX
function coachViewBefore(playerId) {
  // usePlayerPlans(teamId) SIN filtro de playerId
  const playerPlans = firestoreStore['teams/team_1/playerPlans'];
  const teamPlans = firestoreStore['teams/team_1/teamPlans'];
  // PlayerPlansTab.jsx línea 72: const allPlans = [...playerPlans, ...teamPlans];
  const allPlans = [...playerPlans, ...teamPlans];
  return allPlans;
}

// 3. Simulación de la lectura del Jugador en Portal (PlayerPlansPortalTab.jsx:231) ANTES DEL FIX
function playerPortalQueryBefore(playerId) {
  // Query sin filtro en Firestore: collection(db, `${cleanPath}/playerPlans`)
  const wireDocs = firestoreStore['teams/team_1/playerPlans']; // fuga de red: descarga todos los planes de todos
  // Filtro en cliente:
  const clientFiltered = wireDocs.filter(p => (p.playerId === playerId || p.assignedToAll) && p.active !== false);
  return { wireDocsCount: wireDocs.length, displayed: clientFiltered };
}

const coachA_before = coachViewBefore('player_A');
const coachB_before = coachViewBefore('player_B');
const coachC_before = coachViewBefore('player_C');

console.log('\n--- 2. RESULTADOS BANDEJA ENTRENADOR ("Mi Equipo") ANTES DEL FIX ---');
console.log(`Bandeja Jugador A (asignado plan_X): muestra ${coachA_before.map(p => p.id).join(', ')}`);
console.log(`Bandeja Jugador B (SIN planes): muestra ${coachB_before.map(p => p.id).join(', ')} <-- BUG FUGA: B ve plan_X y plan_Y`);
console.log(`Bandeja Jugador C (asignado plan_Y): muestra ${coachC_before.map(p => p.id).join(', ')} <-- BUG FUGA: C ve plan_X`);

const portalA_before = playerPortalQueryBefore('player_A');
const portalB_before = playerPortalQueryBefore('player_B');

console.log('\n--- 3. RESULTADOS PORTAL JUGADOR ANTES DEL FIX ---');
console.log(`Portal Jugador A: wireDocs=${portalA_before.wireDocsCount}, displayed=${portalA_before.displayed.map(p => p.id).join(', ')}`);
console.log(`Portal Jugador B: wireDocs=${portalB_before.wireDocsCount} (descargó planes ajenos por red), displayed=${portalB_before.displayed.map(p => p.id).join(', ')}`);

// Verificación de hipótesis H1
const bugPresentCoachB = coachB_before.some(p => p.id === 'plan_X');
console.log(`\n¿Bandeja de B muestra plan_X antes del fix?: ${bugPresentCoachB ? 'SÍ (CONFIRMA H1: QUERY SIN FILTRO)' : 'NO'}`);
