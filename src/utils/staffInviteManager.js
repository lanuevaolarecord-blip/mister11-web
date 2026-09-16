/**
 * src/utils/staffInviteManager.js
 * Míster11 — Gestor Unificado de Invitaciones para Cuerpo Técnico / Staff
 * 
 * Códigos diferenciados (STAFF-XXXXXX), validación atómica y permisos heredados.
 */

import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { STAFF_ROLES } from '../config/staffRoles.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateStaffCodeString = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};

/**
 * Genera o recupera el código de invitación de staff para un equipo.
 */
export const ensureStaffInviteCode = async (teamId, teamPath, teamName, ownerUid) => {
  if (!teamId || !teamPath) return null;

  try {
    const teamRef = doc(db, teamPath);
    const snap = await getDoc(teamRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.staffInviteCode) {
        const fullCode = data.staffInviteCode.toUpperCase();
        const rawCode = fullCode.replace(/^STAFF-/, '');

        // Asegurar índices en staff_codes
        await setDoc(doc(db, 'staff_codes', fullCode), {
          teamId,
          teamPath,
          teamName: teamName || data.nombre || data.name || 'Mi Equipo',
          ownerUid: ownerUid || data.ownerId || '',
          code: fullCode,
          rawCode,
          updatedAt: serverTimestamp(),
          active: true
        }, { merge: true });

        await setDoc(doc(db, 'staff_codes', rawCode), {
          teamId,
          teamPath,
          teamName: teamName || data.nombre || data.name || 'Mi Equipo',
          ownerUid: ownerUid || data.ownerId || '',
          code: fullCode,
          rawCode,
          updatedAt: serverTimestamp(),
          active: true
        }, { merge: true });

        return fullCode;
      }
    }

    // Si no existe, generar nuevo
    const raw = generateStaffCodeString();
    const fullCode = `STAFF-${raw}`;

    await updateDoc(teamRef, { staffInviteCode: fullCode }).catch(async () => {
      await setDoc(teamRef, { staffInviteCode: fullCode }, { merge: true });
    });

    const payload = {
      teamId,
      teamPath,
      teamName: teamName || 'Mi Equipo',
      ownerUid: ownerUid || '',
      code: fullCode,
      rawCode: raw,
      createdAt: serverTimestamp(),
      active: true
    };

    await setDoc(doc(db, 'staff_codes', fullCode), payload);
    await setDoc(doc(db, 'staff_codes', raw), payload);

    return fullCode;
  } catch (err) {
    console.error('[staffInviteManager] Error generando código de staff:', err);
    return null;
  }
};

/**
 * Valida un código de staff en tiempo real
 */
export const validateStaffInviteCode = async (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return { valid: false, error: 'empty' };
  }

  const clean = rawInput.trim().toUpperCase();
  const rawCode = clean.replace(/^STAFF-/, '');

  if (rawCode.length !== 6) {
    return { valid: false, error: 'length' };
  }

  const validChars = /^[A-Z0-9]{6}$/.test(rawCode);
  if (!validChars) {
    return { valid: false, error: 'invalid_chars' };
  }

  // Buscar en staff_codes
  const codesToTry = [`STAFF-${rawCode}`, rawCode];
  for (const c of codesToTry) {
    try {
      const snap = await getDoc(doc(db, 'staff_codes', c));
      if (snap.exists()) {
        const data = snap.data();
        if (data.active === false) {
          return { valid: false, error: 'expired' };
        }
        return {
          valid: true,
          teamId: data.teamId,
          teamPath: data.teamPath,
          teamName: data.teamName || 'Mi Equipo',
          ownerUid: data.ownerUid || '',
          code: data.code || `STAFF-${rawCode}`,
          rawCode
        };
      }
    } catch (err) {
      console.warn('[staffInviteManager] Error consultando staff_codes:', c, err);
    }
  }

  return { valid: false, error: 'not_found' };
};

/**
 * Vincula un usuario autenticado al equipo como miembro del cuerpo técnico
 */
export const joinTeamAsStaff = async (code, user, selectedRole = 'assistant_coach') => {
  if (!user || !user.uid) {
    return { success: false, error: 'unauthenticated' };
  }

  const validation = await validateStaffInviteCode(code);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { teamId, teamPath, teamName, ownerUid } = validation;

  if (user.uid === ownerUid) {
    return { success: false, error: 'already_owner', teamId, teamName };
  }

  try {
    const teamRef = doc(db, teamPath);
    const teamSnap = await getDoc(teamRef);
    const teamData = teamSnap.exists() ? teamSnap.data() : {};

    const existingMembers = teamData.members || {};
    const existingMemberKeys = Array.isArray(existingMembers)
      ? existingMembers.map(m => (typeof m === 'object' ? m.uid || m.id : m))
      : Object.keys(existingMembers);

    if (existingMemberKeys.includes(user.uid)) {
      return { success: true, alreadyMember: true, teamId, teamName };
    }

    const memberData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Entrenador Staff',
      role: selectedRole,
      joinedAt: new Date().toISOString()
    };

    // Actualizar members en team
    if (Array.isArray(teamData.members)) {
      await updateDoc(teamRef, {
        members: [...teamData.members, memberData],
        [`staffMembers.${user.uid}`]: memberData,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(teamRef, {
        [`members.${user.uid}`]: memberData,
        [`staffMembers.${user.uid}`]: memberData,
        updatedAt: serverTimestamp()
      });
    }

    // Vincular al usuario en shared_teams
    await setDoc(doc(db, `users/${user.uid}/shared_teams`, teamId), {
      teamId,
      teamPath,
      teamName: teamName || 'Mi Equipo',
      role: selectedRole,
      isStaff: true,
      joinedAt: serverTimestamp()
    }, { merge: true });

    // Guardar contexto activo
    localStorage.setItem('mister11_active_mode', 'coach');
    localStorage.setItem(`lastCoachTeam_${user.uid}`, teamId);

    return {
      success: true,
      teamId,
      teamName,
      effectivePlan: teamData.subscriptionPlan || teamData.plan || 'PRO'
    };
  } catch (err) {
    console.error('[staffInviteManager] Error al unirse como staff:', err);
    return { success: false, error: err?.message || 'join_failed' };
  }
};

/**
 * Revoca el acceso de un miembro del cuerpo técnico (exclusivo para Owner)
 */
export const revokeStaffMember = async (teamPath, memberUid) => {
  if (!teamPath || !memberUid) return false;
  try {
    const teamRef = doc(db, teamPath);
    const snap = await getDoc(teamRef);
    if (!snap.exists()) return false;

    const data = snap.data();
    if (Array.isArray(data.members)) {
      const updated = data.members.filter(m => (m.uid || m.id) !== memberUid);
      await updateDoc(teamRef, { members: updated });
    } else if (data.members?.[memberUid]) {
      const copy = { ...data.members };
      delete copy[memberUid];
      await updateDoc(teamRef, { members: copy });
    }

    if (data.staffMembers?.[memberUid]) {
      const copyStaff = { ...data.staffMembers };
      delete copyStaff[memberUid];
      await updateDoc(teamRef, { staffMembers: copyStaff });
    }

    // Remover en users/{memberUid}/shared_teams
    try {
      const teamId = data.id || teamPath.split('/').pop();
      await deleteDoc(doc(db, `users/${memberUid}/shared_teams`, teamId));
    } catch (_) {}

    return true;
  } catch (err) {
    console.error('[staffInviteManager] Error revocando staff:', err);
    return false;
  }
};
