/**
 * src/utils/attendanceMath.js
 * Míster11 — Fórmula Única de Asistencia Real sobre Programado y Asistente de Convocatoria
 *
 * REGLAS DEPORTIVAS OFICIALES:
 * 1. % Asistencia Real sobre Programado:
 *    % = (presente + tarde) / (eventos pasados programados - justificado - lesionado - suspendido) * 100
 *
 * 2. "Evento pasado programado":
 *    - Sesión o partido con fecha/hora <= ahora (o fecha < hoy, o fecha == hoy y hora pasada).
 *    - Evento pasado SIN registro del staff = "Sin registro" (noRecord):
 *      Entra en el denominador de eventos programados, pero NO en el numerador.
 *    - Justificado / lesionado / sesión suspendida (isSuspended: true) = Neutros (se restan del denominador).
 *    - Partidos pasados: SOLO cuentan para el jugador si estaba convocado. Si no estaba convocado, no entra en su denominador.
 *
 * 3. Estado "Sin datos":
 *    Si el denominador efectivo (tras restar neutros) es <= 0 o no hay eventos pasados:
 *    pct = null, hasData = false, status = 'no_data' ("Sin datos").
 *    Queda excluido de la media del equipo y de las alertas de riesgo.
 */

/**
 * Normaliza una fecha a string YYYY-MM-DD
 */
export const toDateKey = (rawDate) => {
  if (!rawDate) return '';
  if (typeof rawDate === 'string') {
    if (rawDate.includes('T')) return rawDate.split('T')[0];
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        // Asumiendo DD/MM/YYYY o YYYY/MM/DD
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return rawDate.substring(0, 10);
  }
  if (rawDate instanceof Date) {
    return rawDate.toISOString().split('T')[0];
  }
  if (rawDate?.toDate && typeof rawDate.toDate === 'function') {
    return rawDate.toDate().toISOString().split('T')[0];
  }
  if (rawDate?.seconds) {
    return new Date(rawDate.seconds * 1000).toISOString().split('T')[0];
  }
  return '';
};

/**
 * Determina si un evento deportivo ya se celebró (es pasado).
 * @param {string|Date} dateStr - Fecha del evento
 * @param {string} timeStr - Hora opcional (HH:mm)
 * @param {Date} referenceNow - Fecha de referencia (por defecto Date.now())
 */
export const isEventPast = (dateStr, timeStr = '23:59', referenceNow = new Date()) => {
  const dKey = toDateKey(dateStr);
  if (!dKey) return false;

  const todayKey = toDateKey(referenceNow);
  if (dKey < todayKey) return true;
  if (dKey > todayKey) return false;

  // Si es hoy, comparar por hora si existe
  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
    const eventTime = new Date(referenceNow);
    eventTime.setHours(h, m, 0, 0);
    return eventTime.getTime() <= referenceNow.getTime();
  }

  return true; // Si es hoy y no tiene hora específica, se considera realizable hoy
};

/**
 * Calcula las métricas de porcentaje y estado de asistencia a partir de contadores.
 *
 * @param {Object} params
 * @param {number} params.present
 * @param {number} params.late
 * @param {number} params.justified
 * @param {number} params.injured
 * @param {number} params.absent
 * @param {number} params.noRecord
 * @param {number} params.suspended
 * @param {number} params.scheduledPast
 * @returns {Object} { pct: number|null, present: number, late: number, attended: number, scheduledPast: number, noRecord: number, justified: number, injured: number, suspended: number, absent: number, eligible: number, hasData: boolean, status: 'no_data'|'optimal'|'risk', labelKey: string }
 */
