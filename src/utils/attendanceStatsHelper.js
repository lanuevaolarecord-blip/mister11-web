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

import { 
  calculateAttendanceMetrics, 
  calculatePlayerAttendanceOnSchedule,
  toDateKey,
  isEventPast
} from './attendanceMath.js';

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
 * Calcula la lista completa de eventos pasados pendientes de registro o cierre (sesiones y actas de partidos).
 * Alimenta tanto la alerta permanente unificada como el estado "SR" del asistente y resumen.
 *
 * @param {Array} sessions
 * @param {Array} matches
 * @param {Array} attendanceRecords
 * @returns {Object} { pendingSessions, openMatches, totalCount }
 */
export const getUnclosedAttendanceEvents = (sessions = [], matches = [], attendanceRecords = []) => {
  const attMap = new Map();
  (attendanceRecords || []).forEach((att) => {
    if (!att) return;
    if (att.id) {
      const rawId = String(att.id);
      attMap.set(rawId, att);
      const clean = rawId.replace(/^session_/, '').replace(/^match_/, '');
      attMap.set(clean, att);
      attMap.set(`session_${clean}`, att);
      attMap.set(`match_${clean}`, att);
    }
    if (att.sessionId) {
      const rawSId = String(att.sessionId);
      attMap.set(rawSId, att);
      const clean = rawSId.replace(/^session_/, '').replace(/^match_/, '');
      attMap.set(clean, att);
      attMap.set(`session_${clean}`, att);
      attMap.set(`match_${clean}`, att);
    }
  });

  const now = new Date();

  // 1. Sesiones pasadas sin registro oficial del staff
  const pendingSessions = (sessions || []).filter((s) => {
    if (!s) return false;
    const sDate = toDateKey(s.date || s.fecha);
    if (!sDate) return false;
    const isPast = isEventPast(sDate, s.time || s.hora || '23:59', now);
    if (!isPast) return false;
    const isSusp = s.isSuspended === true || s.status === 'suspended' || s.estado === 'suspendida';
    if (isSusp) return false;

    const cleanSId = String(s.id || '').replace(/^session_/, '');
    const attDoc = attMap.get(cleanSId) || attMap.get(`session_${cleanSId}`) || attMap.get(s.id);
    const hasRecords = Boolean(attDoc?.records && Object.keys(attDoc.records).length > 0);
    const isDocSuspended = Boolean(attDoc?.isSuspended);

    return !isDocSuspended && !hasRecords;
  });

  // 2. Partidos pasados con acta abierta (no cerrada)
  const openMatches = (matches || []).filter((m) => {
    if (!m) return false;
    const mDate = toDateKey(m.date || m.fecha);
    if (!mDate) return false;
    const isPast = isEventPast(mDate, m.time || m.hora || '23:59', now);
    if (!isPast) return false;
    const isClosed = m.actaOficial?.closed === true;
    return !isClosed;
  });

  return {
    pendingSessions,
    openMatches,
    totalCount: pendingSessions.length + openMatches.length
  };
};

/**
 * Mantiene compatibilidad regresiva retornando las sesiones pasadas sin registro
 */
export const getPendingEvents = (sessions = [], matches = [], attendanceRecords = []) => {
  const { pendingSessions } = getUnclosedAttendanceEvents(sessions, matches, attendanceRecords);
  return pendingSessions;
};

/**
 * Obtiene los contadores de asistencia 0/NaN-safe para un jugador sobre eventos programados.
 */
export const getCounts = (
  playerId,
  { sessions = [], matches = [], attendanceRecords = [], dateRange = null, thresholds = {} } = {}
) => {
  return calculatePlayerAttendanceOnSchedule(playerId, {
    sessions,
    matches,
    attendanceRecords,
    dateRange,
    thresholds
  });
};

/**
 * Obtiene el % real de asistencia seguro: (P+T) / (scheduledPast - J - L - S).
 * Retorna null si no hay datos/eventos evaluables (para render '—').
 */
export const getRealPct = (counts) => {
  if (!counts || !counts.hasData || counts.pct === null || counts.pct === undefined || isNaN(counts.pct)) {
    return null;
  }
  return Number.isFinite(counts.pct) ? counts.pct : null;
};

/**
 * Calcula la racha actual y máxima a partir de un timeline de eventos verificados.
 */
