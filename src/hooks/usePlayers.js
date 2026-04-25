import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../firebase/db';

export const usePlayers = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Suscribirse a los jugadores del usuario actual
    // En el futuro podemos filtrar por equipoId si el entrenador tiene varios equipos
    const unsubscribe = subscribeToCollection('players', (data) => {
      setPlayers(data);
      setLoading(false);
    }, [{ field: 'creadoPor', operator: '==', value: user.uid }]);

    return () => unsubscribe();
  }, [user]);

  const addPlayer = async (playerData) => {
    if (!user) return;
    return await addDocument('players', {
      ...playerData,
      creadoPor: user.uid,
      equipoId: 'default' // Por ahora un equipo por defecto
    });
  };

  const updatePlayer = async (id, playerData) => {
    return await updateDocument('players', id, playerData);
  };

  const removePlayer = async (id) => {
    return await deleteDocument('players', id);
  };

  return { players, loading, addPlayer, updatePlayer, removePlayer };
};
