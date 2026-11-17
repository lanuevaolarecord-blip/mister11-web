/**
 * src/utils/exerciseSafety.js
 * Míster11 — Motor de Validación Clínica, Seguridad por Edad y Prescripción Casera (Oleada 6.1 / P12-A)
 *
 * Decisiones del DUEÑO aplicadas en P12-A:
 * - Q1=A: hex-001 es alias de sys-3 (duplicateOf) y no se prescribe como ficha independiente;
 *         hereda el bloqueo clínico/visual del padre.
 * - Q2=B: todo ejercicio con edadMin < 10 (ej. edadMin=8) exige supervisión presencial efectiva
 *         (effectiveSupervision = true), sin promocionar su tier_riesgo a 'alto'.
 * - Q3=C: los 5 SVG rechazados por el DUEÑO (status === 'rejected_by_owner') quedan bloqueados
 *         hasta rediseño aprobado; no se habilita el SVG rechazado ni guía orientativa visible.
 * - Q4=B: integración con el normalizador canónico de targetZones (targetZoneCanonicalMap.js).
 */

import { DEFAULT_USER_INVENTORY } from '../data/homeExercisesCatalog.js';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../data/exerciseSafetyMap.js';
import { normalizeExerciseTargetZones, normalizeTargetZone } from '../data/targetZoneCanonicalMap.js';

export { CANONICAL_EXERCISE_SAFETY_MAP, normalizeExerciseTargetZones, normalizeTargetZone };

/**
 * Obtiene el tier de riesgo canónico ('alto', 'bajo' o 'PENDIENTE-FISIO') por ID o ejercicio.
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
  if (typeof exerciseOrId === 'object' && exerciseOrId !== null) {
    if (typeof exerciseOrId.edad_minima_segura === 'number') return exerciseOrId.edad_minima_segura;
    if (typeof exerciseOrId.edadMin === 'number') return exerciseOrId.edadMin;
    if (typeof exerciseOrId.age_min === 'number') return exerciseOrId.age_min;
  }
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  if (id && CANONICAL_EXERCISE_SAFETY_MAP[id]) {
    return CANONICAL_EXERCISE_SAFETY_MAP[id].edadMin;
  }
  return 0;
};

/**
 * Q2=B: Determina si un ejercicio requiere supervisión presencial efectiva.
 * Es true cuando el catálogo lo exige explícitamente O cuando edadMin < 10 (ej. edadMin = 8).
 * No promociona ejercicios de edadMin = 8 a tier_riesgo 'alto'.
 */
export const requiresEffectiveSupervision = (exerciseOrId) => {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  const safetyMeta = id && CANONICAL_EXERCISE_SAFETY_MAP ? CANONICAL_EXERCISE_SAFETY_MAP[id] : null;

  if (typeof exerciseOrId === 'object' && exerciseOrId !== null) {
    if (exerciseOrId.requiere_supervision_presencial === true) return true;
    const minAge = getExerciseMinAge(exerciseOrId);
    if (minAge > 0 && minAge < 10) return true;
  }

  if (safetyMeta) {
    return Boolean(safetyMeta.effectiveSupervision || safetyMeta.supervision || (safetyMeta.edadMin > 0 && safetyMeta.edadMin < 10));
  }

  return false;
};

/**
 * Q1=A: Resuelve el estado de alias (duplicateOf) de un ejercicio.
 */
