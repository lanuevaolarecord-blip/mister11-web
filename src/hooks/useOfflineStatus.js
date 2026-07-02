import { useState, useEffect } from 'react';

/**
 * useOfflineStatus
 * Hook que detecta el estado de conectividad del dispositivo.
 * Retorna `isOffline: true` cuando no hay red.
 * Escucha los eventos nativos `online` / `offline` del navegador.
 */
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return { isOffline };
};
