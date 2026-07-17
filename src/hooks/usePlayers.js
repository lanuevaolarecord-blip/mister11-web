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
    
    // Actualizar playerCount en el documento del equipo
    const pathParts = path.split('/');
    const tId = pathParts.pop();
    const colPath = pathParts.join('/');
    await updateDocument(colPath, tId, { playerCount: players.length + 1 });
    
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
    await deleteDocument(`${path}/players`, id);
    
    // Actualizar playerCount en el documento del equipo
    const pathParts = path.split('/');
    const tId = pathParts.pop();
    const colPath = pathParts.join('/');
    await updateDocument(colPath, tId, { playerCount: Math.max(0, players.length - 1) });
  };

  return { players, loading, addPlayer, updatePlayer, removePlayer };
};
