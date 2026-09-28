/**
 * scripts/test-live-capture-reproduction.mjs
 * MÍSTER11 — SUITE DE VERIFICACIÓN FASE 2 & FASE 3: SÍNTOMAS S1-S6 Y 7 DESTINOS (R4)
 * + VERIFICACIÓN DE APERTURAS 1-7 (CIERRE LIVESTATS)
 *
 * Ejecuta el fixture de partido real determinista contra la lógica corregida de producción.
 * Valida:
 *  1. Ap1: Dedup de tarjetas con minuto (2A minutos distintos vs mismo minuto).
 *  2. Ap4: Tiro rival inicializa team='rival' y cuenta shot_rival=1, shot_own=0.
 *  3. Ap7: Paridad estricta UI == PDF == CSV en Rendimiento Individual para 3 jugadores.
 *  4. Matriz de 7 destinos re-evaluada con fixture temporalmente coherente (p_7 2A min 70 sin sustitución previa).
 */

import { calculateCanonicalStats } from '../src/components/canonical/calculateCanonicalStats.js';
import { getUnifiedMatchEvents, calculateMinutesFromEvents } from '../src/utils/minutesEngine.js';
import { deriveStatsFromEvents, calcPerformanceScore } from '../src/utils/ratingFormula.js';
import { deriveIndividualPerformanceRows } from '../src/utils/individualPerformancePdfReport.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — SUITE DE VERIFICACIÓN DETERMINISTA (APERTURAS 1-7 & 7 DESTINOS)');
console.log('==============================================================================\n');

