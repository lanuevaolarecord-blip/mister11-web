/**
 * src/utils/attendanceMath.js
 * Míster11 — Fórmula Única Compartida de Asistencia y Estado Deportivo
 *
 * REGLA DEPORTIVA OFICIAL:
 * 1. El justificado y lesionado NUNCA penalizan el porcentaje. Solo el ausente lo hace.
 * 2. Fórmula oficial:
 *    pctAsistencia = (presente + tarde) / (totalEventos - justificado - lesionado) * 100
 * 3. Estado "Sin datos":
 *    Si un jugador tiene 0 eventos registrados, pct = null y status = 'no_data' ("Sin datos").
 *    Nunca debe mostrarse como "100% Óptimo" ni incluirse en alertas de riesgo ni en la media del equipo.
 */

/**
 * Calcula las métricas de porcentaje y estado de asistencia a partir de contadores.
 *
 * @param {Object} counts - { present, late, justified, injured, absent }
 * @returns {Object} { pct: number|null, attended: number, eligible: number, total: number, hasData: boolean, status: 'no_data'|'optimal'|'risk', labelKey: string }
 */
export const calculateAttendanceMetrics = ({
  present = 0,
  late = 0,
  justified = 0,
  injured = 0,
  absent = 0
} = {}) => {
  const p = Number(present) || 0;
  const l = Number(late) || 0;
  const j = Number(justified) || 0;
  const inj = Number(injured) || 0;
  const a = Number(absent) || 0;

  const total = p + l + j + inj + a;
  const attended = p + l;
  const eligible = total - j - inj;

  // 1. Caso: 0 eventos registrados en total
  if (total === 0) {
    return {
      pct: null,
      attended: 0,
      eligible: 0,
      total: 0,
      hasData: false,
      status: 'no_data',
      labelKey: 'common.noData'
    };
  }

  // 2. Caso: Eventos registrados pero todos justificados o lesionados (eligible = 0)
  if (eligible === 0) {
    return {
      pct: 100,
      attended,
      eligible: 0,
      total,
      hasData: true,
      status: 'optimal',
      labelKey: 'common.optimal'
    };
  }

  // 3. Caso normal: cálculo ponderado
  const rawPct = (attended / eligible) * 100;
  const pct = Math.min(100, Math.max(0, Math.round(rawPct)));
  const isAtRisk = pct < 70;

  return {
    pct,
    attended,
    eligible,
    total,
    hasData: true,
    status: isAtRisk ? 'risk' : 'optimal',
    labelKey: isAtRisk ? 'common.risk' : 'common.optimal'
  };
};

/**
 * Calcula el promedio de asistencia de un conjunto de estadísticas de jugadores,
 * excluyendo explícitamente a los jugadores "Sin datos" (pct === null).
 *
 * @param {Array} squadStatsList - Lista de objetos de estadísticas de jugadores ({ pct, hasData, ... })
 * @returns {number} Promedio de asistencia del equipo (0 a 100)
 */
export const calculateSquadAveragePct = (squadStatsList = []) => {
  const validPlayers = (squadStatsList || []).filter(
    (s) => s && s.hasData && typeof s.pct === 'number' && !isNaN(s.pct)
  );

  if (validPlayers.length === 0) return 0;

  const sum = validPlayers.reduce((acc, curr) => acc + curr.pct, 0);
  return Math.round(sum / validPlayers.length);
};

export default {
  calculateAttendanceMetrics,
  calculateSquadAveragePct
};
