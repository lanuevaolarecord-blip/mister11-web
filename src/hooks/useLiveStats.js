/**
 * useLiveStats.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook de Firestore para el módulo Live Stats de Míster 11.
 *
 * ESQUEMA DE DATOS:
 *   matches/{matchId}/liveStats/{eventId}
 *   {
 *     type: string,          // Tipo de evento (ver EVENT_TYPES abajo)
 *     half: 1 | 2,           // Mitad del partido
 *     minute: number,        // Minuto en que ocurrió el evento
 *     timestamp: serverTimestamp()
 *   }
 *
 * TIPOS DE EVENTO:
 *   - shot_on_target_own     → Tiro a puerta del equipo propio
 *   - shot_on_target_rival   → Tiro a puerta del rival
 *   - shot_off_target_own    → Tiro fuera del equipo propio
 *   - shot_off_target_rival  → Tiro fuera del rival
 *   - card_own               → Tarjeta del equipo propio
 *   - card_rival             → Tarjeta del rival
 *   - foul_favor             → Falta a favor del equipo propio
 *   - foul_against           → Falta en contra del equipo propio
 *   - duel_won               → Duelo ganado
 *   - duel_lost              → Duelo perdido
 *   - player_no_finish       → Jugador no finaliza: ocasión clara sin remate
 *   - counter_not_cut        → Contra no cortada: contraataque rival que llegó a zona de peligro
 *   - corner_favor           → Córner a favor
 *   - corner_against         → Córner en contra
 *   - offside_own            → Fuera de juego del equipo propio
 *   - offside_rival          → Fuera de juego del rival
 *   - recovery               → Recuperación de balón
 *   - loss                   → Pérdida de balón
 *
 * CONCURRENCIA:
 *   Cada evento se guarda como documento independiente (addDoc) con ID
 *   auto-generado por Firestore. Varios analistas/pestañas pueden escribir
 *   simultáneamente sin riesgo de sobrescritura, porque cada addDoc genera
 *   un nuevo documento en lugar de actualizar uno existente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

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

  // ── Escuchar eventos en tiempo real ──────────────────────────────────────
  useEffect(() => {
    if (!matchId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'matches', matchId, 'liveStats');
    const q = query(colRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
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

  // ── Añadir un evento ─────────────────────────────────────────────────────
  /**
   * Escribe un documento nuevo en matches/{matchId}/liveStats/.
   * El ID es auto-generado por Firestore (addDoc), por lo que múltiples
   * analistas pueden escribir simultáneamente sin conflictos.
   *
   * @param {string} type - Tipo de evento (ver EVENT_TYPES)
   * @returns {string|null} ID del documento creado, o null si falla
   */
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
          minute: currentMinute,
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

  // ── Conteo por tipo (para mostrar el contador en cada botón) ─────────────
  const countByType = useCallback(
    (type) => events.filter((e) => e.type === type).length,
    [events]
  );

  return { events, loading, saving, addLiveEvent, countByType };
};