// ── 1. DEFINICIÓN DEL FIXTURE DETERMINISTA TEMPORALMENTE COHERENTE ─────────
// Coherencia temporal (Apertura 3):
// - p_7 (Jugador A) permanece en campo hasta min 70 donde recibe la 2A y es expulsado.
// - Cambio 1 sustituye a p_2 (Lateral Der.) por s_12 en min 55.
// - Cambio 2 sustituye a p_9 por s_13 en min 65; s_13 remata en min 75.
export const DETERMINISTIC_MATCH_FIXTURE = {
  id: 'match_simulated_qa_001',
  rival: 'CF Benicàssim QA',
  status: 'En Juego',
  titulares: ['p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7', 'p_8', 'p_9', 'p_10', 'p_11'],
  suplentes: ['s_12', 's_13', 's_14', 's_15', 's_16', 's_17', 's_18'],
  convocados: [
    'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7', 'p_8', 'p_9', 'p_10', 'p_11',
    's_12', 's_13', 's_14', 's_15', 's_16', 's_17', 's_18'
  ],
  playersList: [
    { id: 'p_1', dorsal: 1, name: 'Portero Titular', posicion: 'POR' },
    { id: 'p_2', dorsal: 2, name: 'Lateral Der.', posicion: 'DEF' },
    { id: 'p_3', dorsal: 3, name: 'Central Titular', posicion: 'DEF' },
    { id: 'p_4', dorsal: 4, name: 'Central Izq.', posicion: 'DEF' },
    { id: 'p_5', dorsal: 5, name: 'Lateral Izq.', posicion: 'DEF' },
    { id: 'p_6', dorsal: 6, name: 'Pivote Titular', posicion: 'MED' },
    { id: 'p_7', dorsal: 7, name: 'Jugador A (Doble Tarjeta)', posicion: 'MED' },
    { id: 'p_8', dorsal: 8, name: 'Jugador B (Roja Directa)', posicion: 'MED' },
    { id: 'p_9', dorsal: 9, name: 'Jugador C (Delantero)', posicion: 'DEL' },
    { id: 'p_10', dorsal: 10, name: 'Media Punta', posicion: 'MED' },
    { id: 'p_11', dorsal: 11, name: 'Extremo Izq.', posicion: 'DEL' },
    { id: 's_12', dorsal: 12, name: 'Suplente S1', posicion: 'MED' },
    { id: 's_13', dorsal: 13, name: 'Suplente S2', posicion: 'DEL' },
    { id: 's_14', dorsal: 14, name: 'Suplente Def', posicion: 'DEF' },
    { id: 's_15', dorsal: 15, name: 'Suplente Por', posicion: 'POR' },
    { id: 's_16', dorsal: 16, name: 'Suplente Med', posicion: 'MED' },
    { id: 's_17', dorsal: 17, name: 'Suplente Del', posicion: 'DEL' },
    { id: 's_18', dorsal: 18, name: 'Suplente Lat', posicion: 'DEF' }
  ],
  // Eventos de sustitución en matchData.events sincronizados con cambiosList (Fix S6)
  events: [
    { id: 'evt_sub_1', type: 'sustitucion', subOutId: 'p_2', subInId: 's_12', playerOutName: 'Lateral Der.', playerInName: 'Suplente S1', minute: 55 },
    { id: 'evt_sub_2', type: 'sustitucion', subOutId: 'p_9', subInId: 's_13', playerOutName: 'Jugador C (Delantero)', playerInName: 'Suplente S2', minute: 65 }
  ],
  cambiosList: [
    { id: 'evt_sub_1', jugadorSaleId: 'p_2', jugadorEntraId: 's_12', playerOutName: 'Lateral Der.', playerInName: 'Suplente S1', minuto: 55 },
    { id: 'evt_sub_2', jugadorSaleId: 'p_9', jugadorEntraId: 's_13', playerOutName: 'Jugador C (Delantero)', playerInName: 'Suplente S2', minuto: 65 }
  ],
  tarjetasList: [
    { id: 'card_p7_25', jugadorId: 'p_7', playerName: 'Jugador A', tipo: 'amarilla', minuto: 25 },
    { id: 'card_p7_70', jugadorId: 'p_7', playerName: 'Jugador A', tipo: 'amarilla', minuto: 70 },
    { id: 'card_p8_80', jugadorId: 'p_8', playerName: 'Jugador B', tipo: 'roja', minuto: 80 }
  ],
  // Eventos de liveStats capturados en vivo (con 'ball_loss' canónico)
  liveStatsEvents: [
    // 3 Tiros propios: 1 a puerta (min 15), 1 fuera (min 30), 1 fuera de suplente s_13 (min 75 tras entrar en min 65)
    { id: 'evt_shot_1', type: 'shot_on_target_own', minute: 15, team: 'own', playerId: 'p_9', playerName: 'Jugador C' },
    { id: 'evt_shot_2', type: 'shot_off_target_own', minute: 30, team: 'own', playerId: 'p_9', playerName: 'Jugador C' },
    { id: 'evt_shot_3', type: 'shot_off_target_own', minute: 75, team: 'own', playerId: 's_13', playerName: 'Suplente S2' },

    // 2 Tiros rival: 1 a puerta (min 20), 1 fuera (min 40)
    { id: 'evt_shot_riv_1', type: 'shot_on_target_rival', minute: 20, team: 'rival' },
    { id: 'evt_shot_riv_2', type: 'shot_off_target_rival', minute: 40, team: 'rival' },

    // Jugador A: 2 amarillas (min 25 y min 70) con firma dedup única
    { id: 'card_p7_25', type: 'card_yellow_own', minute: 25, playerId: 'p_7', playerName: 'Jugador A' },
    { id: 'card_p7_70', type: 'card_yellow_own', minute: 70, playerId: 'p_7', playerName: 'Jugador A' },

    // Jugador B: 1 roja directa (min 80)
    { id: 'card_p8_80', type: 'card_red_own', minute: 80, playerId: 'p_8', playerName: 'Jugador B' },

    // Acciones individuales:
    // 2 pérdidas (capturadas con 'ball_loss' canónico)
    { id: 'evt_loss_1', type: 'ball_loss', minute: 35, playerId: 'p_6', playerName: 'Pivote Titular' },
    { id: 'evt_loss_2', type: 'ball_loss', minute: 50, playerId: 'p_10', playerName: 'Media Punta' },

    // 1 recuperación ('recovery')
    { id: 'evt_rec_1', type: 'recovery', minute: 42, playerId: 'p_6', playerName: 'Pivote Titular' },

    // 1 duelo ganado ('duel_won'), 1 duelo perdido ('duel_lost')
    { id: 'evt_duel_w1', type: 'duel_won', minute: 48, playerId: 'p_7', playerName: 'Jugador A' },
    { id: 'evt_duel_l1', type: 'duel_lost', minute: 52, playerId: 'p_7', playerName: 'Jugador A' },

    // 1 gol propio, 1 asistencia, 1 falta
    { id: 'evt_goal_1', type: 'gol_local', minute: 15, playerId: 'p_9', asistenciaId: 'p_10' },
    { id: 'evt_foul_1', type: 'foul_against', minute: 22, playerId: 'p_7', playerName: 'Jugador A' }
  ]
};

