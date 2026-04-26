import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCollection('matches', (data) => {
      setMatches(data);
      setLoading(false);
    }, [{ field: 'creadoPor', operator: '==', value: user.uid }]);

    return () => unsubscribe();
  }, [user]);

  const addMatch = async (matchData) => {
    if (!user) return;
    const docId = await addDocument('matches', {
      ...matchData,
      creadoPor: user.uid,
      equipoId: 'default'
    });

    await createNotification('info', `Nuevo partido registrado vs ${matchData.rival}`);
    return docId;
  };

  const updateMatch = async (id, matchData) => {
    return await updateDocument('matches', id, matchData);
  };

  const removeMatch = async (id) => {
    return await deleteDocument('matches', id);
  };

  return { matches, loading, addMatch, updateMatch, removeMatch };
};
