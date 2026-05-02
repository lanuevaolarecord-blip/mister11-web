import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useMatches = (teamId) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(`users/${user.uid}/teams/${teamId}/matches`, (data) => {
      setMatches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId]);

  const addMatch = async (matchData) => {
    if (!user || !teamId) return;
    const docId = await addDocument(`users/${user.uid}/teams/${teamId}/matches`, {
      ...matchData
    });

    await createNotification('info', `Nuevo partido registrado vs ${matchData.rival}`);
    return docId;
  };

  const updateMatch = async (id, matchData) => {
    if (!user || !teamId) return;
    return await updateDocument(`users/${user.uid}/teams/${teamId}/matches`, id, matchData);
  };

  const removeMatch = async (id) => {
    if (!user || !teamId) return;
    return await deleteDocument(`users/${user.uid}/teams/${teamId}/matches`, id);
  };

  return { matches, loading, addMatch, updateMatch, removeMatch };
};
