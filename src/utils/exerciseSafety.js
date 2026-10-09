/**
 * src/utils/exerciseSafety.js
 * Míster11 — Motor de Validación Clínica, Seguridad por Edad y Prescripción Casera (Oleada 6.1)
 */

import { DEFAULT_USER_INVENTORY } from '../data/homeExercisesCatalog.js';

/**
 * Validador clínico de edad mínima segura (C2: Bloqueo duro).
 * @param {number|null} playerAge - Edad del jugador
 * @param {object} exercise - Ejercicio del catálogo
 * @returns {{ safe: boolean, badge: string|null, reason?: string, message?: string }}
 */
export const assertAgeSafe = (playerAge, exercise) => {
  if (!exercise) return { safe: true, badge: null };
  const minSafe = exercise.edad_minima_segura ?? exercise.age_min ?? 0;
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
