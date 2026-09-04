/**
 * src/hooks/useGameLevels.js
 * MÍSTER11 v1.1.65 — Hook para gestión y progresión adaptativa de niveles por juego
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  getCategoria,
  NIVELES,
  NIVEL_LABELS,
  evaluarProgresion,
  paramsJuego
} from '../utils/cognitiveLevels';

export const useGameLevels = (teamPath, player) => {
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const playerId = player?.id;
  const storageKey = `m11_cog_levels_${playerId || 'local'}`;

  const [levels, setLevels] = useState(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return player?.cognitive?.levels || {};
  });

  // Suscripción a los niveles del jugador en Firestore
  useEffect(() => {
    if (!cleanPath || !playerId) return;

    const pRef = doc(db, `${cleanPath}/players`, playerId);
    const unsub = onSnapshot(pRef, (snap) => {
      if (snap.exists()) {
        const remoteLevels = snap.data()?.cognitive?.levels || {};
        setLevels(prev => {
          const merged = { ...prev, ...remoteLevels };
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch (_e) {}
          return merged;
        });
      }
    }, (err) => {
      console.warn('[useGameLevels] Snapshot warning:', err);
    });

    return () => unsub();
  }, [cleanPath, playerId, storageKey]);

  // Categoría del jugador según su edad
  const categoria = useMemo(() => {
    return getCategoria(player?.birthDate);
  }, [player?.birthDate]);

  /**
   * Obtiene el nivel actual de un juego específico.
   * Respiración 4-4 y retos no tienen nivel (retornan null).
   */
  const getGameLevel = useCallback((gameId) => {
    if (!gameId || gameId === 'respiracion' || gameId === 'respiracion44' || gameId.startsWith('reto_')) {
      return null;
    }
    return levels[gameId] || 'bronce';
  }, [levels]);

  /**
   * Obtiene los parámetros ajustados para un juego según la categoría y nivel alcanzado.
   */
  const getAdjustedParams = useCallback((gameId) => {
    const lvl = getGameLevel(gameId) || 'bronce';
    const params = paramsJuego(categoria, lvl);
    return params[gameId] || {};
  }, [categoria, getGameLevel]);

  /**
   * Evalúa la sesión y actualiza el nivel si supera los umbrales de mérito.
   * Regla D7: NUNCA baja de nivel. Techo en Leyenda.
   */
  const processSessionProgression = useCallback(async (gameId, metrics) => {
    if (!gameId || gameId === 'respiracion' || gameId === 'respiracion44' || gameId.startsWith('reto_')) {
      return { subio: false, nivel: null };
    }

    const currentLevel = levels[gameId] || 'bronce';
    const evalResult = evaluarProgresion(
      { ...player, cognitive: { ...player?.cognitive, levels } },
      gameId,
      metrics
    );

    if (evalResult.subio && evalResult.nivel !== currentLevel) {
      const nextLevel = evalResult.nivel;
      const updatedLevels = { ...levels, [gameId]: nextLevel };
      setLevels(updatedLevels);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedLevels));
      } catch (_e) {}

      if (cleanPath && playerId) {
        try {
          const pRef = doc(db, `${cleanPath}/players`, playerId);
          await updateDoc(pRef, {
            [`cognitive.levels.${gameId}`]: nextLevel
          });
        } catch (err) {
          console.warn('[useGameLevels] Error persistiendo nivel en Firestore:', err);
        }
      }

      return {
        subio: true,
        anterior: currentLevel,
        nivel: nextLevel,
        techo: evalResult.techo
      };
    }

    return {
      subio: false,
      nivel: currentLevel,
      techo: currentLevel === 'leyenda'
    };
  }, [cleanPath, playerId, levels, player, storageKey]);

  return {
    levels,
    categoria,
    getGameLevel,
    getAdjustedParams,
    processSessionProgression
  };
};

export default useGameLevels;
