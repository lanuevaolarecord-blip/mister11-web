/**
 * src/utils/minutesEngine.js
 * Míster11 — Motor de Minutos Reales (Capa de Verdad)
 *
 * Calcula los minutos jugados por un jugador a partir de los EVENTOS del partido.
 * NUNCA asigna minutos por convocatoria.
 *
 * Reglas oficiales:
 *  1. Titular SIN evento de salida       → minutes = totalDuration
 *  2. Titular CON salida en minuto X     → minutes = X
 *  3. Suplente CON entrada en minuto Y   → minutes = totalDuration - Y
 *  4. Suplente SIN entrada               → minutes = 0 (DNP)
 *  5. minutesOverride del míster         → SIEMPRE prevalece sobre el motor
 *
 * @param {string} playerId        - ID del jugador
 * @param {Array}  allEvents       - Todos los eventos del partido (cambios, goles, tarjetas…)
 * @param {Array}  titulares       - Lista de IDs titulares (primeros 11)
 * @param {Array}  suplentes       - Lista de IDs suplentes (banco)
 * @param {number} totalDuration   - Duración total del partido en minutos (defecto 90)
 * @param {number|null} minutesOverride - Si el míster editó manualmente los minutos
 * @returns {{ minutes: number, source: 'override'|'titular_full'|'titular_subout'|'sub_in'|'dnp'|'not_called' }}
 */
export const calculateMinutesFromEvents = (
  playerId,
  allEvents = [],
  titulares = [],
  suplentes = [],
  totalDuration = 90,
  minutesOverride = null
) => {
  const pid = String(playerId);
  const duration = parseInt(totalDuration, 10) || 90;

  // Regla 5: override manual siempre gana
  if (minutesOverride !== null && minutesOverride !== undefined && !isNaN(Number(minutesOverride))) {
    return { minutes: Math.max(0, parseInt(minutesOverride, 10)), source: 'override' };
  }

  const isTitular = titulares.some(id => String(id) === pid);
  const isSuplente = suplentes.some(id => String(id) === pid);

  if (!isTitular && !isSuplente) {
    // No estaba en la convocatoria activa de este partido
    return { minutes: 0, source: 'not_called' };
  }

  // Eventos de cambio normalizados (soporte para varios alias de campo)
  const subEvents = allEvents.filter(e =>
    e.type === 'cambio' || e.type === 'sustitucion' || e.type === 'substitution'
  );

  if (isTitular) {
    // ¿Fue sustituido?
    const subOutEvent = subEvents.find(e =>
      String(e.subOutId || e.jugadorSaleId || e.playerOutId || '') === pid
    );
    if (subOutEvent) {
      const min = parseInt(subOutEvent.minute || subOutEvent.minuto || duration, 10);
      return { minutes: Math.max(0, min), source: 'titular_subout' };
    }
    // Titular que jugó todo
    return { minutes: duration, source: 'titular_full' };
  }

  // Suplente: ¿entró al campo?
  const subInEvent = subEvents.find(e =>
    String(e.subInId || e.jugadorEntraId || e.playerInId || '') === pid
  );
  if (subInEvent) {
    const entryMin = parseInt(subInEvent.minute || subInEvent.minuto || 0, 10);
    return { minutes: Math.max(0, duration - entryMin), source: 'sub_in' };
  }

  // Suplente que no entró (DNP: Did Not Play)
  return { minutes: 0, source: 'dnp' };
};

/**
 * Determina si un partido ya inició o finalizó (vs partido en el futuro).
 * @param {Object} match
 * @returns {boolean}
 */
export const isMatchStartedOrFinished = (match) => {
  if (!match) return false;
  if (match.status === 'Terminado' || match.status === 'En juego') return true;
  if (match.date) {
    const timeStr = match.time || '00:00';
    const [y, m, d] = String(match.date).split('-').map(Number);
    const [hh, mm] = String(timeStr).split(':').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const matchDate = new Date(y, m - 1, d, hh || 0, mm || 0);
      if (new Date() >= matchDate) return true;
    }
  }
  return false;
};

