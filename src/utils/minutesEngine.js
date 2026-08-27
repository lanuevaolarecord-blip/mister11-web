/**
 * Determina la duración real y efectiva de un partido.
 * Si el partido finalizó anticipadamente (ej. 39:30), la duración efectiva es el finalClock (40' o 39').
 * NINGÚN minuto de jugador puede superar este techo.
 * @param {Object} match
 * @returns {number} Duración efectiva en minutos
 */
export const getEffectiveMatchDuration = (match = {}) => {
  const nominalDuration = parseInt(match.duration || match.duracion || 90, 10);
  if (match.hasExtraTime || match.extraTime || match.prorroga) {
    return Math.max(nominalDuration, 120);
  }

  // Si se marcó explícitamente como completo reglamentario
  if (match.durationType === 'completo') {
    return nominalDuration;
  }

  // Extraer segundos finales reales si el partido terminó
  const finalSec = Number.isFinite(match.finalSeconds)
    ? match.finalSeconds
    : (typeof match.finalClock === 'string' && match.finalClock.includes(':')
        ? (parseInt(match.finalClock.split(':')[0], 10) * 60 + parseInt(match.finalClock.split(':')[1], 10))
        : (Number.isFinite(match.elapsedSeconds) ? match.elapsedSeconds : null));

  const isFinished = match.status === 'Terminado' || match.status === 'Finalizado';

  if (match.durationType === 'anticipado' && finalSec !== null) {
    return Math.max(1, Math.ceil(finalSec / 60));
  }

  // Si está terminado y finalSec es menor que la duración nominal menos 3 min (ej. 39:30 en partido de 90')
  if (isFinished && finalSec !== null && finalSec > 0 && finalSec < (nominalDuration - 3) * 60) {
    return Math.max(1, Math.ceil(finalSec / 60));
  }

  return nominalDuration;
};

/**
 * Determina si el partido está bloqueado contra modificaciones en vivo
 * (Partido terminado o Acta Oficial cerrada).
 * @param {Object} match
 * @returns {boolean}
 */
export const isMatchLocked = (match = {}) => {
  if (!match) return false;
  const status = String(match.status || '').toLowerCase();
  const isFinished = status === 'terminado' || status === 'finalizado';
  const isClosed = match.actaOficial?.closed === true;
  return isFinished || isClosed;
};

/**
 * Extrae y fusiona la lista canónica de eventos de un partido (events + liveStatsEvents).
 * Elimina duplicados por id o firma y ordena por minuto ascendente.
 * @param {Object} match
 * @returns {Array} Eventos deduplicados y ordenados por minute ASC
 */
export const getUnifiedMatchEvents = (match = {}) => {
  const events = Array.isArray(match.events) ? match.events : [];
  const liveStatsEvents = Array.isArray(match.liveStatsEvents) ? match.liveStatsEvents : [];

  const map = new Map();
  events.forEach((e) => {
    if (!e) return;
    if (e.isValid === false) return; // Omitir eventos invalidados
    const key = e.id || `evt_${e.type}_${e.minute || e.minuto || 0}_${e.playerId || e.playerInId || ''}_${e.playerOutId || ''}`;
    map.set(key, e);
  });

  liveStatsEvents.forEach((e) => {
    if (!e) return;
    if (e.isValid === false) return;
    const key = e.id || `evt_${e.type}_${e.minute || e.minuto || 0}_${e.playerId || e.playerInId || ''}_${e.playerOutId || ''}`;
    if (!map.has(key)) {
      map.set(key, e);
    }
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const mA = parseInt(a.minute || a.minuto || a.min || 0, 10);
    const mB = parseInt(b.minute || b.minuto || b.min || 0, 10);
    if (mA !== mB) return mA - mB;
    return (a.timestamp || '').localeCompare(b.timestamp || '');
  });

  return merged;
};

