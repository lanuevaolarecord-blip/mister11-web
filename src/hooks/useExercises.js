import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useExercises = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCollection(`users/${user.uid}/exercises`, (data) => {
      setExercises(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addExercise = async (exerciseData) => {
    if (!user) return;
    const docId = await addDocument(`users/${user.uid}/exercises`, {
      ...exerciseData
    });

    await createNotification('success', `Nuevo ejercicio guardado: ${exerciseData.titulo || exerciseData.nombre}`);
    return docId;
  };

  const removeExercise = async (id) => {
    return await deleteDocument(`users/${user.uid}/exercises`, id);
  };

  return { exercises, loading, addExercise, removeExercise };
};
