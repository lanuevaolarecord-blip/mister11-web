/**
 * src/utils/attendanceStatsHelper.js
 * Míster11 — Motor Unificado de Asistencia, Rachas y XP Diferenciado (Capa de Verdad)
 *
 * REGLAS OFICIALES:
 * 1. Fuente de verdad:
 *    - Sesiones: attendance.records[playerId] (escrito por el staff). NUNCA playerRsvp.
 *    - Partidos: match.actaOficial.actual[playerId] cuando match.actaOficial.closed === true.
 *    - Eventos pasados sin acta cerrada / sin registro del staff = "pendiente de acta" (sin efecto).
 *
 * 2. Tabla de XP Diferenciada (configurable en settings):
 *    - presente: +10 XP (default)
 *    - tarde: +5 XP (default)
 *    - justificado: +2 XP (default)
 *    - ausente: +0 XP
 *    - lesionado: +2 XP (o +0 según config, no rompe racha)
 *    - pendiente: +0 XP (no premia antes de la verificación)
 *
 * 3. Reglas de Racha de Asistencia:
 *    - presente / tarde: SUMAN (+1)
 *    - justificado / lesionado: PAUSAN (no suman, pero NO rompen la racha)
 *    - ausente: ROMPEN (reinicia la racha actual a 0)
 *    - pendiente: SIN EFECTO (se omite del cómputo hasta verificación)
 *
 * 4. Porcentaje de Asistencia (%):
 *    - % = (presente + tarde) / (totalEventosVerificados - justificado - lesionado) * 100
 *    - Si el denominador es 0, retorna 100% si no hubo faltas, o 0% si no hay datos.
 */

import { calculateAttendanceMetrics, calculatePlayerAttendanceOnSchedule } from './attendanceMath.js';

export const DEFAULT_XP_TABLE = {
  xpPresente: 10,
  xpTarde: 5,
  xpJustificado: 2,
  xpAusente: 0,
  xpLesionado: 2
};

/**
 * Normaliza el estado de asistencia de un registro a un estándar canónico:
 * 'presente' | 'tarde' | 'justificado' | 'ausente' | 'lesionado' | 'pendiente' | null
 */
export const normalizeEventStatus = (statusRaw) => {
  if (!statusRaw) return null;
  const s = String(statusRaw).toLowerCase().trim();
  if (s === 'present' || s === 'presente' || s === 'true' || s === 'titular_full' || s === 'titular_subout' || s === 'sub_in') {
    return 'presente';
  }
  if (s === 'late' || s === 'tarde') {
    return 'tarde';
  }
  if (s === 'justified' || s === 'justificado') {
    return 'justificado';
  }
  if (s === 'injured' || s === 'lesionado') {
    return 'lesionado';
  }
  if (s === 'absent' || s === 'ausente' || s === 'false' || s === 'dnp' || s === 'convocado_no_jugó') {
    return 'ausente';
  }
  return null;
};

/**
 * Extrae la lista cronológica unificada de eventos deportivos con verificación oficial
 * para un jugador dado (sesiones de entrenamiento + partidos).
 *
 * @param {string} playerId
 * @param {Array} attendanceList - Lista de docs de /attendance
 * @param {Array} matchesList    - Lista de docs de /matches
 * @returns {Array} Eventos ordenados cronológicamente [{ id, type, date, status, minutes, isPending, raw }]
 */