/**
 * Calcula los minutos jugados por un jugador a partir de los EVENTOS del partido,
 * SUSTITUCIONES, EXPULSIONES, PRÓRROGAS y ESTADO DE ASISTENCIA.
 *
 * @param {string} playerId             - ID del jugador
 * @param {Array}  allEvents            - Todos los eventos del partido
 * @param {Array}  titulares            - Lista de IDs titulares
 * @param {Array}  suplentes            - Lista de IDs suplentes
 * @param {number} totalDuration        - Duración total o efectiva del partido en minutos
 * @param {number|null} minutesOverride - Si el míster editó manualmente los minutos
 * @param {string|null} attendanceStatus - Estado oficial ('presente', 'ausente', 'tarde', 'justificado', 'lesionado')
 * @param {number|null} lateMin         - Minutos de retraso si status === 'tarde'
 * @param {Array}  tarjetasList         - Lista opcional de tarjetas estructuradas
 * @returns {{ minutes: number, source: string, detail: string, eventsUsed: Array }}
 */
export const calculateMinutesFromEvents = (
  playerId,
  allEvents = [],
  titulares = [],
  suplentes = [],
  totalDuration = 90,
  minutesOverride = null,
  attendanceStatus = null,
  lateMin = null,
  tarjetasList = []
) => {
  const pid = String(playerId || '');
  if (!pid) return { minutes: 0, source: 'not_called', detail: 'No convocado', eventsUsed: [] };

  let duration = parseInt(totalDuration, 10) || 90;

  // Regla Override manual del míster
  if (minutesOverride !== null && minutesOverride !== undefined && !isNaN(Number(minutesOverride))) {
    const mins = Math.min(duration, Math.max(0, parseInt(minutesOverride, 10)));
    return {
      minutes: mins,
      source: 'override',
      detail: `Modificado manualmente (${mins}')`,
      eventsUsed: []
    };
  }

  const isTitular = (titulares || []).some(id => id && String(id) === pid);
  const isSuplente = (suplentes || []).some(id => id && String(id) === pid);

  if (!isTitular && !isSuplente) {
    return { minutes: 0, source: 'not_called', detail: 'No convocado', eventsUsed: [] };
  }

  // Normalizar estado de asistencia
  const normStatus = attendanceStatus ? String(attendanceStatus).toLowerCase().trim() : null;

  if (normStatus === 'ausente' || normStatus === 'absent' || normStatus === 'not_going') {
    return { minutes: 0, source: 'absent', detail: 'Ausente (No asistió)', eventsUsed: [] };
  }
  if (normStatus === 'justificado' || normStatus === 'justified') {
    return { minutes: 0, source: 'justified', detail: 'Falta justificada', eventsUsed: [] };
  }

  // Filtrar eventos válidos (excluyendo minutos que superen la duración del partido)
  const validEvents = (allEvents || []).filter(e => {
    if (!e || e.isValid === false) return false;
    const min = parseInt(e.minute || e.minuto || e.min || 0, 10);
    return min <= duration + 5; // Tolerancia de descuento
  });

  // Eventos de sustitución válidos
  const subEvents = validEvents.filter(e =>
    e.type === 'cambio' || e.type === 'sustitucion' || e.type === 'substitution' || e.type === 'sub'
  );

  const subOutEvents = subEvents.filter(e =>
    String(e.subOutId || e.jugadorSaleId || e.playerOutId || e.outId || '') === pid
  );
  const subInEvents = subEvents.filter(e =>
    String(e.subInId || e.jugadorEntraId || e.playerInId || e.inId || '') === pid
  );

  const rawSubOutMin = subOutEvents.length > 0
    ? parseInt(subOutEvents[0].minute || subOutEvents[0].minuto || subOutEvents[0].min || duration, 10)
    : null;
  const rawSubInMin = subInEvents.length > 0
    ? parseInt(subInEvents[0].minute || subInEvents[0].minuto || subInEvents[0].min || 0, 10)
    : null;

  const subOutMin = rawSubOutMin !== null ? Math.min(duration, Math.max(0, rawSubOutMin)) : null;
  const subInMin = rawSubInMin !== null ? Math.min(duration, Math.max(0, rawSubInMin)) : null;

  // Detección de Tarjetas Rojas / Expulsión
  let expulsionMin = null;
  const redCardEvent = (allEvents || []).find(e => {
    if (!e || e.isValid === false) return false;
    const isPlayer = String(e.playerId || e.jugadorId || e.player_id || '') === pid;
    if (!isPlayer) return false;
    const type = String(e.type || '').toLowerCase();
    const card = String(e.card || e.tipo || '').toLowerCase();
    return (
      type === 'roja' ||
      type === 'red_card' ||
      type === 'card_red_own' ||
      type === 'card_red_rival' ||
      type === 'expulsion' ||
      type === 'tarjeta_roja' ||
      (type === 'tarjeta' && (card === 'roja' || card === 'red' || e.isRed === true))
    );
  });

  if (redCardEvent) {
    expulsionMin = parseInt(redCardEvent.minute || redCardEvent.minuto || redCardEvent.min || duration, 10);
  }

  if (expulsionMin === null && Array.isArray(tarjetasList) && tarjetasList.length > 0) {
    const redItem = tarjetasList.find(t =>
      t && String(t.jugadorId || '') === pid && (t.tipo === 'roja' || t.tipo === 'red')
    );
    if (redItem) {
      expulsionMin = parseInt(redItem.minuto || redItem.minute || duration, 10);
    }
  }

  if (expulsionMin === null) {
    const yellowCards = (allEvents || []).filter(e => {
      if (!e || e.isValid === false) return false;
      const isPlayer = String(e.playerId || e.jugadorId || e.player_id || '') === pid;
      if (!isPlayer) return false;
      const type = String(e.type || '').toLowerCase();
      const card = String(e.card || e.tipo || '').toLowerCase();
      return (
        type === 'amarilla' ||
        type === 'yellow_card' ||
        type === 'card_yellow_own' ||
        (type === 'tarjeta' && (card === 'amarilla' || card === 'yellow'))
      );
    });

    if (yellowCards.length >= 2) {
      yellowCards.sort((a, b) => {
        const mA = parseInt(a.minute || a.minuto || 0, 10);
        const mB = parseInt(b.minute || b.minuto || 0, 10);
        return mA - mB;
      });
      expulsionMin = parseInt(yellowCards[1].minute || yellowCards[1].minuto || duration, 10);
    }
  }

  // Determinar si el jugador comenzó el partido en el campo (titular inicial)
  const hasSubIn = subInMin !== null;
  const hasSubOut = subOutMin !== null;

  let startedOnPitch = false;
  if (hasSubOut && (!hasSubIn || subOutMin < subInMin)) {
    startedOnPitch = true;
  } else if (isTitular && !hasSubIn) {
    startedOnPitch = true;
  } else if (isTitular && isSuplente) {
    startedOnPitch = !hasSubIn;
  }

  // Regla: Lesionado
  if (normStatus === 'lesionado' || normStatus === 'injured') {
    if (!startedOnPitch && hasSubIn) {
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      const mins = Math.max(0, exitMin - subInMin);
      return {
        minutes: mins,
        source: 'injured_played',
        detail: `Lesión: jugó ${mins}' (Entra ${subInMin}')`,
        eventsUsed: [...subInEvents, ...(subOutEvents || [])]
      };
    }
    if (startedOnPitch) {
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      const mins = Math.max(0, exitMin);
      return {
        minutes: mins,
        source: 'injured_played',
        detail: `Lesión: jugó ${mins}' (Titular inicial)`,
        eventsUsed: [...(subOutEvents || [])]
      };
    }
    return { minutes: 0, source: 'injured', detail: 'Lesionado (0\')', eventsUsed: [] };
  }

  // Regla: Tarde
  if (normStatus === 'tarde' || normStatus === 'late') {
    if (!startedOnPitch && hasSubIn) {
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      const mins = Math.max(0, exitMin - subInMin);
      return {
        minutes: mins,
        source: 'sub_in',
        detail: `Llegada tarde: entra en min. ${subInMin}' (${mins}')`,
        eventsUsed: [...subInEvents, ...(subOutEvents || [])]
      };
    }
    if (startedOnPitch) {
      const lMin = Math.max(0, parseInt(lateMin || 0, 10));
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      const mins = Math.max(0, exitMin - lMin);
      return {
        minutes: mins,
        source: 'late_adjusted',
        detail: `Llegada tarde (${lMin}' retraso): jugó ${mins}'`,
        eventsUsed: [...(subOutEvents || [])]
      };
    }
    return { minutes: 0, source: 'dnp', detail: 'Tarde sin entrar al campo (0\')', eventsUsed: [] };
  }

  // 1. Titular inicial
  if (startedOnPitch) {
    let exitMin = duration;
    let source = 'titular_full';
    let detail = `Titular completo (${duration}')`;

    if (subOutMin !== null) {
      exitMin = subOutMin;
      source = 'titular_subout';
      detail = `Sale en min. ${subOutMin}' (${exitMin}')`;
    }

    if (expulsionMin !== null && expulsionMin < exitMin) {
      exitMin = expulsionMin;
      source = 'titular_red_card';
      detail = `Expulsión en min. ${expulsionMin}' (${exitMin}')`;
    }

    const mins = Math.max(0, exitMin);
    return {
      minutes: mins,
      source,
      detail,
      eventsUsed: [...subOutEvents, ...(redCardEvent ? [redCardEvent] : [])]
    };
  }

  // 2. Suplente que entra
  if (hasSubIn) {
    let exitMin = duration;
    let source = 'sub_in';
    let detail = `Entra en min. ${subInMin}' (${duration - subInMin}')`;

    if (subOutMin !== null && subOutMin >= subInMin) {
      exitMin = subOutMin;
      source = 'sub_out';
      detail = `Entra min. ${subInMin}' / Sale min. ${subOutMin}' (${exitMin - subInMin}')`;
    }

    if (expulsionMin !== null && expulsionMin >= subInMin && expulsionMin < exitMin) {
      exitMin = expulsionMin;
      source = 'sub_red_card';
      detail = `Entra min. ${subInMin}' / Expulsión min. ${expulsionMin}' (${expulsionMin - subInMin}')`;
    }

    const mins = Math.max(0, exitMin - subInMin);
    return {
      minutes: mins,
      source,
      detail,
      eventsUsed: [...subInEvents, ...subOutEvents, ...(redCardEvent ? [redCardEvent] : [])]
    };
  }

  // 3. Suplente que no entra
  return {
    minutes: 0,
    source: 'dnp',
    detail: 'No entró al campo (0\')',
    eventsUsed: []
  };
};

