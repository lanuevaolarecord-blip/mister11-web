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
import { calculateAllPlayerMinutes } from '../utils/minutesEngine';
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
      if (!currentActual[pid]) {
        const status = RSVP_TO_STATUS[rsvpData.status] || null;
        if (status) {
          updates[`actaOficial.actual.${pid}`] = {
            status,
            at: new Date().toISOString(),
            by: user.uid,
            source: 'rsvp_prefill',
          };
        }
      }
    });

    if (Object.keys(updates).length === 0) return;

    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, updates);
    } catch (err) {
      console.error('[useMatchSheet] Error prellenando desde RSVP:', err);
      throw err;
    }
  };

  /**
   * Actualizar el estado de asistencia de un jugador en el acta.
   * Solo el staff puede llamar a esta función.
   * @param {string} playerId
   * @param {'presente'|'ausente'|'tarde'|'justificado'|'lesionado'} status
   * @param {number} [lateMin]         - Minutos de retraso (si status === 'tarde')
   * @param {number|null} [minutesOverride] - Override manual de minutos jugados
   */
  const updatePlayerStatus = async (playerId, status, lateMin = null, minutesOverride = null) => {
    if (!isValid || !user || sheet?.closed) return;
    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      const payload = {
        status,
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
   * Actualizar solo el override de minutos de un jugador.
   */
  const updateMinutesOverride = async (playerId, minutes) => {
    if (!isValid || !user || sheet?.closed) return;
    try {
      const matchDocRef = doc(db, `${cleanPath}/matches`, matchId);
      await updateDoc(matchDocRef, {
        [`actaOficial.actual.${playerId}.minutesOverride`]: minutes === '' ? null : parseInt(minutes, 10),
        [`actaOficial.actual.${playerId}.by`]: user.uid,
      });
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

      // Construir mapa de overrides desde el actual del míster
      const overrides = {};
      Object.entries(currentActual).forEach(([pid, data]) => {
        if (data.minutesOverride !== undefined && data.minutesOverride !== null) {
          overrides[pid] = data.minutesOverride;
        }
      });

      // Calcular minutos reales con el motor
      const minutesMap = calculateAllPlayerMinutes(matchData, overrides);

      // Construir el `actual` final con minutos reales y status
      const finalActual = { ...currentActual };
      Object.entries(minutesMap).forEach(([pid, { minutes, source }]) => {
        const existing = finalActual[pid] || {};
        // Determinar status si no fue definido por el míster
        let status = existing.status;
        if (!status) {
          if (source === 'not_called') status = 'ausente';
          else if (source === 'dnp') status = 'convocado_no_jugó';
          else status = 'presente';
        }
        finalActual[pid] = {
          ...existing,
          status,
          minutes,
          minuteSource: source,
          at: existing.at || new Date().toISOString(),
          by: existing.by || user.uid,
        };
      });

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
    prefillFromRsvp,
    updatePlayerStatus,
    updateMinutesOverride,
    closeMatchSheet,
    reopenMatchSheet,
  };
};
