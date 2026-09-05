import { useState, useEffect, useCallback } from 'react';
import { doc, writeBatch, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const getWeekKey = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  // Lunes como inicio de semana (ISO-8601)
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

  // Sincronizar cola offline atómicamente cuando vuelva la conexión
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
          const batch = writeBatch(db);
          const sessionRef = doc(db, `${cleanPath}/players/${playerId}/cognitive`, item.sessionId);
          batch.set(sessionRef, {
            ...item,
            syncedAt: serverTimestamp()
          }, { merge: true });

          const pRef = doc(db, `${cleanPath}/players`, playerId);
          const pUpdate = {
            'cognitive.weekly.weekKey': item.weekKey || getWeekKey(),
            'cognitive.weekly.points': increment(item.xpEarned || 0),
            'cognitive.totalXp': increment(item.xpEarned || 0),
            'xp': increment(item.xpEarned || 0)
          };
          if (item.isPersonalBest && item.score !== undefined) {
            pUpdate[`cognitive.best.${item.gameId}`] = item.score;
          }
          if (item.limitsUpdate) {
            pUpdate['cognitive.limits'] = item.limitsUpdate;
          }
          batch.update(pRef, pUpdate);

          await batch.commit();
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
   * Registra una sesión completada de forma 100% ATÓMICA con writeBatch.
   * Actualiza doc de sesión + weekly.points + cognitive.totalXp + limits + xp del jugador.
   * @param {Object} sessionData
   * @param {boolean} higherBetter
   * @param {Object} limitsUpdate
   */
  const saveSession = useCallback(async (sessionData, higherBetter = true, limitsUpdate = null) => {
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

    // Regla D4: XP por esfuerzo pedagógico y superación
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

    const currentWeekKey = getWeekKey();
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
      weekKey: currentWeekKey,
      limitsUpdate: limitsUpdate || null
    };

    // Respaldo inmediato en cola local para garantía offline
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
      // ─── ESCRITURA ATÓMICA ÚNICA (writeBatch) ─────────────────────────────
      const batch = writeBatch(db);

      // 1. Doc de sesión individual en cognitive/{sessionId}
      const sessionRef = doc(db, `${cleanPath}/players/${playerId}/cognitive`, sessionId);
      batch.set(sessionRef, {
        ...payload,
        createdAt: serverTimestamp()
      });

      // 2. Doc del jugador: actualiza weekly.points, totalXp, xp general, límites y best
      const pRef = doc(db, `${cleanPath}/players`, playerId);
      const playerUpdates = {
        'cognitive.weekly.weekKey': currentWeekKey,
        'cognitive.weekly.points': increment(xpEarned),
        'cognitive.totalXp': increment(xpEarned),
        'xp': increment(xpEarned)
      };

      if (isPersonalBest) {
        playerUpdates[`cognitive.best.${gameId}`] = evaluatedVal;
      }

      if (limitsUpdate) {
        playerUpdates['cognitive.limits'] = limitsUpdate;
      }

      if (sessionData.improvementPct !== undefined && sessionData.improvementPct !== null) {
        playerUpdates['cognitive.weekly.improvement'] = Number(sessionData.improvementPct) || 0;
      }

      batch.update(pRef, playerUpdates);

      // Confirmar en un solo paquete de red atómico
      await batch.commit();
      console.log(`[useCognitiveSync] ✅ Sesión guardada y ranking actualizado atómicamente (+${xpEarned} pts)`);
    } catch (err) {
      console.warn('[useCognitiveSync] Error en batch atómico, respaldando en cola offline:', err);
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
