/**
 * sanitizeMatchData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Parser defensivo puro y saneador de documentos de partido para Míster11.
 * 
 * Garantiza que NINGÚN documento (legacy, corrupto, parcial o moderno):
 *  1. Tumbe el renderizado o lance una excepción no capturada.
 *  2. Deje propiedades críticas como `undefined` o con tipos erróneos.
 *  3. Compute eventos imposibles (minuto > finalClock, sustituciones duplicadas).
 *  4. Pierda trazabilidad: todo dato anómalo se aísla en `match.warnings[]`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { normalizeLineup } from './lineupEngine';
import { getEffectiveMatchDuration, cleanseImpossibleMatchEvents } from './minutesEngine';

/**
 * Formatea segundos a MM:SS de forma segura.
 */
const formatSecondsSafe = (sec) => {
  if (!Number.isFinite(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Sanea y normaliza exhaustivamente un documento de partido individual.
 * @param {Object} rawMatch Documento de partido original desde Firestore o memoria
 * @param {Array} players Plantilla de jugadores para validación de nombres/IDs
 * @returns {{ sanitizedMatch: Object, warnings: Array<string>, isCorrupted: boolean }}
 */
export const sanitizeMatchData = (rawMatch = {}, players = []) => {
  const warnings = [];
  let isCorrupted = false;

  try {
    const raw = (rawMatch && typeof rawMatch === 'object') ? rawMatch : {};

    // ── 1. Metadatos Básicos e Identificadores ──────────────────────────────
    const id = raw.id ? String(raw.id) : `match_${Date.now()}`;
    const type = (raw.type === 'Visitante' || raw.tipo === 'Visitante') ? 'Visitante' : 'Local';
    const rival = String(raw.rival || raw.equipoVisitante || raw.visitante || raw.rivalName || 'Rival').trim();
    const date = String(raw.date || raw.fecha || new Date().toISOString().split('T')[0]).trim();
    const time = String(raw.time || raw.hora || '10:00').trim();
    const location = String(raw.location || raw.lugar || raw.campo || (type === 'Local' ? 'Campo Local' : 'Campo Visitante')).trim();
    const competition = String(raw.competition || raw.competicion || raw.torneo || 'Liga').trim();
    const season = String(raw.season || raw.temporada || '2025/2026').trim();
    const duration = Number.isFinite(Number(raw.duration || raw.duracion)) ? Number(raw.duration || raw.duracion) : 90;
    const durationType = String(raw.durationType || 'completo').trim();
    const status = String(raw.status || raw.estado || 'Pendiente').trim();
    const notes = String(raw.notes || raw.notas || '');

    // ── 2. Alineación y Convocatoria Normalizada ───────────────────────────
    const rawTitulares = Array.isArray(raw.titulares)
      ? raw.titulares
      : (Array.isArray(raw.alineacion?.titulares) ? raw.alineacion.titulares : []);
    const rawSuplentes = Array.isArray(raw.suplentes)
      ? raw.suplentes
      : (Array.isArray(raw.alineacion?.suplentes) ? raw.alineacion.suplentes : []);
    const rawConvocados = Array.isArray(raw.convocados)
      ? raw.convocados
      : (Array.isArray(raw.alineacion?.convocados) ? raw.alineacion.convocados : []);

    const normLineup = normalizeLineup(rawTitulares, rawSuplentes, rawConvocados);
    const lineup = String(raw.lineup || raw.formacion || raw.alineacionNombre || '4-3-3').trim();

    // ── 3. Cronómetro y Tiempos de Cierre ──────────────────────────────────
    let finalSeconds = Number.isFinite(raw.finalSeconds)
      ? raw.finalSeconds
      : (Number.isFinite(raw.finalSecondsReal) ? raw.finalSecondsReal : null);
    
    let finalClock = typeof raw.finalClock === 'string' && raw.finalClock.includes(':')
      ? raw.finalClock
      : (finalSeconds !== null ? formatSecondsSafe(finalSeconds) : null);

    const elapsedSeconds = Number.isFinite(raw.elapsedSeconds) ? raw.elapsedSeconds : 0;

    // Si el partido está terminado y no tenía finalSeconds/finalClock (caso legacy)
    const isFinished = status.toLowerCase() === 'terminado' || status.toLowerCase() === 'finalizado';
    if (isFinished && finalSeconds === null) {
      finalSeconds = duration * 60;
      finalClock = `${duration}:00`;
      warnings.push(`Partido legacy sin tiempo final registrado. Se asignó duración reglamentaria (${duration}').`);
      isCorrupted = true;
    }

    const effectiveDuration = getEffectiveMatchDuration({
      ...raw,
      duration,
      durationType,
      status,
      finalSeconds,
      finalClock
    });

    // ── 4. Saneado de Bitácora de Eventos y Descarte de Imposibles ──────────
    const rawEvents = Array.isArray(raw.events)
      ? raw.events
      : (Array.isArray(raw.liveStatsEvents) ? raw.liveStatsEvents : []);

    // Limpiar eventos con nulls o formatos rotos
    const cleanEventsBase = rawEvents.filter(Boolean).map((e, idx) => {
      if (typeof e !== 'object') return null;
      const evtMin = Math.max(1, parseInt(e.minute || e.minuto || e.time || 1, 10) || 1);
      const evtType = String(e.type || e.tipo || 'accion').trim();
      const evtId = e.id ? String(e.id) : `evt_${idx}_${Date.now()}`;
      return {
        ...e,
        id: evtId,
        type: evtType,
        minute: evtMin,
        playerId: e.playerId ? String(e.playerId) : (e.jugadorId ? String(e.jugadorId) : null),
        playerName: String(e.playerName || e.nombre || e.jugadorNombre || '').trim(),
        timestamp: e.timestamp || new Date().toISOString(),
        isValid: e.isValid !== false
      };
    }).filter(Boolean);

    // Detección de eventos imposibles
    const startersSet = new Set(normLineup.titulares.filter(Boolean).map(String));
    const { cleansedEvents, removedCount, details } = cleanseImpossibleMatchEvents(
      cleanEventsBase,
      normLineup.titulares,
      effectiveDuration
    );

    if (removedCount > 0) {
      isCorrupted = true;
      details.forEach((d) => warnings.push(d));
    }

    // Ordenar cronológicamente
    cleansedEvents.sort((a, b) => {
      const mA = parseInt(a.minute, 10) || 0;
      const mB = parseInt(b.minute, 10) || 0;
      if (mA !== mB) return mA - mB;
      return String(a.timestamp || '').localeCompare(String(b.timestamp || ''));
    });

    // ── 5. Marcador y Estadísticas Derivadas ────────────────────────────────
    const validEvents = cleansedEvents.filter((e) => e && e.isValid !== false);
    const derivedGoalsFor = validEvents.filter((e) => e.type === 'gol_local' || e.type === 'goal_own').length;
    const derivedGoalsAgainst = validEvents.filter((e) => e.type === 'gol_rival' || e.type === 'goal_rival').length;

    const rawGoalsFor = Number.isFinite(raw.goalsFor)
      ? raw.goalsFor
      : (Number.isFinite(raw.marcadorLocal) ? raw.marcadorLocal : null);
    const rawGoalsAgainst = Number.isFinite(raw.goalsAgainst)
      ? raw.goalsAgainst
      : (Number.isFinite(raw.marcadorVisitante) ? raw.marcadorVisitante : null);

    let goalsFor = rawGoalsFor !== null ? rawGoalsFor : derivedGoalsFor;
    let goalsAgainst = rawGoalsAgainst !== null ? rawGoalsAgainst : derivedGoalsAgainst;

    if (rawGoalsFor !== null && rawGoalsFor !== derivedGoalsFor && validEvents.length > 0) {
      warnings.push(`Marcador guardado (${rawGoalsFor}-${rawGoalsAgainst}) difiere de los goles en bitácora (${derivedGoalsFor}-${derivedGoalsAgainst}).`);
      isCorrupted = true;
    }

    // Goleadores y tarjetas
    const goleadoresList = Array.isArray(raw.goleadoresList) && raw.goleadoresList.length > 0
      ? raw.goleadoresList.filter(Boolean)
      : validEvents
          .filter((e) => e.type === 'gol_local' && e.playerId)
          .map((e) => ({
            jugadorId: String(e.playerId),
            nombre: e.playerName || 'Goleador',
            minuto: String(e.minute),
            asistenciaId: e.asistenciaId ? String(e.asistenciaId) : ''
          }));

    const tarjetasList = Array.isArray(raw.tarjetasList) && raw.tarjetasList.length > 0
      ? raw.tarjetasList.filter(Boolean)
      : validEvents
          .filter((e) => (e.type === 'amarilla' || e.type === 'roja' || e.type === 'card_yellow_own' || e.type === 'card_red_own') && e.playerId)
          .map((e) => ({
            jugadorId: String(e.playerId),
            nombre: e.playerName || 'Jugador amonestado',
            tipo: e.type.includes('red') || e.type === 'roja' ? 'roja' : 'amarilla',
            minuto: String(e.minute)
          }));

    // ── 6. Acta Oficial ────────────────────────────────────────────────────
    const rawActa = (raw.actaOficial && typeof raw.actaOficial === 'object') ? raw.actaOficial : {};
    const actaOficial = {
      closed: Boolean(rawActa.closed),
      closedWithWarnings: Boolean(rawActa.closedWithWarnings),
      closedAt: rawActa.closedAt || null,
      closedBy: rawActa.closedBy ? String(rawActa.closedBy) : null,
      reopenedAt: rawActa.reopenedAt || null,
      reopenedBy: rawActa.reopenedBy ? String(rawActa.reopenedBy) : null,
      reopenReason: rawActa.reopenReason ? String(rawActa.reopenReason) : '',
      actual: (rawActa.actual && typeof rawActa.actual === 'object') ? rawActa.actual : {},
      rsvp: (rawActa.rsvp && typeof rawActa.rsvp === 'object') ? rawActa.rsvp : {},
      warnings: Array.isArray(rawActa.warnings) ? rawActa.warnings : []
    };

    // ── 7. Post-Partido y Encuesta Técnica ─────────────────────────────────
    const rawPostAnswers = (raw.postMatchAnswers && typeof raw.postMatchAnswers === 'object')
      ? raw.postMatchAnswers
      : {};
    const postMatchAnswers = {
      tactical: String(rawPostAnswers.tactical || ''),
      physical: String(rawPostAnswers.physical || ''),
      improvement: String(rawPostAnswers.improvement || ''),
      highlights: String(rawPostAnswers.highlights || '')
    };

    const postMatchImages = Array.isArray(raw.postMatchImages)
      ? raw.postMatchImages.filter(Boolean)
      : (raw.postMatchPhoto ? [raw.postMatchPhoto] : []);

    // ── 8. Documento Saneado Final ─────────────────────────────────────────
    const sanitizedMatch = {
      ...raw,
      id,
      type,
      rival,
      date,
      time,
      location,
      competition,
      season,
      duration,
      durationType,
      status,
      notes,
      lineup,
      titulares: normLineup.titulares,
      suplentes: normLineup.suplentes,
      convocados: normLineup.convocados,
      finalSeconds,
      finalClock,
      elapsedSeconds,
      events: cleansedEvents,
      liveStatsEvents: cleansedEvents,
      goalsFor,
      goalsAgainst,
      goleadoresList,
      tarjetasList,
      actaOficial,
      postMatchAnswers,
      postMatchImages,
      warnings: Array.from(new Set([...warnings, ...(raw.warnings || [])]))
    };

    return { sanitizedMatch, warnings: sanitizedMatch.warnings, isCorrupted };
  } catch (err) {
    console.error('[sanitizeMatchData] Error defensivo al procesar partido:', err);
    const fallbackMatch = {
      id: rawMatch?.id ? String(rawMatch.id) : `match_${Date.now()}`,
      type: 'Local',
      rival: 'Rival',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      location: 'Campo',
      competition: 'Liga',
      season: '2025/2026',
      duration: 90,
      durationType: 'completo',
      status: 'Pendiente',
      titulares: Array(11).fill(null),
      suplentes: Array(7).fill(null),
      convocados: [],
      events: [],
      liveStatsEvents: [],
      goalsFor: 0,
      goalsAgainst: 0,
      goleadoresList: [],
      tarjetasList: [],
      actaOficial: { closed: false, actual: {}, rsvp: {}, warnings: [] },
      postMatchAnswers: { tactical: '', physical: '', improvement: '', highlights: '' },
      postMatchImages: [],
      warnings: [`Error crítico al parsear partido original: ${err.message}`]
    };
    return { sanitizedMatch: fallbackMatch, warnings: fallbackMatch.warnings, isCorrupted: true };
  }
};

/**
 * Función Batch de Mantenimiento para Sanear Todos los Partidos de la Base de Datos.
 */
export const sanitizeAllMatchesDatabase = async (teamPath, firestoreHelpers, players = []) => {
  const { db, getDocs, updateDoc, doc, collection, serverTimestamp } = firestoreHelpers;
  let totalMatches = 0;
  let repairedMatches = 0;
  const logs = [];

  try {
    const matchesColRef = collection(db, `${teamPath}/matches`);
    const snap = await getDocs(matchesColRef);
    totalMatches = snap.docs.length;

    for (const d of snap.docs) {
      const rawData = { id: d.id, ...d.data() };
      const { sanitizedMatch, warnings, isCorrupted } = sanitizeMatchData(rawData, players);

      if (isCorrupted || warnings.length > 0) {
        repairedMatches++;
        await updateDoc(doc(db, `${teamPath}/matches`, d.id), {
          ...sanitizedMatch,
          sanitizedAt: serverTimestamp(),
          sanitizationReport: warnings
        });
        logs.push({
          matchId: d.id,
          rival: sanitizedMatch.rival,
          date: sanitizedMatch.date,
          warnings
        });
      }
    }

    return { success: true, totalMatches, repairedMatches, logs };
  } catch (err) {
    console.error('[sanitizeAllMatchesDatabase] Error en saneado batch:', err);
    throw err;
  }
};
