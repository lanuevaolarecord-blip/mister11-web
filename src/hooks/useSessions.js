import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { scheduleSessionReminder, cancelSessionReminder, requestNotificationPermission } from './useLocalNotifications';

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

    // Programar recordatorio local (Android nativo) si las notificaciones están habilitadas
    const notifEnabled = localStorage.getItem('mister11_notifications_enabled') !== 'false';
    if (notifEnabled && docId) {
      await requestNotificationPermission();
      await scheduleSessionReminder({ ...sessionData, id: docId });
    }

    return docId;
  };

  const updateSession = async (id, sessionData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    // Reprogramar recordatorio si cambió la fecha/hora
    if (sessionData.date || sessionData.time) {
      const existing = sessions.find(s => s.id === id) || {};
      const updated = { ...existing, ...sessionData, id };
      await cancelSessionReminder(id);
      const notifEnabled = localStorage.getItem('mister11_notifications_enabled') !== 'false';
      if (notifEnabled) await scheduleSessionReminder(updated);
    }
    return await updateDocument(`${path}/sessions`, id, sessionData);
  };

  const removeSession = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    // Cancelar recordatorio al eliminar sesión
    await cancelSessionReminder(id);
    return await deleteDocument(`${path}/sessions`, id);
  };

  return { sessions, loading, addSession, updateSession, removeSession };
};
