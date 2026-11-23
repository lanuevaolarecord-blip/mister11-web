/**
 * src/utils/matchEventIdempotency.js
 * MÍSTER 11 — HOTFIX-10.1 (E1)
 *
 * Motor puro de idempotencia, deduplicación y bloqueo anti-rebote para eventos
 * de estadísticas en vivo (LiveStats / Partidos).
 *
 * Resuelve el efecto visual "+2 y luego baja a +1" causado por:
 * 1) Estado optimista local (`localEvents`) + estado optimista del hook (`useLiveStats`)
 *    + snapshot asíncrono de Firestore (`onSnapshot`) generando IDs temporales distintos
 *    para un mismo tap.
 * 2) Doble disparo sintético (`touchstart`/`touchend` + `click` sintético o doble listener)
 *    en WebView / Android.
 * 3) Reintentos o reproducción de cola offline con el mismo `eventId`.
 */

let _seqCounter = 0;

/**
 * Genera un identificador canónico único y trazable por acción de usuario.
 * Si se provee un `explicitEventId`, lo respeta (idempotencia en reintentos).
 *
 * @param {string} [prefix='evt']
 * @param {Object} [meta={}]
 * @returns {string}
 */
export function createMatchEventId(prefix = 'evt', meta = {}) {
  if (meta && typeof meta.eventId === 'string' && meta.eventId.trim() !== '') {
    return meta.eventId.trim();
  }
  if (meta && typeof meta.clientEventId === 'string' && meta.clientEventId.trim() !== '') {
    return meta.clientEventId.trim();
  }
  _seqCounter = (_seqCounter + 1) % 1000000;
  const cleanPrefix = String(prefix || 'evt').replace(/[^a-zA-Z0-9_-]/g, '');
  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanPrefix}_${now}_${_seqCounter}_${rand}`;
}

/**
 * Extrae la clave canónica de identidad de un evento de partido.
 * Prioriza `eventId` -> `clientEventId` -> `id`.
 *
 * @param {Object} event
 * @returns {string|null}
 */
export function getCanonicalEventKey(event) {
  if (!event || typeof event !== 'object') return null;
  const key = event.eventId || event.clientEventId || event.id;
  if (key === undefined || key === null || String(key).trim() === '') return null;
  return String(key).trim();
}

/**
 * Normaliza un evento asegurando que `id` y `eventId` estén sincronizados.
 *
 * @param {Object} event
 * @param {string} [fallbackPrefix='evt']
 * @returns {Object}
 */
export function ensureCanonicalEventId(event, fallbackPrefix = 'evt') {
  if (!event || typeof event !== 'object') return event;
  const canonicalId = getCanonicalEventKey(event) || createMatchEventId(fallbackPrefix);
  return {
    ...event,
    id: event.id || canonicalId,
    eventId: event.eventId || canonicalId,
  };
}

/**
 * Une y deduplica múltiples listas de eventos (ej. `cleanBase` de Firestore/hook,
 * `localEvents` optimistas de UI, y `matchDayEvents` de bitácora) usando la clave
 * canónica `eventId || clientEventId || id`.
 *
 * Cuando un mismo `eventId` existe tanto en la lista confirmada/base como en la
 * lista optimista local, conserva una única instancia (la confirmada/base enriquecida)
 * evitando que el contador sume +2 durante el vuelo de `addDoc` y luego baje a +1.
 *
 * @param {...Array<Object>} eventLists
 * @returns {Array<Object>}
 */
export function mergeAndDedupeMatchEvents(...eventLists) {
  const byCanonicalKey = new Map();
  const seenFirestoreIds = new Set();
  const seenEventIds = new Set();
  const unkeyedEvents = [];

  for (const list of eventLists) {
    if (!Array.isArray(list)) continue;
    for (const rawEv of list) {
      if (!rawEv || typeof rawEv !== 'object') continue;
      if (rawEv.isValid === false) continue;

      const evId = rawEv.eventId ? String(rawEv.eventId).trim() : (rawEv.clientEventId ? String(rawEv.clientEventId).trim() : null);
      const docId = rawEv.id ? String(rawEv.id).trim() : null;

      // Si ya fue registrado por eventId o por id de documento, fusionar metadatos sin duplicar entrada
      let existingKey = null;
      if (evId && seenEventIds.has(evId)) {
        existingKey = `ev:${evId}`;
      } else if (docId && seenFirestoreIds.has(docId)) {
        existingKey = byCanonicalKey.has(`ev:${docId}`) ? `ev:${docId}` : `doc:${docId}`;
      }

      if (existingKey && byCanonicalKey.has(existingKey)) {
        const prev = byCanonicalKey.get(existingKey);
        byCanonicalKey.set(existingKey, {
          ...rawEv,
          ...prev,
          id: prev.id || rawEv.id || evId,
          eventId: prev.eventId || rawEv.eventId || evId || prev.id,
        });
        if (evId) seenEventIds.add(evId);
        if (docId) seenFirestoreIds.add(docId);
        continue;
      }

      const primaryKey = evId ? `ev:${evId}` : (docId ? `doc:${docId}` : null);
      if (primaryKey) {
        const normalized = {
          ...rawEv,
          id: docId || evId,
          eventId: evId || docId,
        };
        byCanonicalKey.set(primaryKey, normalized);
        if (evId) seenEventIds.add(evId);
        if (docId) seenFirestoreIds.add(docId);
      } else {
        unkeyedEvents.push(rawEv);
      }
    }
  }

  return [...byCanonicalKey.values(), ...unkeyedEvents];
}

/**
 * Crea un controlador de idempotencia y bloqueo anti-rebote para acciones de captura.
 *
 * Reglas:
 * - 1 tap real => +1
 * - 1 tap con evento sintético duplicado (ej. pointerup/touchend + click sintético dentro de `syntheticWindowMs`,
 *   o reintento con el mismo `eventId`) => +1 (bloqueado el duplicado)
 * - 2 taps reales deliberados (`isDeliberateSequentialTap` o separados tras `lockWhilePending: false` / confirmación) => +2
 *
 * @param {Object} [options={}]
 * @param {number} [options.syntheticWindowMs=80] - Ventana para filtrar el click sintético de un mismo gesto touch
 * @param {boolean} [options.lockWhilePending=false] - Si true, bloquea la misma acción hasta que termine el promise en vuelo
 * @returns {Object}
 */
export function createActionIdempotencyGuard(options = {}) {
  const syntheticWindowMs = typeof options.syntheticWindowMs === 'number' ? options.syntheticWindowMs : 80;
  const lockWhilePending = Boolean(options.lockWhilePending);

  const appliedEventIds = new Set();
  const pendingByAction = new Map(); // actionKey -> Set<eventId>
  const lastGestureByAction = new Map(); // actionKey -> { ts, gestureId, source }

  /**
   * Determina si un disparo debe ser aceptado o rechazado por ser duplicado sintético o tener el mismo eventId.
   *
   * @param {string} actionKey - Clave de la acción/botón (ej. 'pass_completed', 'gk_save')
   * @param {Object} [meta={}]
   * @param {string} [meta.eventId] - Si se pasa un eventId ya conocido, se rechaza
   * @param {string} [meta.gestureId] - ID del gesto físico; si coincide con el último gesto de esa acción, es sintético
   * @param {boolean} [meta.isSyntheticClick] - Flag explícito de click sintético tras touch
   * @param {number} [meta.now] - Timestamp opcional para tests deterministas
   * @returns {{ allowed: boolean, reason: string|null, eventId: string }}
   */
  function tryAcquire(actionKey, meta = {}) {
    const key = String(actionKey || 'default');
    const now = typeof meta.now === 'number' ? meta.now : Date.now();
    const candidateEventId = createMatchEventId(key, meta);

    // 1. Idempotencia estricta por eventId (reintentos de red, listener duplicado, cola offline)
    if (appliedEventIds.has(candidateEventId)) {
      return { allowed: false, reason: 'duplicate_event_id', eventId: candidateEventId };
    }

    // 2. Filtro de click sintético tras touch en el mismo gesto físico
    if (meta.isSyntheticClick) {
      return { allowed: false, reason: 'synthetic_click_after_touch', eventId: candidateEventId };
    }

    const lastGesture = lastGestureByAction.get(key);
    if (lastGesture) {
      if (meta.gestureId && lastGesture.gestureId && meta.gestureId === lastGesture.gestureId) {
        return { allowed: false, reason: 'same_physical_gesture', eventId: candidateEventId };
      }
      if (
        meta.source &&
        lastGesture.source &&
        meta.source !== lastGesture.source &&
        now - lastGesture.ts <= syntheticWindowMs
      ) {
        // Ej: 'touchend' seguido de 'click' sintético 15ms después
        return { allowed: false, reason: 'cross_source_synthetic_event', eventId: candidateEventId };
      }
    }

    // 3. Bloqueo opcional mientras la acción está pending
    const activePending = pendingByAction.get(key);
    if (lockWhilePending && activePending && activePending.size > 0) {
      return { allowed: false, reason: 'action_pending_lock', eventId: candidateEventId };
    }

    // Registrar adquisición
    appliedEventIds.add(candidateEventId);
    if (!pendingByAction.has(key)) {
      pendingByAction.set(key, new Set());
    }
    pendingByAction.get(key).add(candidateEventId);
    lastGestureByAction.set(key, {
      ts: now,
      gestureId: meta.gestureId || null,
      source: meta.source || 'click',
    });

    return { allowed: true, reason: null, eventId: candidateEventId };
  }

  /**
   * Marca un `eventId` en vuelo como confirmado (libera el lock pending pero mantiene el `eventId` en `appliedEventIds`).
   */
  function confirm(actionKey, eventId) {
    const key = String(actionKey || 'default');
    const set = pendingByAction.get(key);
    if (set && eventId) {
      set.delete(eventId);
    }
  }

  /**
   * Revierte un `eventId` si la operación falló y debe permitir reintento limpio.
   */
  function rollback(actionKey, eventId) {
    const key = String(actionKey || 'default');
    const set = pendingByAction.get(key);
    if (set && eventId) {
      set.delete(eventId);
    }
    if (eventId) {
      appliedEventIds.delete(eventId);
    }
  }

  function isActionPending(actionKey) {
    const key = String(actionKey || 'default');
    const set = pendingByAction.get(key);
    return Boolean(set && set.size > 0);
  }

  function hasEventId(eventId) {
    return appliedEventIds.has(String(eventId || ''));
  }

  function reset() {
    appliedEventIds.clear();
    pendingByAction.clear();
    lastGestureByAction.clear();
  }

  return {
    tryAcquire,
    confirm,
    rollback,
    isActionPending,
    hasEventId,
    reset,
  };
}
