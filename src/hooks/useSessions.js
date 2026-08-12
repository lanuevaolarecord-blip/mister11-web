import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { scheduleSessionReminder, cancelSessionReminder, requestNotificationPermission } from './useLocalNotifications';

export const sanitizeForFirestore = (obj) => {
  if (obj === undefined || obj === null) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
};

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
    if (!user || !teamId) {
      throw new Error('No hay usuario o equipo activo para guardar la sesión.');
    }
    const path = getTeamPath(teamId);
    const cleanedData = sanitizeForFirestore(sessionData);
    const docId = await addDocument(`${path}/sessions`, cleanedData);

    // Notificaciones en segundo plano (no bloqueantes)
    createNotification('success', `Nueva sesión creada: ${sessionData.title || 'Sesión'}`).catch(() => {});

    const notifEnabled = localStorage.getItem('mister11_notifications_enabled') !== 'false';
    if (notifEnabled && docId) {
      requestNotificationPermission()
        .then(() => scheduleSessionReminder({ ...cleanedData, id: docId }))
        .catch(err => console.warn('[useSessions] Non-blocking reminder error:', err));
    }

    return docId;
  };

  const updateSession = async (id, sessionData) => {
    if (!user || !teamId) {
      throw new Error('No hay usuario o equipo activo para actualizar la sesión.');
    }
    const path = getTeamPath(teamId);
    const cleanedData = sanitizeForFirestore(sessionData);

    if (sessionData.date || sessionData.time) {
      const existing = sessions.find(s => s.id === id) || {};
      const updated = { ...existing, ...cleanedData, id };
      cancelSessionReminder(id).catch(() => {});
      const notifEnabled = localStorage.getItem('mister11_notifications_enabled') !== 'false';
      if (notifEnabled) {
        scheduleSessionReminder(updated).catch(err => console.warn('[useSessions] Non-blocking reminder error:', err));
      }
    }

    await updateDocument(`${path}/sessions`, id, cleanedData);
    return id;
  };

  const removeSession = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    cancelSessionReminder(id).catch(() => {});
    return await deleteDocument(`${path}/sessions`, id);
  };

  return { sessions, loading, addSession, updateSession, removeSession };
};
