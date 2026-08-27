import { useCallback } from 'react';

/**
 * useMatchEvents.js
 * Míster11 — Gestor de Eventos de Partido, Sustituciones y Marcador Derivado
 *
 * REGLAS FUNDAMENTALES:
 * 1. El marcador (goalsFor, goalsAgainst) es 100% DERIVADO del conteo de eventos 'gol_local' y 'gol_rival'.
 * 2. La bitácora de eventos se mantiene SIEMPRE ordenada por minuto ascendente (minute ASC).
 * 3. Las sustituciones validan que el que SALE esté en el campo y el que ENTRA esté en el banquillo y no duplicado.
 * 4. Tras confirmar un cambio, se actualiza el estado de la alineación y se sincroniza en Firestore.
 */
export const useMatchEvents = (matchData, setMatchData, players = [], updateMatch) => {
  const addEvent = useCallback((type, playerId, playerName, minute, additional = {}) => {
    const minInt = Math.max(1, parseInt(minute, 10) || 1);
    const newEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      playerId: playerId || null,
      playerName: playerName || '',
      minute: minInt,
      timestamp: new Date().toISOString(),
      ...additional
    };

    setMatchData(prev => {
      const currentEvents = Array.isArray(prev.events) ? [...prev.events] : [];
      const updatedEvents = [...currentEvents, newEvent];

      // Ordenar cronológicamente por minuto ascendente
      updatedEvents.sort((a, b) => {
        const mA = parseInt(a.minute, 10) || 0;
        const mB = parseInt(b.minute, 10) || 0;
        if (mA !== mB) return mA - mB;
        return (a.timestamp || '').localeCompare(b.timestamp || '');
      });

      // Marcador DERIVADO de los eventos de gol
      const derivedGoalsFor = updatedEvents.filter(e => e.isValid !== false && (e.type === 'gol_local' || e.type === 'goal_own')).length;
      const derivedGoalsAgainst = updatedEvents.filter(e => e.isValid !== false && (e.type === 'gol_rival' || e.type === 'goal_rival')).length;

      // Goleadores y tarjetas derivados
      const updatedGoleadores = updatedEvents
        .filter(e => e.isValid !== false && e.type === 'gol_local' && e.playerId)
        .map(e => ({
          jugadorId: e.playerId,
          nombre: e.playerName,
          minuto: String(e.minute),
          asistenciaId: e.asistenciaId || ''
        }));

      const updatedTarjetas = updatedEvents
        .filter(e => e.isValid !== false && (e.type === 'amarilla' || e.type === 'roja') && e.playerId)
        .map(e => ({
          jugadorId: e.playerId,
          nombre: e.playerName,
          tipo: e.type,
          minuto: String(e.minute)
        }));

      const nextData = {
        ...prev,
        goalsFor: derivedGoalsFor,
        goalsAgainst: derivedGoalsAgainst,
        goleadoresList: updatedGoleadores,
        tarjetasList: updatedTarjetas,
        events: updatedEvents
      };

      if (updateMatch && prev.id) {
        updateMatch(prev.id, nextData).catch(err => {
          console.error('[useMatchEvents] Error auto-guardando evento en Firestore:', err);
        });
      }

      return nextData;
    });
  }, [setMatchData, updateMatch]);

  const removeEvent = useCallback((eventIdx) => {
    setMatchData(prev => {
      const currentEvents = Array.isArray(prev.events) ? [...prev.events] : [];
      if (eventIdx < 0 || eventIdx >= currentEvents.length) return prev;

      const updatedEvents = currentEvents.filter((_, idx) => idx !== eventIdx);

      // Re-ordenar por minuto
      updatedEvents.sort((a, b) => {
        const mA = parseInt(a.minute, 10) || 0;
        const mB = parseInt(b.minute, 10) || 0;
        if (mA !== mB) return mA - mB;
        return (a.timestamp || '').localeCompare(b.timestamp || '');
      });

      // Marcador DERIVADO
      const derivedGoalsFor = updatedEvents.filter(e => e.isValid !== false && (e.type === 'gol_local' || e.type === 'goal_own')).length;
      const derivedGoalsAgainst = updatedEvents.filter(e => e.isValid !== false && (e.type === 'gol_rival' || e.type === 'goal_rival')).length;

      const updatedGoleadores = updatedEvents
        .filter(e => e.isValid !== false && e.type === 'gol_local' && e.playerId)
        .map(e => ({
          jugadorId: e.playerId,
          nombre: e.playerName,
          minuto: String(e.minute),
          asistenciaId: e.asistenciaId || ''
        }));

      const updatedTarjetas = updatedEvents
        .filter(e => e.isValid !== false && (e.type === 'amarilla' || e.type === 'roja') && e.playerId)
        .map(e => ({
          jugadorId: e.playerId,
          nombre: e.playerName,
          tipo: e.type,
          minuto: String(e.minute)
        }));

      const nextData = {
        ...prev,
        goalsFor: derivedGoalsFor,
        goalsAgainst: derivedGoalsAgainst,
        goleadoresList: updatedGoleadores,
        tarjetasList: updatedTarjetas,
        events: updatedEvents
      };

      if (updateMatch && prev.id) {
        updateMatch(prev.id, nextData).catch(err => {
          console.error('[useMatchEvents] Error al eliminar evento en Firestore:', err);
        });
      }

      return nextData;
    });
  }, [setMatchData, updateMatch]);

  const makeSubstitution = useCallback((subOutId, subInId, minute) => {
    if (!subOutId || !subInId) {
      return { success: false, reason: 'Debes seleccionar tanto al jugador que sale como al que entra.' };
    }

    if (String(subOutId) === String(subInId)) {
      return { success: false, reason: 'No puedes sustituir a un jugador por sí mismo.' };
    }

    const playerOut = players.find(p => p && String(p.id) === String(subOutId));
    const playerIn = players.find(p => p && String(p.id) === String(subInId));

    if (!playerOut || !playerIn) {
      return { success: false, reason: 'Jugador no encontrado en la plantilla.' };
    }

    const minInt = Math.max(1, parseInt(minute, 10) || 1);

    let substitutionResult = { success: true };

    setMatchData(prev => {
      // Obtener titulares y suplentes actuales
      const currentTitulares = Array.isArray(prev.titulares)
        ? [...prev.titulares]
        : (Array.isArray(prev.alineacion?.titulares) ? [...prev.alineacion.titulares] : Array(11).fill(null));
      const currentSuplentes = Array.isArray(prev.suplentes)
        ? [...prev.suplentes]
        : (Array.isArray(prev.alineacion?.suplentes) ? [...prev.alineacion.suplentes] : Array(7).fill(null));
      const currentConvocados = Array.isArray(prev.convocados)
        ? [...prev.convocados]
        : [...currentTitulares.filter(Boolean), ...currentSuplentes.filter(Boolean)];

      // 1. Validar que subOutId está en el campo (titulares actuales)
      const outIdx = currentTitulares.findIndex(id => id && String(id) === String(subOutId));
      if (outIdx === -1) {
        substitutionResult = { success: false, reason: `${playerOut.name} no está actualmente en el terreno de juego.` };
        return prev;
      }

      // 2. Validar que subInId está en el banquillo y no en el campo
      const inTitularIdx = currentTitulares.findIndex(id => id && String(id) === String(subInId));
      if (inTitularIdx !== -1) {
        substitutionResult = { success: false, reason: `${playerIn.name} ya está en el terreno de juego.` };
        return prev;
      }

      const inSubIdx = currentSuplentes.findIndex(id => id && String(id) === String(subInId));
      if (inSubIdx === -1 && !currentConvocados.includes(subInId)) {
        substitutionResult = { success: false, reason: `${playerIn.name} no está en la lista de suplentes ni convocado.` };
        return prev;
      }

      // 3. Ejecutar SWAP en titulares y suplentes
      const nextTitulares = [...currentTitulares];
      const nextSuplentes = [...currentSuplentes];

      nextTitulares[outIdx] = subInId;
      if (inSubIdx !== -1) {
        nextSuplentes[inSubIdx] = subOutId;
      } else {
        // Si no estaba en el array de suplentes de 7, agregarlo en el primer slot libre
        const emptySubIdx = nextSuplentes.findIndex(s => !s);
        if (emptySubIdx !== -1) {
          nextSuplentes[emptySubIdx] = subOutId;
        }
      }

      // Actualizar array de convocados
      const nextConvocados = [...new Set([...nextTitulares.filter(Boolean), ...nextSuplentes.filter(Boolean)])];

      // 4. Crear evento de sustitución
      const newEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'sustitucion',
        playerOutId: subOutId,
        playerOutName: playerOut.name,
        subOutId: subOutId,
        playerInId: subInId,
        playerInName: playerIn.name,
        subInId: subInId,
        minute: minInt,
        timestamp: new Date().toISOString()
      };

      const currentEvents = Array.isArray(prev.events) ? [...prev.events] : [];
      const updatedEvents = [...currentEvents, newEvent];
      updatedEvents.sort((a, b) => {
        const mA = parseInt(a.minute, 10) || 0;
        const mB = parseInt(b.minute, 10) || 0;
        if (mA !== mB) return mA - mB;
        return (a.timestamp || '').localeCompare(b.timestamp || '');
      });

      const nextData = {
        ...prev,
        titulares: nextTitulares,
        suplentes: nextSuplentes,
        alineacion: {
          ...(prev.alineacion || {}),
          titulares: nextTitulares,
          suplentes: nextSuplentes
        },
        convocados: nextConvocados,
        events: updatedEvents
      };

      if (updateMatch && prev.id) {
        updateMatch(prev.id, nextData).catch(err => {
          console.error('[useMatchEvents] Error auto-guardando sustitución en Firestore:', err);
        });
      }

      substitutionResult = { success: true };
      return nextData;
    });

    return substitutionResult;
  }, [players, setMatchData, updateMatch]);

  return { addEvent, removeEvent, makeSubstitution };
};

export default useMatchEvents;
