import { useCallback } from 'react';

export const useMatchEvents = (matchData, setMatchData, players, updateMatch) => {
  const addEvent = useCallback((type, playerId, playerName, minute, additional = {}) => {
    const newEvent = {
      type,
      playerId,
      playerName,
      minute: parseInt(minute, 10) || 1,
      timestamp: new Date().toISOString(),
      ...additional
    };

    setMatchData(prev => {
      let updatedGoalsFor = prev.goalsFor || 0;
      let updatedGoalsAgainst = prev.goalsAgainst || 0;
      let updatedGoleadores = [...(prev.goleadoresList || [])];
      let updatedTarjetas = [...(prev.tarjetasList || [])];

      if (type === 'gol_local') {
        updatedGoalsFor += 1;
        updatedGoleadores.push({ 
          jugadorId: playerId, 
          minuto: minute.toString(), 
          asistenciaId: additional.asistenciaId || '' 
        });
      } else if (type === 'gol_rival') {
        updatedGoalsAgainst += 1;
      } else if (type === 'amarilla' || type === 'roja') {
        updatedTarjetas.push({ 
          jugadorId: playerId, 
          tipo: type, 
          minuto: minute.toString() 
        });
      }

      const nextData = {
        ...prev,
        goalsFor: updatedGoalsFor,
        goalsAgainst: updatedGoalsAgainst,
        goleadoresList: updatedGoleadores,
        tarjetasList: updatedTarjetas,
        events: [...(prev.events || []), newEvent]
      };

      if (updateMatch && prev.id) {
        updateMatch(prev.id, nextData).catch(err => {
          console.error("Error auto-saving match event in Firestore:", err);
        });
      }

      return nextData;
    });
  }, [setMatchData, updateMatch]);

  const removeEvent = useCallback((eventIdx) => {
    setMatchData(prev => {
      const event = prev.events && prev.events[eventIdx];
      if (!event) return prev;

      let updatedGoalsFor = prev.goalsFor || 0;
      let updatedGoalsAgainst = prev.goalsAgainst || 0;
      let updatedGoleadores = [...(prev.goleadoresList || [])];
      let updatedTarjetas = [...(prev.tarjetasList || [])];

      if (event.type === 'gol_local') {
        updatedGoalsFor = Math.max(0, updatedGoalsFor - 1);
        updatedGoleadores = updatedGoleadores.filter(
          g => !(g.jugadorId === event.playerId && g.minuto === event.minute.toString())
        );
      } else if (event.type === 'gol_rival') {
        updatedGoalsAgainst = Math.max(0, updatedGoalsAgainst - 1);
      } else if (event.type === 'amarilla' || event.type === 'roja') {
        updatedTarjetas = updatedTarjetas.filter(
          t => !(t.jugadorId === event.playerId && t.tipo === event.type && t.minuto === event.minute.toString())
        );
      }

      const updatedEvents = (prev.events || []).filter((_, idx) => idx !== eventIdx);

      const nextData = {
        ...prev,
        goalsFor: updatedGoalsFor,
        goalsAgainst: updatedGoalsAgainst,
        goleadoresList: updatedGoleadores,
        tarjetasList: updatedTarjetas,
        events: updatedEvents
      };

      if (updateMatch && prev.id) {
        updateMatch(prev.id, nextData).catch(err => {
          console.error("Error auto-saving remove event in Firestore:", err);
        });
      }

      return nextData;
    });
  }, [setMatchData, updateMatch]);

  const makeSubstitution = useCallback((subOutId, subInId, minute) => {
    const playerOut = players.find(p => p.id === subOutId);
    const playerIn = players.find(p => p.id === subInId);
    if (!playerOut || !playerIn) return false;

    const newEvent = {
      type: 'sustitucion',
      playerOutId: subOutId,
      playerOutName: playerOut.name,
      playerInId: subInId,
      playerInName: playerIn.name,
      minute: parseInt(minute, 10) || 1,
      timestamp: new Date().toISOString()
    };

    setMatchData(prev => {
      const newCalled = [...(prev.convocados || [])];
      const idxOut = newCalled.indexOf(subOutId);
      const idxIn = newCalled.indexOf(subInId);

      if (idxOut !== -1 && idxIn !== -1) {
        newCalled[idxOut] = subInId;
        newCalled[idxIn] = subOutId;
      }

      const nextData = {
        ...prev,
        convocados: newCalled,
        events: [...(prev.events || []), newEvent]
      };

      if (updateMatch && prev.id) {
        updateMatch(prev.id, nextData).catch(err => {
          console.error("Error auto-saving substitution in Firestore:", err);
        });
      }

      return nextData;
    });

    return true;
  }, [players, setMatchData, updateMatch]);

  return { addEvent, removeEvent, makeSubstitution };
};
