/**
 * src/utils/teamCodeManager.js
 * Míster11 — Gestor Unificado de Códigos de Invitación (Jugadores, Familias y Staff)
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O, 0, I, 1

/**
 * Genera código único de 6 caracteres alfanuméricos
 */
export const generateTeamCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};

/**
 * Valida formato de código de equipo de jugador (6 chars o M11-XXXXXX)
 */
export const validateTeamCode = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') return { valid: false, error: 'empty' };
  const clean = rawCode.trim().toUpperCase();
  const normalized = clean.replace(/^M11-/, '');
  
  if (clean.startsWith('STAFF-')) {
    return { valid: false, isStaffCode: true, error: 'staff_code_in_player_flow' };
  }

  if (normalized.length !== 6) {
    return { valid: false, error: 'length' };
  }

  const validChars = /^[A-Z0-9]{6}$/.test(normalized);
  if (!validChars) {
    return { valid: false, error: 'invalid_chars' };
  }

  return { valid: true, normalizedCode: normalized, fullCode: `M11-${normalized}` };
};

/**
 * Normaliza y formatea un código al formato estándar M11-XXXXXX
 */
export const formatTeamCode = (code) => {
  if (!code) return '';
  const clean = String(code).trim().toUpperCase().replace(/^M11-/, '');
  return clean ? `M11-${clean}` : '';
};

/**
 * Busca equipo en Firestore a partir del código de 6 caracteres o M11-XXXXXX
 */
export const searchTeamByCode = async (rawCode) => {
  const check = validateTeamCode(rawCode);
  if (!check.valid) {
    if (check.isStaffCode) {
      return { found: false, isStaffCode: true, error: 'is_staff_code' };
    }
    return { found: false, error: check.error };
  }

  const codeToTry = [check.fullCode, check.normalizedCode];

  for (const c of codeToTry) {
    try {
      const ref = doc(db, 'team_codes', c);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const teamInfo = {
          code: c,
          teamId: data.teamId,
          teamPath: data.teamPath,
          teamName: data.teamName || data.name || data.nombre || 'Mi Equipo',
          coachUid: data.coachUid || data.ownerId || '',
          category: data.category || data.categoria || 'General',
          isUsed: Boolean(data.isUsed || data.inviteCodeUsed)
        };
        return {
          found: true,
          ...teamInfo,
          team: teamInfo
        };
      }
    } catch (err) {
      console.warn('[teamCodeManager] Error consultando código:', c, err);
    }
  }

  // Fallback: consultar getTeamByCode si no estaba en team_codes
  try {
    const { getTeamByCode } = await import('./teamCode.js');
    const fallbackData = await getTeamByCode(rawCode);
    if (fallbackData && fallbackData.teamId) {
      const teamInfo = {
        code: check.fullCode,
        teamId: fallbackData.teamId,
        teamPath: fallbackData.teamPath,
        teamName: fallbackData.teamName || 'Mi Equipo',
        coachUid: fallbackData.coachUid || '',
        category: fallbackData.category || 'General',
        isUsed: false
      };
      return {
        found: true,
        ...teamInfo,
        team: teamInfo
      };
    }
  } catch (fbErr) {
    console.warn('[teamCodeManager] Fallback getTeamByCode error:', fbErr);
  }

  // Comprobar si pertenece a staff_codes
  try {
    const staffRef = doc(db, 'staff_codes', check.normalizedCode);
    const staffSnap = await getDoc(staffRef);
    if (staffSnap.exists()) {
      return { found: false, isStaffCode: true, staffData: staffSnap.data(), error: 'is_staff_code' };
    }
    const staffPrefixRef = doc(db, 'staff_codes', `STAFF-${check.normalizedCode}`);
    const staffPrefixSnap = await getDoc(staffPrefixRef);
    if (staffPrefixSnap.exists()) {
      return { found: false, isStaffCode: true, staffData: staffPrefixSnap.data(), error: 'is_staff_code' };
    }
  } catch (_) {}

  return { found: false, error: 'not_found' };
};

/**
 * Marca el código como utilizado por un usuario (si aplica a códigos únicos)
 */
export const markCodeAsUsed = async (code, userUid) => {
  if (!code || !userUid) return false;
  try {
    const clean = code.trim().toUpperCase();
    const ref = doc(db, 'team_codes', clean);
    await updateDoc(ref, {
      usedBy: userUid,
      usedAt: serverTimestamp(),
      inviteCodeUsed: true
    });
    return true;
  } catch (err) {
    console.warn('[teamCodeManager] Error marcando código como usado:', err);
    return false;
  }
};