export const resolveExerciseAlias = (exerciseOrId) => {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  const safetyMeta = id && CANONICAL_EXERCISE_SAFETY_MAP ? CANONICAL_EXERCISE_SAFETY_MAP[id] : null;
  const duplicateOf = (typeof exerciseOrId === 'object' && exerciseOrId !== null && 'duplicateOf' in exerciseOrId)
    ? exerciseOrId.duplicateOf
    : (safetyMeta?.duplicateOf || null);

  if (!duplicateOf) {
    return {
      isAlias: false,
      id: id || null,
      duplicateOf: null,
      independentPrescribable: true,
      parentIllustrationStatus: null,
      label: null
    };
  }

  const parentMeta = CANONICAL_EXERCISE_SAFETY_MAP?.[duplicateOf] || null;
  const parentIllustrationStatus = (typeof exerciseOrId === 'object' && exerciseOrId?.parentIllustrationStatus)
    || parentMeta?.illustrationStatus
    || safetyMeta?.parentIllustrationStatus
    || null;

  return {
    isAlias: true,
    id: id || null,
    duplicateOf,
    independentPrescribable: false,
    parentIllustrationStatus,
    parentExists: Boolean(parentMeta),
    label: `Alias/variante de ${duplicateOf}`
  };
};

/**
 * Q3=C: Estado de renderizado seguro de ilustración.
 * Bloquea el SVG viejo rechazado y prohíbe habilitar guía orientativa antes del rediseño aprobado por el DUEÑO.
 * Aplica tanto a los 5 rechazados (sys-1, sys-2, sys-3, sys-8, sys-9) como a sus alias (hex-001 -> sys-3).
 */
