/**
 * src/utils/goalkeeperStats.js
 * MÍSTER 11 — HOTFIX-10.1 (E2)
 *
 * Motor puro y canónico para detección de porteros, cálculo de estadísticas
 * individuales de portería en tiempo real / post-partido, e integración con el
 * informe del partido y la fórmula de valoración (ratingFormula).
 */

import { calculateMinutesFromEvents, getEffectiveMatchDuration } from './minutesEngine.js';

const CANONICAL_GK_TOKENS = new Set([
  'POR',
  'PO',
  'GK',
  'PORTERO',
  'PORTERA',
  'GOALKEEPER',
  'GOALIE',
  'ARQ',
  'ARQUERO',
  'ARQUERA',
  'GUARDAMETA',
]);

/**
 * Determina si un jugador o cadena de posición/rol corresponde a un Portero.
 * Soporta variantes en ES/EN (`POR`, `PO`, `GK`, `Portero`, `Goalkeeper`, `Arquero`, `Guardameta`)
 * así como flags booleanos `isGoalkeeper` / `esPortero`.
 *
 * @param {Object|string|null|undefined} playerOrRole
 * @param {Object} [context={}]
 * @returns {boolean}
 */
export function isCanonicalGoalkeeper(playerOrRole, context = {}) {
  if (!playerOrRole) return false;

  if (typeof playerOrRole === 'string') {
    const raw = playerOrRole.trim().toUpperCase();
    if (CANONICAL_GK_TOKENS.has(raw)) return true;
    return /^(POR|GK|ARQ|PORTER|GOALKEEP|GUARDAMET)\b/.test(raw);
  }

  if (typeof playerOrRole === 'object') {
    if (playerOrRole.isGoalkeeper === true || playerOrRole.esPortero === true) {
      return true;
    }

    const candidates = [
      playerOrRole.posicion,
      playerOrRole.position,
      playerOrRole.role,
      playerOrRole.rol,
      playerOrRole.pos,
      playerOrRole.primaryPosition,
      context?.role,
      context?.position,
    ];

    for (const c of candidates) {
      if (typeof c === 'string' && c.trim() !== '') {
        if (isCanonicalGoalkeeper(c)) return true;
      }
    }
  }

  return false;
}

/**
 * Resuelve el portero activo en el campo a partir de la lista de jugadores en cancha,
 * la plantilla convocada y los metadatos del partido.
 *
 * Orden de prioridad:
 * 1. Jugador seleccionado actualmente (`activePlayerId`) si es portero canónico.
 * 2. Jugador actualmente en el campo (`onPitchPlayersList`) que sea portero canónico.
 * 3. Jugador en slot 0 de titulares con rol custom `'POR'`/`'GK'` en `matchData.customRoles`.
 * 4. Cualquier portero canónico en la lista de convocados (`playersList`).
 *
 * @param {Array<Object>} [onPitchPlayersList=[]]
 * @param {Array<Object>} [playersList=[]]
 * @param {Object} [matchData=null]
 * @param {string|number|null} [activePlayerId=null]
 * @returns {Object|null}
 */
