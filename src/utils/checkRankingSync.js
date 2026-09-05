import { collection, doc, getDocs, getDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getWeekKey } from './cognitiveLevels';

/**
 * Función de auditoría y verificación de sincronización del ranking cognitivo.
 * Compara:
 * 1. player.cognitive.weekly.points vs suma de sesiones registradas en la semana actual.
 * 2. player.cognitive.totalXp vs suma total histórica de sesiones.
 * 
 * Si fixIfDivergent es true y hay discrepancias, aplica un writeBatch correctivo.
 * 
 * @param {string} cleanPath - Ruta del equipo o club en Firestore
 * @param {string} playerId - ID del jugador
 * @param {boolean} fixIfDivergent - Auto-reparar si se detectan divergencias
 * @returns {Promise<{ synchronized: boolean, divergences: Array<string>, weeklyPoints: number, calculatedWeekly: number, totalXp: number, calculatedTotal: number }>}
 */
export async function checkRankingSync(cleanPath, playerId, fixIfDivergent = false) {
  if (!cleanPath || !playerId) {
    return {
      synchronized: true,
      divergences: ['Parámetros inválidos (cleanPath o playerId vacío)'],
      weeklyPoints: 0,
      calculatedWeekly: 0,
      totalXp: 0,
      calculatedTotal: 0
    };
  }

  const currentWeekKey = getWeekKey();
  const playerRef = doc(db, `${cleanPath}/players`, playerId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    return {
      synchronized: true,
      divergences: ['Jugador no encontrado en Firestore'],
      weeklyPoints: 0,
      calculatedWeekly: 0,
      totalXp: 0,
      calculatedTotal: 0
    };
  }

  const playerData = playerSnap.data();
  const playerWeekly = playerData.cognitive?.weekly?.weekKey === currentWeekKey
    ? (Number(playerData.cognitive.weekly.points) || 0)
    : 0;
  const playerTotalXp = Number(playerData.cognitive?.totalXp) || 0;

  // Consultar todas las sesiones de Firestore del jugador
  const sessionsCol = collection(db, `${cleanPath}/players/${playerId}/cognitive`);
  const sessionsSnap = await getDocs(sessionsCol);

  let calculatedWeekly = 0;
  let calculatedTotal = 0;

  sessionsSnap.forEach((d) => {
    const s = d.data();
    const xp = Number(s.xpEarned) || 0;
    calculatedTotal += xp;
    if (s.weekKey === currentWeekKey) {
      calculatedWeekly += xp;
    }
  });

  const divergences = [];
  if (playerWeekly !== calculatedWeekly) {
    divergences.push(
      `Discrepancia semanal: el doc del jugador tiene ${playerWeekly} pts y la suma de sesiones suma ${calculatedWeekly} pts (semana ${currentWeekKey}).`
    );
  }

  if (playerTotalXp !== calculatedTotal) {
    divergences.push(
      `Discrepancia total: el doc del jugador tiene ${playerTotalXp} XP y la suma de sesiones suma ${calculatedTotal} XP.`
    );
  }

  const synchronized = divergences.length === 0;

  if (!synchronized && fixIfDivergent) {
    try {
      const batch = writeBatch(db);
      const updates = {
        'cognitive.weekly.weekKey': currentWeekKey,
        'cognitive.weekly.points': calculatedWeekly,
        'cognitive.totalXp': calculatedTotal
      };
      batch.update(playerRef, updates);
      await batch.commit();
      divergences.push('Auto-reparación ejecutada con éxito vía writeBatch.');
    } catch (err) {
      divergences.push(`Error en auto-reparación: ${err.message}`);
    }
  }

  return {
    synchronized,
    divergences,
    weeklyPoints: playerWeekly,
    calculatedWeekly,
    totalXp: playerTotalXp,
    calculatedTotal
  };
}

export default checkRankingSync;
