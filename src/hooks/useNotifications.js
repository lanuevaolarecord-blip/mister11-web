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
          time: formatTime(doc.data().createdAt)
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
        time: formatTime(doc.data().createdAt)
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

  const addNotification = async (type, text) => {
    if (!user || !teamId) return;
    try {
      const path = getTeamPath(teamId);
      await addDoc(collection(db, path, 'notifications'), {
        type,
        text,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  return { notifications, loading, addNotification };
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'Ahora';
  const date = (timestamp && typeof timestamp.toDate === 'function') ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};
