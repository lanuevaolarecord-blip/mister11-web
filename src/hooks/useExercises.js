import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { isEn, t } from '../i18n/index.js';

export const PREDEFINED_EXERCISES = [
  {
    id: 'sys-1', 
    name: 'Plancha Frontal', 
    nameEs: 'Plancha Frontal',
    nameEn: 'Front Plank',
    category: 'fortalecimiento',
    targetZones: ['core'], injuryTypes: ['lumbalgia'], difficulty: 1,
    description: 'Apoyo sobre antebrazos y puntas de los pies. Mantener el cuerpo alineado y contraer el abdomen.',
    descriptionEs: 'Apoyo sobre antebrazos y puntas de los pies. Mantener el cuerpo alineado y contraer el abdomen.',
    descriptionEn: 'Forearm plank on toes. Keep body in a straight line and engage the core.',
    durationSeconds: 30, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-2', 
    name: 'Puente de Glúteos', 
    nameEs: 'Puente de Glúteos',
    nameEn: 'Glute Bridge',
    category: 'fortalecimiento',
    targetZones: ['cadera', 'core'], injuryTypes: ['pubalgia'], difficulty: 1,
    description: 'Tumbado boca arriba, flexionar rodillas y elevar la cadera apretando glúteos.',
    descriptionEs: 'Tumbado boca arriba, flexionar rodillas y elevar la cadera apretando glúteos.',
    descriptionEn: 'Lie on your back, bend knees and raise hips while squeezing glutes.',
    durationSeconds: 0, reps: 15, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-3', 
    name: 'Movilidad de Tobillo', 
    nameEs: 'Movilidad de Tobillo',
    nameEn: 'Ankle Mobility',
    category: 'movilidad',
    targetZones: ['tobillo'], injuryTypes: ['esguince'], difficulty: 1,
    description: 'De rodillas frente a una pared, adelantar la rodilla sin despegar el talón.',
    descriptionEs: 'De rodillas frente a una pared, adelantar la rodilla sin despegar el talón.',
    descriptionEn: 'Kneel facing a wall, drive knee forward without lifting the heel.',
    durationSeconds: 0, reps: 10, series: 2, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-4', 
    name: 'Nordic Hamstring', 
    nameEs: 'Nordic Hamstring',
    nameEn: 'Nordic Hamstring Curl',
    category: 'prevencion',
    targetZones: ['isquiosural'], injuryTypes: ['rotura isquios'], difficulty: 3,
    description: 'De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.',
    descriptionEs: 'De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.',
    descriptionEn: 'Kneeling with ankles held by a partner. Lean forward slowly controlling the descent.',
    durationSeconds: 0, reps: 6, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-5', 
    name: 'Ejercicio de Copenhague', 
    nameEs: 'Ejercicio de Copenhague',
    nameEn: 'Copenhagen Adductor Exercise',
    category: 'prevencion',
    targetZones: ['aductores'], injuryTypes: ['pubalgia'], difficulty: 2,
    description: 'Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.',
    descriptionEs: 'Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.',
    descriptionEn: 'Side plank with top leg resting on a bench, lifting the hips.',
    durationSeconds: 20, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-6', 
    name: 'Sentadilla Búlgara', 
    nameEs: 'Sentadilla Búlgara',
    nameEn: 'Bulgarian Split Squat',
    category: 'fortalecimiento',
    targetZones: ['rodilla', 'cuadriceps'], injuryTypes: ['lca'], difficulty: 2,
    description: 'Un pie apoyado atrás en un banco. Flexionar la pierna delantera controlando que la rodilla no colapse hacia adentro.',
    descriptionEs: 'Un pie apoyado atrás en un banco. Flexionar la pierna delantera controlando que la rodilla no colapse hacia adentro.',
    descriptionEn: 'One foot elevated on a bench behind you. Squat down with front leg keeping knee straight.',
    durationSeconds: 0, reps: 10, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-7', 
    name: 'Peso Muerto a Una Pierna', 
    nameEs: 'Peso Muerto a Una Pierna',
    nameEn: 'Single-Leg Deadlift',
    category: 'prevencion',
    targetZones: ['isquiosural', 'cadera'], injuryTypes: ['rotura isquios'], difficulty: 2,
    description: 'Con ligera flexión de rodilla, bajar el tronco recto elevando la pierna trasera.',
    descriptionEs: 'Con ligera flexión de rodilla, bajar el tronco recto elevando la pierna trasera.',
    descriptionEn: 'With a slight knee bend, hinge forward with straight back while lifting rear leg.',
    durationSeconds: 0, reps: 10, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-8', 
    name: 'Estiramiento Isquiosural', 
    nameEs: 'Estiramiento Isquiosural',
    nameEn: 'Hamstring Stretch',
    category: 'recuperacion',
    targetZones: ['isquiosural'], injuryTypes: ['sobrecarga'], difficulty: 1,
    description: 'Pierna extendida en alto, inclinar tronco hacia adelante con la espalda recta.',
    descriptionEs: 'Pierna extendida en alto, inclinar tronco hacia adelante con la espalda recta.',
    descriptionEn: 'Leg extended on an elevated surface, hinge torso forward with straight back.',
    durationSeconds: 30, series: 2, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-9', 
    name: 'Plancha Lateral', 
    nameEs: 'Plancha Lateral',
    nameEn: 'Side Plank',
    category: 'fortalecimiento',
    targetZones: ['core'], injuryTypes: ['lumbalgia'], difficulty: 2,
    description: 'Apoyo sobre un antebrazo y lateral del pie. Elevar cadera alineando el cuerpo.',
    descriptionEs: 'Apoyo sobre un antebrazo y lateral del pie. Elevar cadera alineando el cuerpo.',
    descriptionEn: 'Support on one forearm and side of foot. Raise hips to align body in straight line.',
    durationSeconds: 30, series: 3, source: 'system', createdBy: 'system'
  },
  {
    id: 'sys-10', 
    name: 'Rotación Torácica', 
    nameEs: 'Rotación Torácica',
    nameEn: 'Thoracic Rotation',
    category: 'movilidad',
    targetZones: ['espalda'], injuryTypes: ['lumbalgia'], difficulty: 1,
    description: 'Cuadrupedia, mano en la nuca y rotar el tronco abriendo el pecho hacia arriba.',
    descriptionEs: 'Cuadrupedia, mano en la nuca y rotar el tronco abriendo el pecho hacia arriba.',
    descriptionEn: 'On all fours, hand behind head, rotate torso opening chest upward.',
    durationSeconds: 0, reps: 10, series: 2, source: 'system', createdBy: 'system'
  }
];

