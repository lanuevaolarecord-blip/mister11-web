import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp,
  setDoc,
  getDoc
} from './firestore-proxy';
import { db, auth } from '../firebaseConfig';
import { isEn } from '../i18n/index.js';

/**
 * Lee un documento único de Firestore.
 * @param {string} collectionPath - Ruta de colección (puede ser anidada: 'users/uid/teams')
 * @param {string} docId - ID del documento
 * @returns {Object|null} Datos del documento o null si no existe
 */
export const getDocument = async (collectionPath, docId) => {
  try {
    const ref = doc(db, collectionPath, docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.error(`[db] Error en getDocument ${collectionPath}/${docId}:`, err);
    return null;
  }
};

export const subscribeToCollection = (collectionName, callback, filters = []) => {
  const colRef = collection(db, collectionName);
  let q = query(colRef);

  if (filters.length > 0) {
    filters.forEach(f => {
      q = query(q, where(f.field, f.operator, f.value));
    });
  }

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
};

const sanitizeForFirestore = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore).filter((v) => v !== undefined);
  // Preservar FieldValue o Timestamp de Firestore
  if (obj._methodName || obj.constructor?.name === 'FieldValue' || (obj.seconds !== undefined && obj.nanoseconds !== undefined)) {
    return obj;
  }
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const clean = sanitizeForFirestore(v);
    if (clean !== undefined) res[k] = clean;
  }
  return res;
};

export const addDocument = async (collectionName, data) => {
  try {
    const colRef = collection(db, collectionName);
    const cleanData = sanitizeForFirestore(data) || {};
    const docRef = await addDoc(colRef, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    const cleanData = sanitizeForFirestore(data) || {};
    // setDoc con { merge: true } asegura que si el documento no existe aún
    // (ej. ID autogenerado temporal match_...), se cree automáticamente sin fallar con "No document to update"
    await setDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Error updating document ${id} in ${collectionName}:`, error);
    throw error;
  }
};

export const setDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    const cleanData = sanitizeForFirestore(data) || {};
    await setDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Error setting document ${id} in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collectionName}:`, error);
    throw error;
  }
};

export const createNotification = async (type, content, targetTeamId = null, extra = {}) => {
  try {
    const uid = auth.currentUser?.uid || localStorage.getItem('mister11_active_user_uid');
    if (!uid || uid === 'invitado-local') return; // Silenciar en modo invitado
    
    const activeTeamId = targetTeamId || localStorage.getItem('mister11_active_team_id');
    const colRef = activeTeamId
      ? collection(db, 'users', uid, 'teams', activeTeamId, 'notifications')
      : collection(db, 'users', uid, 'notifications');

    const isObj = typeof content === 'object' && content !== null;
    const text = isObj ? (content.text || '') : (typeof content === 'string' ? content : '');
    const template = isObj ? content.template : extra.template;
    const payload = isObj ? content.payload : extra.payload;
    const locale = (isObj && content.locale) || extra.locale || (isEn() ? 'en' : 'es');

    const notifData = {
      type,
      text,
      locale,
      createdAt: serverTimestamp()
    };

    if (template) notifData.template = template;
    if (payload) notifData.payload = payload;

    await addDoc(colRef, notifData);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
