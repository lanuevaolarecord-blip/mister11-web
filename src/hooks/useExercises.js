import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const useExercises = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCollection('ejercicios', (data) => {
      setExercises(data);
      setLoading(false);
    }, [{ field: 'creadoPor', operator: '==', value: user.uid }]);

    return () => unsubscribe();
  }, [user]);

  const addExercise = async (exerciseData) => {
    if (!user) return;
    const docId = await addDocument('ejercicios', {
      ...exerciseData,
      creadoPor: user.uid
    });

    await createNotification('success', `Nuevo ejercicio guardado: ${exerciseData.titulo || exerciseData.nombre}`);
    return docId;
  };

  const removeExercise = async (id) => {
    return await deleteDocument('ejercicios', id);
  };

  return { exercises, loading, addExercise, removeExercise };
};
