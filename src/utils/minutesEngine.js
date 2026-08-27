/**
 * src/utils/minutesEngine.js
 * Míster11 — Motor de Minutos Reales y Acta Oficial (Capa de Verdad)
 *
 * Calcula los minutos jugados por un jugador a partir de los EVENTOS del partido,
 * SUSTITUCIONES, EXPULSIONES (TARJETA ROJA / DOBLE AMARILLA), PRÓRROGAS
 * y del ESTADO DE ASISTENCIA oficial del acta.
 * NUNCA asigna minutos por mera convocatoria si el jugador no jugó.
 *
 * Reglas oficiales:
 *  1. Ausente o Justificado               → minutes = 0 (si el entrenador marca que no asistió)
 *  2. Lesionado                           → minutos según sustitución/salida; si no entró = 0
 *  3. Tarde                               → minutos según entrada (o total - lateMin si fue titular)
 *  4. Titular Presente SIN salida         → minutes = totalDuration (90' o 120' si hay prórroga)
 *  5. Titular Presente CON salida min X   → minutes = X (ej. sale al 60 -> juega 60')
 *  6. Suplente Presente CON entrada min Y → minutes = totalDuration - Y (ej. entra al 60 en partido de 90 -> 30'; en 120 -> 60')
 *  7. Suplente Presente SIN entrada       → minutes = 0 (DNP - No jugó)
 *  8. Expulsión (Tarjeta Roja / 2ª Amarilla) en min K:
 *     - Titular: juega min(salida || duration, K)
 *     - Suplente que entró en min Y: juega max(0, min(salida || duration, K) - Y)
 *  9. minutesOverride del míster          → SIEMPRE prevalece sobre el cálculo automático
 *
 * @param {string} playerId             - ID del jugador
 * @param {Array}  allEvents            - Todos los eventos del partido (cambios, goles, tarjetas…)
 * @param {Array}  titulares            - Lista de IDs titulares (primeros 11)
 * @param {Array}  suplentes            - Lista de IDs suplentes (banco)
 * @param {number} totalDuration        - Duración total del partido en minutos (defecto 90 o 120)
 * @param {number|null} minutesOverride - Si el míster editó manualmente los minutos
 * @param {string|null} attendanceStatus - Estado oficial ('presente', 'ausente', 'tarde', 'justificado', 'lesionado')
 * @param {number|null} lateMin         - Minutos de retraso si status === 'tarde'
 * @param {Array}  tarjetasList         - Lista opcional de tarjetas estructuradas
 * @returns {{ minutes: number, source: string }}
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
  if (!pid) return { minutes: 0, source: 'not_called' };

  let duration = parseInt(totalDuration, 10) || 90;

  // Regla 9: override manual del míster siempre gana
  if (minutesOverride !== null && minutesOverride !== undefined && !isNaN(Number(minutesOverride))) {
    return { minutes: Math.max(0, parseInt(minutesOverride, 10)), source: 'override' };
  }

  const isTitular = (titulares || []).some(id => id && String(id) === pid);
  const isSuplente = (suplentes || []).some(id => id && String(id) === pid);

  if (!isTitular && !isSuplente) {
    // No estaba en la convocatoria activa de este partido
    return { minutes: 0, source: 'not_called' };
  }

  // Normalizar estado de asistencia
  const normStatus = attendanceStatus ? String(attendanceStatus).toLowerCase().trim() : null;

  // Regla 1: Ausente (No asistió) o Justificado → 0 minutos absolutos
  if (normStatus === 'ausente' || normStatus === 'absent' || normStatus === 'not_going') {
    return { minutes: 0, source: 'absent' };
  }
  if (normStatus === 'justificado' || normStatus === 'justified') {
    return { minutes: 0, source: 'justified' };
  }

  // 1. Detectar prórroga o eventos que extiendan la duración del partido (> 90 min)
  (allEvents || []).forEach(e => {
    if (e) {
      const min = parseInt(e.minute || e.minuto || e.min || 0, 10);
      if (min > duration && min <= 130) {
        duration = Math.max(duration, min > 90 && min <= 120 ? 120 : min);
      }
    }
  });

  // 2. Eventos de sustitución normalizados
  const subEvents = (allEvents || []).filter(e =>
    e && (e.type === 'cambio' || e.type === 'sustitucion' || e.type === 'substitution' || e.type === 'sub')
  );

  const subOutEvent = subEvents.find(e =>
    String(e.subOutId || e.jugadorSaleId || e.playerOutId || e.outId || '') === pid
  );
  const subInEvent = subEvents.find(e =>
    String(e.subInId || e.jugadorEntraId || e.playerInId || e.inId || '') === pid
  );

  const subOutMin = subOutEvent ? parseInt(subOutEvent.minute || subOutEvent.minuto || subOutEvent.min || duration, 10) : null;
  const subInMin = subInEvent ? parseInt(subInEvent.minute || subInEvent.minuto || subInEvent.min || 0, 10) : null;

  // 3. Detección de Tarjetas Rojas / Expulsión (directa o doble amarilla)
  let expulsionMin = null;

  // 3a. Tarjetas directas en allEvents
  const redCardEvent = (allEvents || []).find(e => {
    if (!e) return false;
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

  // 3b. Tarjetas en tarjetasList estructurada
  if (expulsionMin === null && Array.isArray(tarjetasList) && tarjetasList.length > 0) {
    const redItem = tarjetasList.find(t =>
      t && String(t.jugadorId || '') === pid && (t.tipo === 'roja' || t.tipo === 'red')
    );
    if (redItem) {
      expulsionMin = parseInt(redItem.minuto || redItem.minute || duration, 10);
    }
  }

  // 3c. Doble amarilla = Expulsión en el minuto de la 2ª tarjeta amarilla
  if (expulsionMin === null) {
    const yellowCards = (allEvents || []).filter(e => {
      if (!e) return false;
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
      // Ordenar por minuto ascendente y tomar la 2ª amarilla
      yellowCards.sort((a, b) => {
        const mA = parseInt(a.minute || a.minuto || 0, 10);
        const mB = parseInt(b.minute || b.minuto || 0, 10);
        return mA - mB;
      });
      expulsionMin = parseInt(yellowCards[1].minute || yellowCards[1].minuto || duration, 10);
    } else if (Array.isArray(tarjetasList)) {
      const structuredYellows = tarjetasList.filter(t =>
        t && String(t.jugadorId || '') === pid && (t.tipo === 'amarilla' || t.tipo === 'yellow')
      );
      if (structuredYellows.length >= 2) {
        structuredYellows.sort((a, b) => parseInt(a.minuto || 0, 10) - parseInt(b.minuto || 0, 10));
        expulsionMin = parseInt(structuredYellows[1].minuto || duration, 10);
      }
    }
  }

  // 4. Determinar si el jugador comenzó el partido en el campo (titular inicial)
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

  // 5. Regla: Lesionado
  if (normStatus === 'lesionado' || normStatus === 'injured') {
    if (!startedOnPitch && hasSubIn) {
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      return { minutes: Math.max(0, exitMin - subInMin), source: 'injured_played' };
    }
    if (startedOnPitch) {
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      return { minutes: Math.max(0, exitMin), source: 'injured_played' };
    }
    return { minutes: 0, source: 'injured' };
  }

  // 6. Regla: Tarde
  if (normStatus === 'tarde' || normStatus === 'late') {
    if (!startedOnPitch && hasSubIn) {
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      return { minutes: Math.max(0, exitMin - subInMin), source: 'sub_in' };
    }
    if (startedOnPitch) {
      const lMin = Math.max(0, parseInt(lateMin || 0, 10));
      const exitMin = expulsionMin !== null
        ? Math.min(subOutMin !== null ? subOutMin : duration, expulsionMin)
        : (subOutMin !== null ? subOutMin : duration);
      return { minutes: Math.max(0, exitMin - lMin), source: 'late_adjusted' };
    }
    return { minutes: 0, source: 'dnp' };
  }

  // 7. Jugador que INICIÓ EN EL CAMPO (Titular inicial)
  if (startedOnPitch) {
    let exitMin = duration;
    let source = 'titular_full';

    if (subOutMin !== null) {
      exitMin = subOutMin;
      source = 'titular_subout';
    }

    if (expulsionMin !== null && expulsionMin < exitMin) {
      exitMin = expulsionMin;
      source = 'titular_red_card';
    }

    return { minutes: Math.max(0, exitMin), source };
  }

  // 8. Jugador que INICIÓ EN EL BANQUILLO (Suplente)
  if (hasSubIn) {
    let exitMin = duration;
    let source = 'sub_in';

    if (subOutMin !== null && subOutMin >= subInMin) {
      exitMin = subOutMin;
      source = 'sub_out';
    }

    if (expulsionMin !== null && expulsionMin >= subInMin && expulsionMin < exitMin) {
      exitMin = expulsionMin;
      source = 'sub_red_card';
    }

    return { minutes: Math.max(0, exitMin - subInMin), source };
  }

  // Suplente que no entró al campo
  return { minutes: 0, source: 'dnp' };
};

/**
 * Determina si un partido ya inició o finalizó (vs partido en el futuro).
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
 * Construye el mapa `actaOficial.actual` de forma inteligente y conectada.
 *
 * REGLAS FUNDAMENTALES:
 *  - Todos los jugadores convocados (titulares + suplentes + convocados) se incluyen en el acta.
 *  - Por defecto, los convocados se marcan como PRESENTE.
 *  - Si el entrenador cambia a un jugador a 'ausente' (no asistió), 'justificado', etc.,
 *    se respeta inmutablemente el cambio (preserveManual: true) y sus minutos se calculan según el nuevo estado.
 *  - Los minutos se calculan automáticamente con el motor de eventos (sustituciones, rojas, prórroga).
 *
 * @param {Object} match           - Documento del partido (titulares, suplentes, events, liveStatsEvents, duration…)
 * @param {Object} currentActual   - Estado actual de `actaOficial.actual` en Firestore (si existe)
 * @param {Object} rsvpMap         - Mapa de respuestas RSVP `{ [playerId]: { status: 'going'|'not_going'… } }`
 * @param {string} userId          - ID del usuario / entrenador que realiza la acción
 * @param {Object} options         - Opciones { preserveManual: boolean }
 * @returns {Object} { [playerId]: { status, minutes, minuteSource, source, at, by, minutesOverride?, lateMin? } }
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

  const allEvents = Array.isArray(match.liveStatsEvents) && match.liveStatsEvents.length > 0
    ? match.liveStatsEvents
    : (Array.isArray(match.events) ? match.events : []);

  const tarjetasList = Array.isArray(match.tarjetasList) ? match.tarjetasList : [];

  let duration = parseInt(match.duration || match.duracion || 90, 10);
  if (match.hasExtraTime || match.extraTime || match.prorroga) {
    duration = Math.max(duration, 120);
  }

  // Lista unificada de todos los convocados y jugadores en acta
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

    // Si ya existe registro manual y se pide preservar, respetarlo
    const isManual = existing.source === 'manual';
    let status = existing.status;

    if (!status || (!isManual && !options.preserveManual)) {
      if (isCalled) {
        // Todo convocado inicia como 'presente' por defecto
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

    result[pid] = {
      ...existing,
      status: status || 'sin_registro',
      minutes: minutesCalc.minutes,
      minuteSource: minutesCalc.source,
      source: isManual ? 'manual' : (existing.source || 'auto'),
      at: existing.at || new Date().toISOString(),
      by: existing.by || userId || 'staff',
    };
  });

  return result;
};

/**
 * Calcula los minutos de TODOS los jugadores de un partido de una sola vez.
 * @param {Object} match      - Documento del partido (titulares, suplentes, events, duration)
 * @param {Object} overrides  - { [playerId]: minutesOverride } (del acta oficial)
 * @param {Object} statusMap  - { [playerId]: status } (estado oficial)
 * @param {Object} lateMinMap - { [playerId]: lateMin } (minutos de retraso si status === 'tarde')
 * @returns {Object} { [playerId]: { minutes, source } }
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
  const allEvents = Array.isArray(match.liveStatsEvents) && match.liveStatsEvents.length > 0
    ? match.liveStatsEvents
    : (Array.isArray(match.events) ? match.events : []);
  const tarjetasList = Array.isArray(match.tarjetasList) ? match.tarjetasList : [];

  let duration = parseInt(match.duration || match.duracion || 90, 10);
  if (match.hasExtraTime || match.extraTime || match.prorroga) {
    duration = Math.max(duration, 120);
  }

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