/**
 * Determina si un partido ya inició o finalizó.
 * @param {Object} match
 * @returns {boolean}
 */
export const isMatchStartedOrFinished = (match) => {
  if (!match) return false;
  const status = String(match.status || '').toLowerCase().trim();
  if (status === 'terminado' || status === 'finalizado' || status === 'finished' || status === 'live' || status === 'en_juego' || status === 'en directo') {
    return true;
  }
  if (match.goalsFor !== undefined && match.goalsFor !== null && match.goalsFor !== '' && match.goalsFor > 0) return true;
  if (match.goalsAgainst !== undefined && match.goalsAgainst !== null && match.goalsAgainst !== '' && match.goalsAgainst > 0) return true;
  if (Array.isArray(match.events) && match.events.length > 0) return true;
  if (Array.isArray(match.liveStatsEvents) && match.liveStatsEvents.length > 0) return true;
  if (Array.isArray(match.goleadoresList) && match.goleadoresList.length > 0) return true;
  if (Array.isArray(match.tarjetasList) && match.tarjetasList.length > 0) return true;
  return false;
};

/**
 * Detecta discrepancias de coherencia en el partido antes de cerrar el acta.
 * @param {Object} matchData
 * @param {Object} sheetActual
 * @param {Array} players
 * @returns {Array<{ type: string, message: string, tabTarget: string }>}
 */
