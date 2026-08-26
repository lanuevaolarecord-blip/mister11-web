/**
 * src/utils/lineupEngine.js
 * Míster11 — Motor Universal de Alineaciones y Cambios Inmutables a Prueba de Crash
 *
 * REGLAS OFICIALES:
 * 1. Modelo normalizado:
 *    - titulares: Array(11) con playerId (string) | null
 *    - suplentes: Array(7) con playerId (string) | null
 *    - convocados: Array con todos los playerIds únicos no nulos (titulares + suplentes)
 * 2. Un jugador aparece COMO MÁXIMO una sola vez en toda la convocatoria.
 * 3. Casos de movimiento/intercambio (0..10 titulares, 11..17 suplentes):
 *    - Ocupado ↔ Ocupado: SWAP (intercambio).
 *    - Ocupado → Vacío: MOVER (asigna destino y libera origen a null).
 *    - Vacío → Ocupado: MOVER (asigna destino y libera origen a null).
 *    - Vacío ↔ Vacío: NO-OP (sin efecto).
 * 4. Actualizaciones 100% inmutables sin mutar arrays/objetos existentes.
 * 5. Invariantes de integridad post-cambio: titulares.length === 11, suplentes.length === 7, sin duplicados.
 */

/**
 * Normaliza los arrays de titulares y suplentes asegurando longitudes fijas de 11 y 7.
 * @param {Array} rawTitulares - Array de IDs de titulares
 * @param {Array} rawSuplentes - Array de IDs de suplentes
 * @param {Array} rawConvocados - Array opcional de respaldo
 * @returns {{ titulares: Array<string|null>, suplentes: Array<string|null>, convocados: Array<string> }}
 */
export const normalizeLineup = (rawTitulares = [], rawSuplentes = [], rawConvocados = []) => {
  const seen = new Set();
  const titulares = Array.from({ length: 11 }, () => null);
  const suplentes = Array.from({ length: 7 }, () => null);

  // 1. Si se pasan titulares explícitos
  if (Array.isArray(rawTitulares) && rawTitulares.length > 0) {
    rawTitulares.slice(0, 11).forEach((id, idx) => {
      if (id && typeof id === 'string' && !seen.has(id)) {
        titulares[idx] = id;
        seen.add(id);
      }
    });
  } else if (Array.isArray(rawConvocados) && rawConvocados.length > 0) {
    // Fallback: usar los primeros 11 de convocados
    rawConvocados.slice(0, 11).forEach((id, idx) => {
      if (id && typeof id === 'string' && !seen.has(id)) {
        titulares[idx] = id;
        seen.add(id);
      }
    });
  }

  // 2. Si se pasan suplentes explícitos
  if (Array.isArray(rawSuplentes) && rawSuplentes.length > 0) {
    rawSuplentes.slice(0, 7).forEach((id, idx) => {
      if (id && typeof id === 'string' && !seen.has(id)) {
        suplentes[idx] = id;
        seen.add(id);
      }
    });
  } else if (Array.isArray(rawConvocados) && rawConvocados.length > 11) {
    // Fallback: usar del 11 al 17 de convocados
    rawConvocados.slice(11, 18).forEach((id, idx) => {
      if (id && typeof id === 'string' && !seen.has(id)) {
        suplentes[idx] = id;
        seen.add(id);
      }
    });
  }

  const convocados = [...titulares.filter(Boolean), ...suplentes.filter(Boolean)];

  return {
    titulares,
    suplentes,
    convocados
  };
};

/**
 * Aplica un cambio o movimiento en la alineación de forma 100% inmutable y a prueba de fallos.
 *
 * @param {Object} currentLineup - { titulares: Array(11), suplentes: Array(7), customPositions?: Object }
 * @param {Object} action - { fromIdx: number, toIdx: number } (índices 0..17)
 * @returns {Object} Nueva alineación { titulares, suplentes, convocados, customPositions }
 */
