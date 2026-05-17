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
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

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

export const addDocument = async (collectionName, data) => {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
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
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating document ${id} in ${collectionName}:`, error);
    throw error;
  }
};

export const setDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, {
      ...data,
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

export const createNotification = async (type, text) => {
  try {
    if (!auth.currentUser) return;
    const colRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    await addDoc(colRef, {
      type,
      text,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
