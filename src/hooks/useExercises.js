import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const PREDEFINED_EXERCISES = [
  {
    id: 'sys-1', name: 'Plancha Frontal', category: 'fortalecimiento',
    targetZones: ['core'], injuryTypes: ['lumbalgia'], difficulty: 1,
    description: 'Apoyo sobre antebrazos y puntas de los pies. Mantener el cuerpo alineado y contraer el abdomen.',
    durationSeconds: 30, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-2', name: 'Puente de Glúteos', category: 'fortalecimiento',
    targetZones: ['cadera', 'core'], injuryTypes: ['pubalgia'], difficulty: 1,
    description: 'Tumbado boca arriba, flexionar rodillas y elevar la cadera apretando glúteos.',
    durationSeconds: 0, reps: 15, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-3', name: 'Movilidad de Tobillo', category: 'movilidad',
    targetZones: ['tobillo'], injuryTypes: ['esguince'], difficulty: 1,
    description: 'De rodillas frente a una pared, adelantar la rodilla sin despegar el talón.',
    durationSeconds: 0, reps: 10, series: 2, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-4', name: 'Nordic Hamstring', category: 'prevencion',
    targetZones: ['isquiosural'], injuryTypes: ['rotura isquios'], difficulty: 3,
    description: 'De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.',
    durationSeconds: 0, reps: 6, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-5', name: 'Ejercicio de Copenhague', category: 'prevencion',
    targetZones: ['aductores'], injuryTypes: ['pubalgia'], difficulty: 2,
    description: 'Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.',
    durationSeconds: 20, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-6', name: 'Sentadilla Búlgara', category: 'fortalecimiento',
    targetZones: ['rodilla', 'cuadriceps'], injuryTypes: ['lca'], difficulty: 2,
    description: 'Un pie apoyado atrás en un banco. Flexionar la pierna delantera controlando que la rodilla no colapse hacia adentro.',
    durationSeconds: 0, reps: 10, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-7', name: 'Peso Muerto a Una Pierna', category: 'prevencion',
    targetZones: ['isquiosural', 'cadera'], injuryTypes: ['rotura isquios'], difficulty: 2,
    description: 'Con ligera flexión de rodilla, bajar el tronco recto elevando la pierna trasera.',
    durationSeconds: 0, reps: 10, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-8', name: 'Estiramiento Isquiosural', category: 'recuperacion',
    targetZones: ['isquiosural'], injuryTypes: ['sobrecarga'], difficulty: 1,
    description: 'Pierna extendida en alto, inclinar tronco hacia adelante con la espalda recta.',
    durationSeconds: 30, series: 2, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-9', name: 'Plancha Lateral', category: 'fortalecimiento',
    targetZones: ['core'], injuryTypes: ['lumbalgia'], difficulty: 2,
    description: 'Apoyo sobre un antebrazo y lateral del pie. Elevar cadera alineando el cuerpo.',
    durationSeconds: 30, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-10', name: 'Rotación Torácica', category: 'movilidad',
    targetZones: ['espalda'], injuryTypes: ['lumbalgia'], difficulty: 1,
    description: 'Cuadrupedia, mano en la nuca y rotar el tronco abriendo el pecho hacia arriba.',
    durationSeconds: 0, reps: 10, series: 2, source: 'system', createdBy: 'system'
  }
];

export const useExercises = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [exercises, setExercises] = useState(PREDEFINED_EXERCISES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setExercises(PREDEFINED_EXERCISES);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/exercises`, (data) => {
      // Combinar los predefinidos con los guardados en Firestore
      setExercises([...PREDEFINED_EXERCISES, ...data]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId, getTeamPath]);

  const addExercise = async (exerciseData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    const docId = await addDocument(`${path}/exercises`, {
      ...exerciseData,
      createdAt: new Date().toISOString()
    });

    await createNotification('success', `Nuevo ejercicio guardado: ${exerciseData.titulo || exerciseData.nombre || exerciseData.name}`);
    return docId;
  };

  const removeExercise = async (id) => {
    if (!user || !teamId) return;
    if (id.startsWith('sys-')) {
      await createNotification('error', 'No puedes eliminar un ejercicio predefinido del sistema.');
      return;
    }
    const path = getTeamPath(teamId);
    return await deleteDocument(`${path}/exercises`, id);
  };

  return { exercises, loading, addExercise, removeExercise };
};