export const detectMatchEventDivergences = (matchData = {}, sheetActual = {}, players = []) => {
  const warnings = [];
  const allEvents = getUnifiedMatchEvents(matchData);
  const effectiveDuration = getEffectiveMatchDuration(matchData);

  // 1. Goles en bitácora vs Marcador
  const goalsForCount = allEvents.filter(e => e.type === 'gol_local' || e.type === 'goal_own').length;
  const goalsAgainstCount = allEvents.filter(e => e.type === 'gol_rival' || e.type === 'goal_rival').length;

  if (matchData.goalsFor !== undefined && matchData.goalsFor !== null && matchData.goalsFor !== goalsForCount) {
    warnings.push({
      type: 'goals_for_mismatch',
      message: `Goles propios: el marcador indica ${matchData.goalsFor} pero hay ${goalsForCount} gol(es) en la bitácora.`,
      tabTarget: 'MATCH-DAY'
    });
  }
  if (matchData.goalsAgainst !== undefined && matchData.goalsAgainst !== null && matchData.goalsAgainst !== goalsAgainstCount) {
    warnings.push({
      type: 'goals_against_mismatch',
      message: `Goles rival: el marcador indica ${matchData.goalsAgainst} pero hay ${goalsAgainstCount} gol(es) en la bitácora.`,
      tabTarget: 'MATCH-DAY'
    });
  }

  // 2. Eventos con minuto superior a la duración efectiva del partido
  allEvents.forEach((e) => {
    const min = parseInt(e.minute || e.minuto || e.min || 0, 10);
    if (min > effectiveDuration) {
      warnings.push({
        type: 'event_beyond_final_whistle',
        message: `Evento "${e.type || 'evento'}" en min. ${min}' supera la duración final del partido (${effectiveDuration}').`,
        tabTarget: 'MATCH-DAY'
      });
    }
  });

  // 3. Sustituciones duplicadas o imposibles en la bitácora
  const subEvents = allEvents.filter(e => e.type === 'cambio' || e.type === 'sustitucion');
  const onPitchTracker = new Set((matchData.titulares || []).filter(Boolean).map(String));

  subEvents.forEach((se) => {
    const pIn = String(se.playerInId || se.subInId || '');
    const pOut = String(se.playerOutId || se.subOutId || '');
    const pInName = se.playerInName || players.find(p => String(p.id) === pIn)?.name || pIn;
    const pOutName = se.playerOutName || players.find(p => String(p.id) === pOut)?.name || pOut;

    if (pIn && onPitchTracker.has(pIn)) {
      warnings.push({
        type: 'impossible_substitution_in',
        message: `Sustitución duplicada/imposible: ${pInName} entra en min. ${se.minute}' pero ya estaba en el campo.`,
        tabTarget: 'MATCH-DAY'
      });
    }
    if (pOut && !onPitchTracker.has(pOut)) {
      warnings.push({
        type: 'impossible_substitution_out',
        message: `Sustitución imposible: ${pOutName} sale en min. ${se.minute}' pero ya estaba en el banquillo.`,
        tabTarget: 'MATCH-DAY'
      });
    }

    if (pOut) onPitchTracker.delete(pOut);
    if (pIn) onPitchTracker.add(pIn);
  });

  // 4. Cambios en bitácora vs Acta y límites de minutos
  (players || []).forEach(p => {
    const pid = String(p.id);
    const actual = sheetActual?.[pid];
    if (!actual) return;

    const playerSubIns = subEvents.filter(e => String(e.playerInId || e.subInId) === pid && (parseInt(e.minute || e.minuto || 0, 10) <= effectiveDuration));
    const playerSubOuts = subEvents.filter(e => String(e.playerOutId || e.subOutId) === pid && (parseInt(e.minute || e.minuto || 0, 10) <= effectiveDuration));

    if (playerSubIns.length > 0 && (actual.minutes === 0 && actual.minuteSource === 'dnp')) {
      warnings.push({
        type: 'sub_in_zero_minutes',
        message: `${p.name} tiene evento de entrada en bitácora (min. ${playerSubIns[0].minute}') pero figura como "No entró" (0') en el acta.`,
        tabTarget: 'ACTA-OFICIAL'
      });
    }

    if (playerSubOuts.length > 0 && actual.minutes >= effectiveDuration && actual.minuteSource === 'titular_full') {
      warnings.push({
        type: 'sub_out_full_minutes',
        message: `${p.name} tiene evento de salida en bitácora (min. ${playerSubOuts[0].minute}') pero figura como titular completo (${effectiveDuration}') en el acta.`,
        tabTarget: 'ACTA-OFICIAL'
      });
    }

    if (actual.status === 'tarde' && (!actual.lateMin || actual.lateMin <= 0)) {
      warnings.push({
        type: 'late_missing_minutes',
        message: `${p.name} está marcado como "Tarde" sin especificar los minutos de retraso.`,
        tabTarget: 'ACTA-OFICIAL'
      });
    }

    if (!actual.status || actual.status === 'sin_registro') {
      warnings.push({
        type: 'player_no_status',
        message: `${p.name} está convocado pero no tiene estado de asistencia confirmado ("Sin registro").`,
        tabTarget: 'ACTA-OFICIAL'
      });
    }
  });

  return warnings;
};

