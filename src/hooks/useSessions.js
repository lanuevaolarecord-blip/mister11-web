import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCollection('sessions', (data) => {
      setSessions(data);
      setLoading(false);
    }, [{ field: 'creadoPor', operator: '==', value: user.uid }]);

    return () => unsubscribe();
  }, [user]);

  const addSession = async (sessionData) => {
    if (!user) return;
    const docId = await addDocument('sessions', {
      ...sessionData,
      creadoPor: user.uid,
      equipoId: 'default'
    });

    await createNotification('success', `Nueva sesión creada: ${sessionData.title}`);
    return docId;
  };

  const updateSession = async (id, sessionData) => {
    return await updateDocument('sessions', id, sessionData);
  };

  const removeSession = async (id) => {
    return await deleteDocument('sessions', id);
  };

  return { sessions, loading, addSession, updateSession, removeSession };
};
