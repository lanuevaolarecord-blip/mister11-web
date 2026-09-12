import { useState, useEffect, useCallback } from 'react';

/**
 * useTheaterFullscreen
 * Hook para alternar entre pantalla completa nativa (requestFullscreen en Android/Desktop)
 * y un fallback universal de "Modo Teatro" en dispositivos sin soporte de API Fullscreen (Safari iOS).
 *
 * Cumple con:
 * - Sin locks de orientación
 * - Touch targets >= 48dp en controles
 * - Cierre mediante Escape o botón de cierre
 * - Preservación de estado reactivo del componente
 */
export const useTheaterFullscreen = (targetRef) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  const isNativeSupported = typeof document !== 'undefined' && Boolean(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );

  const enter = useCallback(async () => {
    const elem = targetRef?.current;
    if (isNativeSupported && elem && typeof elem.requestFullscreen === 'function') {
      try {
        await elem.requestFullscreen();
        return;
      } catch (err) {
        // Fallback al modo teatro si el navegador rechaza o falla la pantalla completa nativa
        setIsTheater(true);
      }
    } else {
      setIsTheater(true);
    }
  }, [isNativeSupported, targetRef]);

  const exit = useCallback(async () => {
    if (typeof document !== 'undefined' && (document.fullscreenElement || document.webkitFullscreenElement)) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      } catch (_) {}
    }
    setIsTheater(false);
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen || isTheater) {
      exit();
    } else {
      enter();
    }
  }, [isFullscreen, isTheater, enter, exit]);

  useEffect(() => {
    const handleFsChange = () => {
      const activeFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(activeFs);
      if (!activeFs) {
        // Si sale de fullscreen nativo, asegurar que theater esté apagado
        setIsTheater(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTheater) {
        setIsTheater(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTheater]);

  return {
    isActive: isFullscreen || isTheater,
    isFullscreen,
    isTheater,
    enter,
    exit,
    toggle,
  };
};

export default useTheaterFullscreen;
