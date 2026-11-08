/**
 * src/utils/exerciseSafety.js
 * Míster11 — Motor de Validación Clínica, Seguridad por Edad y Prescripción Casera (Oleada 6.1)
 */

import { DEFAULT_USER_INVENTORY } from '../data/homeExercisesCatalog.js';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../data/exerciseSafetyMap.js';

export { CANONICAL_EXERCISE_SAFETY_MAP };

/**
 * Obtiene el tier de riesgo canónico ('alto' o 'bajo') por ID o ejercicio.
 */
export const getExerciseRiskTier = (exerciseOrId) => {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  if (id && CANONICAL_EXERCISE_SAFETY_MAP[id]) {
    return CANONICAL_EXERCISE_SAFETY_MAP[id].tier_riesgo;
  }
  return isHighClinicalRisk(exerciseOrId) ? 'alto' : 'bajo';
};

/**
 * Obtiene la edad mínima segura canónica por ID o ejercicio.
 */
export const getExerciseMinAge = (exerciseOrId) => {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  if (id && CANONICAL_EXERCISE_SAFETY_MAP[id]) {
    return CANONICAL_EXERCISE_SAFETY_MAP[id].edadMin;
  }
  return exerciseOrId?.edad_minima_segura ?? exerciseOrId?.age_min ?? 0;
};

/**
 * Validador clínico de edad mínima segura (C2: Bloqueo duro).
 * @param {number|null} playerAge - Edad del jugador
 * @param {object} exercise - Ejercicio del catálogo
 * @returns {{ safe: boolean, badge: string|null, reason?: string, message?: string }}
 */
export const assertAgeSafe = (playerAge, exercise) => {
  if (!exercise) return { safe: true, badge: null };
  const minSafe = getExerciseMinAge(exercise);
  if (playerAge !== undefined && playerAge !== null && Number(playerAge) < minSafe) {
    return {
      safe: false,
      reason: 'age_below_minimum',
      badge: 'No apto para esta edad',
      message: `Edad mínima segura recomendada: ${minSafe} años (jugador tiene ${playerAge})`
    };
  }
  return { safe: true, badge: null };
};

/**
 * Clasificador clínico de ejercicios de alto riesgo biomecánico / articular (Oleada 6.4).
 * Incluye: Nordic, Copenhagen (todos los niveles), pliometría/drop jump/box jump,
 * landing/absorción de aterrizaje, cuello/cervical GK, y targetZones críticas.
 */
export const isHighClinicalRisk = (exercise) => {
  if (!exercise) return false;
  const id = typeof exercise === 'string' ? exercise : exercise?.id;
  if (id && CANONICAL_EXERCISE_SAFETY_MAP && CANONICAL_EXERCISE_SAFETY_MAP[id]) {
    const tier = CANONICAL_EXERCISE_SAFETY_MAP[id].tier_riesgo;
    return tier === 'alto' || tier === 'PENDIENTE-FISIO';
  }
  const name = ((exercise.name || '') + ' ' + (exercise.nameEs || '') + ' ' + (exercise.nameEn || '') + ' ' + (exercise.id || '')).toLowerCase();
  const tz = (exercise.targetZones || []).map(z => String(z).toLowerCase());
  
  // 1. Nordic / Hamstring excéntrico
  const isNordic = name.includes('nordic') || name.includes('nórdic') || tz.some(z => z.includes('isquiosurales_excentrico'));
  // 2. Copenhagen / aductores en fuerza preventiva
  const isCopenhagen = name.includes('copenhagen') || name.includes('copenhague') || (tz.includes('aductores') && exercise.category === 'fuerza_preventiva');
  // 3. Pliometría / Drop Jump / Box Jump / Caídas
  const isPlio = name.includes('plio') || name.includes('drop jump') || name.includes('box jump') || name.includes('jump stick') || name.includes('caída desde salto');
  // 4. Landing / Absorción / Prevención LCA
  const isLandingLCA = name.includes('landing') || name.includes('single-leg land') || name.includes('aterrizaje') || tz.some(z => z.includes('prevencion_lca') || z.includes('lca_prevencion') || z === 'lca');
  // 5. Cuello GK / Cervical
  const isNeckGK = name.includes('cuello') || name.includes('cervical') || name.includes('neck') || tz.some(z => z.includes('cuello') || z.includes('cervical'));

  return isNordic || isCopenhagen || isPlio || isLandingLCA || isNeckGK;
};

/**
 * Motor de prescripción segura en casa (C1, C2, C3).
 * Bloquea campo_only, evalúa inventario de usuario con equivalencias y supervisión.
 */
