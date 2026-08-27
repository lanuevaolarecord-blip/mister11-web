/**
 * MatchContext.jsx
 * Contexto global del partido en vivo para Míster 11.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * ARQUITECTURA:
 *  • El intervalo del cronómetro se ejecuta aquí, FUERA del componente Partidos,
 *    por lo que sigue corriendo aunque el usuario navegue a la Pizarra Táctica.
 *  • Se usa localStorage para guardar el instante real de inicio (startTimestamp),
 *    lo que hace el tiempo resiliente a recargas accidentales de página.
 *  • La clave de localStorage incluye el uid del usuario autenticado para aislar
 *    el estado entre diferentes usuarios en un dispositivo compartido.
 *  • Lógica de migración: si existe la clave global antigua ('mister11_active_match_state')
 *    sin uid, se migra al nuevo formato y se elimina la clave antigua.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';

// ── Clave de persistencia — incluye uid para aislamiento por usuario ──────────
const LEGACY_LS_KEY = 'mister11_active_match_state';
const getLsKey = (uid) => uid ? `mister11_match_${uid}` : LEGACY_LS_KEY;

// ── Helpers de formato ────────────────────────────────────────────────────────
export const formatMatchTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ── Estado inicial del partido ────────────────────────────────────────────────
const defaultMatchState = {
  matchId: null,         // ID del partido activo en Firestore
  matchSeconds: 0,       // Tiempo acumulado en segundos
  isRunning: false,      // ¿El cronómetro está corriendo?
  startTimestamp: null,  // Date.now() cuando se presionó INICIAR
  offsetSeconds: 0,      // Segundos acumulados antes del último inicio
};

// ── Leer estado desde localStorage con migración de clave antigua ─────────────
const readFromStorage = (uid) => {
  const key = getLsKey(uid);
  try {
    // Intentar leer con la clave específica del usuario
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultMatchState, ...parsed };
    }

    // Migración: si existe la clave global antigua, migrar y eliminarla
    if (uid) {
      const legacyRaw = localStorage.getItem(LEGACY_LS_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        // Solo migrar si había un partido activo guardado con la clave vieja
        if (legacyParsed?.matchId) {
          localStorage.setItem(key, legacyRaw);
          localStorage.removeItem(LEGACY_LS_KEY);
          return { ...defaultMatchState, ...legacyParsed };
        }
        // Sin matchId: limpiar la clave antigua sin migrar
        localStorage.removeItem(LEGACY_LS_KEY);
      }
    }

    return defaultMatchState;
  } catch {
    return defaultMatchState;
  }
};

// ── Recalcular matchSeconds desde el startTimestamp real ─────────────────────
const recalcSeconds = (state) => {
  if (!state.isRunning || !state.startTimestamp) {
    return state.offsetSeconds;
  }
  const elapsed = Math.floor((Date.now() - state.startTimestamp) / 1000);
  return state.offsetSeconds + elapsed;
};

// ── Contexto ──────────────────────────────────────────────────────────────────
const MatchContext = createContext(null);

export const MatchProvider = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid || null;

  // ── Inicializar desde localStorage (con clave aislada por uid) ──────────────
  const [persistedState, setPersistedState] = useState(() => {
    const stored = readFromStorage(uid);
    return {
      ...stored,
      matchSeconds: recalcSeconds(stored), // recalcular al montar por si hubo recarga
    };
  });

  const intervalRef = useRef(null);

  // ── Re-leer el estado cuando el usuario cambia (login / logout / switch) ────
  useEffect(() => {
    const stored = readFromStorage(uid);
    setPersistedState({
      ...stored,
      matchSeconds: recalcSeconds(stored),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // ── Persistir en localStorage cada vez que cambia el estado ────────────────
  useEffect(() => {
    const key = getLsKey(uid);
    const { matchSeconds: _ms, ...toStore } = persistedState; // no guardar matchSeconds (se recalcula)
    localStorage.setItem(key, JSON.stringify(toStore));
  }, [persistedState, uid]);

  // ── Arrancar / detener el intervalo según isRunning ─────────────────────────
  useEffect(() => {
    if (persistedState.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setPersistedState((prev) => ({
          ...prev,
          matchSeconds: recalcSeconds(prev),
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [persistedState.isRunning]);

  // ── API pública del contexto ────────────────────────────────────────────────

  /** Registra qué partido está activo (llamado por Partidos.jsx al abrir un partido) */
  const setActiveMatchId = useCallback((matchId) => {
    setPersistedState((prev) => {
      if (prev.matchId === matchId) return prev;
      return { ...defaultMatchState, matchId };
    });
  }, []);

  /** Sincroniza el estado del partido con Firestore (si está terminado, congela el reloj de inmediato) */
  const syncMatchState = useCallback((matchId, { status, finalSeconds, finalClock, elapsedSeconds } = {}) => {
    const isTerminado = status === 'Terminado' || status === 'Finalizado';
    if (isTerminado) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const fixedSec = Number.isFinite(finalSeconds)
        ? finalSeconds
        : (typeof finalClock === 'string' && finalClock.includes(':')
            ? (parseInt(finalClock.split(':')[0], 10) * 60 + parseInt(finalClock.split(':')[1], 10))
            : (Number.isFinite(elapsedSeconds) ? elapsedSeconds : null));

      setPersistedState((prev) => {
        const sec = fixedSec !== null ? fixedSec : (prev.matchSeconds || prev.offsetSeconds || 0);
        return {
          ...prev,
          matchId,
          isFinished: true,
          isRunning: false,
          startTimestamp: null,
          offsetSeconds: sec,
          matchSeconds: sec,
        };
      });
    } else {
      setPersistedState((prev) => {
        if (prev.matchId === matchId && !prev.isFinished) return prev;
        return {
          ...prev,
          matchId,
          isFinished: false,
        };
      });
    }
  }, []);

  /** Finaliza el partido y congela el cronómetro permanentemente */
  const finishMatch = useCallback((finalSeconds) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPersistedState((prev) => {
      const sec = Number.isFinite(finalSeconds) ? finalSeconds : recalcSeconds(prev);
      return {
        ...prev,
        isFinished: true,
        isRunning: false,
        startTimestamp: null,
        offsetSeconds: sec,
        matchSeconds: sec,
      };
    });
  }, []);

  /** Toggle inicio/pausa */
  const toggleTimer = useCallback(() => {
    setPersistedState((prev) => {
      if (prev.isFinished) return prev; // Bloqueado si el partido está terminado
      if (prev.isRunning) {
        const currentSeconds = recalcSeconds(prev);
        return {
          ...prev,
          isRunning: false,
          startTimestamp: null,
          offsetSeconds: currentSeconds,
          matchSeconds: currentSeconds,
        };
      } else {
        return {
          ...prev,
          isRunning: true,
          startTimestamp: Date.now(),
        };
      }
    });
  }, []);

  /** Resetea el cronómetro completamente */
  const resetTimer = useCallback(() => {
    setPersistedState((prev) => {
      if (prev.isFinished) return prev; // Bloqueado si el partido está terminado
      return {
        ...prev,
        isRunning: false,
        startTimestamp: null,
        offsetSeconds: 0,
        matchSeconds: 0,
      };
    });
  }, []);

  /** Ajuste manual de tiempo (+/- segundos) */
  const adjustTimer = useCallback((deltaSeconds) => {
    setPersistedState((prev) => {
      if (prev.isFinished) return prev; // Bloqueado si el partido está terminado
      const currentSeconds = recalcSeconds(prev);
      const newOffset = Math.max(0, currentSeconds + deltaSeconds);
      return {
        ...prev,
        offsetSeconds: newOffset,
        startTimestamp: prev.isRunning ? Date.now() : null,
        matchSeconds: newOffset,
      };
    });
  }, []);

  /** Limpia el partido activo */
  const clearActiveMatch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPersistedState(defaultMatchState);
    const key = getLsKey(uid);
    localStorage.removeItem(key);
  }, [uid]);

  // ── Valor expuesto al árbol de componentes ──────────────────────────────────
  const value = {
    matchId: persistedState.matchId,
    matchSeconds: persistedState.matchSeconds,
    isRunning: persistedState.isRunning,
    isFinished: Boolean(persistedState.isFinished),
    setActiveMatchId,
    syncMatchState,
    finishMatch,
    toggleTimer,
    resetTimer,
    adjustTimer,
    clearActiveMatch,
    formatMatchTime,
    currentMinute: Math.max(1, Math.ceil(persistedState.matchSeconds / 60)),
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};

// ── Hook de acceso ────────────────────────────────────────────────────────────
export const useMatch = () => {
  const ctx = useContext(MatchContext);
  if (!ctx) {
    throw new Error('useMatch debe usarse dentro de <MatchProvider>');
  }
  return ctx;
};

export default MatchContext;
