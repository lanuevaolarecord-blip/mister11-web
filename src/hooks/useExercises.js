import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { isEn, t } from '../i18n/index.js';
import { HOME_EXERCISES_108, HOME_EXERCISES_CATALOG, DEFAULT_USER_INVENTORY } from '../data/homeExercisesCatalog.js';
import { SYSTEM_CORE_EXERCISES } from '../data/systemCoreExercises.js';

export { HOME_EXERCISES_108, HOME_EXERCISES_CATALOG, DEFAULT_USER_INVENTORY, SYSTEM_CORE_EXERCISES };

export const PREDEFINED_EXERCISES = [
  ...SYSTEM_CORE_EXERCISES,
  ...HOME_EXERCISES_108
];

import { assertAgeSafe, canPrescribeAtHome, filterHomeExercises } from '../utils/exerciseSafety.js';

export { assertAgeSafe, canPrescribeAtHome, filterHomeExercises };

export const getLocalizedExercise = (ex, isEnglish, lang = 'es') => {
  if (!ex) return ex;
  let localizedName = ex.name;
  if (isEnglish) {
    localizedName = ex.nameEn || ex.name;
  } else if (lang === 'pt' && ex.namePt) {
    localizedName = ex.namePt;
  } else if (lang === 'fr' && ex.nameFr) {
    localizedName = ex.nameFr;
  } else if (lang === 'id' && ex.nameId) {
    localizedName = ex.nameId;
  } else if (ex.nameEs) {
    localizedName = ex.nameEs;
  }
  let localizedDesc = ex.description;
  if (isEnglish) {
    localizedDesc = ex.descriptionEn || ex.description;
  } else if (lang === 'pt' && ex.descriptionPt) {
    localizedDesc = ex.descriptionPt;
  } else if (lang === 'fr' && ex.descriptionFr) {
    localizedDesc = ex.descriptionFr;
  } else if (lang === 'id' && ex.descriptionId) {
    localizedDesc = ex.descriptionId;
  } else if (ex.descriptionEs) {
    localizedDesc = ex.descriptionEs;
  }
  return {
    ...ex,
    name: localizedName,
    description: localizedDesc
  };
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
