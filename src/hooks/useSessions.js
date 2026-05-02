import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useSessions = (teamId) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !teamId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(`users/${user.uid}/teams/${teamId}/sessions`, (data) => {
      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, teamId]);

  const addSession = async (sessionData) => {
    if (!user || !teamId) return;
    const docId = await addDocument(`users/${user.uid}/teams/${teamId}/sessions`, {
      ...sessionData
    });

    await createNotification('success', `Nueva sesión creada: ${sessionData.title}`);
    return docId;
  };

  const updateSession = async (id, sessionData) => {
    if (!user || !teamId) return;
    return await updateDocument(`users/${user.uid}/teams/${teamId}/sessions`, id, sessionData);
  };

  const removeSession = async (id) => {
    if (!user || !teamId) return;
    return await deleteDocument(`users/${user.uid}/teams/${teamId}/sessions`, id);
  };

  return { sessions, loading, addSession, updateSession, removeSession };
};
