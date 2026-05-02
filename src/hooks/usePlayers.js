import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const usePlayers = (teamId) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(`users/${user.uid}/teams/${teamId}/players`, (data) => {
      setPlayers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId]);

  const addPlayer = async (playerData) => {
    if (!user || !teamId) return;
    const docId = await addDocument(`users/${user.uid}/teams/${teamId}/players`, {
      ...playerData
    });
    
    await createNotification('info', `Nuevo jugador añadido: ${playerData.nombre}`);
    return docId;
  };

  const updatePlayer = async (id, playerData) => {
    if (!user || !teamId) return;
    return await updateDocument(`users/${user.uid}/teams/${teamId}/players`, id, playerData);
  };

  const removePlayer = async (id) => {
    if (!user || !teamId) return;
    return await deleteDocument(`users/${user.uid}/teams/${teamId}/players`, id);
  };

  return { players, loading, addPlayer, updatePlayer, removePlayer };
};
