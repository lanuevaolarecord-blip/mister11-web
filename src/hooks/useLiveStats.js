/**
 * useLiveStats.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook de Firestore para el módulo Live Stats de Míster 11.
 * Usa firestore-proxy para garantizar compatibilidad con modo invitado / proxy.
 *
 * ESQUEMA DE DATOS:
 *   matches/{matchId}/liveStats/{eventId}
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
 * @param {string|null} matchId  - ID del partido activo en Firestore
 * @param {number}      currentMinute - Minuto actual del cronómetro
 * @param {1|2}         currentHalf   - Mitad actual del partido
 */
export const useLiveStats = (matchId, currentMinute, currentHalf = 1) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Escuchar eventos en tiempo real con onSnapshot ──────────────────────
  useEffect(() => {
    if (!matchId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'matches', matchId, 'liveStats');

    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[useLiveStats] Error leyendo eventos:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [matchId]);

  // ── Añadir un evento (addDoc con ID autogenerado) ────────────────────────
  const addLiveEvent = useCallback(
    async (type) => {
      if (!matchId) {
        console.warn('[useLiveStats] No hay matchId activo');
        return null;
      }
      setSaving(true);
      try {
        const colRef = collection(db, 'matches', matchId, 'liveStats');
        const docRef = await addDoc(colRef, {
          type,
          half: currentHalf,
          minute: currentMinute || 1,
          timestamp: serverTimestamp(),
        });
        return docRef.id;
      } catch (err) {
        console.error('[useLiveStats] Error guardando evento:', err);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [matchId, currentMinute, currentHalf]
  );

  // ── Conteo por tipo para el badge de cada botón ──────────────────────────
  const countByType = useCallback(
    (type) => events.filter((e) => e.type === type).length,
    [events]
  );

  return { events, loading, saving, addLiveEvent, countByType };
};