/**
 * Depura eventos imposibles o duplicados de la bitácora de un partido.
 * Marca como { isValid: false, invalidReason: '...' } los eventos redundantes sin destruir el historial.
 * @param {Array} events
 * @param {Array} initialStarters
 * @param {number} matchDuration
 * @returns {{ cleansedEvents: Array, removedCount: number, details: Array }}
 */
export const cleanseImpossibleMatchEvents = (events = [], initialStarters = [], matchDuration = 90) => {
  const onPitch = new Set((initialStarters || []).filter(Boolean).map(String));
  let removedCount = 0;
  const details = [];

  const cleansedEvents = (events || []).map((e) => {
    if (!e) return e;
    const min = parseInt(e.minute || e.minuto || e.min || 0, 10);

    // 1. Minuto posterior a la duración efectiva del partido
    if (min > matchDuration) {
      removedCount++;
      const msg = `Evento en min. ${min}' posterior al final del partido (${matchDuration}').`;
      details.push(msg);
      return {
        ...e,
        isValid: false,
        invalidReason: msg
      };
    }

    // 2. Sustituciones duplicadas o imposibles
    if (e.type === 'cambio' || e.type === 'sustitucion') {
      const pIn = String(e.playerInId || e.subInId || '');
      const pOut = String(e.playerOutId || e.subOutId || '');

      if (pIn && onPitch.has(pIn)) {
        removedCount++;
        const msg = `Sustitución duplicada min. ${min}': ${e.playerInName || pIn} ya estaba en el campo.`;
        details.push(msg);
        return {
          ...e,
          isValid: false,
          invalidReason: msg
        };
      }

      if (pOut && !onPitch.has(pOut)) {
        removedCount++;
        const msg = `Sustitución imposible min. ${min}': ${e.playerOutName || pOut} ya estaba en el banquillo.`;
        details.push(msg);
        return {
          ...e,
          isValid: false,
          invalidReason: msg
        };
      }

      if (pOut) onPitch.delete(pOut);
      if (pIn) onPitch.add(pIn);
    }
    return e;
  });

  return { cleansedEvents, removedCount, details };
};

