import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, deleteDocument } from '../firebase/db';

export const useCaptures = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !teamId) {
      setCaptures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/captures`, (data) => {
      // Ordenar por fecha descendente
      const sorted = data.sort((a, b) => {
        const t1 = a.timestamp?.seconds || 0;
        const t2 = b.timestamp?.seconds || 0;
        return t2 - t1;
      });
      setCaptures(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, teamId, getTeamPath]);

  const removeCapture = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await deleteDocument(`${path}/captures`, id);
  };

  return { captures, loading, removeCapture };
};
