import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatTime(doc.data().createdAt)
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addNotification = async (type, text) => {
    try {
      await addDoc(collection(db, 'notifications'), {
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
  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};