export const applyLineupChange = (
  currentLineup = {},
  action = {}
) => {
  const { fromIdx, toIdx } = action;

  if (
    typeof fromIdx !== 'number' ||
    typeof toIdx !== 'number' ||
    fromIdx === toIdx ||
    fromIdx < 0 ||
    fromIdx >= 18 ||
    toIdx < 0 ||
    toIdx >= 18
  ) {
    return currentLineup;
  }

  // Normalizar slots actuales a 11 y 7 con nulls
  const currentTitulares = Array.from({ length: 11 }, (_, i) => currentLineup.titulares?.[i] || null);
  const currentSuplentes = Array.from({ length: 7 }, (_, i) => currentLineup.suplentes?.[i] || null);
  const allSlots = [...currentTitulares, ...currentSuplentes]; // Longitud 18 exacta

  const playerA = allSlots[fromIdx];
  const playerB = allSlots[toIdx];

  // Caso 1: Vacío ↔ Vacío (NO-OP)
  if (!playerA && !playerB) {
    return currentLineup;
  }

  // Clon inmutable de los slots
  const nextSlots = [...allSlots];

  // Caso 2: Intercambio / Movimiento universal
  nextSlots[toIdx] = playerA;
  nextSlots[fromIdx] = playerB;

  const nextTitulares = nextSlots.slice(0, 11);
  const nextSuplentes = nextSlots.slice(11, 18);

  // Verificación de invariantes:
  // 1. Longitudes fijas garantizadas
  if (nextTitulares.length !== 11 || nextSuplentes.length !== 7) {
    console.warn('[applyLineupChange] Error de longitud de slots, cambio cancelado.');
    return currentLineup;
  }

  // 2. Comprobar que ningún jugador esté duplicado
  const seenIds = new Set();
  for (const pid of nextSlots) {
    if (pid) {
      if (seenIds.has(pid)) {
        console.warn(`[applyLineupChange] Jugador duplicado detectado (${pid}), cambio cancelado.`);
        return currentLineup;
      }
      seenIds.add(pid);
    }
  }

  // Intercambiar coordenadas tácticas personalizadas si existen
  const nextCustomPositions = { ...(currentLineup.customPositions || {}) };
  const posA = nextCustomPositions[fromIdx];
  const posB = nextCustomPositions[toIdx];

  if (posA) nextCustomPositions[toIdx] = posA;
  else delete nextCustomPositions[toIdx];

  if (posB) nextCustomPositions[fromIdx] = posB;
  else delete nextCustomPositions[fromIdx];

  return {
    titulares: nextTitulares,
    suplentes: nextSuplentes,
    convocados: Array.from(seenIds),
    customPositions: nextCustomPositions
  };
};

/**
 * Formatea de manera segura y defensiva la fecha de un partido terminado o programado.
 * @param {Object} match - Objeto de partido
 * @param {string} language - Idioma activo ('Español (ES)' | 'English (EN)' | 'en' | 'es')
 * @returns {string} Fecha formateada o "Fecha sin registrar" / "Unrecorded date"
 */
export const formatMatchDateSafe = (match, language = 'es') => {
  const isEn = language === 'en' || language === 'English (EN)';
  const rawDate = match?.date || match?.fecha || match?.matchDate;
  const rawTime = match?.time || match?.hora;

  if (!rawDate) {
    return isEn ? 'Unrecorded date' : 'Fecha sin registrar';
  }

  let formattedDate = '';
  try {
    if (typeof rawDate === 'string') {
      const cleanDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      const parts = cleanDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // Formato YYYY-MM-DD
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString(isEn ? 'en-US' : 'es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          }
        } else {
          // Formato DD/MM/YYYY
          formattedDate = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
      } else {
        formattedDate = cleanDate;
      }
    } else if (rawDate?.toDate && typeof rawDate.toDate === 'function') {
      formattedDate = rawDate.toDate().toLocaleDateString(isEn ? 'en-US' : 'es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } else if (rawDate?.seconds) {
      formattedDate = new Date(rawDate.seconds * 1000).toLocaleDateString(isEn ? 'en-US' : 'es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } else if (rawDate instanceof Date) {
      formattedDate = rawDate.toLocaleDateString(isEn ? 'en-US' : 'es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (err) {
    formattedDate = '';
  }

  if (!formattedDate) {
    return isEn ? 'Unrecorded date' : 'Fecha sin registrar';
  }

  return rawTime ? `${formattedDate} · ${rawTime}` : formattedDate;
};

export default {
  normalizeLineup,
  applyLineupChange,
  formatMatchDateSafe
};
