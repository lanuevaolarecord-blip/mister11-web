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
 * Calcula los minutos de TODOS los jugadores de un partido de una sola vez.
 * @param {Object} match   - Documento del partido (titulares, suplentes, events, duration)
 * @param {Object} overrides - { [playerId]: minutesOverride } (del acta oficial)
 * @returns {Object} { [playerId]: { minutes, source } }
 */
export const calculateAllPlayerMinutes = (match, overrides = {}) => {
  const titulares = Array.isArray(match.titulares)
    ? match.titulares
    : (match.alineacion?.titulares || []);
  const suplentes = Array.isArray(match.suplentes)
    ? match.suplentes
    : (match.alineacion?.suplentes || []);
  const allEvents = Array.isArray(match.events) ? match.events : [];
  const duration = parseInt(match.duration || match.duracion || 90, 10);

  const allPlayers = [...new Set([
    ...titulares.map(String),
    ...suplentes.map(String),
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
