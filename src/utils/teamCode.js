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
        // Asegurar que exista en el índice global
        const indexRef = doc(db, 'team_codes', data.teamCode.toUpperCase());
        const indexSnap = await getDoc(indexRef);
        if (!indexSnap.exists()) {
          await setDoc(indexRef, {
            teamId,
            teamPath,
            teamName: teamName || data.nombre || data.name || 'Mi Equipo',
            coachUid: coachUid || data.ownerId || '',
            createdAt: serverTimestamp(),
          });
        }
        return data.teamCode;
      }
    }

    // Si no tiene código, generar uno nuevo
    const newCode = generateTeamCodeString();
    await setDoc(teamRef, { teamCode: newCode }, { merge: true });

    // Guardar en índice global
    const indexRef = doc(db, 'team_codes', newCode);
    await setDoc(indexRef, {
      teamId,
      teamPath,
      teamName: teamName || 'Mi Equipo',
      coachUid: coachUid || '',
      createdAt: serverTimestamp(),
    });

    return newCode;
  } catch (err) {
    console.error('[ensureTeamCode] Error al registrar código de equipo:', err);
    return null;
  }
};



/**
 * Busca los datos de un equipo a partir de su código M11-XXXXXX
 */
export const getTeamByCode = async (code) => {
  if (!code) return null;
  let cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode.startsWith('M11-') && cleanCode.length === 6) {
    cleanCode = `M11-${cleanCode}`;
  }

  try {
    // 1. Búsqueda directa en índice público team_codes
    const indexRef = doc(db, 'team_codes', cleanCode);
    const indexSnap = await getDoc(indexRef);
    if (indexSnap.exists()) {
      return indexSnap.data();
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
        await setDoc(indexRef, teamData, { merge: true });
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