export const extractPlayerVerifiedTimeline = (playerId, attendanceList = [], matchesList = []) => {
  const pid = String(playerId);
  const timeline = [];

  // 1. Procesar Sesiones de entrenamiento (colección attendance)
  (attendanceList || []).forEach(att => {
    if (!att) return;
    const dateStr = att.fecha || att.date || att.sessionDate || att.createdAt || '1970-01-01';

    // Leer SOLO registro del staff (records[pid])
    let staffRecord = att.records?.[pid];
    let rawStatus = null;
    let isStaffVerified = false;

    if (staffRecord !== undefined && staffRecord !== null) {
      isStaffVerified = true;
      if (typeof staffRecord === 'object') {
        rawStatus = staffRecord.status;
      } else if (typeof staffRecord === 'string') {
        rawStatus = staffRecord;
      } else if (typeof staffRecord === 'boolean') {
        rawStatus = staffRecord ? 'presente' : 'ausente';
      }
    } else if (att.players?.[pid] !== undefined) {
      // Fallback para estructuras heredadas de asistencia
      isStaffVerified = true;
      const pData = att.players[pid];
      rawStatus = typeof pData === 'object' ? pData.status : (pData === true ? 'presente' : (pData === false ? 'ausente' : pData));
    } else if (Array.isArray(att.presentes) && att.presentes.some(id => String(id) === pid)) {
      isStaffVerified = true;
      rawStatus = 'presente';
    } else if (Array.isArray(att.presentPlayers) && att.presentPlayers.some(id => String(id) === pid)) {
      isStaffVerified = true;
      rawStatus = 'presente';
    }

    const normStatus = isStaffVerified ? normalizeEventStatus(rawStatus) : null;
    const hasPlayerRsvp = Boolean(att.playerRsvp?.[pid]);

    timeline.push({
      id: att.id,
      type: 'session',
      title: att.title || att.titulo || 'Entrenamiento',
      date: dateStr,
      status: normStatus || (hasPlayerRsvp ? 'pendiente' : 'no_convocado'),
      isStaffVerified: Boolean(normStatus),
      isPending: !normStatus && hasPlayerRsvp,
      minutes: null,
      rsvp: att.playerRsvp?.[pid]?.status || null,
      lateMin: staffRecord?.lateMin || null
    });
  });

  // 2. Procesar Partidos oficiales y amistosos (colección matches)
  (matchesList || []).forEach(m => {
    if (!m) return;
    const dateStr = m.date || m.fecha || m.matchDate || '1970-01-01';
    const isCalled = (m.convocados || []).some(id => String(id) === pid) ||
                     (m.titulares || []).some(id => String(id) === pid) ||
                     (m.suplentes || []).some(id => String(id) === pid) ||
                     (m.alineacion?.titulares || []).some(id => String(id) === pid) ||
                     (m.alineacion?.suplentes || []).some(id => String(id) === pid);

    const acta = m.actaOficial;
    const actaClosed = acta?.closed === true;
    const actaActual = acta?.actual?.[pid];
    const hasPlayerRsvp = Boolean(m.playerRsvp?.[pid]);

    if (!isCalled && !hasPlayerRsvp && !actaActual) return;

    if (actaClosed && actaActual) {
      // Acta cerrada: dato 100% oficial
      let normStatus = normalizeEventStatus(actaActual.status);
      const minutes = typeof actaActual.minutes === 'number' ? actaActual.minutes : 0;
      if (!normStatus) {
        normStatus = minutes > 0 ? 'presente' : (actaActual.status === 'convocado_no_jugó' ? 'presente' : 'ausente');
      }

      timeline.push({
        id: m.id,
        type: 'match',
        title: `vs ${m.rival || m.opponent || 'Rival'}`,
        date: dateStr,
        status: normStatus,
        isStaffVerified: true,
        isPending: false,
        minutes,
        minuteSource: actaActual.minuteSource || 'acta',
        actaClosed: true,
        rsvp: m.playerRsvp?.[pid]?.status || null,
        lateMin: actaActual.lateMin || null
      });
    } else {
      // Acta NO cerrada: se registra como pendiente de acta
      timeline.push({
        id: m.id,
        type: 'match',
        title: `vs ${m.rival || m.opponent || 'Rival'}`,
        date: dateStr,
        status: 'pendiente',
        isStaffVerified: false,
        isPending: true,
        minutes: null,
        actaClosed: false,
        rsvp: m.playerRsvp?.[pid]?.status || null,
        lateMin: null
      });
    }
  });

  // Ordenar cronológicamente (más antiguo primero para el cálculo de rachas)
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return timeline;
};

/**
 * Calcula las estadísticas completas de asistencia, rachas y XP para un jugador
 *
 * @param {string} playerId
 * @param {Array} attendanceList
 * @param {Array} matchesList
 * @param {Object} customXpTable
 * @returns {Object} { streak, maxStreak, percentage, totalVerified, attended, justified, absent, injured, pendingCount, attendanceXP, timeline }
 */
