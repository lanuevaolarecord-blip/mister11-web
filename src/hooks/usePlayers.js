import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { increment } from 'firebase/firestore';
import { t, isEn } from '../i18n/index.js';

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
    const pLocale = playerData.locale || (isEn() ? 'en' : 'es');
    const docId = await addDocument(`${path}/players`, {
      ...playerData,
      locale: pLocale
    });
    
    // Actualizar playerCount en el documento del equipo de forma atómica
    const pathParts = path.split('/');
    const tId = pathParts.pop();
    const colPath = pathParts.join('/');
    await updateDocument(colPath, tId, { playerCount: increment(1) });
    
    const playerName = playerData.nombre || playerData.name || (isEn() ? 'Player' : 'Jugador');
    await createNotification('info', {
      template: 'notifications.newPlayerAdded',
      payload: { name: playerName },
      text: t('notifications.newPlayerAdded', { name: playerName })
    });
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
    
    // Actualizar playerCount en el documento del equipo de forma atómica
    const pathParts = path.split('/');
    const tId = pathParts.pop();
    const colPath = pathParts.join('/');
    await updateDocument(colPath, tId, { playerCount: increment(-1) });
  };

  return { players, loading, addPlayer, updatePlayer, removePlayer };
};
