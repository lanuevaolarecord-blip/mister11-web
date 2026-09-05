import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const MAX_COGNITIVE_MINUTES_PER_DAY = 15;
export const MAX_CHALLENGES_MINUTES_PER_DAY = 20;
export const MAX_ATTEMPTS_PER_CHALLENGE = 2;

export const getTodayDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useGameLimits = (teamPath, playerId) => {
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const todayKey = getTodayDateKey();
  const storageKey = `m11_cog_limits_${playerId || 'local'}`;

  // Cargar estado inicial desde localStorage (offline-first instantáneo)
  const getInitialLimits = () => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === todayKey) {
          return {
            date: todayKey,
            cognitiveMinutesToday: Number(parsed.cognitiveMinutesToday) || 0,
            challengesMinutesToday: Number(parsed.challengesMinutesToday) || 0,
            challengesAttemptsToday: parsed.challengesAttemptsToday || {},
            challengesCompletedToday: parsed.challengesCompletedToday || {},
            // Retrocompatibilidad:
            minutesToday: (Number(parsed.cognitiveMinutesToday) || 0) + (Number(parsed.challengesMinutesToday) || 0),
            sessionsToday: Number(parsed.sessionsToday) || 0
          };
        }
      }
    } catch (e) {
      console.warn('[useGameLimits] Error leyendo caché local:', e);
    }
    return {
      date: todayKey,
      cognitiveMinutesToday: 0,
      challengesMinutesToday: 0,
      challengesAttemptsToday: {},
      challengesCompletedToday: {},
      minutesToday: 0,
      sessionsToday: 0
    };
  };

  const [limits, setLimits] = useState(getInitialLimits);
  const [loading, setLoading] = useState(true);

  // Escuchar documento del jugador en Firestore
  useEffect(() => {
    if (!cleanPath || !playerId) {
      setLoading(false);
      return;
    }

    const playerRef = doc(db, `${cleanPath}/players`, playerId);
    const unsub = onSnapshot(playerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const firestoreLimits = data?.cognitive?.limits;
        if (firestoreLimits && firestoreLimits.date === todayKey) {
          setLimits((prev) => {
            const cogMin = Math.max(prev.cognitiveMinutesToday, Number(firestoreLimits.cognitiveMinutesToday ?? firestoreLimits.minutesToday) || 0);
            const chalMin = Math.max(prev.challengesMinutesToday, Number(firestoreLimits.challengesMinutesToday) || 0);
            
            const mergedAttempts = {
              ...(prev.challengesAttemptsToday || {}),
              ...(firestoreLimits.challengesAttemptsToday || {})
            };
            const mergedCompleted = {
              ...(prev.challengesCompletedToday || {}),
              ...(firestoreLimits.challengesCompletedToday || {})
            };

            const merged = {
              date: todayKey,
              cognitiveMinutesToday: cogMin,
              challengesMinutesToday: chalMin,
              challengesAttemptsToday: mergedAttempts,
              challengesCompletedToday: mergedCompleted,
              minutesToday: cogMin + chalMin,
              sessionsToday: (Number(prev.sessionsToday) || 0) + 1
            };

            try {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            } catch (_e) {}
            return merged;
          });
        }
      }
      setLoading(false);
    }, (err) => {
      console.warn('[useGameLimits] Error en listener de Firestore, usando local:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [cleanPath, playerId, todayKey, storageKey]);

  // Si el día cambió en el cliente mientras la app seguía abierta, resetear
  const activeLimits = useMemo(() => {
    if (limits.date !== todayKey) {
      return {
        date: todayKey,
        cognitiveMinutesToday: 0,
        challengesMinutesToday: 0,
        challengesAttemptsToday: {},
        challengesCompletedToday: {},
        minutesToday: 0,
        sessionsToday: 0
      };
    }
    return limits;
  }, [limits, todayKey]);

  // ─── VALIDACIONES COGNITIVAS (Juegos: 15 min max) ──────────────────────────
  const canPlayCognitive = useMemo(() => {
    return activeLimits.cognitiveMinutesToday < MAX_COGNITIVE_MINUTES_PER_DAY;
  }, [activeLimits.cognitiveMinutesToday]);

  const remainingCognitiveMinutes = Math.max(
    0,
    MAX_COGNITIVE_MINUTES_PER_DAY - activeLimits.cognitiveMinutesToday
  );

  // ─── VALIDACIONES RETOS EN CASA (20 min max y 2 intentos por reto) ─────────
  const remainingChallengeMinutes = Math.max(
    0,
    MAX_CHALLENGES_MINUTES_PER_DAY - activeLimits.challengesMinutesToday
  );

  const getChallengeAttempts = useCallback((retoId) => {
    return activeLimits.challengesAttemptsToday?.[retoId] || 0;
  }, [activeLimits.challengesAttemptsToday]);

  const canPlayChallenge = useCallback((retoId) => {
    if (remainingChallengeMinutes <= 0) {
      return { allowed: false, reason: 'time_limit' };
    }
    const attempts = activeLimits.challengesAttemptsToday?.[retoId] || 0;
    if (attempts >= MAX_ATTEMPTS_PER_CHALLENGE) {
      return { allowed: false, reason: 'attempts_limit' };
    }
    return { allowed: true, reason: 'ok' };
  }, [remainingChallengeMinutes, activeLimits.challengesAttemptsToday]);

  const isChallengeCompletedToday = useCallback((retoId) => {
    return Boolean(activeLimits.challengesCompletedToday?.[retoId]);
  }, [activeLimits.challengesCompletedToday]);

  // canPlay global para retrocompatibilidad
  const canPlay = canPlayCognitive || remainingChallengeMinutes > 0;

  // ─── REGISTRAR SESIÓN CON DURACIÓN REAL ────────────────────────────────────
  const registerSession = useCallback(async (durationSec = 60, isChallenge = false, challengeId = null, isSuccess = false) => {
    const minutesAdded = Math.max(1, Math.round(durationSec / 60));
    let updated;

    setLimits((prev) => {
      const base = prev.date === todayKey
        ? prev
        : {
            date: todayKey,
            cognitiveMinutesToday: 0,
            challengesMinutesToday: 0,
            challengesAttemptsToday: {},
            challengesCompletedToday: {},
            minutesToday: 0,
            sessionsToday: 0
          };

      const newCognitiveMin = isChallenge
        ? base.cognitiveMinutesToday
        : base.cognitiveMinutesToday + minutesAdded;

      const newChallengesMin = isChallenge
        ? base.challengesMinutesToday + minutesAdded
        : base.challengesMinutesToday;

      const newAttempts = { ...(base.challengesAttemptsToday || {}) };
      if (isChallenge && challengeId) {
        newAttempts[challengeId] = (newAttempts[challengeId] || 0) + 1;
      }

      const newCompleted = { ...(base.challengesCompletedToday || {}) };
      if (isChallenge && challengeId && isSuccess) {
        newCompleted[challengeId] = true;
      }

      updated = {
        date: todayKey,
        cognitiveMinutesToday: newCognitiveMin,
        challengesMinutesToday: newChallengesMin,
        challengesAttemptsToday: newAttempts,
        challengesCompletedToday: newCompleted,
        minutesToday: newCognitiveMin + newChallengesMin,
        sessionsToday: (base.sessionsToday || 0) + 1
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    if (cleanPath && playerId && updated) {
      try {
        const playerRef = doc(db, `${cleanPath}/players`, playerId);
        await updateDoc(playerRef, {
          'cognitive.limits': updated
        });
      } catch (err) {
        console.warn('[useGameLimits] Error guardando límites en Firestore:', err);
      }
    }

    return updated;
  }, [cleanPath, playerId, todayKey, storageKey]);

  return {
    limits: activeLimits,
    canPlay,
    canPlayCognitive,
    remainingCognitiveMinutes,
    maxCognitiveMinutes: MAX_COGNITIVE_MINUTES_PER_DAY,
    remainingChallengeMinutes,
    maxChallengeMinutes: MAX_CHALLENGES_MINUTES_PER_DAY,
    maxAttemptsPerChallenge: MAX_ATTEMPTS_PER_CHALLENGE,
    canPlayChallenge,
    getChallengeAttempts,
    isChallengeCompletedToday,
    registerSession,
    // Retrocompatibilidad:
    remainingMinutes: remainingCognitiveMinutes,
    maxMinutes: MAX_COGNITIVE_MINUTES_PER_DAY,
    remainingSessions: 99,
    maxSessions: 99,
    loading
  };
};

export default useGameLimits;
