/**
 * src/hooks/useMatchSheet.js
 * Míster11 — Ciclo de vida del Acta Oficial de Partido
 *
 * Gestiona:
 *  - Escucha en tiempo real del RSVP del jugador y del `actual` del entrenador
 *  - Actualización del estado del jugador en el acta (presente/ausente/tarde…)
 *  - Override manual de minutos
 *  - Cierre del acta (closed: true + minutos reales calculados)
 *  - Reapertura del acta (solo admin)
 */
import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import {
  calculateAllPlayerMinutes,
  buildSmartMatchSheetActual,
  calculateMinutesFromEvents,
  getUnifiedMatchEvents,
  cleanseImpossibleMatchEvents
} from '../utils/minutesEngine';
import { showToast } from '../utils/toast';

/**
 * Hook principal del Acta Oficial.
 *
 * @param {string} teamPath   - Ruta del equipo ej: "users/uid/teams/teamId"
 * @param {string} matchId    - ID del partido
 * @param {Object} matchData  - Datos actuales del partido (titulares, suplentes, events…)
 * @param {Array}  players    - Lista de jugadores del equipo
 */
export const useMatchSheet = (teamPath, matchId, matchData, players = []) => {
  const { user } = useAuth();
  const [sheet, setSheet] = useState(null);      // { rsvp, actual, closed, closedAt, closedBy }
  const [loading, setLoading] = useState(true);

  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const isValid = cleanPath && matchId;

  // 1. Escucha en tiempo real del documento del acta dentro del partido
  useEffect(() => {
    if (!isValid) { setLoading(false); return; }

    const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
    const unsub = onSnapshot(matchDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSheet({
          rsvp:       data.playerRsvp  || {},
          actual:     data.actaOficial?.actual     || {},
          closed:     data.actaOficial?.closed     || false,
          closedAt:   data.actaOficial?.closedAt   || null,
          closedBy:   data.actaOficial?.closedBy   || null,
        });
      } else {
        setSheet({ rsvp: {}, actual: {}, closed: false, closedAt: null, closedBy: null });
      }
      setLoading(false);
    }, (err) => {
      console.warn('[useMatchSheet] Error escuchando acta:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [cleanPath, matchId, isValid]);

  /**
   * Prellenado Inteligente del Acta Oficial.
   * - En partido iniciado o terminado: alineación = PRESENTE + minutos calculados por events.
   * - No sobreescribe modificaciones manuales del míster (source === 'manual').
   * - No depende de que haya RSVP de los jugadores.
   */
  const smartPrefill = async () => {
    if (!isValid || !user || sheet?.closed) return;
    try {
      const smartActual = buildSmartMatchSheetActual(
        matchData,
        sheet?.actual || {},
        sheet?.rsvp || {},
        user.uid,
        { preserveManual: true }
      );
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, {
        'actaOficial.actual': smartActual,
      });
      showToast('⚡ Acta prellenada inteligentemente desde alineación y eventos.', 'success');
    } catch (err) {
      console.error('[useMatchSheet] Error en prellenado inteligente:', err);
      showToast('❌ Error en prellenado inteligente.', 'error');
      throw err;
    }
  };

  /**
   * Prellenar el `actual` desde el RSVP actual.
   * going → presente | not_going → ausente | late → tarde | justified → justificado
   * No sobreescribe entradas ya confirmadas por el míster (preserva cambios manuales).
   */
  const prefillFromRsvp = async () => {
    if (!isValid || !user || sheet?.closed) return;
    const rsvpMap = sheet?.rsvp || {};
    const currentActual = sheet?.actual || {};

    const RSVP_TO_STATUS = {
      going: 'presente',
      not_going: 'ausente',
      late: 'tarde',
      justified: 'justificado',
    };

    const updates = {};
    Object.entries(rsvpMap).forEach(([pid, rsvpData]) => {
      if (!currentActual[pid] || currentActual[pid].source !== 'manual') {
        const status = RSVP_TO_STATUS[rsvpData.status] || null;
        if (status) {
          updates[`actaOficial.actual.${pid}`] = {
            ...(currentActual[pid] || {}),
            status,
            at: new Date().toISOString(),
            by: user.uid,
            source: 'rsvp_prefill',
          };
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      showToast('No hay respuestas RSVP pendientes para prellenar.', 'info');
      return;
    }

    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, updates);
      showToast('✅ Estados prellenados desde RSVP.', 'success');
    } catch (err) {
      console.error('[useMatchSheet] Error prellenando desde RSVP:', err);
      showToast('❌ Error al prellenar desde RSVP.', 'error');
      throw err;
    }
  };

  /**
   * Actualizar el estado de asistencia de un jugador en el acta.
   * Solo el staff puede llamar a esta función.
   * @param {string} playerId
   * @param {'presente'|'ausente'|'tarde'|'justificado'|'lesionado'|'sin_registro'} status
   * @param {number} [lateMin]         - Minutos de retraso (si status === 'tarde')
   * @param {number|null} [minutesOverride] - Override manual de minutos jugados
   */
  const updatePlayerStatus = async (playerId, status, lateMin = null, minutesOverride = null) => {
    if (!isValid || !user || sheet?.closed) return;
    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      const existing = sheet?.actual?.[playerId] || {};
      const duration = parseInt(matchData?.duration || matchData?.duracion || 90, 10);
      const rawTitulares = Array.isArray(matchData?.titulares) ? matchData.titulares : (matchData?.alineacion?.titulares || []);
      const rawSuplentes = Array.isArray(matchData?.suplentes) ? matchData.suplentes : (matchData?.alineacion?.suplentes || []);
      const allEvents = getUnifiedMatchEvents(matchData);

      const effectiveOverride = minutesOverride !== null ? minutesOverride : (existing.minutesOverride ?? null);
      const effectiveLateMin = lateMin !== null ? lateMin : (existing.lateMin ?? null);

      const minutesCalc = calculateMinutesFromEvents(
        playerId,
        allEvents,
        rawTitulares,
        rawSuplentes,
        duration,
        effectiveOverride,
        status,
        effectiveLateMin
      );

      const payload = {
        ...existing,
        status,
        minutes: minutesCalc.minutes,
        minuteSource: minutesCalc.source,
        detail: minutesCalc.detail,
        source: 'manual',
        at: new Date().toISOString(),
        by: user.uid,
      };
      if (lateMin !== null) payload.lateMin = lateMin;
      if (minutesOverride !== null) payload.minutesOverride = minutesOverride;

      await updateDoc(matchDocRef, {
        [`actaOficial.actual.${playerId}`]: payload,
      });
    } catch (err) {
      console.error('[useMatchSheet] Error actualizando estado:', err);
      throw err;
    }
  };

  /**
   * Depura eventos imposibles y duplicados de la bitácora, recalculando el acta y marcador.
   */
  const cleanseEvents = async () => {
    if (!isValid || !user || sheet?.closed) return { removedCount: 0 };
    try {
      const rawTitulares = Array.isArray(matchData?.titulares) ? matchData.titulares : (matchData?.alineacion?.titulares || []);
      const events = Array.isArray(matchData?.events) ? matchData.events : [];
      const { cleansedEvents, removedCount, details } = cleanseImpossibleMatchEvents(events, rawTitulares);

      if (removedCount === 0) {
        showToast('✅ No se detectaron sustituciones imposibles ni eventos duplicados.', 'info');
        return { removedCount: 0, details: [] };
      }

      const derivedGoalsFor = cleansedEvents.filter(e => e.isValid !== false && (e.type === 'gol_local' || e.type === 'goal_own')).length;
      const derivedGoalsAgainst = cleansedEvents.filter(e => e.isValid !== false && (e.type === 'gol_rival' || e.type === 'goal_rival')).length;

      const smartActual = buildSmartMatchSheetActual(
        { ...matchData, events: cleansedEvents },
        sheet?.actual || {},
        sheet?.rsvp || {},
        user.uid,
        { preserveManual: false }
      );

      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, {
        events: cleansedEvents,
        goalsFor: derivedGoalsFor,
        goalsAgainst: derivedGoalsAgainst,
        'actaOficial.actual': smartActual,
      });

      showToast(`🧹 Se depuraron ${removedCount} evento(s) imposible(s) y se recalculó el acta.`, 'success');
      return { removedCount, details };
    } catch (err) {
      console.error('[useMatchSheet] Error depurando bitácora:', err);
      showToast('❌ Error al depurar bitácora.', 'error');
      throw err;
    }
  };

  /**
   * Actualizar solo el override de minutos de un jugador.
   */
  const updateMinutesOverride = async (playerId, minutes) => {
    if (!isValid || !user || sheet?.closed) return;
    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      const parsed = minutes === '' || minutes === null ? null : parseInt(minutes, 10);
      const existing = sheet?.actual?.[playerId] || {};
      const updates = {
        [`actaOficial.actual.${playerId}.minutesOverride`]: parsed,
        [`actaOficial.actual.${playerId}.by`]: user.uid,
        [`actaOficial.actual.${playerId}.source`]: 'manual',
      };
      if (parsed !== null) {
        updates[`actaOficial.actual.${playerId}.minutes`] = parsed;
        updates[`actaOficial.actual.${playerId}.minuteSource`] = 'override';
      }
      await updateDoc(matchDocRef, updates);
    } catch (err) {
      console.error('[useMatchSheet] Error actualizando override de minutos:', err);
      throw err;
    }
  };

  /**
   * CERRAR EL ACTA.
   * Calcula los minutos reales de cada jugador con el motor de minutos y congela el acta.
   * Solo el staff puede cerrar.
   */
  const closeMatchSheet = async () => {
    if (!isValid || !user) throw new Error('Sin usuario o partido activo.');
    if (sheet?.closed) return;

    try {
      const duration = parseInt(matchData?.duration || matchData?.duracion || 90, 10);
      const currentActual = sheet?.actual || {};

      const finalActual = buildSmartMatchSheetActual(
        matchData,
        currentActual,
        sheet?.rsvp || {},
        user.uid,
        { preserveManual: true }
      );

      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, {
        'actaOficial.actual': finalActual,
        'actaOficial.closed': true,
        'actaOficial.closedAt': serverTimestamp(),
        'actaOficial.closedBy': user.uid,
        'actaOficial.closedByName': user.displayName || 'Staff',
        'actaOficial.totalDuration': duration,
      });

      showToast('✅ Acta cerrada. Minutos reales guardados.', 'success');
    } catch (err) {
      console.error('[useMatchSheet] Error cerrando acta:', err);
      showToast('❌ Error al cerrar el acta. Intenta de nuevo.', 'error');
      throw err;
    }
  };

  /**
   * REABRIR EL ACTA (solo admin).
   * Resetea closed a false para permitir correcciones.
   */
  const reopenMatchSheet = async () => {
    if (!isValid || !user) return;
    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, {
        'actaOficial.closed': false,
        'actaOficial.reopenedAt': serverTimestamp(),
        'actaOficial.reopenedBy': user.uid,
      });
      showToast('🔓 Acta reabierta. Puedes corregir y volver a cerrar.', 'info');
    } catch (err) {
      console.error('[useMatchSheet] Error reabriendo acta:', err);
      throw err;
    }
  };

  // Helpers de lectura del sheet
  const getPlayerActual = (playerId) => sheet?.actual?.[playerId] || null;
  const getPlayerRsvp   = (playerId) => sheet?.rsvp?.[playerId]   || null;
  const isClosed = sheet?.closed === true;

  /**
   * Detectar discrepancias: jugador dijo "iré" pero el míster lo marcó ausente (o viceversa).
   */
  const getDiscrepancies = () => {
    if (!sheet) return [];
    const RSVP_TO_STATUS = { going: 'presente', not_going: 'ausente', late: 'tarde', justified: 'justificado' };
    return Object.entries(sheet.rsvp || {}).reduce((acc, [pid, rsvpData]) => {
      const actualStatus = sheet.actual?.[pid]?.status;
      const expectedFromRsvp = RSVP_TO_STATUS[rsvpData.status];
      if (actualStatus && expectedFromRsvp && actualStatus !== expectedFromRsvp) {
        acc.push({ playerId: pid, rsvp: rsvpData.status, actual: actualStatus });
      }
      return acc;
    }, []);
  };

  return {
    sheet,
    loading,
    isClosed,
    getPlayerActual,
    getPlayerRsvp,
    getDiscrepancies,
    smartPrefill,
    prefillFromRsvp,
    updatePlayerStatus,
    updateMinutesOverride,
    closeMatchSheet,
    reopenMatchSheet,
    cleanseEvents,
  };
};
