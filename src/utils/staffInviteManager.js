/**
 * src/utils/staffInviteManager.js
 * Míster11 — Gestor Unificado de Invitaciones para Cuerpo Técnico / Staff
 * 
 * Códigos diferenciados (STAFF-XXXXXX), validación atómica y permisos heredados.
 */

import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, collection, getDocs } from 'firebase/firestore';
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
        const rawCode = fullCode.replace(/^STAFF-/, '').replace(/^STF-/, '');

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
 * Valida un código de staff en tiempo real buscando en múltiples fuentes canónicas:
 * 1. staff_codes (ej. STAFF-UZOWSY o UZOWSY)
 * 2. staff_invitations (doc id o inviteCode)
 * 3. team_codes (en caso de usar código de equipo)
 * 4. Colección teams por staffInviteCode
 */
export const validateStaffInviteCode = async (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return { valid: false, error: 'empty' };
  }

  const clean = rawInput.trim();

  // Si parece un token de staff_invitations (ej. staff_17265289_abc123)
  if (clean.toLowerCase().startsWith('staff_')) {
    try {
      const invSnap = await getDoc(doc(db, 'staff_invitations', clean.toLowerCase()));
      if (invSnap.exists()) {
        const data = invSnap.data();
        if (data.status === 'revoked' || data.status === 'cancelled') return { valid: false, error: 'cancelled' };
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) return { valid: false, error: 'expired' };
        return {
          valid: true,
          teamId: data.teamId,
          teamPath: data.teamPath,
          teamName: data.teamName || 'Mi Equipo',
          ownerUid: data.invitedByUid || '',
          code: data.inviteCode || clean,
          rawCode: data.inviteCode || clean,
          role: data.role || 'assistant_coach',
          invitationId: invSnap.id,
          email: data.email || null,
          source: 'staff_invitations_token'
        };
      }
    } catch (_) {}
  }

  const upper = clean.toUpperCase();
  const rawCode = upper.replace(/^STAFF-/, '').replace(/^STF-/, '').replace(/^M11-/, '');

  if (rawCode.length !== 6) {
    return { valid: false, error: 'length' };
  }

  const validChars = /^[A-Z0-9]{6}$/.test(rawCode);
  if (!validChars) {
    return { valid: false, error: 'invalid_chars' };
  }

  // 1. Buscar en staff_codes (ej. STAFF-UZOWSY, UZOWSY, STF-UZOWSY)
  const staffCodesToTry = [`STAFF-${rawCode}`, rawCode, `STF-${rawCode}`];
  for (const c of staffCodesToTry) {
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
          ownerUid: data.ownerUid || data.coachUid || data.ownerId || '',
          code: data.code || `STAFF-${rawCode}`,
          rawCode,
          role: data.role || 'assistant_coach',
          source: 'staff_codes'
        };
      }
    } catch (err) {
      console.warn('[staffInviteManager] Error consultando staff_codes:', c, err);
    }
  }

  // 2. Buscar en staff_invitations (por ID exacto en mayúsculas o minúsculas)
  const invIdsToTry = [rawCode, rawCode.toLowerCase(), `staff_${rawCode}`, `staff_${rawCode.toLowerCase()}`];
  for (const invId of invIdsToTry) {
    try {
      const invSnap = await getDoc(doc(db, 'staff_invitations', invId));
      if (invSnap.exists()) {
        const data = invSnap.data();
        if (data.status === 'revoked' || data.status === 'cancelled') {
          return { valid: false, error: 'cancelled' };
        }
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          return { valid: false, error: 'expired' };
        }
        return {
          valid: true,
          teamId: data.teamId,
          teamPath: data.teamPath,
          teamName: data.teamName || 'Mi Equipo',
          ownerUid: data.invitedByUid || '',
          code: rawCode,
          rawCode,
          role: data.role || 'assistant_coach',
          invitationId: invId,
          email: data.email || null,
          source: 'staff_invitations'
        };
      }
    } catch (err) {
      console.warn('[staffInviteManager] Error consultando staff_invitations doc:', invId, err);
    }
  }

  // 3. Query en staff_invitations donde inviteCode == rawCode
  try {
    const qInv = query(collection(db, 'staff_invitations'), where('inviteCode', '==', rawCode));
    const qSnap = await getDocs(qInv);
    if (!qSnap.empty) {
      const docMatch = qSnap.docs[0];
      const data = docMatch.data();
      if (data.status === 'revoked' || data.status === 'cancelled') {
        return { valid: false, error: 'cancelled' };
      }
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        return { valid: false, error: 'expired' };
      }
      return {
        valid: true,
        teamId: data.teamId,
        teamPath: data.teamPath,
        teamName: data.teamName || 'Mi Equipo',
        ownerUid: data.invitedByUid || '',
        code: rawCode,
        rawCode,
        role: data.role || 'assistant_coach',
        invitationId: docMatch.id,
        email: data.email || null,
        source: 'staff_invitations_query'
      };
    }
  } catch (err) {
    console.warn('[staffInviteManager] Error en query staff_invitations:', err);
  }

  // 4. Buscar en team_codes (en caso de que el usuario haya introducido el código de equipo)
  const teamCodesToTry = [`M11-${rawCode}`, rawCode];
  for (const tc of teamCodesToTry) {
    try {
      const tcSnap = await getDoc(doc(db, 'team_codes', tc));
      if (tcSnap.exists()) {
        const data = tcSnap.data();
        return {
          valid: true,
          teamId: data.teamId,
          teamPath: data.teamPath,
          teamName: data.teamName || 'Mi Equipo',
          ownerUid: data.ownerUid || data.coachUid || data.ownerId || '',
          code: rawCode,
          rawCode,
          role: 'assistant_coach',
          source: 'team_codes'
        };
      }
    } catch (err) {
      console.warn('[staffInviteManager] Error consultando team_codes:', tc, err);
    }
  }

  // 5. Query en coleccion teams por staffInviteCode o teamCode
  try {
    const qTeams = query(collection(db, 'teams'), where('staffInviteCode', 'in', [`STAFF-${rawCode}`, rawCode]));
    const teamsSnap = await getDocs(qTeams);
    if (!teamsSnap.empty) {
      const tDoc = teamsSnap.docs[0];
      const tData = tDoc.data();
      return {
        valid: true,
        teamId: tDoc.id,
        teamPath: `teams/${tDoc.id}`,
        teamName: tData.nombre || tData.name || 'Mi Equipo',
        ownerUid: tData.ownerId || tData.ownerUid || tData.userId || '',
        code: rawCode,
        rawCode,
        role: 'assistant_coach',
        source: 'teams_query'
      };
    }
  } catch (err) {
    console.warn('[staffInviteManager] Error en query teams staffInviteCode:', err);
  }

  try {
    const qTeamsCode = query(collection(db, 'teams'), where('teamCode', 'in', [`M11-${rawCode}`, rawCode]));
    const teamsCodeSnap = await getDocs(qTeamsCode);
    if (!teamsCodeSnap.empty) {
      const tDoc = teamsCodeSnap.docs[0];
      const tData = tDoc.data();
      return {
        valid: true,
        teamId: tDoc.id,
        teamPath: `teams/${tDoc.id}`,
        teamName: tData.nombre || tData.name || 'Mi Equipo',
        ownerUid: tData.ownerId || tData.ownerUid || tData.userId || '',
        code: rawCode,
        rawCode,
        role: 'assistant_coach',
        source: 'teams_teamCode_query'
      };
    }
  } catch (err) {
    console.warn('[staffInviteManager] Error en query teams teamCode:', err);
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

  const { teamId, teamPath, teamName, ownerUid, invitationId } = validation;

  if (user.uid === ownerUid) {
    return { success: false, error: 'already_owner', teamId, teamName };
  }

  try {
    const teamRef = doc(db, teamPath || `teams/${teamId}`);
    const teamSnap = await getDoc(teamRef);
    const teamData = teamSnap.exists() ? teamSnap.data() : {};

    // Verificar si el usuario ya es miembro
    const existingMembers = teamData.members || [];
    const isAlreadyMember = Array.isArray(existingMembers)
      ? existingMembers.some(m => (typeof m === 'object' ? (m.uid || m.id) : m) === user.uid)
      : Boolean(teamData.members && teamData.members[user.uid]);

    if (isAlreadyMember) {
      return { success: false, error: 'already_member', teamId, teamName };
    }

    const effectiveRole = validation.role || selectedRole || 'assistant_coach';

    // 1. Marcar invitación como aceptada si vino de staff_invitations
    if (invitationId) {
      try {
        await updateDoc(doc(db, 'staff_invitations', invitationId), {
          status: 'accepted',
          acceptedByUid: user.uid,
          acceptedByEmail: user.email || '',
          acceptedAt: serverTimestamp()
        });
        if (teamPath) {
          await updateDoc(doc(db, `${teamPath}/staff_invitations`, invitationId), {
            status: 'accepted',
            acceptedByUid: user.uid,
            acceptedByEmail: user.email || '',
            acceptedAt: serverTimestamp()
          }).catch(() => {});
        }
      } catch (_) {}
    }

    // 2. Guardar en subcolección members: ${teamPath}/members/${user.uid}
    const memberDocData = {
      id: user.uid,
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Entrenador Staff',
      name: user.displayName || user.email?.split('@')[0] || 'Entrenador Staff',
      role: effectiveRole,
      normalizedRole: effectiveRole,
      joinedAt: new Date().toISOString()
    };

    if (teamPath) {
      try {
        await setDoc(doc(db, `${teamPath}/members`, user.uid), memberDocData, { merge: true });
      } catch (err) {
        console.warn('[staffInviteManager] Error escribiendo subcoleccion members:', err);
      }
    }

    // 3. Actualizar documento principal del equipo (members, staffMembers, memberRoles)
    try {
      if (Array.isArray(teamData.members)) {
        const withoutUser = teamData.members.filter(m => (m.uid || m.id) !== user.uid);
        await updateDoc(teamRef, {
          members: [...withoutUser, memberDocData],
          [`staffMembers.${user.uid}`]: memberDocData,
          [`memberRoles.${user.uid}`]: effectiveRole,
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(teamRef, {
          [`members.${user.uid}`]: memberDocData,
          [`staffMembers.${user.uid}`]: memberDocData,
          [`memberRoles.${user.uid}`]: effectiveRole,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('[staffInviteManager] Error actualizando team doc:', e);
    }

    // 4. Vincular al usuario en shared_teams
    await setDoc(doc(db, `users/${user.uid}/shared_teams`, teamId), {
      teamId,
      teamPath: teamPath || `teams/${teamId}`,
      teamName: teamName || 'Mi Equipo',
      role: effectiveRole,
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
