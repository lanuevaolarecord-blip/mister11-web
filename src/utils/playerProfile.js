/**
 * src/utils/playerProfile.js
 * Utilidades para gestión y validación del perfil del jugador (Feature 1).
 */

import { db } from '../firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const HEIGHT_MIN = 100;
export const HEIGHT_MAX = 230;
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 150;

/**
 * Calcula el IMC (BMI) reactivo a partir de altura (cm) y peso (kg).
 * @param {number|string} height - Altura en cm
 * @param {number|string} weight - Peso en kg
 * @returns {{ value: number, statusKey: 'underweight'|'normal'|'overweight'|'obese' } | null}
 */
export const calculateBMI = (height, weight) => {
  const h = Number(height);
  const w = Number(weight);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const heightM = h / 100;
  const bmiVal = Number((w / (heightM * heightM)).toFixed(1));
  let statusKey = 'normal';
  if (bmiVal < 18.5) statusKey = 'underweight';
  else if (bmiVal >= 25 && bmiVal < 30) statusKey = 'overweight';
  else if (bmiVal >= 30) statusKey = 'obese';
  return { value: bmiVal, statusKey };
};

/**
 * Valida los rangos físicos de altura y peso.
 * @param {{ height?: number|string, weight?: number|string }} stats
 * @returns {{ valid: boolean, errors: { height?: string, weight?: string } }}
 */
export const validatePhysicalStats = ({ height, weight }) => {
  const errors = {};

  if (height !== undefined && height !== null && height !== '') {
    const numHeight = Number(height);
    if (isNaN(numHeight) || numHeight < HEIGHT_MIN || numHeight > HEIGHT_MAX) {
      errors.height = `La altura debe estar entre ${HEIGHT_MIN} y ${HEIGHT_MAX} cm.`;
    }
  }

  if (weight !== undefined && weight !== null && weight !== '') {
    const numWeight = Number(weight);
    if (isNaN(numWeight) || numWeight < WEIGHT_MIN || numWeight > WEIGHT_MAX) {
      errors.weight = `El peso debe estar entre ${WEIGHT_MIN} y ${WEIGHT_MAX} kg.`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Actualiza la altura y peso del jugador en Firestore con serverTimestamp().
 * @param {string} teamPath - Ruta del equipo (ej. 'users/uid/teams/teamId' o 'equipos/teamId')
 * @param {string} playerId - ID del jugador
 * @param {{ height?: number|string, weight?: number|string }} physicalStats
 * @returns {Promise<{ success: boolean, height: number, weight: number }>}
 */
export const updatePhysicalStats = async (teamPath, playerId, { height, weight }) => {
  if (!teamPath || !playerId) {
    throw new Error('teamPath y playerId son obligatorios para actualizar las estadísticas físicas.');
  }

  const validation = validatePhysicalStats({ height, weight });
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    const err = new Error(firstError);
    err.validationErrors = validation.errors;
    throw err;
  }

  const cleanHeight = height !== '' && height !== null && height !== undefined ? Number(height) : null;
  const cleanWeight = weight !== '' && weight !== null && weight !== undefined ? Number(weight) : null;

  const playerDocRef = doc(db, `${teamPath.replace(/^\/+|\/+$/g, '')}/players`, playerId);

  const payload = {
    updatedAt: serverTimestamp()
  };

  if (cleanHeight !== null) payload.height = cleanHeight;
  if (cleanWeight !== null) payload.weight = cleanWeight;

  await updateDoc(playerDocRef, payload);

  return {
    success: true,
    height: cleanHeight,
    weight: cleanWeight
  };
};

export default updatePhysicalStats;
