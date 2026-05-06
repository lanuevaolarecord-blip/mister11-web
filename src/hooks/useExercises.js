import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useExercises = (teamId) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setExercises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(`users/${user.uid}/teams/${teamId}/exercises`, (data) => {
      setExercises(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId]);

  const addExercise = async (exerciseData) => {
    if (!user || !teamId) return;
    const docId = await addDocument(`users/${user.uid}/teams/${teamId}/exercises`, {
      ...exerciseData
    });

    await createNotification('success', `Nuevo ejercicio guardado: ${exerciseData.titulo || exerciseData.nombre}`);
    return docId;
  };

  const removeExercise = async (id) => {
    if (!user || !teamId) return;
    return await deleteDocument(`users/${user.uid}/teams/${teamId}/exercises`, id);
  };

  return { exercises, loading, addExercise, removeExercise };
};
