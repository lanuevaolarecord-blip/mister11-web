import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useMatches = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/matches`, (data) => {
      setMatches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId, getTeamPath]);

  const addMatch = async (matchData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    const docId = await addDocument(`${path}/matches`, {
      ...matchData
    });

    await createNotification('info', `Nuevo partido registrado vs ${matchData.rival}`);
    return docId;
  };

  const updateMatch = async (id, matchData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await updateDocument(`${path}/matches`, id, matchData);
  };

  const removeMatch = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await deleteDocument(`${path}/matches`, id);
  };

  return { matches, loading, addMatch, updateMatch, removeMatch };
};
