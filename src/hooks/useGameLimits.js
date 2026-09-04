import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const MAX_SESSIONS_PER_DAY = 2;
const MAX_MINUTES_PER_DAY = 10;

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

  // Cargar estado inicial desde localStorage (garantiza respuesta offline instantánea)
  const getInitialLimits = () => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === todayKey) {
          return {
            date: todayKey,
            sessionsToday: Number(parsed.sessionsToday) || 0,
            minutesToday: Number(parsed.minutesToday) || 0
          };
        }
      }
    } catch (e) {
      console.warn('[useGameLimits] Error reading cache:', e);
    }
    return { date: todayKey, sessionsToday: 0, minutesToday: 0 };
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
            const merged = {
              date: todayKey,
              sessionsToday: Math.max(prev.sessionsToday, Number(firestoreLimits.sessionsToday) || 0),
              minutesToday: Math.max(prev.minutesToday, Number(firestoreLimits.minutesToday) || 0)
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
      console.warn('[useGameLimits] Firestore sync error, using local fallback:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [cleanPath, playerId, todayKey, storageKey]);

  const activeLimits = useMemo(() => {
    if (limits.date !== todayKey) {
      return { date: todayKey, sessionsToday: 0, minutesToday: 0 };
    }
    return limits;
  }, [limits, todayKey]);

  const canPlay = useMemo(() => {
    return activeLimits.sessionsToday < MAX_SESSIONS_PER_DAY && activeLimits.minutesToday < MAX_MINUTES_PER_DAY;
  }, [activeLimits.sessionsToday, activeLimits.minutesToday]);

  const remainingSessions = Math.max(0, MAX_SESSIONS_PER_DAY - activeLimits.sessionsToday);
  const remainingMinutes = Math.max(0, MAX_MINUTES_PER_DAY - activeLimits.minutesToday);

  const registerSession = useCallback(async (durationSec = 60) => {
    const minutesAdded = Math.max(1, Math.round(durationSec / 60));
    let updated;
    setLimits((prev) => {
      const base = prev.date === todayKey ? prev : { date: todayKey, sessionsToday: 0, minutesToday: 0 };
      updated = {
        date: todayKey,
        sessionsToday: base.sessionsToday + 1,
        minutesToday: base.minutesToday + minutesAdded
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
    remainingSessions,
    remainingMinutes,
    maxSessions: MAX_SESSIONS_PER_DAY,
    maxMinutes: MAX_MINUTES_PER_DAY,
    registerSession,
    loading
  };
};

export default useGameLimits;
