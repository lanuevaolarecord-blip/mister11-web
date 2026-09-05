import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from './useGameLimits';

/**
 * Hook de Cronómetro en Vivo con Pausa en Segundo Plano y Persistencia Periódica (useGameTimer v3).
 * 
 * @param {Object} options
 * @param {'cognitive' | 'retos'} options.category - Categoría del juego/reto
 * @param {number} options.initialRemainingSeconds - Segundos que le quedan hoy al jugador
 * @param {Function} options.recordTimeDelta - Función (deltaSec, category) para persistir tiempo
 * @param {Function} options.startSession - Función para incrementar sesión una sola vez
 * @param {Function} [options.onTimeExpired] - Callback opcional al agotarse el tiempo diario
 */
export const useGameTimer = ({
  category = 'cognitive',
  initialRemainingSeconds = 900,
  recordTimeDelta = null,
  startSession = null,
  onTimeExpired = null
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Referencias para medición precisa sin desfases por re-renders
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastActiveTimestampRef = useRef(null);
  const accumulatedMsRef = useRef(0);
  const lastFlushedMsRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const initialRemainingRef = useRef(initialRemainingSeconds);

  // Mantener actualizado el límite restante inicial si cambia antes de activar
  useEffect(() => {
    if (!isActiveRef.current) {
      initialRemainingRef.current = initialRemainingSeconds;
    }
  }, [initialRemainingSeconds]);

  // Función para descargar delta pendiente a Firestore / LocalStorage
  const flushDelta = useCallback(() => {
    if (!recordTimeDelta) return 0;

    // Calcular ms transcurridos actualmente
    let currentTotalMs = accumulatedMsRef.current;
    if (isActiveRef.current && !isPausedRef.current && lastActiveTimestampRef.current !== null) {
      currentTotalMs += (performance.now() - lastActiveTimestampRef.current);
    }

    const uncommittedMs = currentTotalMs - lastFlushedMsRef.current;
    const deltaSec = Math.floor(uncommittedMs / 1000);

    if (deltaSec > 0) {
      lastFlushedMsRef.current += (deltaSec * 1000);
      recordTimeDelta(deltaSec, category);
    }
    return deltaSec;
  }, [recordTimeDelta, category]);

  // Iniciar temporizador (al pulsar "Comenzar" tras intro/práctica)
  const startTimer = useCallback(() => {
    if (isActiveRef.current) return;

    isActiveRef.current = true;
    isPausedRef.current = false;
    lastActiveTimestampRef.current = performance.now();
    accumulatedMsRef.current = 0;
    lastFlushedMsRef.current = 0;

    setIsActive(true);
    setIsPaused(false);
    setElapsedSeconds(0);

    // Incrementar sesión exactamente UNA vez al inicio real
    if (!sessionStartedRef.current && startSession) {
      sessionStartedRef.current = true;
      startSession(category);
    }
  }, [startSession, category]);

  // Pausar temporalmente (ej. juego en pausa o app oculta)
  const pauseTimer = useCallback(() => {
    if (!isActiveRef.current || isPausedRef.current) return;

    if (lastActiveTimestampRef.current !== null) {
      accumulatedMsRef.current += (performance.now() - lastActiveTimestampRef.current);
      lastActiveTimestampRef.current = null;
    }
    isPausedRef.current = true;
    setIsPaused(true);

    // Descargar inmediatamente el delta acumulado hasta la pausa
    flushDelta();
  }, [flushDelta]);

  // Reanudar temporizador
  const resumeTimer = useCallback(() => {
    if (!isActiveRef.current || !isPausedRef.current) return;

    lastActiveTimestampRef.current = performance.now();
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  // Detener y hacer flush final de la sesión
  const stopTimer = useCallback(() => {
    if (!isActiveRef.current) return 0;

    if (lastActiveTimestampRef.current !== null) {
      accumulatedMsRef.current += (performance.now() - lastActiveTimestampRef.current);
      lastActiveTimestampRef.current = null;
    }

    const finalDelta = flushDelta();
    isActiveRef.current = false;
    isPausedRef.current = false;
    setIsActive(false);
    setIsPaused(false);

    return Math.floor(accumulatedMsRef.current / 1000);
  }, [flushDelta]);

  // 1. Manejo automático de Document Visibility (Pausa en segundo plano)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActiveRef.current && !isPausedRef.current) {
          pauseTimer();
        }
      } else {
        if (isActiveRef.current && isPausedRef.current) {
          resumeTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseTimer, resumeTimer]);

  // 2. Persistencia en cierre de ventana / página (pagehide, beforeunload)
  useEffect(() => {
    const handlePageHide = () => {
      flushDelta();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      flushDelta();
    };
  }, [flushDelta]);

  // 3. Ticker en vivo cada 200ms y flush periódico cada 10 segundos
  useEffect(() => {
    if (!isActive) return;

    let flushCounterMs = 0;
    const interval = setInterval(() => {
      if (!isActiveRef.current || isPausedRef.current) return;

      let currentTotalMs = accumulatedMsRef.current;
      if (lastActiveTimestampRef.current !== null) {
        currentTotalMs += (performance.now() - lastActiveTimestampRef.current);
      }

      const totalSec = Math.floor(currentTotalMs / 1000);
      setElapsedSeconds(totalSec);

      // Evaluar si se agotó el cupo
      const remainingSec = Math.max(0, initialRemainingRef.current - totalSec);
      if (remainingSec <= 0 && onTimeExpired) {
        onTimeExpired();
      }

      // Flush periódico cada 10s (10,000 ms)
      flushCounterMs += 200;
      if (flushCounterMs >= 10000) {
        flushCounterMs = 0;
        flushDelta();
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, flushDelta, onTimeExpired]);

  const remainingSeconds = Math.max(0, initialRemainingRef.current - elapsedSeconds);
  const isTimeExpired = remainingSeconds <= 0;

  return {
    isActive,
    isPaused,
    elapsedSeconds,
    remainingSeconds,
    isTimeExpired,
    formattedElapsed: formatTime(elapsedSeconds),
    formattedRemaining: formatTime(remainingSeconds),
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    flushDelta
  };
};

export default useGameTimer;
