import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCollection(`users/${user.uid}/matches`, (data) => {
      setMatches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addMatch = async (matchData) => {
    if (!user) return;
    const docId = await addDocument(`users/${user.uid}/matches`, {
      ...matchData,
      equipoId: 'default'
    });

    await createNotification('info', `Nuevo partido registrado vs ${matchData.rival}`);
    return docId;
  };

  const updateMatch = async (id, matchData) => {
    return await updateDocument(`users/${user.uid}/matches`, id, matchData);
  };

  const removeMatch = async (id) => {
    return await deleteDocument(`users/${user.uid}/matches`, id);
  };

  return { matches, loading, addMatch, updateMatch, removeMatch };
};
