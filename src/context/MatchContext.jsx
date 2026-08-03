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
 *  • El estado se restaura automáticamente al montar el proveedor.
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

// ── Clave de persistencia en localStorage ────────────────────────────────────
const LS_KEY = 'mister11_active_match_state';

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

// ── Leer estado desde localStorage (con resiliencia a JSON inválido) ──────────
const readFromStorage = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultMatchState;
    const parsed = JSON.parse(raw);
    return { ...defaultMatchState, ...parsed };
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
  // ── Inicializar desde localStorage ─────────────────────────────────────────
  const [persistedState, setPersistedState] = useState(() => {
    const stored = readFromStorage();
    return {
      ...stored,
      matchSeconds: recalcSeconds(stored), // recalcular al montar por si hubo recarga
    };
  });

  const intervalRef = useRef(null);

  // ── Persistir en localStorage cada vez que cambia el estado ────────────────
  useEffect(() => {
    const { matchSeconds: _ms, ...toStore } = persistedState; // no guardar matchSeconds (se recalcula)
    localStorage.setItem(LS_KEY, JSON.stringify(toStore));
  }, [persistedState]);

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

  /** Toggle inicio/pausa */
  const toggleTimer = useCallback(() => {
    setPersistedState((prev) => {
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
    setPersistedState((prev) => ({
      ...prev,
      isRunning: false,
      startTimestamp: null,
      offsetSeconds: 0,
      matchSeconds: 0,
    }));
  }, []);

  /** Ajuste manual de tiempo (+/- segundos) */
  const adjustTimer = useCallback((deltaSeconds) => {
    setPersistedState((prev) => {
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
    localStorage.removeItem(LS_KEY);
  }, []);

  // ── Valor expuesto al árbol de componentes ──────────────────────────────────
  const value = {
    matchId: persistedState.matchId,
    matchSeconds: persistedState.matchSeconds,
    isRunning: persistedState.isRunning,
    setActiveMatchId,
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
