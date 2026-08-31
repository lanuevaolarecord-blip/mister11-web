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
  'card_yellow_own',
  'card_red_own',
  'card_yellow_rival',
  'card_red_rival',
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

  const cacheKey = matchId ? `mister11_livestats_${matchId}` : null;

  // Inicializar estado local desde localStorage para respuesta instantánea (0ms)
  const [events, setEvents] = useState(() => {
    if (cacheKey) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) return JSON.parse(stored);
      } catch (_) { }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const teamPath = teamId ? getTeamPath(teamId) : (user ? getTeamPath() : null);
  const fullCollectionPath = (teamPath && matchId) ? `${teamPath}/matches/${matchId}/liveStats` : null;

  // ── Escuchar eventos en tiempo real con onSnapshot ────────────────────────
  useEffect(() => {
    if (!matchId) {
      setEvents([]);
      return;
    }

    // Cargar caché local de forma síncrona si existe
    if (cacheKey) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) setEvents(parsed);
        }
      } catch (_) { }
    }

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
          if (cacheKey) {
            try { localStorage.setItem(cacheKey, JSON.stringify(docs)); } catch (_) { }
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useLiveStats] Error leyendo eventos en', fullCollectionPath, err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fullCollectionPath, matchId, cacheKey]);

  // ── Añadir un evento (Incremento inmediato optimista + Persistencia) ──────
  const addLiveEvent = useCallback(
    async (type, explicitHalf = null, extraData = {}) => {
      const targetHalf = explicitHalf !== null && explicitHalf !== undefined ? explicitHalf : currentHalf;
      const newId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      
      // Limpiar campos undefined para evitar rechazos de Firestore
      const cleanExtra = {};
      if (extraData && typeof extraData === 'object') {
        Object.entries(extraData).forEach(([k, v]) => {
          if (v !== undefined) cleanExtra[k] = v;
        });
      }

      const localDoc = {
        id: newId,
        type,
        half: targetHalf,
        minute: currentMinute || 1,
        ...cleanExtra,
        timestamp: new Date().toISOString(),
      };

      // 1. Incremento optimista inmediato en el estado local y localStorage (0 ms latencia)
      setEvents((prev) => {
        const next = [...prev, localDoc];
        if (cacheKey) {
          try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch (_) { }
        }
        return next;
      });

      // 2. Persistencia en Firestore en segundo plano si hay ruta válida
      if (fullCollectionPath) {
        setSaving(true);
        try {
          const colRef = collection(db, fullCollectionPath);
          const docRef = await addDoc(colRef, {
            type,
            half: targetHalf,
            minute: currentMinute || 1,
            ...cleanExtra,
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
    [fullCollectionPath, currentMinute, currentHalf, cacheKey]
  );

  // ── Reiniciar todos los eventos del partido (Reset a 0) ───────────────────
  const resetLiveStats = useCallback(async () => {
    setEvents([]);
    if (cacheKey) {
      try { localStorage.removeItem(cacheKey); } catch (_) { }
    }
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
  }, [fullCollectionPath, cacheKey]);

  // ── Conteo por tipo ───────────────────────────────────────────────────────
  const countByType = useCallback(
    (type) => events.filter((e) => e.type === type).length,
    [events]
  );

  return { events, loading, saving, addLiveEvent, resetLiveStats, countByType };
};