export const getLocalizedExercise = (ex, isEnglish) => {
  if (!ex) return ex;
  if (ex.source === 'system') {
    return {
      ...ex,
      name: isEnglish ? (ex.nameEn || ex.name) : (ex.nameEs || ex.name),
      description: isEnglish ? (ex.descriptionEn || ex.description) : (ex.descriptionEs || ex.description)
    };
  }
  return ex;
};

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
      const validCustom = [];
      (data || []).forEach(ex => {
        const rawName = (ex.name || ex.titulo || ex.title || ex.nombre || '').trim();
        const isCorrupt = !rawName || rawName === '<think>' || rawName === '</think>' || rawName.startsWith('<think');

        if (isCorrupt) {
          // Auto-limpieza en segundo plano de documentos huérfanos o con tags <think> en Firestore
          if (ex.id) {
            deleteDocument(`${path}/exercises`, ex.id).catch(err => {
              console.warn('[useExercises] Error purgando ejercicio corrupto:', err);
            });
          }
        } else {
          const cleanName = rawName.replace(/<\/?think>/gi, '').trim();
          validCustom.push({
            ...ex,
            name: cleanName || 'Ejercicio',
            titulo: cleanName || 'Ejercicio'
          });
        }
      });

      // Combinar los predefinidos con los ejercicios válidos
      setExercises([...PREDEFINED_EXERCISES, ...validCustom]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId, getTeamPath]);

  const addExercise = async (exerciseData) => {
    if (!user || !teamId) return null;
    const rawName = (exerciseData.name || exerciseData.titulo || exerciseData.title || exerciseData.nombre || '').trim();
    const cleanName = rawName.replace(/<\/?think>/gi, '').trim();

    if (!cleanName || cleanName === '<think>' || cleanName === '</think>') {
      console.warn('[useExercises] Rechazado ejercicio con nombre inválido o tag <think>');
      return null;
    }

    const path = getTeamPath(teamId);
    const activeLocale = exerciseData.locale || (isEn() ? 'en' : 'es');
    const docId = await addDocument(`${path}/exercises`, {
      ...exerciseData,
      name: cleanName,
      title: cleanName,
      titulo: cleanName,
      locale: activeLocale,
      createdAt: new Date().toISOString()
    });

    await createNotification('success', {
      template: 'notifications.newExerciseSaved',
      payload: { name: cleanName },
      text: t('notifications.newExerciseSaved', { name: cleanName }),
      locale: activeLocale
    });
    return docId;
  };

  const removeExercise = async (id) => {
    if (!user || !teamId) return;
    if (id.startsWith('sys-')) {
      await createNotification('error', {
        template: 'notifications.predefinedExerciseError',
        text: t('notifications.predefinedExerciseError'),
        locale: isEn() ? 'en' : 'es'
      });
      return;
    }
    const path = getTeamPath(teamId);
    return await deleteDocument(`${path}/exercises`, id);
  };

  return { exercises, loading, addExercise, removeExercise };
};
