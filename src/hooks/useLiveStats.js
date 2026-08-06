/**
 * useLiveStats.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook de Firestore para el módulo Live Stats de Míster 11.
 *
 * ACTUALIZACIÓN:
 *   1. Actualización local optimista de eventos (setEvents +1 inmediato).
 *      El contador y los badges de botones suman al instante (0 ms de latencia)
 *      al hacer tap en cualquier botón.
 *   2. Persistencia asíncrona en Firestore:
 *      ${teamPath}/matches/${matchId}/liveStats/${eventId}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  writeBatch,
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
    // Resetear inmediatamente el estado local al cambiar de partido o ruta
    setEvents([]);

    if (!fullCollectionPath) {
      return;
    }

    setLoading(true);
    const colRef = collection(db, fullCollectionPath);

    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        if (snap && snap.docs) {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setEvents(docs);
        } else {
          setEvents([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useLiveStats] Error leyendo eventos en', fullCollectionPath, err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fullCollectionPath]);

  // ── Añadir un evento (Incremento inmediato optimista + Persistencia) ──────
  const addLiveEvent = useCallback(
    async (type, explicitHalf = null) => {
      const targetHalf = explicitHalf !== null && explicitHalf !== undefined ? explicitHalf : currentHalf;
      const newId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const localDoc = {
        id: newId,
        type,
        half: targetHalf,
        minute: currentMinute || 1,
        timestamp: new Date().toISOString(),
      };

      // 1. Incremento optimista inmediato en el estado local (0 ms latencia)
      setEvents((prev) => [...prev, localDoc]);

      // 2. Persistencia en Firestore en segundo plano si hay ruta válida
      if (fullCollectionPath) {
        setSaving(true);
        try {
          const colRef = collection(db, fullCollectionPath);
          const docRef = await addDoc(colRef, {
            type,
            half: targetHalf,
            minute: currentMinute || 1,
            timestamp: serverTimestamp(),
          });
          return docRef?.id || newId;
        } catch (err) {
          console.error('[useLiveStats] Error guardando evento en Firestore:', err);
          return newId;
        } finally {
          setSaving(false);
        }
      }

      return newId;
    },
    [fullCollectionPath, currentMinute, currentHalf]
  );

  // ── Reiniciar todos los eventos del partido (Reset a 0) ───────────────────
  const resetLiveStats = useCallback(async () => {
    setEvents([]);
    if (fullCollectionPath) {
      setSaving(true);
      try {
        const colRef = collection(db, fullCollectionPath);
        const snap = await getDocs(colRef);
        if (snap && snap.docs && snap.docs.length > 0) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      } catch (err) {
        console.error('[useLiveStats] Error reseteando eventos:', err);
      } finally {
        setSaving(false);
      }
    }
  }, [fullCollectionPath]);

  // ── Conteo por tipo ───────────────────────────────────────────────────────
  const countByType = useCallback(
    (type) => events.filter((e) => e.type === type).length,
    [events]
  );

  return { events, loading, saving, addLiveEvent, resetLiveStats, countByType };
};
