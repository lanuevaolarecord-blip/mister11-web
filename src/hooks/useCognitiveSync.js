import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const getWeekKey = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
};

export const useCognitiveSync = (teamPath, playerId) => {
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const queueKey = `m11_cog_sync_queue_${playerId || 'local'}`;
  const bestKey = `m11_cog_best_${playerId || 'local'}`;

  const [bestScores, setBestScores] = useState(() => {
    try {
      const cached = localStorage.getItem(bestKey);
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  // Cargar mejores marcas desde Firestore al iniciar
  useEffect(() => {
    if (!cleanPath || !playerId) return;
    const fetchPlayer = async () => {
      try {
        const pRef = doc(db, `${cleanPath}/players`, playerId);
        const snap = await getDoc(pRef);
        if (snap.exists()) {
          const cog = snap.data()?.cognitive;
          if (cog?.best) {
            setBestScores(prev => {
              const merged = { ...prev, ...cog.best };
              try { localStorage.setItem(bestKey, JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('[useCognitiveSync] Error cargando cognitive:', err);
      }
    };
    fetchPlayer();
  }, [cleanPath, playerId, bestKey]);

  // Sincronizar cola offline cuando vuelva la conexión
  const drainOfflineQueue = useCallback(async () => {
    if (!cleanPath || !playerId || !navigator.onLine) return;
    try {
      const raw = localStorage.getItem(queueKey);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining = [];
      for (const item of queue) {
        try {
          const sessionRef = doc(db, `${cleanPath}/players/${playerId}/cognitive`, item.sessionId);
          await setDoc(sessionRef, {
            ...item,
            syncedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          remaining.push(item);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem(queueKey);
      } else {
        localStorage.setItem(queueKey, JSON.stringify(remaining));
      }
    } catch (err) {
      console.warn('[useCognitiveSync] Error procesando cola offline:', err);
    }
  }, [cleanPath, playerId, queueKey]);

  useEffect(() => {
    window.addEventListener('online', drainOfflineQueue);
    drainOfflineQueue();
    return () => window.removeEventListener('online', drainOfflineQueue);
  }, [drainOfflineQueue]);

  /**
   * Registra una sesión completada
   * @param {Object} sessionData
   * @param {boolean} higherBetter - Indica si una puntuación más alta es mejor (ej: precisión vs tiempo reacción)
   */
  const saveSession = useCallback(async (sessionData, higherBetter = true) => {
    const {
      gameId,
      mode = 'cognitive',
      durationSec = 60,
      sets = [],
      score = 0,
      reactionMs = null,
      accuracy = null,
      allSetsCompleted = false
    } = sessionData;

    const sessionId = `cog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const currentBest = bestScores[gameId];
    let isPersonalBest = false;

    const evaluatedVal = reactionMs !== null ? reactionMs : (accuracy !== null ? accuracy : score);
    if (evaluatedVal !== null && evaluatedVal !== undefined && !isNaN(evaluatedVal)) {
      if (currentBest === undefined || currentBest === null) {
        isPersonalBest = true;
      } else if (higherBetter ? evaluatedVal > currentBest : evaluatedVal < currentBest) {
        isPersonalBest = true;
      }
    }

    // Regla D4: XP por esfuerzo
    // +10 sesión completada
    // +5 récord personal
    // +5 si reto conseguido (mode === 'challenge' o sets con éxito)
    // +5 si pleno 3/3 sets completados con éxito
    let xpEarned = 10;
    if (isPersonalBest) xpEarned += 5;
    if (mode === 'challenge' && score > 0) xpEarned += 5;
    if (allSetsCompleted) xpEarned += 5;

    const newBestMap = isPersonalBest
      ? { ...bestScores, [gameId]: evaluatedVal }
      : bestScores;

    if (isPersonalBest) {
      setBestScores(newBestMap);
      try { localStorage.setItem(bestKey, JSON.stringify(newBestMap)); } catch (e) {}
    }

    const payload = {
      sessionId,
      gameId,
      mode,
      startedAt: sessionData.startedAt || new Date(Date.now() - durationSec * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec,
      completed: true,
      sets,
      score: evaluatedVal,
      reactionMs,
      accuracy,
      xpEarned,
      isPersonalBest,
      weekKey: getWeekKey()
    };

    // Si no hay red o falla, encolar en localStorage para sync posterior
    const enqueueLocally = () => {
      try {
        const raw = localStorage.getItem(queueKey);
        const queue = raw ? JSON.parse(raw) : [];
        queue.push(payload);
        localStorage.setItem(queueKey, JSON.stringify(queue));
      } catch (e) {}
    };

    if (!navigator.onLine || !cleanPath || !playerId) {
      enqueueLocally();
      return { sessionId, xpEarned, isPersonalBest };
    }

    try {
      const sessionRef = doc(db, `${cleanPath}/players/${playerId}/cognitive`, sessionId);
      await setDoc(sessionRef, {
        ...payload,
        createdAt: serverTimestamp()
      });

      // Actualizar documento de jugador (best, weekly)
      const pRef = doc(db, `${cleanPath}/players`, playerId);
      const updateData = {};
      if (isPersonalBest) {
        updateData[`cognitive.best.${gameId}`] = evaluatedVal;
      }
      // Actualizar semana
      const currentWeekKey = getWeekKey();
      updateData[`cognitive.weekly.weekKey`] = currentWeekKey;

      await updateDoc(pRef, updateData).catch(err => {
        console.warn('[useCognitiveSync] Non-blocking updateDoc warning:', err);
      });
    } catch (err) {
      console.warn('[useCognitiveSync] Fallback a cola offline por error de red:', err);
      enqueueLocally();
    }

    return { sessionId, xpEarned, isPersonalBest };
  }, [cleanPath, playerId, bestScores, bestKey, queueKey]);

  return {
    bestScores,
    saveSession,
    drainOfflineQueue
  };
};

export default useCognitiveSync;
