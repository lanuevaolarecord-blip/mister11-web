import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const usePlayers = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/players`, (data) => {
      setPlayers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId, getTeamPath]);

  const addPlayer = async (playerData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    const docId = await addDocument(`${path}/players`, {
      ...playerData
    });
    
    await createNotification('info', `Nuevo jugador añadido: ${playerData.nombre}`);
    return docId;
  };

  const updatePlayer = async (id, playerData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await updateDocument(`${path}/players`, id, playerData);
  };

  const removePlayer = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await deleteDocument(`${path}/players`, id);
  };

  return { players, loading, addPlayer, updatePlayer, removePlayer };
};