export const calculateAttendanceMetrics = ({
  present = 0,
  late = 0,
  justified = 0,
  injured = 0,
  absent = 0,
  noRecord = 0,
  suspended = 0,
  scheduledPast = 0
} = {}) => {
  const p = Number.isFinite(Number(present)) ? Number(present) : 0;
  const l = Number.isFinite(Number(late)) ? Number(late) : 0;
  const j = Number.isFinite(Number(justified)) ? Number(justified) : 0;
  const inj = Number.isFinite(Number(injured)) ? Number(injured) : 0;
  const a = Number.isFinite(Number(absent)) ? Number(absent) : 0;
  const nr = Number.isFinite(Number(noRecord)) ? Number(noRecord) : 0;
  const susp = Number.isFinite(Number(suspended)) ? Number(suspended) : 0;

  const attended = p + l;
  // Denominador total de eventos pasados programados
  const totalPast = scheduledPast > 0 ? scheduledPast : (p + l + j + inj + a + nr + susp);
  const eligible = Math.max(0, totalPast - j - inj - susp);

  // 1. Caso: 0 eventos pasados programados o sin eventos evaluables
  if (totalPast === 0 || eligible <= 0) {
    if (totalPast > 0 && (j > 0 || inj > 0) && a === 0 && nr === 0) {
      // Si todos los eventos fueron justificados o lesionados (100% justificado)
      return {
        pct: 100,
        present: p,
        late: l,
        attended,
        scheduledPast: totalPast,
        noRecord: nr,
        justified: j,
        injured: inj,
        suspended: susp,
        absent: a,
        eligible: 0,
        hasData: true,
        status: 'optimal',
        labelKey: 'common.optimal'
      };
    }

    return {
      pct: null,
      present: p,
      late: l,
      attended: 0,
      scheduledPast: totalPast,
      noRecord: nr,
      justified: j,
      injured: inj,
      suspended: susp,
      absent: a,
      eligible: 0,
      hasData: false,
      status: 'no_data',
      labelKey: 'common.noData'
    };
  }

  // 2. Cálculo ponderado sobre programado
  const rawPct = (attended / eligible) * 100;
  const pct = Math.min(100, Math.max(0, Math.round(rawPct)));
  const isAtRisk = pct < 70;

  return {
    pct,
    present: p,
    late: l,
    attended,
    scheduledPast: totalPast,
    noRecord: nr,
    justified: j,
    injured: inj,
    suspended: susp,
    absent: a,
    eligible,
    hasData: true,
    status: isAtRisk ? 'risk' : 'optimal',
    labelKey: isAtRisk ? 'common.risk' : 'common.optimal'
  };
};

/**
 * Calcula el promedio de asistencia de un conjunto de estadísticas de jugadores,
 * excluyendo explícitamente a los jugadores "Sin datos" (pct === null).
 *
 * @param {Array} squadStatsList - Lista de estadísticas de jugadores ({ pct, hasData, ... })
 * @returns {number} Promedio de asistencia del equipo (0 a 100)
 */
export const calculateSquadAveragePct = (squadStatsList = []) => {
  const validPlayers = (squadStatsList || []).filter(
    (s) => s && s.hasData && typeof s.pct === 'number' && Number.isFinite(s.pct)
  );

  if (validPlayers.length === 0) return 0;

  const sum = validPlayers.reduce((acc, curr) => acc + curr.pct, 0);
  return Math.round(sum / validPlayers.length);
};

/**
 * Determina la orientación para la convocatoria según el % de asistencia y umbrales configurados.
 *
 * @param {number|null} pct - Porcentaje de asistencia real
 * @param {Object} thresholds - { convocMinPct: 80, dudaMinPct: 50 }
 * @returns {Object} { recommendation: 'recommended'|'doubtful'|'not_recommended'|'no_data', label: string, labelEn: string, color: string, bg: string, border: string, badge: string }
 */
export const determineCallupRecommendation = (pct, thresholds = {}) => {
  const convocMin = Number(thresholds?.convocMinPct ?? 80);
  const dudaMin = Number(thresholds?.dudaMinPct ?? 50);

  if (pct === null || pct === undefined || isNaN(pct) || !Number.isFinite(pct)) {
    return {
      recommendation: 'no_data',
      label: 'Sin sesiones en ventana',
      labelEn: 'No sessions in window',
      color: '#94A3B8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.3)',
      badge: '⚪'
    };
  }

  if (pct >= convocMin) {
    return {
      recommendation: 'recommended',
      label: 'Recomendado convocar',
      labelEn: 'Recommended call-up',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      badge: '✅'
    };
  }

  if (pct >= dudaMin) {
    return {
      recommendation: 'doubtful',
      label: 'Valorar',
      labelEn: 'Consider',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      badge: '⚠️'
    };
  }

  return {
    recommendation: 'not_recommended',
    label: 'No recomendado',
    labelEn: 'Not recommended',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    badge: '❌'
  };
};

