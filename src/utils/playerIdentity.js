import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { normalizeEmail } from './normalizeEmail';

/**
 * Guarda la identidad multi-equipo de un jugador en playerIdentityByEmail/{emailNorm}_{teamId}
 */
export const savePlayerIdentity = async ({
  email,
  teamId,
  teamPath,
  playerId,
  teamName = 'Mi Equipo',
  role = 'player',
  uid = null
}) => {
  if (!email || !teamId) return null;
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return null;

  const docId = `${emailNorm}_${teamId}`;
  const identityData = {
    email,
    emailNorm,
    teamId,
    teamPath: (teamPath || '').replace(/^\/+|\/+$/g, ''),
    playerId: playerId || '',
    teamName: teamName || 'Mi Equipo',
    role: role || 'player',
    uid: uid || null,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'playerIdentityByEmail', docId), identityData, { merge: true });
    return docId;
  } catch (err) {
    console.warn('[playerIdentity] Error guardando identidad multi-equipo:', err);
    return null;
  }
};

/**
 * Obtiene todas las identidades multi-equipo vinculadas a un email.
 * Soporta formato multi-equipo ({emailNorm}_{teamId}) y doc legado ({emailNorm}).
 */
export const getPlayerIdentitiesByEmail = async (email) => {
  if (!email) return [];
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return [];

  const identities = [];

  try {
    // 1. Consultar formato multi-equipo donde emailNorm coincida
    const q = query(collection(db, 'playerIdentityByEmail'), where('emailNorm', '==', emailNorm));
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const data = d.data();
      // Filtrar el doc legado si tuviera el mismo id que emailNorm pero formato antiguo
      identities.push({
        id: d.id,
        ...data,
        teamPath: (data.teamPath || '').replace(/^\/+|\/+$/g, '')
      });
    });

    // 2. Si no encontró ningún registro multi-equipo, intentar leer el doc legado directo
    if (identities.length === 0) {
      const legacySnap = await getDoc(doc(db, 'playerIdentityByEmail', emailNorm));
      if (legacySnap.exists()) {
        const legData = legacySnap.data();
        if (legData.teamId) {
          identities.push({
            id: legacySnap.id,
            ...legData,
            teamPath: (legData.teamPath || '').replace(/^\/+|\/+$/g, '')
          });
        }
      }
    }
  } catch (err) {
    console.warn('[playerIdentity] Error consultando identidades por email:', err);
    // Fallback de contingencia a doc legado si la query da error
    try {
      const legacySnap = await getDoc(doc(db, 'playerIdentityByEmail', emailNorm));
      if (legacySnap.exists()) {
        const legData = legacySnap.data();
        if (legData.teamId) {
          identities.push({
            id: legacySnap.id,
            ...legData,
            teamPath: (legData.teamPath || '').replace(/^\/+|\/+$/g, '')
          });
        }
      }
    } catch (_) {}
  }

  return identities;
};

/**
 * Elimina la identidad de un jugador para un equipo específico
 */
export const deletePlayerIdentity = async (email, teamId) => {
  if (!email || !teamId) return;
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return;

  try {
    await deleteDoc(doc(db, 'playerIdentityByEmail', `${emailNorm}_${teamId}`));
  } catch (err) {
    console.warn('[playerIdentity] Error eliminando identidad:', err);
  }
};