export function resolveActiveGoalkeeper(
  onPitchPlayersList = [],
  playersList = [],
  matchData = null,
  activePlayerId = null
) {
  const safeOnPitch = Array.isArray(onPitchPlayersList) ? onPitchPlayersList.filter(Boolean) : [];
  const safeAll = Array.isArray(playersList) ? playersList.filter(Boolean) : [];

  // 1. Si el jugador activo seleccionado en la barra individual es portero
  if (activePlayerId !== null && activePlayerId !== undefined) {
    const selected =
      safeOnPitch.find(p => String(p.id) === String(activePlayerId)) ||
      safeAll.find(p => String(p.id) === String(activePlayerId));
    if (selected && isCanonicalGoalkeeper(selected)) {
      return selected;
    }
  }

  // 2. Portero canónico actualmente en cancha
  const onPitchGk = safeOnPitch.find(p => isCanonicalGoalkeeper(p));
  if (onPitchGk) return onPitchGk;

  // 3. Slot con customRole 'POR' en matchData
  if (matchData && matchData.customRoles && Array.isArray(matchData.titulares)) {
    for (const [slotIdx, roleStr] of Object.entries(matchData.customRoles)) {
      if (isCanonicalGoalkeeper(roleStr)) {
        const pid = matchData.titulares[Number(slotIdx)];
        if (pid) {
          const found =
            safeOnPitch.find(p => String(p.id) === String(pid)) ||
            safeAll.find(p => String(p.id) === String(pid));
          if (found) return found;
        }
      }
    }
  }

  // 4. Portero canónico en la lista general de convocados/plantilla
  const rosterGk = safeAll.find(p => isCanonicalGoalkeeper(p));
  if (rosterGk) return rosterGk;

  return null;
}

/**
 * Calcula el intervalo `[startMin, endMin]` en el que un jugador estuvo en el terreno de juego.
 *
 * @param {string} playerId
 * @param {Array<Object>} events
 * @param {Object} teamContext
 * @returns {{ onPitchIntervals: Array<[number, number]>, minutesPlayed: number }}
 */
export function computePlayerOnPitchIntervals(playerId, events = [], teamContext = {}) {
  const pid = String(playerId || '');
  const safeEvents = Array.isArray(events) ? events.filter(e => e && e.isValid !== false) : [];
  const matchData = teamContext?.matchData || teamContext || {};
  const duration = Number(teamContext?.duration || getEffectiveMatchDuration(matchData) || 90);

  const rawTitulares = Array.isArray(teamContext?.titulares)
    ? teamContext.titulares
    : (Array.isArray(matchData?.titulares) ? matchData.titulares : []);
  const rawSuplentes = Array.isArray(teamContext?.suplentes)
    ? teamContext.suplentes
    : (Array.isArray(matchData?.suplentes) ? matchData.suplentes : []);

  const titIds = rawTitulares.filter(Boolean).map(t => (typeof t === 'object' ? String(t.id) : String(t)));
  const supIds = rawSuplentes.filter(Boolean).map(s => (typeof s === 'object' ? String(s.id) : String(s)));

  // Verificar override manual en actaOficial
  const actaActual = matchData?.actaOficial?.actual?.[pid];
  const hasLineupInfo = titIds.length > 0 || supIds.length > 0;

  let isStarter = titIds.includes(pid);
  if (!hasLineupInfo) {
    // Si no hay alineación explícita, inferir: si no tiene evento de entrada como suplente, asumir titular si tiene minutos o es el portero principal
    const enteredAsSub = safeEvents.some(e => {
      const t = String(e.type || '').toLowerCase();
      if (!['cambio', 'sustitucion', 'substitution', 'sub'].includes(t)) return false;
      const inId = String(e.subInId || e.playerInId || e.jugadorEntraId || e.inId || e.entraId || '');
      return inId === pid;
    });
    isStarter = !enteredAsSub && (teamContext?.assumeStarter !== false);
  }

  // Ordenar eventos cronológicamente
  const sorted = [...safeEvents].sort((a, b) => {
    const ma = Number(a.minute ?? a.minuto ?? 0);
    const mb = Number(b.minute ?? b.minuto ?? 0);
    return ma - mb;
  });

  const intervals = [];
  let currentStart = isStarter ? 0 : null;
  let yellowCount = 0;

  for (const ev of sorted) {
    const t = String(ev.type || '').toLowerCase();
    const rawMin = Number(ev.minute ?? ev.minuto ?? 0);
    const min = Number.isFinite(rawMin) && rawMin >= 0 ? Math.min(duration, rawMin) : 0;

    if (['cambio', 'sustitucion', 'substitution', 'sub'].includes(t)) {
      const inId = String(ev.subInId || ev.playerInId || ev.jugadorEntraId || ev.inId || ev.entraId || '');
      const outId = String(ev.subOutId || ev.playerOutId || ev.jugadorSaleId || ev.outId || ev.saleId || '');

      if (outId === pid && currentStart !== null) {
        intervals.push([currentStart, Math.max(currentStart, min)]);
        currentStart = null;
      } else if (inId === pid && currentStart === null) {
        currentStart = min;
      }
    }

    // Expulsión por tarjeta roja o doble amarilla
    const evPid = String(ev.playerId || ev.jugadorId || '');
    if (evPid === pid) {
      if (['card_red_own', 'red_card', 'roja'].includes(t)) {
        if (currentStart !== null) {
          intervals.push([currentStart, Math.max(currentStart, min)]);
          currentStart = null;
        }
      } else if (['card_yellow_own', 'yellow_card', 'amarilla'].includes(t)) {
        yellowCount += 1;
        if (yellowCount >= 2 && currentStart !== null) {
          intervals.push([currentStart, Math.max(currentStart, min)]);
          currentStart = null;
        }
      }
    }
  }

  if (currentStart !== null) {
    intervals.push([currentStart, duration]);
  }

  let computedMinutes = intervals.reduce((acc, [s, e]) => acc + Math.max(0, e - s), 0);

  if (actaActual?.minutesOverride !== undefined && actaActual?.minutesOverride !== null && actaActual?.minutesOverride !== '') {
    computedMinutes = Number(actaActual.minutesOverride) || 0;
  } else if (typeof actaActual?.minutes === 'number' && actaActual.minutes >= 0 && matchData?.actaOficial?.closed) {
    computedMinutes = actaActual.minutes;
  } else if (typeof teamContext?.playerMinutes === 'number') {
    computedMinutes = teamContext.playerMinutes;
  } else if (hasLineupInfo) {
    const calc = calculateMinutesFromEvents(
      pid,
      safeEvents,
      titIds,
      supIds,
      duration,
      null,
      actaActual?.status || (isStarter ? 'presente' : 'sin_registro'),
      actaActual?.lateMin ?? null,
      matchData?.tarjetasList || []
    );
    if (typeof calc?.minutes === 'number') {
      computedMinutes = calc.minutes;
    }
  }

  // Si computedMinutes es 0 pero no había intervalos explícitos, vaciar intervalos
  if (computedMinutes === 0 && !isStarter && intervals.length === 0) {
    return { onPitchIntervals: [], minutesPlayed: 0 };
  }

  return {
    onPitchIntervals: intervals,
    minutesPlayed: Math.max(0, Math.min(duration, computedMinutes)),
  };
}

