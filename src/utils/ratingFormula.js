/**
 * src/utils/ratingFormula.js
 * Míster11 — Fórmula Mixta de Nota de Jugador (Rediseño de Captura)
 *
 * Nota MIXTA = 60% rendimiento estadístico + 40% esfuerzo/actitud (1-5★)
 * Rango final: 1.0 – 10.0 (redondeado a 1 decimal)
 *
 * Fórmula de rendimiento sin pases (base 10):
 *   base = 6.0
 *   + goles × 1.5
 *   + asistencias × 1.0
 *   + tirosPuerta × 0.35
 *   + recuperaciones × 0.25
 *   + duelosGanados × 0.25
 *   − duelosPerdidos × 0.15
 *   + pasesClave × 0.4 (si existen)
 *   − faltas × 0.20
 *   − tarjetasAmarillas × 0.5
 *   − tarjetasRojas × 1.5
 *   Clamped [4.0, 10.0]
 *
 * Para porteros: calcGkPerformanceScore (con paradas normales + 2×decisivas).
 */

import { calcGkPerformanceScore } from './testScoreEngine.js';
import { isCanonicalGoalkeeper, computeGoalkeeperMatchStats } from './goalkeeperStats.js';
import { mergeAndDedupeMatchEvents } from './matchEventIdempotency.js';

/**
 * Calcula la nota de rendimiento estadístico puro (base 10).
 * Para jugadores de campo y porteros (rol POR / GK / Portero).
 * @param {Object} stats
 * @returns {number} score ∈ [4.0, 10.0]
 */
export function calcPerformanceScore(stats = {}) {
  const isGk = Boolean(
    isCanonicalGoalkeeper(stats) ||
    stats.gkStats
  );

  if (isGk) {
    const gkData = stats.gkStats || stats;
    const baseScore = calcGkPerformanceScore(gkData);
    const penaltyBonus = (Number(gkData.penaltySaves ?? gkData.penaltiesSaved ?? 0)) * 0.8;
    const claimsBonus = (Number(gkData.claims ?? 0)) * 0.15;
    const cleanSheetBonus = gkData.cleanSheet ? 0.4 : 0;
    const errorPenalty = (Number(gkData.errorGoal ?? 0)) * 0.8;
    return parseFloat(Math.min(10.0, Math.max(4.0, baseScore + penaltyBonus + claimsBonus + cleanSheetBonus - errorPenalty)).toFixed(1));
  }

  const {
    goles = 0,
    asistencias = 0,
    tirosPuerta = 0,
    recuperaciones = 0,
    duelosGanados = 0,
    duelosPerdidos = 0,
    pasesClave = 0,
    faltas = 0,
    tarjetasAmarillas = 0,
    tarjetasRojas = 0,
  } = stats;

  const raw =
    6.0 +
    goles * 1.5 +
    asistencias * 1.0 +
    tirosPuerta * 0.35 +
    recuperaciones * 0.25 +
    duelosGanados * 0.25 -
    duelosPerdidos * 0.15 +
    pasesClave * 0.4 -
    faltas * 0.20 -
    tarjetasAmarillas * 0.5 -
    tarjetasRojas * 1.5;

  return Math.min(10, Math.max(4.0, raw));
}

/**
 * Convierte la valoración de actitud (1-5★) a escala 10.
 * @param {number} actitud - Valor entero 1–5
 * @returns {number} score ∈ [2.0, 10.0]
 */
export function actitudToScore(actitud) {
  const v = Math.min(5, Math.max(1, Number(actitud) || 3));
  return (v / 5) * 10;
}

/**
 * Calcula la nota MIXTA final (D1).
 * Si actitud no se provee, usa 3★ como valor neutro.
 *
 * @param {Object} stats   - Estadísticas de rendimiento
 * @param {number} actitud - Valoración de actitud 1–5★ (default: 3)
 * @param {number|null} [misterOverride=null] - Nota manual del míster (override total)
 * @returns {{ mixedRating: number, performanceScore: number, attitudeScore: number, suggested: number }}
 */
export function calcMixedRating(stats = {}, actitud = 3, misterOverride = null) {
  const performanceScore = calcPerformanceScore(stats);
  const attitudeScore    = actitudToScore(actitud);
  const suggested        = parseFloat((performanceScore * 0.6 + attitudeScore * 0.4).toFixed(1));

  let mixedRating;
  if (misterOverride !== null && misterOverride !== undefined && misterOverride !== '') {
    const ov = parseFloat(misterOverride);
    mixedRating = isNaN(ov) ? suggested : Math.min(10, Math.max(1, ov));
  } else {
    mixedRating = suggested;
  }

  return {
    mixedRating: parseFloat(mixedRating.toFixed(1)),
    performanceScore: parseFloat(performanceScore.toFixed(1)),
    attitudeScore: parseFloat(attitudeScore.toFixed(1)),
    suggested,
  };
}