export const canPrescribeAtHome = (exercise, {
  playerAge = null,
  userInventory = DEFAULT_USER_INVENTORY,
  hasSupervision = false,
  hasGymAccess = false,
  locale = 'es'
} = {}) => {
  if (!exercise) return { prescribable: false, reason: 'missing_exercise', badge: 'Inválido' };

  // C3: Aislamiento estricto de técnica de campo
  if (exercise.contexto === 'campo_only') {
    return {
      prescribable: false,
      reason: 'campo_only',
      badge: 'Solo en campo'
    };
  }

  // C3: Gimnasio solo si el usuario tiene acceso
  if (exercise.contexto === 'gym' && !hasGymAccess) {
    return {
      prescribable: false,
      reason: 'gym_required',
      badge: 'Requiere gimnasio'
    };
  }

  // C2: Bloqueo duro de edad mínima segura
  const ageCheck = assertAgeSafe(playerAge, exercise);
  if (!ageCheck.safe) {
    return {
      prescribable: false,
      reason: ageCheck.reason,
      badge: ageCheck.badge,
      message: ageCheck.message
    };
  }

  // C2: Supervisión presencial requerida
  if (exercise.requiere_supervision_presencial && !hasSupervision) {
    return {
      prescribable: false,
      reason: 'supervision_required',
      badge: 'Requiere supervisión presencial'
    };
  }

  // G10 (Oleada 6.4) & E1b / R4: Ejercicio de riesgo alto sin ilustración validada requiere supervisión presencial obligatoria
  // Para tier 'PENDIENTE-FISIO', reviewed_by_human NO basta por sí solo; exige obligatoriamente rigVerifiedBy (firma de fisioterapeuta colegiado)
  const isHighRisk = isHighClinicalRisk(exercise);
  const exerciseId = typeof exercise === 'string' ? exercise : exercise?.id;
  const safetyMeta = exerciseId && CANONICAL_EXERCISE_SAFETY_MAP ? CANONICAL_EXERCISE_SAFETY_MAP[exerciseId] : null;
  const isTierPendienteFisio = safetyMeta?.tier_riesgo === 'PENDIENTE-FISIO';

  const unreviewedIllustration = !exercise.illustration?.reviewed_by_human || exercise.illustration?.type === 'pendiente';
  const fisioVerificationMissing = isTierPendienteFisio && !exercise.illustration?.rigVerifiedBy;

  if (isHighRisk && (unreviewedIllustration || fisioVerificationMissing) && !hasSupervision) {
    const isFisioBlocked = !unreviewedIllustration && fisioVerificationMissing;
    return {
      prescribable: false,
      reason: isFisioBlocked ? 'high_risk_fisio_verification_required' : 'high_risk_unreviewed_illustration',
      badge: isFisioBlocked 
        ? 'Requiere supervisión presencial (firma de fisio requerida)'
        : 'Requiere supervisión presencial (ilustración pendiente)'
    };
  }

  // B5-A: Piloto vectorial bajo riesgo — Fail-closed si está en revisión pendiente sin aprobación humana
  if (exercise.illustration?.status === 'pilot_pending_review' && !exercise.illustration?.reviewed_by_human) {
    return {
      prescribable: false,
      reason: 'pilot_illustration_pending_review',
      badge: 'Ilustración en revisión (aprobación requerida)'
    };
  }

  // C1: Delta de material real y cruce de inventario
  const activeInventory = Array.isArray(userInventory) && userInventory.length > 0 
    ? userInventory 
    : DEFAULT_USER_INVENTORY;
  const inventorySet = new Set(activeInventory);

  const preferred = Array.isArray(exercise.material_preferido) ? exercise.material_preferido : [];
  const preferredMatch = preferred.length === 0 || preferred.every(m => inventorySet.has(m) || m === 'peso_corporal');

  if (preferredMatch) {
    return {
      prescribable: true,
      materialMode: 'preferred',
      selectedMaterial: preferred,
      nota: null,
      badge: null
    };
  }

  // Si no coincide material preferido, comprobar alternativa casera
  const alt = exercise.alternativa_casa;
  const altOptions = Array.isArray(alt?.option) ? alt.option : [];
  const altMatch = altOptions.length > 0 && altOptions.every(m => inventorySet.has(m) || m === 'peso_corporal');

  if (altMatch) {
    const noteObj = alt?.nota || {};
    const noteText = locale === 'en' ? (noteObj.en || noteObj.es || '') : (noteObj.es || noteObj.en || '');
    return {
      prescribable: true,
      materialMode: 'alternative',
      selectedMaterial: altOptions,
      nota: noteText,
      badge: noteText ? `Alternativa casera: ${altOptions.join(', ')}` : null
    };
  }

  // Bloqueo: Sin material requerido ni alternativa casera viable
  const missingName = preferred.length > 0 ? preferred.join(', ') : 'material especifico';
  return {
    prescribable: false,
    reason: 'material_missing',
    badge: `Requiere material: ${missingName}`
  };
};

/**
 * Selector que filtra catálogo casero aplicando C1, C2 y C3.
 */
export const filterHomeExercises = (exercises = [], options = {}) => {
  return exercises.filter(ex => canPrescribeAtHome(ex, options).prescribable);
};