/**
 * Construye el mapa `actaOficial.actual` de forma inteligente.
 * Regla de Oro:
 *  - En partido iniciado/terminado: jugadores en alineación (titulares y suplentes) son PRESENTE automáticos.
 *  - Si no están en alineación pero hay RSVP -> se mapea el RSVP.
 *  - Minutos calculados con el minutesEngine a partir de eventos de cambios.
 *  - NUNCA sobreescribe ediciones manuales del míster si preserveManual es true.
 *
 * @param {Object} match
 * @param {Object} currentActual
 * @param {Object} rsvpMap
 * @param {string} userId
 * @param {Object} options
 * @returns {Object} { [playerId]: { status, minutes, minuteSource, source, at, by } }
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
    : (match.alineacion?.convocados || []);

  const titulares = rawTitulares.filter(Boolean).map(String);
  const suplentes = rawSuplentes.filter(Boolean).map(String);
  const convocados = rawConvocados.filter(Boolean).map(String);

  const allEvents = Array.isArray(match.liveStatsEvents) && match.liveStatsEvents.length > 0
    ? match.liveStatsEvents
    : (Array.isArray(match.events) ? match.events : []);
  const duration = parseInt(match.duration || match.duracion || 90, 10);
  const isStartedOrDone = isMatchStartedOrFinished(match);

  const allPlayerIds = [...new Set([
    ...titulares,
    ...suplentes,
    ...convocados,
    ...Object.keys(rsvpMap || {}),
    ...Object.keys(currentActual || {})
  ])].filter(Boolean);

  const RSVP_TO_STATUS = {
    going: 'presente',
    not_going: 'ausente',
    late: 'tarde',
    justified: 'justificado'
  };

  const result = { ...(currentActual || {}) };

  allPlayerIds.forEach(pid => {
    const existing = result[pid] || {};
    const isManual = options.preserveManual && (existing.source === 'manual' || (existing.status && existing.source !== 'auto' && existing.source !== 'auto_prefill' && existing.source !== 'rsvp_prefill'));
    const manualMinutesOverride = existing.minutesOverride !== undefined && existing.minutesOverride !== null
      ? existing.minutesOverride
      : null;

    const minutesCalc = calculateMinutesFromEvents(
      pid,
      allEvents,
      titulares,
      suplentes,
      duration,
      manualMinutesOverride
    );

    let status = existing.status;

    if (!isManual || !status) {
      const isInLineup = titulares.includes(pid) || suplentes.includes(pid);
      const rsvp = rsvpMap?.[pid];
      const rsvpStatus = rsvp?.status ? RSVP_TO_STATUS[rsvp.status] : null;

      if (isStartedOrDone) {
        if (isInLineup) {
          status = 'presente';
        } else if (rsvpStatus) {
          status = rsvpStatus;
        } else {
          status = 'sin_registro';
        }
      } else {
        if (rsvpStatus) {
          status = rsvpStatus;
        } else if (isInLineup) {
          status = 'presente';
        } else {
          status = 'sin_registro';
        }
      }
    }

    result[pid] = {
      ...existing,
      status: status || 'sin_registro',
      minutes: minutesCalc.minutes,
      minuteSource: minutesCalc.source,
      source: isManual ? 'manual' : 'auto',
      at: existing.at || new Date().toISOString(),
      by: existing.by || userId || 'staff',
    };
  });

  return result;
};

/**
 * Calcula los minutos de TODOS los jugadores de un partido de una sola vez.
 * @param {Object} match   - Documento del partido (titulares, suplentes, events, duration)
 * @param {Object} overrides - { [playerId]: minutesOverride } (del acta oficial)
 * @returns {Object} { [playerId]: { minutes, source } }
 */
export const calculateAllPlayerMinutes = (match = {}, overrides = {}) => {
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
  const duration = parseInt(match.duration || match.duracion || 90, 10);

  const allPlayers = [...new Set([
    ...titulares,
    ...suplentes,
  ])];

  const result = {};
  allPlayers.forEach(pid => {
    result[pid] = calculateMinutesFromEvents(
      pid,
      allEvents,
      titulares,
      suplentes,
      duration,
      overrides[pid] ?? null
    );
  });
  return result;
};