/**
 * Deriva las estadísticas de rendimiento de un jugador desde la lista de eventos del partido.
 * Ignora eventos no atribuidos (attributed: false o playerId nulo).
 *
 * @param {string} playerId
 * @param {Array}  events
 * @param {string|null} playerRole
 * @returns {Object} stats
 */
export function deriveStatsFromEvents(playerIdOrEvents, eventsOrPlayerId = [], playerRole = null, teamContext = {}) {
  let pid = '';
  let events = [];
  if (Array.isArray(playerIdOrEvents)) {
    events = playerIdOrEvents;
    pid = String(eventsOrPlayerId);
  } else {
    pid = String(playerIdOrEvents);
    events = eventsOrPlayerId;
  }
  const dedupedEvents = mergeAndDedupeMatchEvents(events || []);
  const validEvents = dedupedEvents.filter(e => e && e.attributed !== false && e.isValid !== false);

  const byPlayer = validEvents.filter(e => String(e.playerId || e.jugadorId || '') === pid || String(e.fromPlayerId || '') === pid);
  const count = (type) => byPlayer.filter(e => e.type === type).length;

  const allSaves = byPlayer.filter(e => e.type === 'save' || e.type === 'save_own' || e.type === 'parada');
  const normalSaves = allSaves.filter(e => e.saveDifficulty !== 'decisiva' && e.difficulty !== 'decisiva').length;
  const decisiveSaves = allSaves.filter(e => e.saveDifficulty === 'decisiva' || e.difficulty === 'decisiva').length;
  let conceded = count('conceded');
  const penaltySaves = count('penaltySave') + count('penalty_save') + count('penalti_parado');
  const claims = count('claim') + count('salida');
  const errorGoal = count('errorGoal') + count('error_goal');

  const isGk = Boolean(
    isCanonicalGoalkeeper(playerRole) ||
    isCanonicalGoalkeeper(teamContext?.player) ||
    allSaves.length > 0 ||
    conceded > 0 ||
    penaltySaves > 0
  );

  let gkComputed = null;
  if (isGk) {
    gkComputed = computeGoalkeeperMatchStats(
      {
        id: pid,
        position: playerRole || 'POR',
        ...(teamContext?.player || {}),
        isGoalkeeper: true,
      },
      validEvents,
      teamContext
    );
    conceded = gkComputed.goalsConceded;
  }

  // Tiros a puerta propios del jugador (excluyendo autogoles)
  const tirosPuerta = byPlayer.filter(e => {
    const t = String(e.type || '').toLowerCase();
    const isOwn = !t.includes('rival') && t !== 'own_goal' && t !== 'autogol' && !e.isOwnGoal;
    return isOwn && (t === 'shot_on_target_own' || e.outcome === 'on_target' || e.result === 'parada' || e.result === 'gol' || e.isGoal);
  }).length;

  return {
    goles: validEvents.filter(e => {
      const isScorer = String(e.playerId || e.jugadorId || '') === pid;
      const t = String(e.type || '').toLowerCase();
      const isOwnGoal = t === 'own_goal' || t === 'autogol' || t === 'gol_propia' || e.isOwnGoal === true;
      if (isOwnGoal) return false;
      const isGoalType = t === 'gol_local' || t === 'goal' || e.isGoal === true || e.result === 'gol';
      const isNotRival = !t.includes('rival') && e.team !== 'rival';
      return isScorer && isGoalType && isNotRival;
    }).length,
    asistencias: validEvents.filter(e => String(e.asistenciaId || e.assistId || '') === pid || ((e.type === 'asistencia' || e.type === 'assist') && String(e.playerId || '') === pid)).length,
    tirosPuerta,
    recuperaciones: count('recovery') + count('recuperacion'),
    perdidas: count('ball_loss') + count('loss') + count('perdida') + count('turnover'),
    duelosGanados: count('duel_won'),
    duelosPerdidos: count('duel_lost'),
    pasesClave: count('key_pass'),
    faltas: count('foul_against'),
    faltasProvocadas: count('foul_favor'),
    tarjetasAmarillas: validEvents.filter(e => String(e.playerId || e.jugadorId || '') === pid && (e.type === 'card_yellow_own' || (e.type === 'amarilla' && e.card !== 'roja'))).length,
    tarjetasRojas: validEvents.filter(e => String(e.playerId || e.jugadorId || '') === pid && (e.type === 'card_red_own' || e.type === 'roja' || e.type === 'expulsion')).length,
    // Métricas GK específicas
    saves: gkComputed ? gkComputed.saves : allSaves.length,
    normalSaves: gkComputed ? gkComputed.normalSaves : normalSaves,
    decisiveSaves: gkComputed ? gkComputed.decisiveSaves : decisiveSaves,
    conceded,
    goalsConceded: conceded,
    penaltySaves: gkComputed ? gkComputed.penaltiesSaved : penaltySaves,
    penaltiesSaved: gkComputed ? gkComputed.penaltiesSaved : penaltySaves,
    claims: gkComputed ? gkComputed.claims : claims,
    errorGoal: gkComputed ? gkComputed.errorGoal : errorGoal,
    cleanSheet: gkComputed ? gkComputed.cleanSheet : (isGk && conceded === 0),
    goalsAgainstPer90: gkComputed ? gkComputed.goalsAgainstPer90 : 0,
    savePct: gkComputed ? gkComputed.savePct : 0,
    isGoalkeeper: isGk,
  };
}

