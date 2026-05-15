import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, deleteDocument } from '../firebase/db';

export const useCaptures = (teamId) => {
  const { user } = useAuth();
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !teamId) {
      setCaptures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(`users/${user.uid}/teams/${teamId}/captures`, (data) => {
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
  }, [user?.uid, teamId]);

  const removeCapture = async (id) => {
    if (!user || !teamId) return;
    return await deleteDocument(`users/${user.uid}/teams/${teamId}/captures`, id);
  };

  return { captures, loading, removeCapture };
};