/**
 * Verifica si un minuto cae dentro de alguno de los intervalos en cancha del portero.
 * En el minuto exacto de un cambio (`s` o `e`):
 * - Si el portero salió en el minuto `M` (`interval = [0, M]`), un gol en `M` tras el cambio
 *   o después de `M` pertenece al portero entrante `[M, 90]`, salvo que esté atribuido explícitamente.
 */
function isMinuteWithinIntervals(minute, intervals, isSubbedInInterval = false) {
  if (!Array.isArray(intervals) || intervals.length === 0) return false;
  if (minute === null || minute === undefined || Number.isNaN(Number(minute))) {
    return intervals.length > 0;
  }
  const m = Number(minute);
  for (const [start, end] of intervals) {
    // Si el intervalo empieza en > 0 (entró de cambio en `start`), incluye `m >= start && m <= end`
    // Si el intervalo termina antes del final (`end < duration`), un gol en `m === end` tras el cambio va al que entra,
    // por lo que usamos `m < end` cuando hay relevo, o `m <= end` si es el último tramo.
    if (start > 0) {
      if (m >= start && m <= end) return true;
    } else {
      if (m >= start && m <= end) return true;
    }
  }
  return false;
}

/**
 * Calcula las estadísticas completas y canónicas de un portero en un partido.
 *
 * Contempla:
 * - Portero titular 90' con 0, 1 o N goles recibidos.
 * - Portero sustituido (ej. GK1 0-45' recibe 1 gol, GK2 46-90' recibe 1 gol => cada uno suma 1, equipo suma 2).
 * - Jugador no portero (`isGoalkeeper: false`).
 * - Autogol (`own_goal` / `autogol` / `gol_en_contra_propio`): cuenta como gol encajado del portero en cancha,
 *   sin atribuirse como gol a favor del jugador que lo marcó en propia puerta.
 * - Deduplicación estricta entre `gol_rival`, `shot_on_target_rival` (con `outcome: 'goal'`), y `conceded`
 *   mediante `rivalGoalId`, `eventId`/`id` o firma `(half, minute)`.
 *
 * @param {Object} player - Objeto jugador `{ id, name/nombre, position/posicion, ... }`
 * @param {Array<Object>} [matchEvents=[]] - Lista de eventos del partido
 * @param {Object} [teamContext={}] - Contexto `{ matchData, titulares, suplentes, duration, goalsAgainst, isPrimaryGk }`
 * @returns {Object}
 */