/**
 * Construye el mapa `actaOficial.actual` de forma inteligente y conectada.
 */
export const buildSmartMatchSheetActual = (
  match = {},
  currentActual = {},
  rsvpMap = {},
  userId = 'staff',
  options = { preserveManual: true }
) => {
  const rawTitulares = Array.isArray(match.titulares)
    ? match.titulares
    : (match.alineacion?.titulares || []);
  const rawSuplentes = Array.isArray(match.suplentes)
    ? match.suplentes
    : (match.alineacion?.suplentes || []);
  const rawConvocados = Array.isArray(match.convocados)
    ? match.convocados
    : (match.convocatoria || []);

  const titulares = rawTitulares.filter(Boolean).map(String);
  const suplentes = rawSuplentes.filter(Boolean).map(String);
  const convocados = rawConvocados.filter(Boolean).map(String);

  // Usar SIEMPRE la lista canónica unificada de eventos
  const allEvents = getUnifiedMatchEvents(match);
  const tarjetasList = Array.isArray(match.tarjetasList) ? match.tarjetasList : [];

  // Duración efectiva del partido (techo absoluto de minutos)
  const duration = getEffectiveMatchDuration(match);

  const allPlayerIds = [
    ...new Set([
      ...titulares,
      ...suplentes,
      ...convocados,
      ...Object.keys(currentActual || {}),
      ...Object.keys(rsvpMap || {})
    ])
  ].filter(Boolean);

  const result = {};

  allPlayerIds.forEach(pid => {
    const existing = currentActual?.[pid] || {};
    const rsvp = rsvpMap?.[pid] || null;
    const isStarter = titulares.includes(pid);
    const isSub = suplentes.includes(pid);
    const isCalled = convocados.includes(pid) || isStarter || isSub;

    const isManual = existing.source === 'manual';
    let status = existing.status;

    if (!status || (!isManual && !options.preserveManual)) {
      if (isCalled) {
        status = 'presente';
      } else if (rsvp?.status) {
        const RSVP_MAP = { going: 'presente', not_going: 'ausente', late: 'tarde', justified: 'justificado' };
        status = RSVP_MAP[rsvp.status] || 'sin_registro';
      } else {
        status = 'sin_registro';
      }
    }

    const manualMinutesOverride = existing.minutesOverride ?? null;

    const minutesCalc = calculateMinutesFromEvents(
      pid,
      allEvents,
      titulares,
      suplentes,
      duration,
      manualMinutesOverride,
      status,
      existing.lateMin ?? null,
      tarjetasList
    );

    // Si el jugador entró al campo en los eventos, asegurar estado presente
    if ((minutesCalc.source === 'sub_in' || minutesCalc.source === 'sub_out' || minutesCalc.source === 'titular_subout') && status === 'sin_registro') {
      status = 'presente';
    }

    result[pid] = {
      ...existing,
      status: status || 'sin_registro',
      minutes: minutesCalc.minutes,
      minuteSource: minutesCalc.source,
      detail: minutesCalc.detail,
      source: isManual ? 'manual' : (existing.source || 'auto'),
      at: existing.at || new Date().toISOString(),
      by: existing.by || userId || 'staff',
    };
  });

  return result;
};