export const getStreak = (timeline = []) => {
  let currentStreak = 0;
  let maxStreak = 0;

  (timeline || []).forEach((event) => {
    if (event.status === 'pendiente' || event.status === 'no_record') {
      return;
    }

    if (event.status === 'presente' || event.status === 'tarde' || event.status === 'present' || event.status === 'late') {
      currentStreak++;
    } else if (event.status === 'justificado' || event.status === 'lesionado' || event.status === 'suspended' || event.status === 'justified' || event.status === 'injured') {
      // PAUSA la racha: no incrementa ni reinicia
      return;
    } else if (event.status === 'ausente' || event.status === 'absent') {
      currentStreak = 0; // ROMPE la racha
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  });

  return { streak: currentStreak, maxStreak };
};

/**
 * Extrae los estados por evento para un jugador.
 */
export const getEventStatuses = (playerId, { sessions = [], matches = [], attendanceRecords = [], dateRange = null } = {}) => {
  const stats = calculatePlayerAttendanceOnSchedule(playerId, {
    sessions,
    matches,
    attendanceRecords,
    dateRange
  });
  return stats.eventDetails || [];
};

/**
 * Calcula las estadísticas completas de asistencia, rachas y XP para un jugador
 *
 * @param {string} playerId
 * @param {Array} attendanceList
 * @param {Array} matchesList
 * @param {Object} customXpTable
 * @param {Array} sessionsList
 * @param {Object|null} dateRange
 * @returns {Object} { streak, maxStreak, percentage, pct, hasData, status, totalVerified, present, late, justified, injured, absent, noRecord, suspended, scheduledPast, eligible, attended, attendanceXP, timeline, eventDetails, callupGuidance }
 */
export const calculatePlayerAttendanceStats = (
  playerId,
  attendanceList = [],
  matchesList = [],
  customXpTable = {},
  sessionsList = [],
  dateRange = null
) => {
  const xpTable = { ...DEFAULT_XP_TABLE, ...customXpTable };
  const pid = String(playerId);

  // 1. Obtener conteo canónico sobre programado
  const scheduleStats = calculatePlayerAttendanceOnSchedule(pid, {
    sessions: sessionsList,
    matches: matchesList,
    attendanceRecords: attendanceList,
    dateRange,
    thresholds: customXpTable
  });

  // 2. Extraer timeline ordenado cronológicamente para racha y XP
  const timeline = extractPlayerVerifiedTimeline(pid, attendanceList, matchesList);

  let currentStreak = 0;
  let maxStreak = 0;
  let totalAttendanceXP = 0;

  timeline.forEach((event) => {
    if (event.status === 'pendiente') {
      return;
    }

    switch (event.status) {
      case 'presente':
        currentStreak++;
        totalAttendanceXP += Number(xpTable.xpPresente ?? 10);
        break;

      case 'tarde':
        currentStreak++;
        totalAttendanceXP += Number(xpTable.xpTarde ?? 5);
        break;

      case 'justificado':
        totalAttendanceXP += Number(xpTable.xpJustificado ?? 2);
        break;

      case 'lesionado':
        totalAttendanceXP += Number(xpTable.xpLesionado ?? 2);
        break;

      case 'ausente':
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

  // Asegurar que todos los valores numéricos son enteros finitos
  const present = Number.isFinite(scheduleStats.present) ? scheduleStats.present : 0;
  const late = Number.isFinite(scheduleStats.late) ? scheduleStats.late : 0;
  const justified = Number.isFinite(scheduleStats.justified) ? scheduleStats.justified : 0;
  const injured = Number.isFinite(scheduleStats.injured) ? scheduleStats.injured : 0;
  const absent = Number.isFinite(scheduleStats.absent) ? scheduleStats.absent : 0;
  const noRecord = Number.isFinite(scheduleStats.noRecord) ? scheduleStats.noRecord : 0;
  const suspended = Number.isFinite(scheduleStats.suspended) ? scheduleStats.suspended : 0;
  const scheduledPast = Number.isFinite(scheduleStats.scheduledPast) ? scheduleStats.scheduledPast : 0;
  const attended = Number.isFinite(scheduleStats.attended) ? scheduleStats.attended : (present + late);
  const eligible = Number.isFinite(scheduleStats.eligible) ? scheduleStats.eligible : 0;

  const pct = scheduleStats.hasData && Number.isFinite(scheduleStats.pct) ? scheduleStats.pct : null;
  const hasData = Boolean(scheduleStats.hasData && pct !== null);

  return {
    streak: currentStreak,
    maxStreak,
    percentage: pct,
    pct,
    hasData,
    status: scheduleStats.status || (hasData ? (pct < 70 ? 'risk' : 'optimal') : 'no_data'),
    totalVerified: present + late + justified + injured + absent,
    present,
    late,
    justified,
    injured,
    absent,
    noRecord,
    suspended,
    scheduledPast,
    eligible,
    attended,
    total: scheduledPast,
    pendingCount: noRecord,
    attendanceXP: totalAttendanceXP,
    hasPendingEvents: noRecord > 0,
    timeline,
    eventDetails: scheduleStats.eventDetails || [],
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

/**
 * API canónica única requerida por el estándar de Míster11:
 * getPlayerAttendance(playerId, { from, to, sessions, matches, attendanceRecords, thresholds })
 * Retorna contadores y porcentajes NaN-safe garantizados.
 */
export const getPlayerAttendance = (
  playerId,
  {
    from = null,
    to = null,
    sessions = [],
    matches = [],
    attendanceRecords = [],
    thresholds = {}
  } = {}
) => {
  const dateRange = (from || to) ? { startDate: from, endDate: to } : null;
  const stats = calculatePlayerAttendanceStats(
    playerId,
    attendanceRecords,
    matches,
    thresholds,
    sessions,
    dateRange
  );

  return {
    presente: stats.present,
    tarde: stats.late,
    justificado: stats.justified,
    ausente: stats.absent,
    lesionado: stats.injured,
    sinRegistro: stats.noRecord,
    suspendido: stats.suspended,
    scheduledPast: stats.scheduledPast,
    eligible: stats.eligible,
    attended: stats.attended,
    pct: stats.pct,
    percentage: stats.percentage,
    streak: stats.streak,
    maxStreak: stats.maxStreak,
    hasData: stats.hasData,
    status: stats.status,
    timeline: stats.timeline,
    eventDetails: stats.eventDetails,
    callupGuidance: stats.callupGuidance
  };
};

/**
 * Fase 5: Auto-test de Coherencia (Entrenador vs Asistente vs Portal del Jugador)
 * Compara para cada jugador que Resumen(temporada), Asistente(ventana=temporada) y Portal(temporada)
 * devuelvan exactamente los mismos números.
 */
export const checkAttendanceConsistency = ({
  players = [],
  sessions = [],
  matches = [],
  attendanceRecords = [],
  seasonRange = null,
  thresholds = {}
} = {}) => {
  const divergences = [];

  (players || []).forEach((p) => {
    const pid = String(p.id);
    const pName = p.name || p.nombre || pid;

    // 1. Resumen de plantilla (Temporada)
    const resumen = calculatePlayerAttendanceStats(
      pid,
      attendanceRecords,
      matches,
      thresholds,
      sessions,
      seasonRange
    );

    // 2. Asistente de convocatoria con ventana de temporada
    const asistente = calculatePlayerAttendanceOnSchedule(pid, {
      sessions,
      matches,
      attendanceRecords,
      dateRange: seasonRange,
      thresholds,
      player: p
    });

    // 3. Portal del jugador (getPlayerAttendance)
    const portal = getPlayerAttendance(pid, {
      from: seasonRange?.startDate || null,
      to: seasonRange?.endDate || null,
      sessions,
      matches,
      attendanceRecords,
      thresholds
    });

    // Verificar igualdad estricta campo a campo
    const fields = ['present', 'late', 'justified', 'injured', 'absent', 'noRecord', 'scheduledPast', 'pct'];
    const diffs = [];

    fields.forEach((f) => {
      const vResumen = resumen[f];
      const vAsistente = asistente[f];
      const vPortal = f === 'present' ? portal.presente :
                      f === 'late' ? portal.tarde :
                      f === 'justified' ? portal.justificado :
                      f === 'injured' ? portal.lesionado :
                      f === 'absent' ? portal.ausente :
                      f === 'noRecord' ? portal.sinRegistro :
                      portal[f];

      if (vResumen !== vAsistente || vResumen !== vPortal) {
        diffs.push({
          field: f,
          resumen: vResumen,
          asistente: vAsistente,
          portal: vPortal
        });
      }
    });

    if (diffs.length > 0) {
      divergences.push({
        playerId: pid,
        playerName: pName,
        diffs
      });
      console.warn(`[checkAttendanceConsistency] ⚠️ Divergencia detectada para ${pName} (${pid}):`, diffs);
    }
  });

  if (divergences.length === 0) {
    console.log(`[checkAttendanceConsistency] ✅ 0 divergencias detectadas en ${players.length} jugadores auditados. Coherencia 100% total.`);
  }

  return {
    divergences,
    count: divergences.length,
    isConsistent: divergences.length === 0,
    totalPlayersChecked: (players || []).length
  };
};

/**
 * Fase 1: Migración / Normalización y Reparación Completa de Asistencia en Firestore
 * 1. Copia el valor del míster a la fuente canónica para eventos pasados sin tocar campos legacy.
 * 2. Repara la omisión de claves en records cuando se guardó asistencia para toda la plantilla.
 */
export const repairAttendanceRecords = async (teamPath, { db, getDocs, updateDoc, setDoc, doc, collection, serverTimestamp }) => {
  if (!teamPath || !db) throw new Error('Parámetros de Firestore no válidos');

  let normalizedCount = 0;
  let repairedKeysCount = 0;
  const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');

  // 0. Obtener lista completa de jugadores de la plantilla
  const playersSnap = await getDocs(collection(db, `${cleanPath}/players`));
  const teamPlayerIds = playersSnap.docs.map(d => d.id);

  // 1. Normalizar y reparar sesiones en attendance/{eventId}
  const attSnap = await getDocs(collection(db, `${cleanPath}/attendance`));
  for (const attDoc of attSnap.docs) {
    const data = attDoc.data();
    let needsUpdate = false;
    const records = { ...(data.records || {}) };

    // A) Canonizar campos legacy como players, presentes o presentPlayers a records
    if (data.players && typeof data.players === 'object') {
      Object.entries(data.players).forEach(([pid, pVal]) => {
        if (!records[pid]) {
          const rawStatus = typeof pVal === 'object' ? pVal.status : (pVal === true ? 'present' : (pVal === false ? 'absent' : pVal));
          const norm = normalizeEventStatus(rawStatus) || 'presente';
          records[pid] = { status: norm, lateMin: typeof pVal === 'object' ? pVal.lateMin : null };
          needsUpdate = true;
        }
      });
    }

    if (Array.isArray(data.presentes)) {
      data.presentes.forEach((pid) => {
        if (!records[String(pid)]) {
          records[String(pid)] = { status: 'presente' };
          needsUpdate = true;
        }
      });
    }

    if (Array.isArray(data.presentPlayers)) {
      data.presentPlayers.forEach((pid) => {
        if (!records[String(pid)]) {
          records[String(pid)] = { status: 'presente' };
          needsUpdate = true;
        }
      });
    }

    // B) Reparación: si el registro tiene jugadores guardados, asegurar que TODOS los jugadores de la plantilla están presentes
    const existingPids = Object.keys(records);
    if (existingPids.length > 0) {
      // Verificar si la sesión fue guardada con todos presentes (o casi todos presentes)
      const presentCount = existingPids.filter(id => {
        const s = records[id]?.status || records[id];
        return s === 'present' || s === 'presente';
      }).length;
      const isAllPresentSession = presentCount === existingPids.length;

      teamPlayerIds.forEach(pid => {
        if (!records[pid]) {
          records[pid] = {
            status: isAllPresentSession ? 'presente' : 'ausente',
            lateMin: 0
          };
          needsUpdate = true;
          repairedKeysCount++;
        }
      });
    }

    if (needsUpdate) {
      await updateDoc(doc(db, `${cleanPath}/attendance`, attDoc.id), {
        records,
        updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
      });
      normalizedCount++;
    }
  }

  // 2. Normalizar y reparar partidos en matches/{id}.actaOficial.actual
  const matchesSnap = await getDocs(collection(db, `${cleanPath}/matches`));
  for (const mDoc of matchesSnap.docs) {
    const mData = mDoc.data();
    const acta = mData.actaOficial;
    const actaActual = acta?.actual || {};
    let needsMatchUpdate = false;
    const updatedActual = { ...actaActual };

    // Sincronizar desde attendance si existe registro correspondiente
    const cleanId = mDoc.id.replace(/^match_/, '');
    const matchAttDoc = attSnap.docs.find(d => d.id === mDoc.id || d.id === `match_${cleanId}` || d.id === cleanId);
    if (matchAttDoc) {
      const matchRecords = matchAttDoc.data()?.records || {};
      Object.entries(matchRecords).forEach(([pid, rec]) => {
        if (!updatedActual[pid]) {
          const rawStatus = typeof rec === 'object' ? rec.status : rec;
          const norm = normalizeEventStatus(rawStatus) || 'presente';
          updatedActual[pid] = {
            status: norm,
            at: new Date().toISOString(),
            ...(typeof rec === 'object' && rec.lateMinutes ? { lateMin: rec.lateMinutes } : {})
          };
          needsMatchUpdate = true;
        }
      });
    }

    // Asegurar que todos los convocados/titulares/suplentes tienen clave en actaOficial.actual
    const allCalled = [
      ...(mData.convocados || []),
      ...(mData.titulares || []),
      ...(mData.suplentes || []),
      ...(mData.alineacion?.titulares || []),
      ...(mData.alineacion?.suplentes || [])
    ];
    allCalled.forEach(pId => {
      const pidStr = String(pId);
      if (!updatedActual[pidStr]) {
        updatedActual[pidStr] = {
          status: 'ausente',
          minutes: 0,
          minuteSource: 'acta',
          at: new Date().toISOString()
        };
        needsMatchUpdate = true;
        repairedKeysCount++;
      }
    });

    if (needsMatchUpdate) {
      await updateDoc(doc(db, `${cleanPath}/matches`, mDoc.id), {
        'actaOficial.actual': updatedActual,
        updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
      });
      normalizedCount++;
    }
  }

  return { normalizedCount, repairedKeysCount };
};

export const normalizeAttendanceDatabase = repairAttendanceRecords;

