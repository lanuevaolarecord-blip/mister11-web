import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const MAX_COGNITIVE_MINUTES_PER_DAY = 15;
export const MAX_CHALLENGES_MINUTES_PER_DAY = 20;
export const MAX_COGNITIVE_SECONDS_PER_DAY = MAX_COGNITIVE_MINUTES_PER_DAY * 60; // 900s
export const MAX_CHALLENGES_SECONDS_PER_DAY = MAX_CHALLENGES_MINUTES_PER_DAY * 60; // 1200s
export const MAX_ATTEMPTS_PER_CHALLENGE = 2;

export const getTodayDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatea segundos a string 'm:ss' o 'mm:ss'
 * @param {number} totalSec
 * @param {boolean} padMinutes
 * @returns {string} e.g. "6:42" o "15:00"
 */
export const formatTime = (totalSec, padMinutes = false) => {
  const s = Math.max(0, Math.floor(Number(totalSec) || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const minStr = padMinutes ? String(mins).padStart(2, '0') : String(mins);
  const secStr = String(secs).padStart(2, '0');
  return `${minStr}:${secStr}`;
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
          const secGames = Number(parsed.secGames ?? (parsed.cognitiveMinutesToday ? parsed.cognitiveMinutesToday * 60 : 0)) || 0;
          const secRetos = Number(parsed.secRetos ?? (parsed.challengesMinutesToday ? parsed.challengesMinutesToday * 60 : 0)) || 0;
          const sesGames = Number(parsed.sesGames ?? parsed.sessionsToday ?? 0) || 0;
          const sesRetos = Number(parsed.sesRetos ?? 0) || 0;

          return {
            date: todayKey,
            secGames,
            secRetos,
            sesGames,
            sesRetos,
            challengesAttemptsToday: parsed.challengesAttemptsToday || {},
            challengesCompletedToday: parsed.challengesCompletedToday || {},
            // Retrocompatibilidad
            cognitiveMinutesToday: Math.floor(secGames / 60),
            challengesMinutesToday: Math.floor(secRetos / 60),
            minutesToday: Math.floor((secGames + secRetos) / 60),
            sessionsToday: sesGames + sesRetos
          };
        }
      }
    } catch (e) {
      console.warn('[useGameLimits] Error leyendo caché local:', e);
    }
    return {
      date: todayKey,
      secGames: 0,
      secRetos: 0,
      sesGames: 0,
      sesRetos: 0,
      challengesAttemptsToday: {},
      challengesCompletedToday: {},
      cognitiveMinutesToday: 0,
      challengesMinutesToday: 0,
      minutesToday: 0,
      sessionsToday: 0
    };
  };

  const [limits, setLimits] = useState(getInitialLimits);
  const [loading, setLoading] = useState(true);

  // Escuchar documento del jugador en Firestore con onSnapshot (actualización al segundo)
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
            const rawSecGames = Number(
              firestoreLimits.secGames ?? 
              (firestoreLimits.cognitiveMinutesToday ? firestoreLimits.cognitiveMinutesToday * 60 : 0)
            ) || 0;
            const rawSecRetos = Number(
              firestoreLimits.secRetos ?? 
              (firestoreLimits.challengesMinutesToday ? firestoreLimits.challengesMinutesToday * 60 : 0)
            ) || 0;

            // Mantener el máximo entre Firestore y local para no perder segundos recién acumulados
            const secGames = Math.max(prev.secGames || 0, rawSecGames);
            const secRetos = Math.max(prev.secRetos || 0, rawSecRetos);
            const sesGames = Math.max(prev.sesGames || 0, Number(firestoreLimits.sesGames) || 0);
            const sesRetos = Math.max(prev.sesRetos || 0, Number(firestoreLimits.sesRetos) || 0);

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
              secGames,
              secRetos,
              sesGames,
              sesRetos,
              challengesAttemptsToday: mergedAttempts,
              challengesCompletedToday: mergedCompleted,
              cognitiveMinutesToday: Math.floor(secGames / 60),
              challengesMinutesToday: Math.floor(secRetos / 60),
              minutesToday: Math.floor((secGames + secRetos) / 60),
              sessionsToday: sesGames + sesRetos
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
        secGames: 0,
        secRetos: 0,
        sesGames: 0,
        sesRetos: 0,
        challengesAttemptsToday: {},
        challengesCompletedToday: {},
        cognitiveMinutesToday: 0,
        challengesMinutesToday: 0,
        minutesToday: 0,
        sessionsToday: 0
      };
    }
    return limits;
  }, [limits, todayKey]);

  // ─── VALIDACIONES COGNITIVAS (Juegos: 900s / 15 min max) ───────────────────
  const canPlayCognitive = useMemo(() => {
    return activeLimits.secGames < MAX_COGNITIVE_SECONDS_PER_DAY;
  }, [activeLimits.secGames]);

  const remainingCognitiveSeconds = Math.max(
    0,
    MAX_COGNITIVE_SECONDS_PER_DAY - activeLimits.secGames
  );
  const remainingCognitiveMinutes = Math.max(
    0,
    MAX_COGNITIVE_MINUTES_PER_DAY - Math.floor(activeLimits.secGames / 60)
  );

  // ─── VALIDACIONES RETOS EN CASA (1200s / 20 min max y 2 intentos por reto) ──
  const remainingChallengeSeconds = Math.max(
    0,
    MAX_CHALLENGES_SECONDS_PER_DAY - activeLimits.secRetos
  );
  const remainingChallengeMinutes = Math.max(
    0,
    MAX_CHALLENGES_MINUTES_PER_DAY - Math.floor(activeLimits.secRetos / 60)
  );

  const getChallengeAttempts = useCallback((retoId) => {
    return activeLimits.challengesAttemptsToday?.[retoId] || 0;
  }, [activeLimits.challengesAttemptsToday]);

  const canPlayChallenge = useCallback((retoId) => {
    if (remainingChallengeSeconds <= 0) {
      return { allowed: false, reason: 'time_limit' };
    }
    const attempts = activeLimits.challengesAttemptsToday?.[retoId] || 0;
    if (attempts >= MAX_ATTEMPTS_PER_CHALLENGE) {
      return { allowed: false, reason: 'attempts_limit' };
    }
    return { allowed: true, reason: 'ok' };
  }, [remainingChallengeSeconds, activeLimits.challengesAttemptsToday]);

  const isChallengeCompletedToday = useCallback((retoId) => {
    return Boolean(activeLimits.challengesCompletedToday?.[retoId]);
  }, [activeLimits.challengesCompletedToday]);

  // canPlay global
  const canPlay = canPlayCognitive || remainingChallengeSeconds > 0;

  // ─── REGISTRAR INICIO DE SESIÓN REAL (INCREMENTA EXACTAMENTE UNA VEZ) ────────
  const startSession = useCallback(async (category = 'cognitive') => {
    const isChallenge = category === 'retos' || category === 'challenge';
    const fieldSes = isChallenge ? 'sesRetos' : 'sesGames';

    let updated;
    setLimits((prev) => {
      const base = prev.date === todayKey ? prev : {
        date: todayKey,
        secGames: 0,
        secRetos: 0,
        sesGames: 0,
        sesRetos: 0,
        challengesAttemptsToday: {},
        challengesCompletedToday: {},
        cognitiveMinutesToday: 0,
        challengesMinutesToday: 0,
        minutesToday: 0,
        sessionsToday: 0
      };

      updated = {
        ...base,
        [fieldSes]: (base[fieldSes] || 0) + 1,
        sessionsToday: (base.sessionsToday || 0) + 1
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    if (cleanPath && playerId) {
      try {
        const playerRef = doc(db, `${cleanPath}/players`, playerId);
        await updateDoc(playerRef, {
          'cognitive.limits.date': todayKey,
          [`cognitive.limits.${fieldSes}`]: increment(1),
          'cognitive.limits.sessionsToday': increment(1)
        });
      } catch (err) {
        console.warn('[useGameLimits] Error incrementando sesión en Firestore:', err);
      }
    }
  }, [cleanPath, playerId, todayKey, storageKey]);

  // ─── DESCARGA ATÓMICA DE SEGUNDOS REALES (FLUSH CADA 10S / UNMOUNT / SET) ───
  const recordTimeDelta = useCallback(async (deltaSec, category = 'cognitive') => {
    const delta = Math.max(0, Math.round(Number(deltaSec) || 0));
    if (delta <= 0) return;

    const isChallenge = category === 'retos' || category === 'challenge';
    const fieldSec = isChallenge ? 'secRetos' : 'secGames';
    const fieldMin = isChallenge ? 'challengesMinutesToday' : 'cognitiveMinutesToday';

    let updated;
    setLimits((prev) => {
      const base = prev.date === todayKey ? prev : {
        date: todayKey,
        secGames: 0,
        secRetos: 0,
        sesGames: 0,
        sesRetos: 0,
        challengesAttemptsToday: {},
        challengesCompletedToday: {},
        cognitiveMinutesToday: 0,
        challengesMinutesToday: 0,
        minutesToday: 0,
        sessionsToday: 0
      };

      const newSec = (base[fieldSec] || 0) + delta;
      updated = {
        ...base,
        [fieldSec]: newSec,
        [fieldMin]: Math.floor(newSec / 60),
        minutesToday: Math.floor(((isChallenge ? base.secGames : newSec) + (isChallenge ? newSec : base.secRetos)) / 60)
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    if (cleanPath && playerId) {
      try {
        const playerRef = doc(db, `${cleanPath}/players`, playerId);
        await updateDoc(playerRef, {
          'cognitive.limits.date': todayKey,
          [`cognitive.limits.${fieldSec}`]: increment(delta),
          [`cognitive.limits.${fieldMin}`]: Math.floor((updated?.[fieldSec] || 0) / 60),
          'cognitive.limits.minutesToday': updated?.minutesToday || 0
        });
      } catch (err) {
        console.warn('[useGameLimits] Error sincronizando delta de tiempo en Firestore:', err);
      }
    }

    return updated;
  }, [cleanPath, playerId, todayKey, storageKey]);

  // ─── REGISTRAR INTENTO O COMPLETADO DE RETO ─────────────────────────────────
  const recordChallengeAttempt = useCallback(async (challengeId, isSuccess = false) => {
    if (!challengeId) return;

    let updated;
    setLimits((prev) => {
      const base = prev.date === todayKey ? prev : {
        date: todayKey,
        secGames: 0,
        secRetos: 0,
        sesGames: 0,
        sesRetos: 0,
        challengesAttemptsToday: {},
        challengesCompletedToday: {},
        cognitiveMinutesToday: 0,
        challengesMinutesToday: 0,
        minutesToday: 0,
        sessionsToday: 0
      };

      const attempts = { ...(base.challengesAttemptsToday || {}) };
      attempts[challengeId] = (attempts[challengeId] || 0) + 1;

      const completed = { ...(base.challengesCompletedToday || {}) };
      if (isSuccess) {
        completed[challengeId] = true;
      }

      updated = {
        ...base,
        challengesAttemptsToday: attempts,
        challengesCompletedToday: completed
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    if (cleanPath && playerId) {
      try {
        const playerRef = doc(db, `${cleanPath}/players`, playerId);
        const updates = {
          'cognitive.limits.date': todayKey,
          [`cognitive.limits.challengesAttemptsToday.${challengeId}`]: increment(1)
        };
        if (isSuccess) {
          updates[`cognitive.limits.challengesCompletedToday.${challengeId}`] = true;
        }
        await updateDoc(playerRef, updates);
      } catch (err) {
        console.warn('[useGameLimits] Error registrando intento de reto en Firestore:', err);
      }
    }

    return updated;
  }, [cleanPath, playerId, todayKey, storageKey]);

  // Retrocompatibilidad con registerSession (ahora usa segundos reales y options)
  const registerSession = useCallback(async (durationSec = 60, options = {}) => {
    const isChallenge = Boolean(options.isChallenge || options.challengeId);
    const challengeId = options.challengeId || null;
    const isSuccess = Boolean(options.isSuccess || options.completed);

    if (isChallenge && challengeId) {
      await recordChallengeAttempt(challengeId, isSuccess);
    }
    return activeLimits;
  }, [activeLimits, recordChallengeAttempt]);

  return {
    limits: activeLimits,
    canPlay,
    canPlayCognitive,
    remainingCognitiveSeconds,
    remainingCognitiveMinutes,
    maxCognitiveSeconds: MAX_COGNITIVE_SECONDS_PER_DAY,
    maxCognitiveMinutes: MAX_COGNITIVE_MINUTES_PER_DAY,
    remainingChallengeSeconds,
    remainingChallengeMinutes,
    maxChallengeSeconds: MAX_CHALLENGES_SECONDS_PER_DAY,
    maxChallengeMinutes: MAX_CHALLENGES_MINUTES_PER_DAY,
    maxAttemptsPerChallenge: MAX_ATTEMPTS_PER_CHALLENGE,
    canPlayChallenge,
    getChallengeAttempts,
    isChallengeCompletedToday,
    startSession,
    recordTimeDelta,
    recordChallengeAttempt,
    registerSession,
    formatTime,
    // Retrocompatibilidad
    remainingMinutes: remainingCognitiveMinutes,
    maxMinutes: MAX_COGNITIVE_MINUTES_PER_DAY,
    remainingSessions: 99,
    maxSessions: 99,
    loading
  };
};

export default useGameLimits;
