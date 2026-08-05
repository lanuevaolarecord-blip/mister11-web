/**
 * useLiveStats.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook de Firestore para el módulo Live Stats de Míster 11.
 *
 * ESTRUCTURA FIRESTORE REAL:
 *   Los partidos pertenecen al equipo activo, guardados en:
 *   ${teamPath}/matches/${matchId}/liveStats/${eventId}
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

  const teamPath = teamId ? getTeamPath(teamId) : (user ? getTeamPath() : null);
  const fullCollectionPath = (teamPath && matchId) ? `${teamPath}/matches/${matchId}/liveStats` : null;

  // ── Escuchar eventos en tiempo real con onSnapshot ────────────────────────
  useEffect(() => {
    if (!fullCollectionPath) {
      setEvents([]);
      return;
    }

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
  }, [fullCollectionPath]);

  // ── Añadir un evento (addDoc) ─────────────────────────────────────────────
  const addLiveEvent = useCallback(
    async (type) => {
      if (!fullCollectionPath) {
        console.warn('[useLiveStats] Imposible guardar. fullCollectionPath es nulo.', { teamPath, matchId });
        return null;
      }
      setSaving(true);
      try {
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
    [fullCollectionPath, teamPath, matchId, currentMinute, currentHalf]
  );

  // ── Conteo por tipo ───────────────────────────────────────────────────────
  const countByType = useCallback(
    (type) => events.filter((e) => e.type === type).length,
    [events]
  );

  return { events, loading, saving, addLiveEvent, countByType };
};
