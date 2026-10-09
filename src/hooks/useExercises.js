import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { isEn, t } from '../i18n/index.js';
import { HOME_EXERCISES_107, DEFAULT_USER_INVENTORY } from '../data/homeExercisesCatalog.js';

export { HOME_EXERCISES_107, DEFAULT_USER_INVENTORY };

export const SYSTEM_CORE_EXERCISES = [
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
    durationSeconds: 30, series: 3,
    material_preferido: ['peso_corporal', 'suelo', 'colchoneta'],
    alternativa_casa: {
      option: ['suelo'],
      nota: {
        es: 'Puede realizarse directamente sobre esterilla o suelo con toalla.',
        en: 'Can be done directly on mat or floor with a towel.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 10,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Mantener pelvis neutra, no arquear zona lumbar.',
      en: 'Maintain neutral pelvis, avoid arching lower back.'
    },
    source: {
      type: 'guia_fifa',
      citation: 'FIFA 11+ Programme Manual, Part 2 (Core stability)'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 0, reps: 15, series: 3,
    material_preferido: ['peso_corporal', 'suelo'],
    alternativa_casa: {
      option: ['suelo'],
      nota: { es: '', en: '' }
    },
    contexto: 'casa',
    edad_minima_segura: 10,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Alinear rodilla-cadera-hombro al elevar.',
      en: 'Align knee-hip-shoulder upon hip elevation.'
    },
    source: {
      type: 'guia_fifa',
      citation: 'FIFA 11+ Programme Manual, Part 2'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 0, reps: 10, series: 2,
    material_preferido: ['pared'],
    alternativa_casa: {
      option: ['peso_corporal'],
      nota: {
        es: 'Puede usarse marco de puerta o pared de apoyo.',
        en: 'Can use a door frame or wall for support.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 10,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'No despegar el talón del suelo al avanzar la rodilla.',
      en: 'Do not lift heel from floor while advancing knee.'
    },
    source: {
      type: 'estudio_peer_reviewed',
      citation: 'Verhagen et al. 2004, ankle injury prevention'
    },
    createdBy: 'clinical_seed'
  },
  {
    id: 'sys-4', 
    name: 'Nordic Hamstring', 
    nameEs: 'Nordic Hamstring',
    nameEn: 'Nordic Hamstring Curl',
    category: 'prevencion',
    targetZones: ['isquiosural', 'isquiosurales_excentrico'], injuryTypes: ['rotura isquios'], difficulty: 3,
    description: 'De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.',
    descriptionEs: 'De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.',
    descriptionEn: 'Kneeling with ankles held by a partner. Lean forward slowly controlling the descent.',
    durationSeconds: 0, reps: 6, series: 3,
    material_preferido: ['anclaje_pies'],
    alternativa_casa: {
      option: ['sofa_pesado', 'tope_puerta'],
      nota: {
        es: 'Variante asistida casera: usar soporte pesado o tope bajo supervisión.',
        en: 'Home assisted variant: use heavy support or strap under supervision.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 14,
    requiere_supervision_presencial: true,
    safety_notes: {
      es: 'No prescribir sin base de fuerza previa. Progresar de isométrico a asistido a full. Supervisión recomendada.',
      en: 'Do not prescribe without baseline strength. Progress isometric to assisted to full. Recommended supervision.'
    },
    source: {
      type: 'estudio_peer_reviewed',
      citation: 'Petersen et al. 2011, Am J Sports Med'
    },
    createdBy: 'clinical_seed'
  },
  {
    id: 'sys-5', 
    name: 'Ejercicio de Copenhague', 
    nameEs: 'Ejercicio de Copenhague',
    nameEn: 'Copenhagen Adductor Exercise',
    category: 'prevencion',
    targetZones: ['aductores', 'pubalgia_prevencion'], injuryTypes: ['pubalgia'], difficulty: 2,
    description: 'Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.',
    descriptionEs: 'Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.',
    descriptionEn: 'Side plank with top leg resting on a bench, lifting the hips.',
    durationSeconds: 20, series: 3,
    material_preferido: ['silla_estable'],
    alternativa_casa: {
      option: ['escalon'],
      nota: {
        es: 'Uso de escalón o silla baja para reducir palanca aductora.',
        en: 'Use low step or chair to reduce adductor lever.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 14,
    requiere_supervision_presencial: true,
    safety_notes: {
      es: 'Supervisar alineación de cadera para evitar sobrecarga en sínfisis púbica.',
      en: 'Monitor hip alignment to prevent pubic overload.'
    },
    source: {
      type: 'estudio_peer_reviewed',
      citation: 'Thorborg/Hölmich, Copenhagen adduction exercise literature'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 0, reps: 10, series: 3,
    material_preferido: ['silla_estable'],
    alternativa_casa: {
      option: ['escalon'],
      nota: {
        es: 'Escalón reduce altura del pie retrasado.',
        en: 'Step reduces height of rear foot.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 12,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Rodilla delantera estable sin colapso en valgo.',
      en: 'Keep front knee stable without valgus collapse.'
    },
    source: {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 Guidelines; strength & conditioning principles'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 0, reps: 10, series: 3,
    material_preferido: ['peso_corporal'],
    alternativa_casa: {
      option: ['pared'],
      nota: {
        es: 'Pared de apoyo para equilibrio en fase inicial.',
        en: 'Wall support for balance in initial phase.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 12,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Espalda neutra, bisagra de cadera sin rotar pelvis.',
      en: 'Neutral spine, hinge at hip without rotating pelvis.'
    },
    source: {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 Guidelines; hamstring & glute stabilization'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 30, series: 2,
    material_preferido: ['toalla'],
    alternativa_casa: {
      option: ['peso_corporal'],
      nota: {
        es: 'Puede realizarse de pie o sentado sin toalla manteniendo columna neutra.',
        en: 'Can be performed standing or seated without towel keeping neutral spine.'
      }
    },
    contexto: 'casa',
    edad_minima_segura: 10,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Evitar flexión lumbar excesiva; tensión suave sin dolor.',
      en: 'Avoid excessive lumbar flexion; mild stretch without pain.'
    },
    source: {
      type: 'consenso_fisio_colegiado',
      citation: 'ACSM 2022 flexibility; Page 2012 stretching concepts'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 30, series: 3,
    material_preferido: ['peso_corporal', 'suelo'],
    alternativa_casa: {
      option: ['suelo'],
      nota: { es: '', en: '' }
    },
    contexto: 'casa',
    edad_minima_segura: 10,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Codo justo debajo del hombro para proteger articulación.',
      en: 'Elbow directly under shoulder to protect joint.'
    },
    source: {
      type: 'guia_fifa',
      citation: 'FIFA 11+ Programme Manual, Part 2'
    },
    createdBy: 'clinical_seed'
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
    durationSeconds: 0, reps: 10, series: 2,
    material_preferido: ['peso_corporal', 'suelo'],
    alternativa_casa: {
      option: ['suelo'],
      nota: { es: '', en: '' }
    },
    contexto: 'casa',
    edad_minima_segura: 10,
    requiere_supervision_presencial: false,
    safety_notes: {
      es: 'Rotar desde la caja torácica, no forzar cuello.',
      en: 'Rotate from ribcage, do not yank neck.'
    },
    source: {
      type: 'guia_fifa',
      citation: 'FIFA 11+ Programme Manual, Part 1'
    },
    createdBy: 'clinical_seed'
  }
];

export const PREDEFINED_EXERCISES = [
  ...SYSTEM_CORE_EXERCISES,
  ...HOME_EXERCISES_107
];

import { assertAgeSafe, canPrescribeAtHome, filterHomeExercises } from '../utils/exerciseSafety.js';

export { assertAgeSafe, canPrescribeAtHome, filterHomeExercises };

export const getLocalizedExercise = (ex, isEnglish) => {
  if (!ex) return ex;
  return {
    ...ex,
    name: isEnglish ? (ex.nameEn || ex.name) : (ex.nameEs || ex.name),
    description: isEnglish ? (ex.descriptionEn || ex.description) : (ex.descriptionEs || ex.description)
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
