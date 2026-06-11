import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useSessions = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !teamId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/sessions`, (data) => {
      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, teamId, getTeamPath]);

  const addSession = async (sessionData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    const docId = await addDocument(`${path}/sessions`, {
      ...sessionData
    });

    await createNotification('success', `Nueva sesión creada: ${sessionData.title}`);
    return docId;
  };

  const updateSession = async (id, sessionData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await updateDocument(`${path}/sessions`, id, sessionData);
  };

  const removeSession = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    return await deleteDocument(`${path}/sessions`, id);
  };

  return { sessions, loading, addSession, updateSession, removeSession };
};