export const getIllustrationRenderState = (exerciseOrId) => {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  const safetyMeta = id && CANONICAL_EXERCISE_SAFETY_MAP ? CANONICAL_EXERCISE_SAFETY_MAP[id] : null;
  const aliasInfo = resolveExerciseAlias(exerciseOrId);

  const directStatus = (typeof exerciseOrId === 'object' && exerciseOrId?.illustration?.status)
    || safetyMeta?.illustrationStatus
    || null;
  const effectiveStatus = directStatus || aliasInfo.parentIllustrationStatus || null;

  if (effectiveStatus === 'rejected_by_owner') {
    return {
      renderable: false,
      svgAllowed: false,
      guideAllowed: false,
      status: 'rejected_by_owner',
      inheritedFrom: aliasInfo.isAlias ? aliasInfo.duplicateOf : null,
      placeholder: 'Ilustración pendiente de rediseño aprobado por el DUEÑO'
    };
  }

  if (aliasInfo.isAlias) {
    return {
      renderable: false,
      svgAllowed: false,
      guideAllowed: false,
      status: 'alias_non_independent',
      inheritedFrom: aliasInfo.duplicateOf,
      placeholder: `Alias/variante de ${aliasInfo.duplicateOf}`
    };
  }

  const ill = typeof exerciseOrId === 'object' ? exerciseOrId?.illustration : null;
  const isApproved = Boolean(ill && ill.reviewed_by_human === true && ill.type !== 'pendiente' && ill.status !== 'rejected_by_owner');

  return {
    renderable: isApproved,
    svgAllowed: isApproved,
    guideAllowed: isApproved,
    status: effectiveStatus || ill?.type || 'pendiente',
    inheritedFrom: null,
    placeholder: isApproved ? null : 'Ilustración pendiente de rediseño aprobado por el DUEÑO'
  };
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
 * Motor de prescripción segura en casa (C1, C2, C3 + P12-A Q1, Q2, Q3).
 * Bloquea alias no independientes (Q1), exige supervisión para edadMin < 10 (Q2),
 * bloquea ilustraciones rechazadas por el DUEÑO (Q3), aísla campo_only y evalúa inventario.
 */
export const canPrescribeAtHome = (exercise, {
  playerAge = null,
  userInventory = DEFAULT_USER_INVENTORY,
  hasSupervision = false,
  hasGymAccess = false,
  locale = 'es'
} = {}) => {
  if (!exercise) return { prescribable: false, reason: 'missing_exercise', badge: 'Inválido' };

  const exerciseId = typeof exercise === 'string' ? exercise : exercise?.id;
  const safetyMeta = exerciseId && CANONICAL_EXERCISE_SAFETY_MAP ? CANONICAL_EXERCISE_SAFETY_MAP[exerciseId] : null;

  // Q1=A: Si el ejercicio tiene duplicateOf (ej. hex-001 -> sys-3), es alias no independiente
  // y hereda el bloqueo del padre si el padre está en rejected_by_owner.
  const aliasInfo = resolveExerciseAlias(exercise);
  if (aliasInfo.isAlias) {
    if (aliasInfo.parentIllustrationStatus === 'rejected_by_owner') {
      return {
        prescribable: false,
        reason: 'alias_of_blocked_exercise',
        inheritedReason: 'illustration_rejected_by_owner',
        duplicateOf: aliasInfo.duplicateOf,
        badge: `Alias/variante de ${aliasInfo.duplicateOf} bloqueado (ilustración rechazada por el dueño)`
      };
    }
    return {
      prescribable: false,
      reason: 'alias_not_independent',
      duplicateOf: aliasInfo.duplicateOf,
      badge: `Alias/variante de ${aliasInfo.duplicateOf} (no prescribible como ficha independiente)`
    };
  }

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

  // D2 / Q3=C: Ilustraciones rechazadas por el DUEÑO — Fail-closed absoluto (incluso con supervisión)
  const effectiveIllStatus = exercise.illustration?.status || (!exercise.illustration ? safetyMeta?.illustrationStatus : null);
  if (effectiveIllStatus === 'rejected_by_owner') {
    return {
      prescribable: false,
      reason: 'illustration_rejected_by_owner',
      badge: 'Ilustración rechazada por el dueño (rediseño biomecánico requerido)'
    };
  }

  // C2 + Q2=B: Supervisión presencial requerida (heredada del catálogo o derivada por edadMin < 10)
  const minSafeAge = getExerciseMinAge(exercise);
  const catalogSupervision = Boolean(exercise.requiere_supervision_presencial);
  const under10Supervision = minSafeAge > 0 && minSafeAge < 10;
  if ((catalogSupervision || under10Supervision) && !hasSupervision) {
    return {
      prescribable: false,
      reason: 'supervision_required',
      subReason: (!catalogSupervision && under10Supervision) ? 'q2_age_min_under_10' : 'catalog_supervision_required',
      badge: (!catalogSupervision && under10Supervision)
        ? 'Requiere supervisión presencial (edad mínima < 10 años)'
        : 'Requiere supervisión presencial'
    };
  }

  // G10 (Oleada 6.4) & E1b / R4: Ejercicio de riesgo alto sin ilustración validada requiere supervisión presencial obligatoria
  // Para tier 'PENDIENTE-FISIO', reviewed_by_human NO basta por sí solo; exige obligatoriamente rigVerifiedBy (firma de fisioterapeuta colegiado)
  const isHighRisk = isHighClinicalRisk(exercise);
  const isTierPendienteFisio = safetyMeta?.tier_riesgo === 'PENDIENTE-FISIO';

  const unreviewedIllustration = !exercise.illustration?.reviewed_by_human || exercise.illustration?.type === 'pendiente';

  // S1 (R4): PENDIENTE-FISIO exige rigVerifiedBy colegiada obligatoria; la supervisión del coach NO sustituye la firma del fisio
  if (isTierPendienteFisio && !exercise.illustration?.rigVerifiedBy) {
    return {
      prescribable: false,
      reason: 'high_risk_fisio_verification_required',
      badge: 'Bloqueado clínicamente (firma de fisio requerida, supervisión no sustituye)'
    };
  }

  if (isHighRisk && unreviewedIllustration && !hasSupervision) {
    return {
      prescribable: false,
      reason: 'high_risk_unreviewed_illustration',
      badge: 'Requiere supervisión presencial (ilustración pendiente)'
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
 * Selector que filtra catálogo casero aplicando C1, C2, C3 y P12-A (Q1, Q2, Q3).
 * Excluye todo alias con duplicateOf (Q1=A).
 */
export const filterHomeExercises = (exercises = [], options = {}) => {
  return exercises.filter(ex => !resolveExerciseAlias(ex).isAlias && canPrescribeAtHome(ex, options).prescribable);
};