/**
 * Calcula de forma canónica y fiel los goles encajados por el portero en campo.
 * Suma eventos explícitos 'conceded' (atribuidos al portero o sin asignar),
 * eventos de gol rival ('gol_rival', 'goal_rival', o tiros rival con resultado gol),
 * y deduplica cuando ambos coexisten para el mismo gol en el mismo minuto/mitad o con el mismo rivalGoalId.
 * Fallback garantizado: si no hay eventos desglosados pero hay marcador en contra, refleja matchData.goalsAgainst.
 *
 * @param {Array} events
 * @param {Object|null} gk
 * @param {Object|null} matchData
 * @returns {number}
 */
export function getGkConcededCount(events = [], gk = null, matchData = null) {
  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];

  // Combinar eventos directos con la bitácora de matchData (events y liveStatsEvents) para garantizar cobertura total
  const matchEvents = [
    ...(Array.isArray(matchData?.events) ? matchData.events : []),
    ...(Array.isArray(matchData?.liveStatsEvents) ? matchData.liveStatsEvents : [])
  ].filter(Boolean);

  const allEvents = mergeAndDedupeMatchEvents(safeEvents, matchEvents);

  const rivalGoalEvents = allEvents.filter(e => {
    if (e.isValid === false) return false;
    const t = String(e.type || '').toLowerCase();
    const isExplicitConceded = t === 'conceded' && (!gk || !e.playerId || String(e.playerId) === String(gk.id));
    const isRivalGoal = t === 'gol_rival' || t === 'goal_rival';
    const isRivalShotGoal = (t === 'shot_on_target_rival' || t === 'shot_rival') && (e.outcome === 'goal' || e.isGoal === true || e.result === 'gol');
    const isGoalAgainst = (t === 'goal' || t === 'gol') && (e.team === 'rival' || e.isRival || e.playerId === 'rival');
    const isOwnGoalAgainst = t === 'own_goal' || t === 'autogol' || t === 'gol_propia' || e.isOwnGoal === true;
    return isExplicitConceded || isRivalGoal || isRivalShotGoal || isGoalAgainst || isOwnGoalAgainst;
  });

  const matchGoalsAgainst = Number(
    matchData?.goalsAgainst ?? 
    matchData?.golesContra ?? 
    (matchData?.type === 'Visitante' ? matchData?.marcadorLocal : matchData?.marcadorVisitante) ?? 
    matchData?.marcadorVisitante ?? 
    0
  );

  if (rivalGoalEvents.length === 0) {
    return matchGoalsAgainst;
  }

  // Deduplicación canónica: agrupar por rivalGoalId, por id de evento o por minuto+mitad
  const seenGoals = new Set();
  let distinctCount = 0;

  rivalGoalEvents.forEach((e) => {
    const minute = Number(e.minute || e.minuto || e.min || 0);
    const half = Number(e.half || (minute > 45 ? 2 : 1));
    const key = e.rivalGoalId 
      ? `rg_${e.rivalGoalId}` 
      : (e.id ? `id_${e.id}` : `min_${half}_${minute}`);
    if (!seenGoals.has(key)) {
      seenGoals.add(key);
      distinctCount++;
    }
  });

  return Math.max(distinctCount, matchGoalsAgainst);
}
