import { doc, getDoc, setDoc, serverTimestamp, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Genera un código de equipo único en formato M11-XXXXXX
 */
export const generateTeamCodeString = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres confusos como O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `M11-${code}`;
};

/**
 * Asegura que el equipo tenga un código de acceso registrado en Firestore
 * y en el índice público `team_codes/{code}` para búsqueda rápida.
 */
export const ensureTeamCode = async (teamId, teamPath, teamName, coachUid) => {
  if (!teamId || !teamPath) return null;

  try {
    const teamRef = doc(db, teamPath);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      const data = teamSnap.data();
      if (data.teamCode) {
        const fullCode = data.teamCode.toUpperCase();
        const shortCode = fullCode.replace(/^M11-/, '');
        const payload = {
          teamId,
          teamPath,
          teamName: teamName || data.nombre || data.name || 'Mi Equipo',
          coachUid: coachUid || data.ownerId || '',
          active: true,
          createdAt: serverTimestamp(),
        };

        // Asegurar que exista en el índice global tanto con M11- como sin él
        const indexRef = doc(db, 'team_codes', fullCode);
        const indexSnap = await getDoc(indexRef);
        if (!indexSnap.exists()) {
          await setDoc(indexRef, payload, { merge: true });
        }
        const shortIndexRef = doc(db, 'team_codes', shortCode);
        const shortIndexSnap = await getDoc(shortIndexRef);
        if (!shortIndexSnap.exists()) {
          await setDoc(shortIndexRef, payload, { merge: true });
        }

        return data.teamCode;
      }
    }

    // Si no tiene código, generar uno nuevo
    const newCode = generateTeamCodeString();
    const cleanShort = newCode.replace(/^M11-/, '');
    await setDoc(teamRef, { teamCode: newCode }, { merge: true });

    // Guardar en índice global con y sin prefijo
    const payload = {
      teamId,
      teamPath,
      teamName: teamName || 'Mi Equipo',
      coachUid: coachUid || '',
      active: true,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'team_codes', newCode), payload, { merge: true });
    await setDoc(doc(db, 'team_codes', cleanShort), payload, { merge: true });

    return newCode;
  } catch (err) {
    console.error('[ensureTeamCode] Error al registrar código de equipo:', err);
    return null;
  }
};

/**
 * Regenera un nuevo código de equipo para jugadores y familias.
 * Actualiza el equipo en Firestore y el índice público team_codes.
 * NUNCA altera ni modifica los códigos de cuerpo técnico / staff (staff_codes).
 */
export const regenerateTeamCode = async (teamId, teamPath, teamName, coachUid) => {
  if (!teamId || !teamPath) return null;

  try {
    const teamRef = doc(db, teamPath);
    const newCode = generateTeamCodeString();
    const cleanShort = newCode.replace(/^M11-/, '');

    // 1. Actualizar documento del equipo
    await setDoc(teamRef, {
      teamCode: newCode,
      teamCodeUpdatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Indexar nuevo código (con y sin M11-) para búsqueda instantánea
    const payload = {
      teamId,
      teamPath,
      teamName: teamName || 'Mi Equipo',
      coachUid: coachUid || '',
      active: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'team_codes', newCode), payload, { merge: true });
    await setDoc(doc(db, 'team_codes', cleanShort), payload, { merge: true });

    return newCode;
  } catch (err) {
    console.error('[regenerateTeamCode] Error al regenerar código de equipo:', err);
    throw err;
  }
};



export const getTeamByCode = async (code) => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
  const fullCode = cleanCode.startsWith('M11-') ? cleanCode : `M11-${cleanCode}`;
  const shortCode = fullCode.replace(/^M11-/, '');

  try {
    // 1. Búsqueda directa en índice público team_codes (probando con y sin M11-)
    for (const c of [fullCode, shortCode]) {
      const indexRef = doc(db, 'team_codes', c);
      const indexSnap = await getDoc(indexRef);
      if (indexSnap.exists()) {
        return indexSnap.data();
      }
    }

    // 2. Fallback: buscar en colección global de equipos si no estaba indexado
    const teamsQuery = query(collectionGroup(db, 'teams'), where('teamCode', '==', cleanCode));
    const teamsSnap = await getDocs(teamsQuery);
    if (!teamsSnap.empty) {
      const teamDoc = teamsSnap.docs[0];
      const data = teamDoc.data();
      const teamPath = teamDoc.ref.path;
      const teamData = {
        teamId: teamDoc.id,
        teamPath,
        teamName: data.nombre || data.name || 'Mi Equipo',
        coachUid: data.ownerId || '',
        createdAt: serverTimestamp(),
      };

      // Auto-indexar para futuras consultas rápidas
      try {
        await setDoc(doc(db, 'team_codes', fullCode), teamData, { merge: true });
        await setDoc(doc(db, 'team_codes', shortCode), teamData, { merge: true });
      } catch (idxErr) {
        console.warn('[getTeamByCode] No se pudo auto-indexar:', idxErr);
      }

      return teamData;
    }

    return null;
  } catch (err) {
    console.error('[getTeamByCode] Error al consultar código de equipo:', err);
    return null;
  }
};