export const calculatePlayerAttendanceStats = (
  playerId,
  attendanceList = [],
  matchesList = [],
  customXpTable = {},
  sessionsList = []
) => {
  const xpTable = { ...DEFAULT_XP_TABLE, ...customXpTable };
  const timeline = extractPlayerVerifiedTimeline(playerId, attendanceList, matchesList);

  let currentStreak = 0;
  let maxStreak = 0;
  let attended = 0;
  let late = 0;
  let justified = 0;
  let injured = 0;
  let absent = 0;
  let pendingCount = 0;
  let totalAttendanceXP = 0;

  timeline.forEach(event => {
    if (event.status === 'pendiente') {
      pendingCount++;
      return; // Los eventos pendientes no suman ni rompen racha ni aportan XP
    }

    switch (event.status) {
      case 'presente':
        attended++;
        currentStreak++;
        totalAttendanceXP += Number(xpTable.xpPresente ?? 10);
        break;

      case 'tarde':
        late++;
        attended++;
        currentStreak++;
        totalAttendanceXP += Number(xpTable.xpTarde ?? 5);
        break;

      case 'justificado':
        justified++;
        // PAUSA la racha: no incrementa currentStreak, pero NO la reinicia
        totalAttendanceXP += Number(xpTable.xpJustificado ?? 2);
        break;

      case 'lesionado':
        injured++;
        // PAUSA la racha: no rompe
        totalAttendanceXP += Number(xpTable.xpLesionado ?? 2);
        break;

      case 'ausente':
        absent++;
        currentStreak = 0; // ROMPE la racha
        totalAttendanceXP += Number(xpTable.xpAusente ?? 0);
        break;

      default:
        break;
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  });

  const totalVerified = attended + justified + injured + absent;

  // Cálculo de % de asistencia real sobre programado (Fase 1)
  const effectiveSessions = sessionsList && sessionsList.length > 0
    ? sessionsList
    : (attendanceList || []).filter(a => a && a.type !== 'match');

  const scheduleStats = calculatePlayerAttendanceOnSchedule(playerId, {
    sessions: effectiveSessions,
    matches: matchesList,
    attendanceRecords: attendanceList,
    thresholds: customXpTable
  });

  return {
    streak: currentStreak,
    maxStreak,
    percentage: scheduleStats.pct,
    pct: scheduleStats.pct,
    hasData: scheduleStats.hasData,
    status: scheduleStats.status,
    totalVerified,
    attended,
    late,
    justified,
    injured,
    absent,
    noRecord: scheduleStats.noRecord,
    suspended: scheduleStats.suspended,
    scheduledPast: scheduleStats.scheduledPast,
    pendingCount,
    attendanceXP: totalAttendanceXP,
    hasPendingEvents: pendingCount > 0,
    timeline,
    callupGuidance: scheduleStats.callupGuidance
  };
};

/**
 * Calcula el Power Score / Global XP unificado para el Leaderboard:
 * Global XP = Attendance XP (diferenciado) + Match XP (minutos reales + eventos) + Achievements XP
 */
export const calculatePlayerGlobalXP = ({
  attendanceXP = 0,
  playerMatchStats = null,
  achievementsXP = 0,
  customMatchXpWeights = {}
}) => {
  let matchXP = 0;

  if (playerMatchStats) {
    const minutes = Number(playerMatchStats.minutesPlayed) || 0;
    const goals = Number(playerMatchStats.goals) || 0;
    const assists = Number(playerMatchStats.assists) || 0;
    const yellowCards = Number(playerMatchStats.yellowCards) || 0;
    const redCards = Number(playerMatchStats.redCards) || 0;
    const avgRating = Number(playerMatchStats.avgRating) || 0;

    // 1 XP por cada 5 minutos disputados oficialmente
    const minutesPoints = Math.round(minutes * (customMatchXpWeights.xpPerMinute ?? 0.2));
    // 10 XP por gol
    const goalsPoints = goals * (customMatchXpWeights.xpPerGoal ?? 10);
    // 5 XP por asistencia
    const assistsPoints = assists * (customMatchXpWeights.xpPerAssist ?? 5);
    // Bonus por nota media alta (si nota >= 8.0)
    const ratingBonus = avgRating >= 8.0 ? 15 : (avgRating >= 7.0 ? 5 : 0);
    // Penalización por tarjetas
    const cardsPenalty = (yellowCards * 2) + (redCards * 5);

    matchXP = Math.max(0, minutesPoints + goalsPoints + assistsPoints + ratingBonus - cardsPenalty);
  }

  const totalXP = attendanceXP + matchXP + achievementsXP;

  return {
    totalXP,
    attendanceXP,
    matchXP,
    achievementsXP
  };
};
