/**
 * useLiveStats.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook de Firestore para el módulo Live Stats de Míster 11.
 *
 * ESTRUCTURA FIRESTORE REAL:
 *   Los partidos pertenecen al equipo activo, guardados en:
 *   ${teamPath}/matches/${matchId}/liveStats/${eventId}
 *
 * ESQUEMA DE DATOS DE CADA EVENTO:
 *   {
 *     type: string,          // Tipo de evento
 *     half: 1 | 2,           // Mitad del partido (1ª o 2ª)
 *     minute: number,        // Minuto en que ocurrió el evento
 *     timestamp: serverTimestamp()
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from '../firebase/firestore-proxy';

export const EVENT_TYPES = [
  'shot_on_target_own',
  'shot_on_target_rival',
  'shot_off_target_own',
  'shot_off_target_rival',
  'card_own',
  'card_rival',
  'foul_favor',
  'foul_against',
  'duel_won',
  'duel_lost',
  'player_no_finish',
  'counter_not_cut',
  'corner_favor',
  'corner_against',
  'offside_own',
  'offside_rival',
  'recovery',
  'loss',
];

/**
 * @param {string|null} teamId        - ID del equipo activo
 * @param {string|null} matchId       - ID del partido activo en Firestore
 * @param {number}      currentMinute - Minuto actual del cronómetro
 * @param {1|2}         currentHalf   - Mitad actual del partido
 */
export const useLiveStats = (teamId, matchId, currentMinute, currentHalf = 1) => {
  const { user, getTeamPath } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Obtener ruta base del equipo (ej: users/{uid}/teams/{teamId} o clubs/{clubId}/teams/{teamId})
  const teamPath = teamId ? getTeamPath(teamId) : (user ? getTeamPath() : null);

  // ── Escuchar eventos en tiempo real con onSnapshot en la ruta correcta ──
  useEffect(() => {
    if (!matchId || !teamPath) {
      setEvents([]);
      return;
    }

    const fullCollectionPath = `${teamPath}/matches/${matchId}/liveStats`;
    console.log('[useLiveStats] Escuchando en ruta:', fullCollectionPath, 'matchId:', matchId);

    setLoading(true);
    const colRef = collection(db, fullCollectionPath);

    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[useLiveStats] Error leyendo eventos en', fullCollectionPath, err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [teamPath, matchId]);

  // ── Añadir un evento (addDoc en la subcolección del partido del equipo) ──
  const addLiveEvent = useCallback(
    async (type) => {
      if (!matchId || !teamPath) {
        console.warn('[useLiveStats] No hay matchId o teamPath activo. matchId:', matchId, 'teamPath:', teamPath);
        return null;
      }
      setSaving(true);
      const fullCollectionPath = `${teamPath}/matches/${matchId}/liveStats`;
      try {
        console.log('[useLiveStats] Escribiendo evento en:', fullCollectionPath, 'tipo:', type);
        const colRef = collection(db, fullCollectionPath);
        const docRef = await addDoc(colRef, {
          type,
          half: currentHalf,
          minute: currentMinute || 1,
          timestamp: serverTimestamp(),
        });
        return docRef.id;
      } catch (err) {
        console.error('[useLiveStats] Error guardando evento en', fullCollectionPath, err);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [teamPath, matchId, currentMinute, currentHalf]
  );

  // ── Conteo por tipo para el badge de cada botón ──────────────────────────
  const countByType = useCallback(
    (type) => events.filter((e) => e.type === type).length,
    [events]
  );

  return { events, loading, saving, addLiveEvent, countByType };
};
