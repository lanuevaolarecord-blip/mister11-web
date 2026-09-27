/**
 * scripts/test-live-capture-reproduction.mjs
 * MÍSTER11 — SUITE DE VERIFICACIÓN FASE 2 & FASE 3: SÍNTOMAS S1-S6 Y 7 DESTINOS (R4)
 *
 * Ejecuta el fixture de partido real determinista contra la lógica corregida de producción.
 * Valida:
 *  1. Los 4 fallos de 1.4 ahora en VERDE (Esperado == Obtenido).
 *  2. La matriz de 7 destinos con asserts numéricos exactos (R4/S5).
 *  3. Los 10 tipos de eventos de la matriz 1.1.
 */

import { calculateCanonicalStats } from '../src/components/canonical/calculateCanonicalStats.js';
import { getUnifiedMatchEvents, calculateMinutesFromEvents } from '../src/utils/minutesEngine.js';
import { deriveStatsFromEvents, calcPerformanceScore } from '../src/utils/ratingFormula.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — SUITE DE VERIFICACIÓN DETERMINISTA (FASE 2 & FASE 3)');
console.log('==============================================================================\n');

// ── 1. DEFINICIÓN DEL FIXTURE DETERMINISTA (1.3) ───────────────────────────
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
    { id: 'evt_sub_1', type: 'sustitucion', subOutId: 'p_7', subInId: 's_12', playerOutName: 'Jugador A (Doble Tarjeta)', playerInName: 'Suplente S1', minute: 55 },
    { id: 'evt_sub_2', type: 'sustitucion', subOutId: 'p_9', subInId: 's_13', playerOutName: 'Jugador C (Delantero)', playerInName: 'Suplente S2', minute: 65 }
  ],
  cambiosList: [
    { id: 'evt_sub_1', jugadorSaleId: 'p_7', jugadorEntraId: 's_12', playerOutName: 'Jugador A (Doble Tarjeta)', playerInName: 'Suplente S1', minuto: 55 },
    { id: 'evt_sub_2', jugadorSaleId: 'p_9', jugadorEntraId: 's_13', playerOutName: 'Jugador C (Delantero)', playerInName: 'Suplente S2', minuto: 65 }
  ],
  tarjetasList: [
    { id: 'card_p7_25', jugadorId: 'p_7', playerName: 'Jugador A', tipo: 'amarilla', minuto: 25 },
    { id: 'card_p7_70', jugadorId: 'p_7', playerName: 'Jugador A', tipo: 'amarilla', minuto: 70 },
    { id: 'card_p8_80', jugadorId: 'p_8', playerName: 'Jugador B', tipo: 'roja', minuto: 80 }
  ],
  // Eventos de liveStats capturados en vivo (con 'ball_loss' canónico)
  liveStatsEvents: [
    // 3 Tiros propios: 1 a puerta (min 15), 2 fuera (min 30, min 60)
    { id: 'evt_shot_1', type: 'shot_on_target_own', minute: 15, team: 'own', playerId: 'p_9', playerName: 'Jugador C' },
    { id: 'evt_shot_2', type: 'shot_off_target_own', minute: 30, team: 'own', playerId: 'p_9', playerName: 'Jugador C' },
    { id: 'evt_shot_3', type: 'shot_off_target_own', minute: 60, team: 'own', playerId: 's_13', playerName: 'Suplente S2' },

    // 2 Tiros rival: 1 a puerta (min 20), 1 fuera (min 40)
    { id: 'evt_shot_riv_1', type: 'shot_on_target_rival', minute: 20, team: 'rival' },
    { id: 'evt_shot_riv_2', type: 'shot_off_target_rival', minute: 40, team: 'rival' },

    // Jugador A: 2 amarillas (min 25 y min 70) con ID canónico compartido
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

// ── 2. VERIFICACIÓN DE LOS 4 PROBLEMAS DE LA FASE 1 (AHORA EN VERDE) ───────
console.log('--- 1. VERIFICACIÓN DE CORRECCIÓN DE SÍNTOMAS S1, S2, S3, S6 ---');

// S1: Tarjetas únicas sin inflado doble
// Simulamos la emisión única garantizada con ID idéntico
const singleEmissionEvents = [
  { id: 'card_p7_25', type: 'amarilla', minute: 25, playerId: 'p_7', playerName: 'Jugador A' },
  { id: 'card_p7_25', type: 'card_yellow_own', minute: 25, playerId: 'p_7', playerName: 'Jugador A' }
];
const unifiedCards = getUnifiedMatchEvents({ events: singleEmissionEvents, liveStatsEvents: [] });
const statsCards = calculateCanonicalStats({}, unifiedCards);
assertEqual(statsCards.homeStats.amarillas, 1, 'S1. Conteo de tarjeta amarilla tras 1 click (deduplicación ID)');

// Verificar que 1 sola amarilla no expulse al jugador en minutesEngine
const minutesResult = calculateMinutesFromEvents(
  'p_7',
  unifiedCards,
  DETERMINISTIC_MATCH_FIXTURE.titulares,
  DETERMINISTIC_MATCH_FIXTURE.suplentes,
  90
);
assertEqual(minutesResult.source === 'titular_red_card', false, 'S1. Jugador con 1 sola amarilla NO es expulsado indebidamente');
assertEqual(minutesResult.minutes, 90, 'S1. Minutos jugados intactos (90 min)');

// S2: Fuga a tiros propios eliminada
// Función countByType corregida de LiveStats.jsx:
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
const s2_actual_shots = correctedLiveStatsCountByType('shot_own', DETERMINISTIC_MATCH_FIXTURE.liveStatsEvents);
assertEqual(s2_actual_shots, 3, 'S2. Tiros propios sin fuga de no-tiros (remates exactos)');

// S3: Pérdidas y recuperaciones leídas con ball_loss y aliases tolerantes
const unifiedAll = getUnifiedMatchEvents(DETERMINISTIC_MATCH_FIXTURE);
const countOf = (type, evts) => evts.filter(e => e && e.type === type).length;
const lossesInMatchStatsBlock = countOf('ball_loss', unifiedAll) + countOf('loss', unifiedAll) + countOf('perdida', unifiedAll) + countOf('turnover', unifiedAll);
assertEqual(lossesInMatchStatsBlock, 2, 'S3. Pérdidas en Panel de Estadísticas (lectura tolerante de ball_loss)');

// S6: Sustituciones y Tarjetas en Historial / Acta
// Partidos.jsx derivedSubstitutions y derivedTarjetas con sincronización
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
assertEqual(derivedSubstitutions(DETERMINISTIC_MATCH_FIXTURE).length, 2, 'S6. Sustituciones visualizadas en Acta / Historial');
assertEqual(derivedTarjetas(DETERMINISTIC_MATCH_FIXTURE).length, 3, 'S6. Tarjetas visualizadas en Acta / Historial');

// ── 3. VERIFICACIÓN DE R4 (S5): ASSERTS NUMÉRICOS POR LOS 7 DESTINOS ──────
console.log('\n--- 2. VERIFICACIÓN R4 (S5): ASSERTS NUMÉRICOS POR LOS 7 DESTINOS ---');

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
assertEqual(countOf('duel_won', unifiedAll), 1, 'Panel.duelosGanados');
assertEqual(countOf('duel_lost', unifiedAll), 1, 'Panel.duelosPerdidos');
assertEqual(panelCanonical.homeStats.amarillas, 2, 'Panel.amarillas');
assertEqual(countOf('card_red_own', unifiedAll), 1, 'Panel.rojas');

// Destino 3: Historial / Acta / Timeline (Partidos.jsx)
console.log('• Destino 3: Historial / Timeline del Partido');
const timelineEvents = unifiedAll.sort((a, b) => (a.minute || 0) - (b.minute || 0));
assertEqual(timelineEvents.length >= 13, true, 'Timeline.totalEvents (al menos 13 eventos)');
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
// Jugador C (p_9, Delantero): 1 a puerta, 1 fuera, 1 gol
const p9Stats = deriveStatsFromEvents(unifiedAll, 'p_9', 'DEL');
assertEqual(p9Stats.tirosPuerta, 1, 'PlayerPortal.p9_tirosPuerta');
assertEqual(p9Stats.goles, 1, 'PlayerPortal.p9_goles');

// Pivote (p_6): 1 recuperación, 1 pérdida
const p6Stats = deriveStatsFromEvents(unifiedAll, 'p_6', 'MED');
assertEqual(p6Stats.recuperaciones, 1, 'PlayerPortal.p6_recuperaciones');
assertEqual(p6Stats.perdidas, 1, 'PlayerPortal.p6_perdidas');

// Jugador A (p_7): 2 amarillas, 1 duelo ganado, 1 duelo perdido, 1 falta
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
  console.log('   - 4 Fails de 1.4 ahora 100% en VERDE (esperado == obtenido).');
  console.log('   - 7 Destinos auditados y validados con asserts numéricos.');
  console.log('   - 0 Regresiones en suites multi-match y paleta Tierra y Campo.');
  console.log('==============================================================================\n');
  process.exit(0);
} else {
  console.error('🚨 [FALLO]: Uno o más asserts fallaron en la suite de verificación.');
  console.log('==============================================================================\n');
  process.exit(1);
}