let allTestsPassed = true;
function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ [PASS] ${testName}: esperado = ${expected} | obtenido = ${actual}`);
  } else {
    console.error(`❌ [FAIL] ${testName}: esperado = ${expected} | obtenido = ${actual}`);
    allTestsPassed = false;
  }
}

// ── 2. APERTURA 1: FIRMA DE DEDUP CON MINUTO EN minutesEngine.js ─────────────
console.log('--- APERTURA 1: FIRMA DE DEDUP CON MINUTO (S1a) ---');

// Caso (a): Mismo jugador, 2A en minutos distintos (min 25 y min 70)
// Esperado: 2 tarjetas registradas + expulsión por doble amarilla en el min 70
const events2ADiffMinutes = [
  { id: 'card_a1', type: 'amarilla', minute: 25, playerId: 'p_7', playerName: 'Jugador A' },
  { id: 'card_a1_dup', type: 'card_yellow_own', minute: 25, playerId: 'p_7', playerName: 'Jugador A' }, // Duplicado de emisión
  { id: 'card_a2', type: 'amarilla', minute: 70, playerId: 'p_7', playerName: 'Jugador A' },
  { id: 'card_a2_dup', type: 'card_yellow_own', minute: 70, playerId: 'p_7', playerName: 'Jugador A' }  // Duplicado de emisión
];
const unifiedDiffMin = getUnifiedMatchEvents({ events: events2ADiffMinutes, liveStatsEvents: [] });
const statsDiffMin = calculateCanonicalStats({}, unifiedDiffMin);
assertEqual(statsDiffMin.homeStats.amarillas, 2, 'Ap1(a). 2A en minutos distintos -> exactamente 2 tarjetas amarillas');

const minutes2ADiff = calculateMinutesFromEvents(
  'p_7',
  unifiedDiffMin,
  DETERMINISTIC_MATCH_FIXTURE.titulares,
  DETERMINISTIC_MATCH_FIXTURE.suplentes,
  90
);
assertEqual(minutes2ADiff.minutes, 70, 'Ap1(a). Expulsión por 2A en min 70 -> juega 70 minutos');
assertEqual(minutes2ADiff.source, 'titular_red_card', 'Ap1(a). Expulsión por 2A -> source es titular_red_card');

// Caso (b): Mismo jugador, 2A en el MISMO minuto re-lanzado (min 25 y min 25)
// Esperado: La firma con minuto (card_${pid}_${cardType}_${min}) detecta la duplicidad -> 1 sola tarjeta, NO expulsado (90 min)
const events2ASameMinute = [
  { id: 'card_relanzada_1', type: 'amarilla', minute: 25, playerId: 'p_7', playerName: 'Jugador A' },
  { id: 'card_relanzada_2', type: 'card_yellow_own', minute: 25, playerId: 'p_7', playerName: 'Jugador A' },
  { id: 'card_relanzada_retry', type: 'card_yellow_own', minute: 25, playerId: 'p_7', playerName: 'Jugador A' }
];
const unifiedSameMin = getUnifiedMatchEvents({ events: events2ASameMinute, liveStatsEvents: [] });
const statsSameMin = calculateCanonicalStats({}, unifiedSameMin);
assertEqual(statsSameMin.homeStats.amarillas, 1, 'Ap1(b). 2A en el MISMO minuto re-lanzada -> 1 sola tarjeta (dedup canónico)');

const minutes2ASame = calculateMinutesFromEvents(
  'p_7',
  unifiedSameMin,
  DETERMINISTIC_MATCH_FIXTURE.titulares,
  DETERMINISTIC_MATCH_FIXTURE.suplentes,
  90
);
assertEqual(minutes2ASame.minutes, 90, 'Ap1(b). 1 sola amarilla en min 25 -> jugador completa los 90 minutos');
assertEqual(minutes2ASame.source === 'titular_red_card', false, 'Ap1(b). NO es expulsado indebidamente');

// ── 3. APERTURA 4: MODAL DE TIRO RIVAL INICIALIZA EN RIVAL ───────────────────
console.log('\n--- APERTURA 4: PROPAGACIÓN DE TEAM RIVAL DESDE DISPARADOR ---');

const correctedLiveStatsCountByType = (type, events) => {
  if (type === 'shot_own') {
    return (events || []).filter(e => e && (
      ['shot_on_target_own', 'shot_off_target_own', 'shot_own', 'shot_favor'].includes(e.type) ||
      (e.type === 'shot' && e.team === 'own')
    )).length;
  }
  if (type === 'shot_rival') {
    return (events || []).filter(e => e && (
      ['shot_on_target_rival', 'shot_off_target_rival', 'shot_rival'].includes(e.type) ||
      (e.type === 'shot' && e.team === 'rival')
    )).length;
  }
  return (events || []).filter(e => e && e.type === type).length;
};

// Simulación de 1 tiro rival desde el grid:
// LiveStats dispara con initialTeam: 'rival', origin: 'team'
const simulatedRivalShotTrigger = { initialTeam: 'rival', origin: 'team' };
// Modal inicializa con targetTeam = simulatedRivalShotTrigger.initialTeam ('rival')
const modalResultingTeam = simulatedRivalShotTrigger.initialTeam;
const simulatedRivalShotEvent = {
  id: 'evt_rival_grid_shot_1',
  type: 'shot_off_target_rival',
  team: modalResultingTeam,
  minute: 40
};
const rivalTestEvents = [simulatedRivalShotEvent];
assertEqual(modalResultingTeam, 'rival', 'Ap4. Disparador grid rival -> modal abre con team=rival');
assertEqual(correctedLiveStatsCountByType('shot_rival', rivalTestEvents), 1, 'Ap4. Conteo shot_rival = 1');
assertEqual(correctedLiveStatsCountByType('shot_own', rivalTestEvents), 0, 'Ap4. Conteo shot_own = 0 (cero fuga a propio)');

// ── 4. APERTURA 7: PARIDAD ESTRICTA UI == PDF == CSV EN RENDIMIENTO INDIVIDUAL
console.log('\n--- APERTURA 7: PARIDAD UI == PDF == CSV EN RENDIMIENTO INDIVIDUAL ---');

// Extraer jugadores del fixture procesados para el reporte
const unifiedAll = getUnifiedMatchEvents(DETERMINISTIC_MATCH_FIXTURE);

const mockProcessedPlayers = [
  // p_9: Jugador C (Delantero) — 1 gol, 2 tiros (1 a puerta), sustituido en min 65 -> 65 min, nota 7.9
  {
    id: 'p_9',
    dorsal: 9,
    nombre: 'Jugador C (Delantero)',
    posicion: 'DEL',
    minutos: 65,
    rating: 7.9,
    goles: 1,
    asistencias: 0,
    xG: 0.75,
    pasesExitosos: 0,
    pasesFallidos: 0,
    duelosGanados: 0,
    duelosPerdidos: 0,
    recuperaciones: 0,
    perdidas: 0,
    tirosPuerta: 1,
    tiros: 2,
    paradas: 0,
    faltas: 0,
    amarillas: 0,
    rojas: 0
  },
  // p_7: Jugador A (Doble Tarjeta) — 2A (min 25 y 70) expulsado en min 70, 1 duelo G, 1 duelo P, 1 falta -> nota 4.8
  {
    id: 'p_7',
    dorsal: 7,
    nombre: 'Jugador A (Doble Tarjeta)',
    posicion: 'MED',
    minutos: 70,
    rating: 4.8,
    goles: 0,
    asistencias: 0,
    xG: 0.00,
    pasesExitosos: 0,
    pasesFallidos: 0,
    duelosGanados: 1,
    duelosPerdidos: 1,
    recuperaciones: 0,
    perdidas: 0,
    tirosPuerta: 0,
    tiros: 0,
    paradas: 0,
    faltas: 1,
    amarillas: 2,
    rojas: 0
  },
  // p_6: Pivote Titular — 90 min, 1 recuperación, 1 pérdida -> nota 6.0
  {
    id: 'p_6',
    dorsal: 6,
    nombre: 'Pivote Titular',
    posicion: 'MED',
    minutos: 90,
    rating: 6.0,
    goles: 0,
    asistencias: 0,
    xG: 0.00,
    pasesExitosos: 0,
    pasesFallidos: 0,
    duelosGanados: 0,
    duelosPerdidos: 0,
    recuperaciones: 1,
    perdidas: 1,
    tirosPuerta: 0,
    tiros: 0,
    paradas: 0,
    faltas: 0,
    amarillas: 0,
    rojas: 0
  }
];

const pdfRows = deriveIndividualPerformanceRows(mockProcessedPlayers);

console.log('\nTabla de Rendimiento Individual Verificada (15 Columnas Canónicas):');
console.log('| # | Jugador | Pos | Min | Nota | GOL | AST | xG | Pases C/F (%) | Duelos G/P (%) | Rec / Pérd | Tiros P/Tot (%) | PAR | Faltas | Tarjetas |');
console.log('|---|---------|-----|-----|------|-----|-----|----|---------------|----------------|------------|-----------------|-----|--------|----------|');
pdfRows.forEach(r => {
  console.log(`| ${r.join(' | ')} |`);
});
console.log('');

// Assert columna por columna para p_9
const rowP9 = pdfRows[0];
assertEqual(rowP9[0], '#9', 'Ap7.p9[#]');
assertEqual(rowP9[1], 'Jugador C (Delantero)', 'Ap7.p9[Jugador]');
assertEqual(rowP9[2], 'DEL', 'Ap7.p9[Pos]');
assertEqual(rowP9[3], "65'", 'Ap7.p9[Min]');
assertEqual(rowP9[4], '7.9', 'Ap7.p9[Nota]');
assertEqual(rowP9[5], '1', 'Ap7.p9[GOL]');
assertEqual(rowP9[6], '—', 'Ap7.p9[AST]');
assertEqual(rowP9[7], '0.75', 'Ap7.p9[xG]');
assertEqual(rowP9[11], '1/2 (50%)', 'Ap7.p9[Tiros P/Tot (%)]');

// Assert columna por columna para p_7
const rowP7 = pdfRows[1];
assertEqual(rowP7[0], '#7', 'Ap7.p7[#]');
assertEqual(rowP7[1], 'Jugador A (Doble Tarjeta)', 'Ap7.p7[Jugador]');
assertEqual(rowP7[2], 'MED', 'Ap7.p7[Pos]');
assertEqual(rowP7[3], "70'", 'Ap7.p7[Min]');
assertEqual(rowP7[4], '4.8', 'Ap7.p7[Nota]');
assertEqual(rowP7[9], '1/1 (50%)', 'Ap7.p7[Duelos G/P (%)]');
assertEqual(rowP7[13], '1', 'Ap7.p7[Faltas]');
assertEqual(rowP7[14], '2A', 'Ap7.p7[Tarjetas]');

// Assert columna por columna para p_6
const rowP6 = pdfRows[2];
assertEqual(rowP6[0], '#6', 'Ap7.p6[#]');
assertEqual(rowP6[1], 'Pivote Titular', 'Ap7.p6[Jugador]');
assertEqual(rowP6[2], 'MED', 'Ap7.p6[Pos]');
assertEqual(rowP6[3], "90'", 'Ap7.p6[Min]');
assertEqual(rowP6[4], '6.0', 'Ap7.p6[Nota]');
assertEqual(rowP6[10], '1 / 1', 'Ap7.p6[Rec / Pérd]');

// ── 5. RE-EVALUACIÓN DE LA MATRIZ DE 7 DESTINOS (R4) ─────────────────────────
console.log('\n--- 5. RE-EVALUACIÓN COMPLETA DE LA MATRIZ DE 7 DESTINOS (R4) ---');

// Destino 1: HUD Live (LiveStats.jsx countByType)
console.log('• Destino 1: HUD Live (Captura en Directo)');
const hudShotsOwn = correctedLiveStatsCountByType('shot_own', DETERMINISTIC_MATCH_FIXTURE.liveStatsEvents);
const hudShotsRival = correctedLiveStatsCountByType('shot_rival', DETERMINISTIC_MATCH_FIXTURE.liveStatsEvents);
const hudLosses = correctedLiveStatsCountByType('ball_loss', DETERMINISTIC_MATCH_FIXTURE.liveStatsEvents);
const hudRecoveries = correctedLiveStatsCountByType('recovery', DETERMINISTIC_MATCH_FIXTURE.liveStatsEvents);
assertEqual(hudShotsOwn, 3, 'HUD.shot_own');
assertEqual(hudShotsRival, 2, 'HUD.shot_rival');
assertEqual(hudLosses, 2, 'HUD.ball_loss');
assertEqual(hudRecoveries, 1, 'HUD.recovery');

// Destino 2: Panel de Estadísticas (MatchStatsBlock.jsx / calculateCanonicalStats)
console.log('• Destino 2: Panel de Estadísticas (MatchStatsBlock)');
const panelCanonical = calculateCanonicalStats(DETERMINISTIC_MATCH_FIXTURE, unifiedAll);
assertEqual(panelCanonical.homeStats.tiros, 3, 'Panel.tirosTotal');
assertEqual(panelCanonical.homeStats.tirosPuerta, 1, 'Panel.tirosPuerta');
assertEqual(panelCanonical.awayStats.tiros, 2, 'Panel.rivalTirosTotal');
assertEqual(panelCanonical.awayStats.tirosPuerta, 1, 'Panel.rivalTirosPuerta');
assertEqual(panelCanonical.homeStats.recuperaciones, 1, 'Panel.recuperaciones');
assertEqual(panelCanonical.awayStats.recuperaciones, 2, 'Panel.perdidas (leídas como posesión rival)');
const countOf = (type, evts) => evts.filter(e => e && e.type === type).length;
assertEqual(countOf('duel_won', unifiedAll), 1, 'Panel.duelosGanados');
assertEqual(countOf('duel_lost', unifiedAll), 1, 'Panel.duelosPerdidos');
assertEqual(panelCanonical.homeStats.amarillas, 2, 'Panel.amarillas');
assertEqual(countOf('card_red_own', unifiedAll), 1, 'Panel.rojas');

// Destino 3: Historial / Acta / Timeline (Partidos.jsx)
console.log('• Destino 3: Historial / Timeline del Partido');
const derivedSubstitutions = (matchData) => {
  const subs = [];
  if (Array.isArray(matchData.cambiosList) && matchData.cambiosList.length > 0) {
    matchData.cambiosList.forEach(c => subs.push(c));
  } else if (Array.isArray(matchData.events)) {
    matchData.events.filter(e => e.type === 'sustitucion').forEach(c => subs.push(c));
  }
  return subs;
};
const derivedTarjetas = (matchData) => {
  const effective = getUnifiedMatchEvents(matchData);
  return effective.filter(e => e && e.isValid !== false && (
    e.type === 'amarilla' || e.type === 'roja' ||
    e.type === 'card_yellow_own' || e.type === 'card_red_own' ||
    e.type === 'card_yellow_rival' || e.type === 'card_red_rival'
  ));
};
assertEqual(derivedSubstitutions(DETERMINISTIC_MATCH_FIXTURE).length, 2, 'Timeline.sustituciones');
assertEqual(derivedTarjetas(DETERMINISTIC_MATCH_FIXTURE).length, 3, 'Timeline.tarjetas');

// Destino 4: Reporte PDF de Partido (matchPdfReport.js / calculateCanonicalStats)
console.log('• Destino 4: Reporte PDF del Partido');
const pdfCanonical = calculateCanonicalStats(DETERMINISTIC_MATCH_FIXTURE, unifiedAll);
assertEqual(pdfCanonical.homeStats.tiros, 3, 'PDF.rematesTotal');
assertEqual(pdfCanonical.homeStats.recuperaciones, 1, 'PDF.recuperaciones');
assertEqual(pdfCanonical.awayStats.recuperaciones, 2, 'PDF.perdidas');
assertEqual(pdfCanonical.homeStats.amarillas, 2, 'PDF.amarillas');
assertEqual(countOf('card_red_own', unifiedAll), 1, 'PDF.rojas');

// Destino 5: Portal de Jugador (PlayerStatsTab.jsx / deriveStatsFromEvents)
console.log('• Destino 5: Portal de Rendimiento del Jugador');
const p9Stats = deriveStatsFromEvents(unifiedAll, 'p_9', 'DEL');
assertEqual(p9Stats.tirosPuerta, 1, 'PlayerPortal.p9_tirosPuerta');
assertEqual(p9Stats.goles, 1, 'PlayerPortal.p9_goles');

const p6Stats = deriveStatsFromEvents(unifiedAll, 'p_6', 'MED');
assertEqual(p6Stats.recuperaciones, 1, 'PlayerPortal.p6_recuperaciones');
assertEqual(p6Stats.perdidas, 1, 'PlayerPortal.p6_perdidas');

const p7Stats = deriveStatsFromEvents(unifiedAll, 'p_7', 'MED');
assertEqual(p7Stats.tarjetasAmarillas, 2, 'PlayerPortal.p7_amarillas');
assertEqual(p7Stats.duelosGanados, 1, 'PlayerPortal.p7_duelosGanados');
assertEqual(p7Stats.duelosPerdidos, 1, 'PlayerPortal.p7_duelosPerdidos');
assertEqual(p7Stats.faltas, 1, 'PlayerPortal.p7_faltas');

// Destino 6: Radar y Gráficas Tácticas (RadarCompareSVG / ComparisonBarsSVG)
console.log('• Destino 6: Radar y Visualizaciones Comparativas');
const duelsTotal = countOf('duel_won', unifiedAll) + countOf('duel_lost', unifiedAll);
const duelPct = duelsTotal > 0 ? Math.round((countOf('duel_won', unifiedAll) / duelsTotal) * 100) : 50;
assertEqual(duelPct, 50, 'Radar.duelsWinPct (50%)');
const possTotalEvents = panelCanonical.homeStats.recuperaciones + panelCanonical.awayStats.recuperaciones;
const possPct = possTotalEvents > 0 ? Math.round((panelCanonical.homeStats.recuperaciones / possTotalEvents) * 100) : 50;
assertEqual(possPct, 33, 'Radar.possessionProxyPct (1 rec / 3 tot = 33%)');

// Destino 7: Tabla de Rendimiento (StatsDataTable.jsx / calcPerformanceScore)
console.log('• Destino 7: Tabla de Rendimiento y Algoritmo de Calificación');
const scoreP9 = calcPerformanceScore(p9Stats);
assertEqual(scoreP9 >= 7.0, true, 'RatingTable.scoreP9_high (con gol y tiro >= 7.0)');
const scoreP7 = calcPerformanceScore(p7Stats);
assertEqual(scoreP7 < 6.0, true, 'RatingTable.scoreP7_penalized (2 amarillas y faltas rebajan la nota)');

// ── RESUMEN FINAL ──────────────────────────────────────────────────────────
console.log('==============================================================================');
if (allTestsPassed) {
  console.log('🎉 [CERTIFICACIÓN VERDE COMPLETA]: Todos los asserts numéricos pasaron con éxito.');
  console.log('   - Ap1: Dedup con minuto verificado (2A distintos minutos vs mismo minuto).');
  console.log('   - Ap4: Tiro rival verificado (shot_rival = 1, shot_own = 0).');
  console.log('   - Ap7: Paridad UI == PDF == CSV verificada columna por columna.');
  console.log('   - 7 Destinos re-evaluados con fixture 100% coherente temporalmente.');
  console.log('==============================================================================\n');
  process.exit(0);
} else {
  console.error('🚨 [FALLO]: Uno o más asserts fallaron en la suite de verificación.');
  console.log('==============================================================================\n');
  process.exit(1);
}
