import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useSettings = (teamId) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    profileName: '',
    specialty: 'Primer Entrenador',
    clubName: 'Mister11 FC',
    primaryColor: '#1B3A2D',
    secondaryColor: '#4CAF7D',
    notifications: true,
    darkMode: true,
    language: 'Español (ES)'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) return;

    const docRef = doc(db, 'users', user.uid, 'teams', teamId, 'settings', 'config');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId]);

  const saveSettings = async (newSettings) => {
    if (!user || !teamId) return;
    const docRef = doc(db, 'users', user.uid, 'teams', teamId, 'settings', 'config');
    await setDoc(docRef, { ...newSettings, updatedAt: new Date() }, { merge: true });
  };

  return { settings, loading, saveSettings };
};