/**
 * Calcula los minutos de TODOS los jugadores de un partido de una sola vez.
 */
export const calculateAllPlayerMinutes = (
  match = {},
  overrides = {},
  statusMap = {},
  lateMinMap = {}
) => {
  const rawTitulares = Array.isArray(match.titulares)
    ? match.titulares
    : (match.alineacion?.titulares || []);
  const rawSuplentes = Array.isArray(match.suplentes)
    ? match.suplentes
    : (match.alineacion?.suplentes || []);

  const titulares = rawTitulares.filter(Boolean).map(String);
  const suplentes = rawSuplentes.filter(Boolean).map(String);
  const allEvents = getUnifiedMatchEvents(match);
  const tarjetasList = Array.isArray(match.tarjetasList) ? match.tarjetasList : [];

  const duration = getEffectiveMatchDuration(match);

  const allPlayers = [...new Set([
    ...titulares,
    ...suplentes,
    ...Object.keys(statusMap || {})
  ])];

  const result = {};
  allPlayers.forEach(pid => {
    result[pid] = calculateMinutesFromEvents(
      pid,
      allEvents,
      titulares,
      suplentes,
      duration,
      overrides[pid] ?? null,
      statusMap[pid] ?? null,
      lateMinMap[pid] ?? null,
      tarjetasList
    );
  });
  return result;
};
