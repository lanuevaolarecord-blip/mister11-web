/**
 * src/utils/ratingFormula.js
 * Míster11 — Fórmula Mixta de Nota de Jugador (D1)
 *
 * Nota MIXTA = 60% rendimiento estadístico + 40% esfuerzo/actitud (1-5★)
 * Rango final: 1.0 – 10.0 (redondeado a 1 decimal)
 *
 * Fórmula de rendimiento (base 10):
 *   base = 6.0
 *   + goles × 1.5
 *   + asistencias × 1.0
 *   + pasesClave × 0.4
 *   + recuperaciones × 0.2
 *   + tirosPuerta × 0.3
 *   − faltas × 0.25
 *   − tarjetasAmarillas × 0.5
 *   − tarjetasRojas × 1.5
 *   Clamped [4.0, 10.0]
 *
 * Fórmula de actitud (1-5★ → escala 10):
 *   attitudeScore = (actitud / 5) × 10   → [2.0, 10.0]
 *
 * Nota mixta = (performanceScore × 0.60) + (attitudeScore × 0.40)
 */

/**
 * Calcula la nota de rendimiento estadístico puro (base 10).
 * @param {Object} stats
 * @returns {number} score ∈ [4.0, 10.0]
 */
export function calcPerformanceScore(stats = {}) {
  const {
    goles = 0,
    asistencias = 0,
    pasesClave = 0,
    recuperaciones = 0,
    tirosPuerta = 0,
    faltas = 0,
    tarjetasAmarillas = 0,
    tarjetasRojas = 0,
  } = stats;

  const raw =
    6.0 +
    goles * 1.5 +
    asistencias * 1.0 +
    pasesClave * 0.4 +
    recuperaciones * 0.2 +
    tirosPuerta * 0.3 -
    faltas * 0.25 -
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
 * @param {string} playerId
 * @param {Array}  events
 * @returns {Object} stats
 */
export function deriveStatsFromEvents(playerId, events = []) {
  const byPlayer = events.filter(e => e && (e.playerId === playerId || e.fromPlayerId === playerId));
  const count = (type) => byPlayer.filter(e => e.type === type).length;

  return {
    goles:             events.filter(e => e && (e.type === 'gol_local' || e.type === 'goal') && e.playerId === playerId).length,
    asistencias:       events.filter(e => e && e.asistenciaId === playerId).length,
    tirosPuerta:       count('shot_on_target_own'),
    pasesClave:        count('duel_won'),
    recuperaciones:    count('recovery'),
    faltas:            count('foul_against'),
    tarjetasAmarillas: events.filter(e => e && e.type === 'card_yellow_own' && e.playerId === playerId).length,
    tarjetasRojas:     events.filter(e => e && e.type === 'card_red_own' && e.playerId === playerId).length,
  };
}
