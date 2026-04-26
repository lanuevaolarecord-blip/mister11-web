import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const usePlayers = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Suscribirse a los jugadores del usuario actual
    // En el futuro podemos filtrar por equipoId si el entrenador tiene varios equipos
    const unsubscribe = subscribeToCollection(`users/${user.uid}/players`, (data) => {
      setPlayers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addPlayer = async (playerData) => {
    if (!user) return;
    const docId = await addDocument(`users/${user.uid}/players`, {
      ...playerData,
      equipoId: 'default' // Por ahora un equipo por defecto
    });
    
    await createNotification('info', `Nuevo jugador añadido: ${playerData.nombre}`);
    return docId;
  };

  const updatePlayer = async (id, playerData) => {
    return await updateDocument(`users/${user.uid}/players`, id, playerData);
  };

  const removePlayer = async (id) => {
    return await deleteDocument(`users/${user.uid}/players`, id);
  };

  return { players, loading, addPlayer, updatePlayer, removePlayer };
};
