import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { t, getLocale, isEn } from '../i18n/index.js';

export const useNotifications = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let unsubTeam = null;
    let unsubUser = null;
    let teamNotifs = [];
    let userNotifs = [];

    const updateMerged = () => {
      const all = [...teamNotifs, ...userNotifs];
      const unique = [];
      const seen = new Set();
      for (const item of all) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item);
        }
      }
      unique.sort((a, b) => {
        const tA = a.rawDate?.toMillis ? a.rawDate.toMillis() : (a.rawDate?.seconds ? a.rawDate.seconds * 1000 : 0);
        const tB = b.rawDate?.toMillis ? b.rawDate.toMillis() : (b.rawDate?.seconds ? b.rawDate.seconds * 1000 : 0);
        return tB - tA;
      });
      setNotifications(unique.slice(0, 20));
      setLoading(false);
    };

    if (teamId) {
      const teamPath = getTeamPath(teamId);
      const qTeam = query(
        collection(db, teamPath, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      unsubTeam = onSnapshot(qTeam, (snapshot) => {
        teamNotifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          rawDate: doc.data().createdAt,
          time: formatNotificationTime(doc.data().createdAt)
        }));
        updateMerged();
      }, (err) => {
        console.warn('[useNotifications] Error en escucha de notificaciones del equipo:', err);
        setLoading(false);
      });
    }

    // Ruta legacy para asegurar que las notificaciones previas de los usuarios no se pierdan
    const qUser = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    unsubUser = onSnapshot(qUser, (snapshot) => {
      userNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rawDate: doc.data().createdAt,
        time: formatNotificationTime(doc.data().createdAt)
      }));
      updateMerged();
    }, (err) => {
      console.warn('[useNotifications] Error en escucha de notificaciones legacy:', err);
      setLoading(false);
    });

    return () => {
      if (unsubTeam) unsubTeam();
      if (unsubUser) unsubUser();
    };
  }, [user, teamId, getTeamPath]);

  const addNotification = async (type, content, extra = {}) => {
    if (!user || !teamId) return;
    try {
      const path = getTeamPath(teamId);
      const isObj = typeof content === 'object' && content !== null;
      const text = isObj ? (content.text || '') : (typeof content === 'string' ? content : '');
      const template = isObj ? content.template : extra.template;
      const payload = isObj ? content.payload : extra.payload;
      const locale = (isObj && content.locale) || extra.locale || (isEn() ? 'en' : 'es');

      const notifData = {
        type,
        text,
        locale,
        createdAt: serverTimestamp()
      };
      if (template) notifData.template = template;
      if (payload) notifData.payload = payload;

      await addDoc(collection(db, path, 'notifications'), notifData);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  return { notifications, loading, addNotification };
};

export const formatNotificationTime = (timestamp) => {
  if (!timestamp) return t('notifications.timeNow');
  const date = (timestamp && typeof timestamp.toDate === 'function') ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return t('notifications.timeNow');
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return t('notifications.timeJustNow');
  if (diffInSeconds < 3600) return t('notifications.timeMinAgo', { min: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return t('notifications.timeHoursAgo', { hours: Math.floor(diffInSeconds / 3600) });
  return date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });
};
