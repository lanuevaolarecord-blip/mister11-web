/**
 * src/utils/transferOwnership.js
 * Caso Límite 3: Transferencia de propiedad con validación de límite de plan Free.
 */

import { db } from '../firebaseConfig';
import { doc, getDoc, getDocs, collection, query, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { PLANS } from '../config/plans';

export const ERR_TARGET_FREE_LIMIT = 'ERR_TARGET_FREE_LIMIT';

/**
 * Valida si un usuario receptor puede recibir la propiedad de un equipo según su plan y equipos actuales.
 * @param {Object} targetUserData
 * @param {number} ownedTeamsCount
 * @returns {{ allowed: boolean, reason?: string, message?: string }}
 */
export const canTransferOwnership = (targetUserData = {}, ownedTeamsCount = 0) => {
  const plan = (targetUserData.plan || 'free').toLowerCase();
  const isPro = plan === 'pro' || plan.startsWith('club');
  const freeLimit = PLANS.free?.teamLimit || 1;

  if (!isPro && ownedTeamsCount >= freeLimit) {
    return {
      allowed: false,
      reason: 'target_limit_exceeded',
      message: 'El usuario seleccionado ya posee el límite máximo de equipos de su plan gratuito (1 equipo).'
    };
  }

  return {
    allowed: true
  };
};

/**
 * Valida y ejecuta la transferencia de propiedad de un equipo.
 * @param {string} teamId - ID del equipo
 * @param {string} teamPath - Ruta del equipo en Firestore (opcional)
 * @param {string} newOwnerUid - UID del nuevo propietario
 * @param {string} currentOwnerUid - UID del propietario actual
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export const transferTeamOwnership = async (teamId, teamPath, newOwnerUid, currentOwnerUid, options = {}) => {
  if (!teamId || !newOwnerUid || !currentOwnerUid) {
    throw new Error('Parámetros insuficientes para transferir la propiedad del equipo.');
  }

  // 1. Obtener datos del nuevo propietario
  const targetUserRef = doc(db, 'users', newOwnerUid);
  const targetUserSnap = await getDoc(targetUserRef);
  
  const targetUserData = targetUserSnap.exists() ? targetUserSnap.data() : {};
  const targetUserPlan = (targetUserData.plan || 'free').toLowerCase();
  const isTargetPro = targetUserPlan === 'pro' || targetUserPlan.startsWith('club');

  // 2. Si el nuevo dueño es Free, comprobar cuántos equipos posee actualmente
  if (!isTargetPro) {
    // Consultar colección de equipos propios del nuevo usuario
    const targetTeamsRef = collection(db, 'users', newOwnerUid, 'teams');
    const targetTeamsSnap = await getDocs(targetTeamsRef);
    const ownedTeamsCount = targetTeamsSnap.size;

    const freeTeamLimit = PLANS.free?.teamLimit || 1;

    if (ownedTeamsCount >= freeTeamLimit) {
      const error = new Error('El usuario seleccionado ya posee el límite máximo de equipos de su plan gratuito (1 equipo). Debe actualizar a PRO para aceptar la propiedad.');
      error.code = ERR_TARGET_FREE_LIMIT;
      error.targetPlan = 'free';
      error.ownedTeamsCount = ownedTeamsCount;
      throw error;
    }
  }

  // 3. Ejecutar la transferencia atómica
  const resolvedTeamPath = teamPath || `users/${currentOwnerUid}/teams/${teamId}`;
  const teamDocRef = doc(db, resolvedTeamPath);
  const teamSnap = await getDoc(teamDocRef);

  if (!teamSnap.exists()) {
    throw new Error(`No se encontró el documento del equipo en ${resolvedTeamPath}`);
  }

  const teamData = teamSnap.data();

  // Actualizar metadatos de propiedad
  await updateDoc(teamDocRef, {
    ownerUid: newOwnerUid,
    userId: newOwnerUid,
    previousOwnerUid: currentOwnerUid,
    transferredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    success: true,
    newOwnerUid,
    teamId
  };
};

export default transferTeamOwnership;
