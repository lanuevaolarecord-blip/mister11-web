import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToCollection(`users/${user.uid}/sessions`, (data) => {
      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const addSession = async (sessionData) => {
    if (!user) return;
    const docId = await addDocument(`users/${user.uid}/sessions`, {
      ...sessionData,
      equipoId: 'default'
    });

    await createNotification('success', `Nueva sesión creada: ${sessionData.title}`);
    return docId;
  };

  const updateSession = async (id, sessionData) => {
    return await updateDocument(`users/${user.uid}/sessions`, id, sessionData);
  };

  const removeSession = async (id) => {
    return await deleteDocument(`users/${user.uid}/sessions`, id);
  };

  return { sessions, loading, addSession, updateSession, removeSession };
};