/**
 * Calcula la ventana inteligente de microciclo para el asistente de convocatoria.
 * Si hay un partido en los próximos 7 días, define la ventana desde el día siguiente al partido anterior (o lunes) hasta el día del partido.
 *
 * @param {Object} params - { matches, sessions, targetDate }
 * @returns {Object} { windowType: 'microcycle'|'week', startDate: string, endDate: string, nextMatch: Object|null, previousMatch: Object|null, title: string, titleEn: string }
 */
export const getMicrocycleDateRange = ({ matches = [], sessions = [], targetDate = new Date() } = {}) => {
  const refDate = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const todayStr = toDateKey(refDate);

  // 1. Buscar el próximo partido dentro de los próximos 7 días
  const next7DaysStr = toDateKey(new Date(refDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  
  const upcomingMatches = (matches || [])
    .filter((m) => {
      const d = toDateKey(m.date || m.fecha);
      return d >= todayStr && d <= next7DaysStr;
    })
    .sort((a, b) => new Date(a.date || a.fecha).getTime() - new Date(b.date || b.fecha).getTime());

  const nextMatch = upcomingMatches[0] || null;

  if (nextMatch) {
    const nextMatchDateStr = toDateKey(nextMatch.date || nextMatch.fecha);

    // Buscar el partido anterior más reciente antes de este próximo partido
    const pastMatchesBefore = (matches || [])
      .filter((m) => {
        const d = toDateKey(m.date || m.fecha);
        return d < nextMatchDateStr;
      })
      .sort((a, b) => new Date(b.date || b.fecha).getTime() - new Date(a.date || a.fecha).getTime());

    const previousMatch = pastMatchesBefore[0] || null;
    let startDateStr = '';

    if (previousMatch) {
      const prevDate = new Date(previousMatch.date || previousMatch.fecha);
      prevDate.setDate(prevDate.getDate() + 1); // Día siguiente al partido anterior
      startDateStr = toDateKey(prevDate);
    } else {
      // Si no hay partido previo, usar el lunes de la semana del próximo partido
      const nDate = new Date(nextMatchDateStr);
      const day = nDate.getDay();
      const diff = nDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(nDate.setDate(diff));
      startDateStr = toDateKey(monday);
    }

    return {
      windowType: 'microcycle',
      startDate: startDateStr,
      endDate: nextMatchDateStr,
      nextMatch,
      previousMatch,
      title: `Microciclo vs ${nextMatch.rival || nextMatch.opponent || 'Rival'} (${startDateStr} al ${nextMatchDateStr})`,
      titleEn: `Microcycle vs ${nextMatch.rival || nextMatch.opponent || 'Rival'} (${startDateStr} to ${nextMatchDateStr})`
    };
  }

  // 2. Si no hay partido en 7 días, usar la semana en curso (Lunes a Domingo)
  const day = refDate.getDay();
  const diffToMonday = refDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(refDate.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startStr = toDateKey(monday);
  const endStr = toDateKey(sunday);

  return {
    windowType: 'week',
    startDate: startStr,
    endDate: endStr,
    nextMatch: null,
    previousMatch: null,
    title: `Semana en Curso (${startStr} al ${endStr})`,
    titleEn: `Current Week (${startStr} to ${endStr})`
  };
};

/**
 * Calcula la asistencia real sobre eventos programados de un jugador en una ventana de tiempo.
 *
 * @param {string} playerId
 * @param {Object} params
 * @param {Array} params.sessions
 * @param {Array} params.matches
 * @param {Array} params.attendanceRecords
 * @param {Object|null} params.dateRange - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' } (opcional para filtrar microciclo/quincena)
 * @param {Object} params.thresholds - { convocMinPct: 80, dudaMinPct: 50 }
 * @returns {Object} Desglose completo de asistencia sobre programado
 */
export const calculatePlayerAttendanceOnSchedule = (
  playerId,
  {
    sessions = [],
    matches = [],
    attendanceRecords = [],
    dateRange = null,
    thresholds = {},
    player = null
  } = {}
) => {
  const pid = String(playerId);
  const now = new Date();

  let present = 0;
  let late = 0;
  let justified = 0;
  let injured = 0;
  let absent = 0;
  let noRecord = 0;
  let suspended = 0;
  let scheduledPast = 0;

  const eventDetails = [];

  // Indexar attendance exhaustivamente por múltiples claves para enlace 100% fiable
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
    if (att.date && !attMap.has(`date_${att.date}`)) {
      attMap.set(`date_${att.date}`, att);
    }
  });

  // 1. Evaluar Sesiones de entrenamiento
  (sessions || []).forEach((s) => {
    if (!s) return;
    const sDate = toDateKey(s.date || s.fecha);
    if (!sDate) return;

    // Filtro por ventana de fechas si está activa
    if (dateRange?.startDate && sDate < dateRange.startDate) return;
    if (dateRange?.endDate && sDate > dateRange.endDate) return;

    // Solo eventos pasados o de hoy
    const isPast = isEventPast(sDate, s.time || s.hora || '23:59', now);
    if (!isPast) return;

    // Verificar si la sesión fue suspendida (Lluvia/Fuerza Mayor)
    const cleanSId = String(s.id || '').replace(/^session_/, '');
    const attDoc = attMap.get(cleanSId) || attMap.get(`session_${cleanSId}`) || attMap.get(s.id) || (sDate ? attMap.get(`date_${sDate}`) : null);
    const isSuspended = s.isSuspended === true || s.status === 'suspended' || s.estado === 'suspendida' || attDoc?.isSuspended === true;

    if (isSuspended) {
      suspended++;
      eventDetails.push({
        id: s.id,
        type: 'session',
        title: s.title || s.titulo || 'Entrenamiento',
        date: sDate,
        status: 'suspended',
        label: 'Suspendida',
        labelEn: 'Suspended',
        isSuspended: true
      });
      return;
    }

    scheduledPast++;

    // Buscar registro de asistencia del staff (records[pid])
    const hasStaffRecords = Boolean(attDoc?.records && Object.keys(attDoc.records).length > 0);
    const staffRecord = attDoc?.records?.[pid] ?? attDoc?.players?.[pid];
    let status = null;

    if (staffRecord !== undefined && staffRecord !== null) {
      if (typeof staffRecord === 'object') status = staffRecord.status;
      else if (typeof staffRecord === 'string') status = staffRecord;
      else if (typeof staffRecord === 'boolean') status = staffRecord ? 'present' : 'absent';
    } else if (Array.isArray(attDoc?.presentes) && attDoc.presentes.some((id) => String(id) === pid)) {
      status = 'present';
    } else if (hasStaffRecords) {
      // La sesión fue registrada por el staff pero este jugador no tiene registro explícito -> default ausente
      status = 'absent';
    }

    if (!status) {
      noRecord++;
      eventDetails.push({
        id: s.id,
        type: 'session',
        title: s.title || s.titulo || 'Entrenamiento',
        date: sDate,
        status: 'no_record',
        label: 'Sin registro',
        labelEn: 'No record',
        isNoRecord: true
      });
    } else {
      const sLower = String(status).toLowerCase().trim();
      if (sLower === 'present' || sLower === 'presente') {
        present++;
        eventDetails.push({ id: s.id, type: 'session', title: s.title, date: sDate, status: 'present', label: 'Presente', labelEn: 'Present' });
      } else if (sLower === 'late' || sLower === 'tarde') {
        late++;
        eventDetails.push({ id: s.id, type: 'session', title: s.title, date: sDate, status: 'late', label: 'Tarde', labelEn: 'Late' });
      } else if (sLower === 'justified' || sLower === 'justificado') {
        justified++;
        eventDetails.push({ id: s.id, type: 'session', title: s.title, date: sDate, status: 'justified', label: 'Justificado', labelEn: 'Justified' });
      } else if (sLower === 'injured' || sLower === 'lesionado') {
        injured++;
        eventDetails.push({ id: s.id, type: 'session', title: s.title, date: sDate, status: 'injured', label: 'Lesionado', labelEn: 'Injured' });
      } else {
        absent++;
        eventDetails.push({ id: s.id, type: 'session', title: s.title, date: sDate, status: 'absent', label: 'Ausente', labelEn: 'Absent' });
      }
    }
  });

  // 2. Evaluar Partidos
  (matches || []).forEach((m) => {
    if (!m) return;
    const mDate = toDateKey(m.date || m.fecha);
    if (!mDate) return;

    // Filtro por ventana de fechas
    if (dateRange?.startDate && mDate < dateRange.startDate) return;
    if (dateRange?.endDate && mDate > dateRange.endDate) return;

    // Solo partidos pasados
    const isPast = isEventPast(mDate, m.time || m.hora || '23:59', now);
    if (!isPast) return;

    // Verificar si el jugador estaba convocado para el partido
    const isCalled =
      (m.convocados || []).some((id) => String(id) === pid) ||
      (m.titulares || []).some((id) => String(id) === pid) ||
      (m.suplentes || []).some((id) => String(id) === pid) ||
      (m.convocatoria || []).some((id) => String(id) === pid) ||
      Boolean(m.actaOficial?.actual?.[pid]);

    // Si NO estaba convocado para este partido, no entra en su denominador
    if (!isCalled) return;

    scheduledPast++;

    const cleanMId = String(m.id || '').replace(/^match_/, '');
    const acta = m.actaOficial;
    const actaActual = acta?.actual?.[pid];
    const attDoc = attMap.get(cleanMId) || attMap.get(`match_${cleanMId}`) || attMap.get(m.id);
    const staffRecord = actaActual || attDoc?.records?.[pid];

    if (!staffRecord) {
      noRecord++;
      eventDetails.push({
        id: m.id,
        type: 'match',
        title: `vs ${m.rival || m.opponent || 'Rival'}`,
        date: mDate,
        status: 'no_record',
        label: 'Sin registro (Convocado)',
        labelEn: 'No record (Called up)',
        isNoRecord: true
      });
    } else {
      const rawStatus = typeof staffRecord === 'object' ? staffRecord.status : staffRecord;
      const sLower = String(rawStatus || '').toLowerCase().trim();

      if (sLower === 'present' || sLower === 'presente' || sLower === 'titular_full' || sLower === 'titular_subout' || sLower === 'sub_in') {
        present++;
        eventDetails.push({ id: m.id, type: 'match', title: `vs ${m.rival || 'Rival'}`, date: mDate, status: 'present', label: 'Presente', labelEn: 'Present' });
      } else if (sLower === 'late' || sLower === 'tarde') {
        late++;
        eventDetails.push({ id: m.id, type: 'match', title: `vs ${m.rival || 'Rival'}`, date: mDate, status: 'late', label: 'Tarde', labelEn: 'Late' });
      } else if (sLower === 'justified' || sLower === 'justificado') {
        justified++;
        eventDetails.push({ id: m.id, type: 'match', title: `vs ${m.rival || 'Rival'}`, date: mDate, status: 'justified', label: 'Justificado', labelEn: 'Justified' });
      } else if (sLower === 'injured' || sLower === 'lesionado') {
        injured++;
        eventDetails.push({ id: m.id, type: 'match', title: `vs ${m.rival || 'Rival'}`, date: mDate, status: 'injured', label: 'Lesionado', labelEn: 'Injured' });
      } else {
        absent++;
        eventDetails.push({ id: m.id, type: 'match', title: `vs ${m.rival || 'Rival'}`, date: mDate, status: 'absent', label: 'Ausente', labelEn: 'Absent' });
      }
    }
  });

  const metrics = calculateAttendanceMetrics({
    present,
    late,
    justified,
    injured,
    absent,
    noRecord,
    suspended,
    scheduledPast
  });

  let callupGuidance = determineCallupRecommendation(metrics.pct, thresholds);

  // Salvaguarda innegociable de justicia: Jugador suspendido disciplinariamente
  if (player?.isSuspended === true || player?.status === 'suspended' || player?.estado === 'suspendido') {
    callupGuidance = {
      recommendation: 'no_convocar',
      label: 'Sancionado / Suspendido',
      labelEn: 'Suspended / Sanctioned',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.4)',
      badge: '🚫',
      isSuspended: true,
      suspensionReason: player.suspensionReason || player.motivoSuspension || ''
    };
  }

  return {
    ...metrics,
    callupGuidance,
    eventDetails,
    dateRange
  };
};

export default {
  calculateAttendanceMetrics,
  calculateSquadAveragePct,
  determineCallupRecommendation,
  getMicrocycleDateRange,
  calculatePlayerAttendanceOnSchedule,
  isEventPast,
  toDateKey
};
