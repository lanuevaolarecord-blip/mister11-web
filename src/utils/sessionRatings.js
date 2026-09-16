/**
 * src/utils/sessionRatings.js
 * Persistencia y cálculo de calificaciones individuales de sesiones (Feature 2).
 */

import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, serverTimestamp, writeBatch, query, orderBy, limit } from 'firebase/firestore';

/**
 * Guarda o actualiza un lote de calificaciones de jugadores para una sesión.
 * @param {string} teamPath - Ruta base del equipo (ej. 'equipos/teamId' o 'users/uid/teams/teamId')
 * @param {string} sessionId - ID de la sesión
 * @param {Object.<string, { rating: number, comment?: string }>} ratingsMap - Mapa playerId -> { rating, comment }
 * @param {string} ratedBy - UID del miembro del staff que califica
 * @returns {Promise<{ success: boolean, count: number }>}
 */
export const saveSessionRatings = async (teamPath, sessionId, ratingsMap = {}, ratedBy = '') => {
  if (!teamPath || !sessionId) {
    throw new Error('teamPath y sessionId son obligatorios para guardar calificaciones.');
  }

  const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');
  const entries = Object.entries(ratingsMap);
  if (entries.length === 0) return { success: true, count: 0 };

  const batch = writeBatch(db);

  entries.forEach(([playerId, data]) => {
    const rawRating = Number(data.rating);
    const validRating = Math.max(0, Math.min(10, isNaN(rawRating) ? 0 : rawRating));
    const cleanComment = String(data.comment || '').trim().slice(0, 200);

    const ratingDocRef = doc(db, `${cleanPath}/sessions/${sessionId}/ratings`, playerId);

    const payload = {
      rating: validRating,
      comment: cleanComment,
      ratedBy: ratedBy || 'staff',
      ratedAt: serverTimestamp(),
      playerId,
      sessionId,
      teamPath: cleanPath
    };

    batch.set(ratingDocRef, payload, { merge: true });
  });

  await batch.commit();

  return {
    success: true,
    count: entries.length
  };
};

/**
 * Obtiene las calificaciones de una sesión específica.
 * @param {string} teamPath - Ruta del equipo
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object.<string, { rating: number, comment: string, ratedBy: string, ratedAt: any }>>}
 */
export const getSessionRatings = async (teamPath, sessionId) => {
  if (!teamPath || !sessionId) return {};

  const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');
  const ratingsRef = collection(db, `${cleanPath}/sessions/${sessionId}/ratings`);
  const snap = await getDocs(ratingsRef);

  const result = {};
  snap.docs.forEach((d) => {
    result[d.id] = { id: d.id, ...d.data() };
  });

  return result;
};

/**
 * Calcula la media de calificaciones de un jugador.
 * @param {Array<{ rating: number }>} ratingsList
 * @returns {number} Calificación media redondeada a 1 decimal (0 a 10)
 */
export const calculatePlayerAverageRating = (ratingsList = []) => {
  const valid = ratingsList.filter(r => typeof r.rating === 'number' && !isNaN(r.rating));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => acc + curr.rating, 0);
  return Number((sum / valid.length).toFixed(1));
};

export default {
  saveSessionRatings,
  getSessionRatings,
  calculatePlayerAverageRating
};