export function computeGoalkeeperMatchStats(player, matchEvents = [], teamContext = {}) {
  if (!player || typeof player !== 'object') {
    return {
      isGoalkeeper: false,
      minutesPlayed: 0,
      goalsConceded: 0,
      saves: 0,
      normalSaves: 0,
      decisiveSaves: 0,
      penaltiesSaved: 0,
      claims: 0,
      errorGoal: 0,
      cleanSheet: false,
      goalsAgainstPer90: 0,
      savePct: 0,
      gkExertionIndex: 0,
      ratingInputs: { isGoalkeeper: false },
    };
  }

  const pid = String(player.id ?? '');
  const matchData = teamContext?.matchData || teamContext || {};
  const isGk = isCanonicalGoalkeeper(player, teamContext);

  const mergedEvents = [
    ...(Array.isArray(matchEvents) ? matchEvents : []),
    ...(Array.isArray(matchData?.events) ? matchData.events : []),
    ...(Array.isArray(matchData?.liveStatsEvents) ? matchData.liveStatsEvents : []),
  ].filter(e => e && typeof e === 'object' && e.isValid !== false);

  // Deduplicar eventos por eventId / id
  const dedupedEvents = [];
  const seenKeys = new Set();
  for (const ev of mergedEvents) {
    const key = ev.eventId || ev.clientEventId || ev.id;
    if (key) {
      const kStr = String(key);
      if (seenKeys.has(kStr)) continue;
      seenKeys.add(kStr);
    }
    dedupedEvents.push(ev);
  }

  const { onPitchIntervals, minutesPlayed } = computePlayerOnPitchIntervals(pid, dedupedEvents, teamContext);

  if (!isGk) {
    return {
      isGoalkeeper: false,
      minutesPlayed,
      goalsConceded: 0,
      saves: 0,
      normalSaves: 0,
      decisiveSaves: 0,
      penaltiesSaved: 0,
      claims: 0,
      errorGoal: 0,
      cleanSheet: false,
      goalsAgainstPer90: 0,
      savePct: 0,
      gkExertionIndex: 0,
      ratingInputs: { isGoalkeeper: false, minutesPlayed },
    };
  }

  // Identificar si hubo otros porteros en el partido (cambio de portero)
  const allGoalkeepersInMatch = new Set([pid]);
  for (const ev of dedupedEvents) {
    const t = String(ev.type || '').toLowerCase();
    if (['save', 'save_own', 'parada', 'conceded', 'penaltysave', 'penalty_save', 'penalti_parado', 'claim', 'salida', 'errorgoal', 'error_goal'].includes(t)) {
      if (ev.playerId && String(ev.playerId) !== 'Rival' && String(ev.playerId) !== 'rival') {
        allGoalkeepersInMatch.add(String(ev.playerId));
      }
    }
    if (['cambio', 'sustitucion', 'substitution', 'sub'].includes(t)) {
      const outId = String(ev.subOutId || ev.playerOutId || ev.jugadorSaleId || ev.outId || ev.saleId || '');
      const inId = String(ev.subInId || ev.playerInId || ev.jugadorEntraId || ev.inId || ev.entraId || '');
      if (outId === pid && inId) allGoalkeepersInMatch.add(inId);
      if (inId === pid && outId) allGoalkeepersInMatch.add(outId);
    }
  }
  const hasMultipleGoalkeepers = allGoalkeepersInMatch.size > 1;

  // Helper: ¿estaba este portero en cancha en el minuto del evento?
  const wasOnPitchAtEvent = (ev) => {
    if (minutesPlayed <= 0 && onPitchIntervals.length === 0) return false;
    const rawMin = ev.minute ?? ev.minuto ?? ev.min;
    const min = rawMin !== undefined && rawMin !== null && rawMin !== '' ? Number(rawMin) : null;
    if (min === null || Number.isNaN(min)) {
      return onPitchIntervals.length > 0;
    }
    for (let i = 0; i < onPitchIntervals.length; i++) {
      const [start, end] = onPitchIntervals[i];
      // Si fue sustituido en `end` (y no es el final del partido), un evento exactamente en `end` tras el cambio
      // solo cuenta si `min <= end` y no entró otro portero antes
      if (hasMultipleGoalkeepers && start === 0 && end < Number(teamContext?.duration || 90) && min > end) {
        continue;
      }
      if (hasMultipleGoalkeepers && start > 0 && min < start) {
        continue;
      }
      if (min >= start && min <= end) return true;
    }
    return false;
  };

  // Helper: ¿pertenece un evento de acción de portero (parada, salida, penalti, error) a este portero?
  const belongsToThisGk = (ev) => {
    const evPid = ev.playerId ?? ev.jugadorId ?? null;
    if (evPid !== null && evPid !== undefined && String(evPid).trim() !== '' && String(evPid) !== 'Equipo') {
      return String(evPid) === pid;
    }
    // Si el evento de portero se grabó sin playerId (ej. antes de detectar portero activo),
    // atribuirlo al portero que estaba en cancha en ese minuto
    return wasOnPitchAtEvent(ev);
  };

  let normalSaves = 0;
  let decisiveSaves = 0;
  let penaltiesSaved = 0;
  let claims = 0;
  let errorGoal = 0;

  const goalSignatures = new Set();

  for (let idx = 0; idx < dedupedEvents.length; idx++) {
    const ev = dedupedEvents[idx];
    const t = String(ev.type || '').toLowerCase();

    // 1. Paradas (save / save_own / parada o tiro rival con resultado parada)
    const isSaveEvent = ['save', 'save_own', 'parada'].includes(t);
    const isRivalShotSaved =
      (t === 'shot_on_target_rival' || t === 'shot_rival') &&
      (ev.outcome === 'saved' || ev.result === 'parada') &&
      // Solo contar tiro rival como parada si no existe ya un evento 'save'/'save_own' paralelo en ese mismo minuto/tiro
      !dedupedEvents.some(other =>
        other !== ev &&
        ['save', 'save_own', 'parada'].includes(String(other.type || '').toLowerCase()) &&
        (
          (other.shotEventId && other.shotEventId === ev.id) ||
          Number(other.minute ?? other.minuto ?? -1) === Number(ev.minute ?? ev.minuto ?? -2)
        )
      );

    if ((isSaveEvent || isRivalShotSaved) && belongsToThisGk(ev)) {
      const diff = String(ev.saveDifficulty || ev.difficulty || 'normal').toLowerCase();
      if (diff === 'decisiva' || diff === 'decisive' || diff === 'alta' || diff === 'high') {
        decisiveSaves += 1;
      } else {
        normalSaves += 1;
      }
    }

    // 2. Penaltis parados
    if (['penaltysave', 'penalty_save', 'penalti_parado'].includes(t) && belongsToThisGk(ev)) {
      penaltiesSaved += 1;
    }

    // 3. Salidas / juego aéreo / despejes de puños
    if (['claim', 'salida', 'despeje'].includes(t) && belongsToThisGk(ev)) {
      claims += 1;
    }

    // 4. Error que termina en gol
    if (['errorgoal', 'error_goal', 'error_portero'].includes(t) && belongsToThisGk(ev)) {
      errorGoal += 1;
    }

    // 5. Goles encajados (conceded explícito, gol_rival, shot_on_target_rival en gol, o autogol propio)
    const isExplicitConceded = t === 'conceded' || t === 'gol_encajado' || t === 'goal_conceded';
    const isRivalGoalEvent =
      t === 'gol_rival' ||
      t === 'goal_rival' ||
      ((t.includes('shot') && t.includes('rival')) &&
        (ev.outcome === 'goal' || ev.isGoal === true || ev.result === 'gol'));
    const isOwnGoalAgainstUs =
      t === 'own_goal' ||
      t === 'autogol' ||
      t === 'gol_propia' ||
      t === 'gol_en_contra_propio' ||
      (ev.isOwnGoal === true && t !== 'gol_local');

    if (isExplicitConceded) {
      const evPid = ev.playerId ?? ev.jugadorId ?? null;
      const matchesGk =
        (evPid && String(evPid) === pid) ||
        (!evPid && wasOnPitchAtEvent(ev));
      if (matchesGk) {
        const half = ev.half || (Number(ev.minute ?? ev.minuto ?? 0) > 45 ? 2 : 1);
        const min = ev.minute ?? ev.minuto ?? null;
        const sig = ev.rivalGoalId
          ? `rg_${ev.rivalGoalId}`
          : `min_${half}_${min !== null ? Number(min) : `idx_${idx}`}`;
        goalSignatures.add(sig);
      }
    } else if (isRivalGoalEvent || isOwnGoalAgainstUs) {
      // Si hay un evento 'conceded' explícito con el mismo rivalGoalId o mismo minuto atribuido a OTRO portero, no contarlo para éste
      const half = ev.half || (Number(ev.minute ?? ev.minuto ?? 0) > 45 ? 2 : 1);
      const min = ev.minute ?? ev.minuto ?? null;
      const explicitOtherGk = dedupedEvents.some(other => {
        const ot = String(other.type || '').toLowerCase();
        if (ot !== 'conceded' && ot !== 'gol_encajado') return false;
        const otherPid = other.playerId ?? other.jugadorId ?? null;
        if (!otherPid || String(otherPid) === pid) return false;
        if (ev.rivalGoalId && other.rivalGoalId && ev.rivalGoalId === other.rivalGoalId) return true;
        const otherMin = other.minute ?? other.minuto ?? null;
        return min !== null && otherMin !== null && Number(min) === Number(otherMin);
      });

      if (!explicitOtherGk && wasOnPitchAtEvent(ev)) {
        const sig = ev.rivalGoalId
          ? `rg_${ev.rivalGoalId}`
          : `min_${half}_${min !== null ? Number(min) : `idx_${idx}`}`;
        goalSignatures.add(sig);
      }
    }
  }

  let goalsConceded = goalSignatures.size;

  // Fallback con marcador global solo si no hubo eventos de gol desglosados y este portero jugó el partido (único portero en cancha)
  if (goalsConceded === 0 && !hasMultipleGoalkeepers && minutesPlayed > 0) {
    let fallbackGoalsAgainst = null;
    if (teamContext?.goalsAgainst !== undefined && teamContext?.goalsAgainst !== null) {
      fallbackGoalsAgainst = Number(teamContext.goalsAgainst);
    } else if (matchData?.goalsAgainst !== undefined && matchData?.goalsAgainst !== null) {
      fallbackGoalsAgainst = Number(matchData.goalsAgainst);
    } else if (matchData?.golesEnContra !== undefined && matchData?.golesEnContra !== null) {
      fallbackGoalsAgainst = Number(matchData.golesEnContra);
    } else if (matchData?.type === 'Visitante' && matchData?.marcadorLocal !== undefined) {
      fallbackGoalsAgainst = Number(matchData.marcadorLocal);
    } else if (matchData?.marcadorVisitante !== undefined && matchData?.type !== 'Visitante') {
      fallbackGoalsAgainst = Number(matchData.marcadorVisitante);
    }

    // Solo usar fallback de marcador si tampoco existen eventos de gol rival asignados a otro tramo
    const anyRivalGoalEvents = dedupedEvents.some(e => {
      const t = String(e.type || '').toLowerCase();
      return t === 'gol_rival' || t === 'goal_rival' || t === 'conceded' || t === 'own_goal' || t === 'autogol';
    });
    if (!anyRivalGoalEvents && Number.isFinite(fallbackGoalsAgainst) && fallbackGoalsAgainst > 0) {
      goalsConceded = fallbackGoalsAgainst;
    }
  }

  // Respetar pStats guardados si son mayores y no hay conflicto con múltiples porteros
  const pStats = matchData?.playerStats?.[pid] || matchData?.gkStats?.[pid] || {};
  const totalSavesFromEvents = normalSaves + decisiveSaves;
  const savedTotalSaves = Number(pStats.paradas ?? pStats.saves ?? 0);
  const saves = Math.max(totalSavesFromEvents, savedTotalSaves);
  if (saves > totalSavesFromEvents) {
    normalSaves += saves - totalSavesFromEvents;
  }

  penaltiesSaved = Math.max(penaltiesSaved, Number(pStats.penaltySaves ?? pStats.penaltisParados ?? 0));
  claims = Math.max(claims, Number(pStats.claims ?? pStats.salidas ?? 0));
  errorGoal = Math.max(errorGoal, Number(pStats.errorGoal ?? pStats.erroresGol ?? 0));

  // Portería a cero (cleanSheet): jugó al menos 1 minuto (o partido/tramo activo) y encajó 0 goles mientras estuvo en cancha
  const cleanSheet = minutesPlayed > 0 && goalsConceded === 0;

  // Goles encajados por 90 minutos
  const goalsAgainstPer90 = minutesPlayed > 0
    ? Number(((goalsConceded * 90) / minutesPlayed).toFixed(2))
    : 0;

  // % Paradas (incluyendo penaltis parados dentro de intervenciones de gol evitado)
  const totalInterventionsSaves = saves + penaltiesSaved;
  const shotsFaced = totalInterventionsSaves + goalsConceded;
  const savePct = shotsFaced > 0
    ? Math.round((totalInterventionsSaves / shotsFaced) * 100)
    : (cleanSheet ? 100 : 0);

  // Índice de exigencia GK = paradas normales + 2 * paradas decisivas + 2 * penaltis parados
  const gkExertionIndex = normalSaves + (2 * decisiveSaves) + (2 * penaltiesSaved);

  const ratingInputs = {
    isGoalkeeper: true,
    minutesPlayed,
    saves,
    normalSaves,
    decisiveSaves,
    conceded: goalsConceded,
    golesEncajados: goalsConceded,
    cleanSheet,
    penaltySaves: penaltiesSaved,
    claims,
    errorGoal,
    goalsAgainstPer90,
    savePct,
  };

  return {
    isGoalkeeper: true,
    minutesPlayed,
    goalsConceded,
    saves,
    normalSaves,
    decisiveSaves,
    penaltiesSaved,
    claims,
    errorGoal,
    cleanSheet,
    goalsAgainstPer90,
    savePct,
    shotsFaced,
    gkExertionIndex,
    ratingInputs,
  };
}
