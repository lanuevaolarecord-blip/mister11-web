import * as real from '@firebase/firestore';
export * from '@firebase/firestore';
import { auth } from '../firebaseConfig';

// Mock references classes to match Firestore API
export class MockDocRef {
  constructor(path) {
    this.type = 'document';
    this.path = path;
    const parts = path.split('/');
    this.id = parts[parts.length - 1];
  }
}

export class MockCollectionRef {
  constructor(path) {
    this.type = 'collection';
    this.path = path;
    const parts = path.split('/');
    this.id = parts[parts.length - 1];
  }
}

// Detect if query or reference belongs to the guest user
const isLocalGuest = (refOrPath) => {
  const activeUid = localStorage.getItem('mister11_active_user_uid');
  if (activeUid === 'invitado-local') return true;

  if (typeof refOrPath === 'string') {
    return refOrPath.includes('invitado-local');
  }
  if (refOrPath && typeof refOrPath.path === 'string') {
    return refOrPath.path.includes('invitado-local');
  }
  return false;
};

// Seed local collections for guest user
const getSeededCollection = (path) => {
  if (path.endsWith('/players')) {
    return [
      {
        id: 'play-1',
        name: 'Marc García',
        nombre: 'Marc García',
        number: 7,
        dorsal: 7,
        position: 'DEL',
        posicion: 'DEL',
        fechaNacimiento: '2010-05-15',
        foot: 'Derecho',
        height: '1.70',
        weight: '62',
        injuries: false,
        injuryType: ''
      },
      {
        id: 'play-2',
        name: 'Carlos Ruiz',
        nombre: 'Carlos Ruiz',
        number: 5,
        dorsal: 5,
        position: 'DEF',
        posicion: 'DEF',
        fechaNacimiento: '2010-03-22',
        foot: 'Derecho',
        height: '1.68',
        weight: '59',
        injuries: false,
        injuryType: ''
      },
      {
        id: 'play-3',
        name: 'Álex Gómez',
        nombre: 'Álex Gómez',
        number: 10,
        dorsal: 10,
        position: 'MC',
        posicion: 'MC',
        fechaNacimiento: '2010-07-10',
        foot: 'Izquierdo',
        height: '1.65',
        weight: '55',
        injuries: false,
        injuryType: ''
      }
    ];
  }
  
  if (path.endsWith('/sessions')) {
    const today = new Date();
    const dateIn = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    return [
      {
        id: 'sess-1',
        title: 'Técnica de pase y control',
        nombre: 'Técnica de pase y control',
        date: dateIn(2),
        time: '17:00',
        duration: 90,
        category: 'Técnica',
        intensity: 'Media',
        objectives: 'Mejorar la precisión del primer toque y la velocidad del pase corto.',
        materials: 'Balones, conos',
        players: [],
        files: [],
        blocks: [
          { id: 1, name: 'Calentamiento', type: 'Física', duration: 15, description: 'Movilidad articular + rondos 4v2.' },
          { id: 2, name: 'Ejercicio de pase en triángulos', type: 'Técnica', duration: 25, description: 'Triángulos de 10m. Pase-control-pase en 2 toques.' },
          { id: 3, name: 'Partido posicional 5v5', type: 'Táctica', duration: 30, description: 'Posesión con zonas prohibidas. Premio a los pases consecutivos.' },
          { id: 4, name: 'Vuelta a la calma', type: 'Física', duration: 10, description: 'Estiramientos en parejas.' }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'sess-2',
        title: 'Táctica defensiva en bloque medio',
        nombre: 'Táctica defensiva en bloque medio',
        date: dateIn(5),
        time: '17:00',
        duration: 90,
        category: 'Táctica',
        intensity: 'Alta',
        objectives: 'Organizar la defensa en bloque medio y trabajar la salida controlada.',
        materials: 'Balones, conos, petos',
        players: [],
        files: [],
        blocks: [
          { id: 1, name: 'Activación táctica', type: 'Física', duration: 15, description: 'Posicionamiento inicial y organización defensiva estática.' },
          { id: 2, name: 'Defensa 8v8 en bloque', type: 'Táctica', duration: 30, description: 'Bloque defensivo medio-bajo. Pressing al portador al recuperar.' },
          { id: 3, name: 'Transición defensa-ataque', type: 'Táctica', duration: 25, description: 'Salida rápida en 3 segundos al recuperar el balón.' },
          { id: 4, name: 'Partido condicionado', type: 'Táctica', duration: 15, description: 'Aplicación de los conceptos trabajados en partido 8v8.' }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  }

  if (path.endsWith('/matches')) {
    const today = new Date();
    const dateIn = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    return [
      {
        id: 'match-1',
        rival: 'Escuela Deportiva Ejemplo',
        fecha: dateIn(7),
        hora: '11:00',
        lugar: 'Campo Municipal',
        esLocal: false,
        convocados: ['play-1', 'play-2', 'play-3'],
        titulares: [],
        suplentes: [],
        formacion: '4-3-3',
        resultado: { local: null, visitante: null },
        goles: [],
        tarjetas: [],
        cambios: [],
        minutosJugados: {},
        valoraciones: {},
        notas: 'Partido de muestra. Edita o elimina este registro.',
        createdAt: new Date().toISOString()
      }
    ];
  }

  if (path.endsWith('/tests')) {
    return [
      { id: '1', nombre: 'Velocidad 30m', descripcion: 'Sprint lineal de 30 metros.', tipoCarga: 'Velocidad', unidad: 's' },
      { id: '2', nombre: 'Salto Vertical', descripcion: 'Salto vertical desde parado.', tipoCarga: 'Fuerza', unidad: 'cm' },
      { id: '3', nombre: 'Course Navette', descripcion: 'Test de resistencia aeróbica.', tipoCarga: 'Resistencia', unidad: 'palier' }
    ];
  }

  return [];
};

// Seed local documents for guest user
const getSeededDoc = (path) => {
  if (path.endsWith('/planificacion/config')) {
    return {
      macroInfo: {
        startDate: '2025-09-01',
        endDate: '2026-06-15',
        category: 'Juvenil',
        objective: 'Adapteremos al equipo en la parte técnica y táctica, mediante trabajos de posición y finalización.',
        trainer: 'Entrenador Invitado',
        sessionDuration: 90,
        trainingDays: [0, 2, 4],
      },
      microcycles: [],
      macroCounts: { sesiones: 0, sesionesMax: 10, trabajo: 0, trabajoMax: 10, compet: 0, competMax: 10 }
    };
  }
  if (path.includes('/settings/config')) {
    return {
      profileName: 'Entrenador Invitado',
      specialty: 'Primer Entrenador',
      clubName: 'FC Invitado',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      notifications: true,
      darkMode: true,
      language: 'Español (ES)'
    };
  }
  return null;
};

// Helper to load collection data from localStorage
const getLocalCollectionData = (path) => {
  const key = `mister11_mock_db_${path}`;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  const seeded = getSeededCollection(path);
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
};

// Local publish-subscribe list for listeners updates
const listeners = {};

const triggerListeners = (path, data) => {
  if (listeners[path]) {
    listeners[path].forEach(cb => {
      if (Array.isArray(data)) {
        const docs = data.map(item => ({
          id: item.id,
          data: () => item,
          exists: () => true
        }));
        cb({
          docs,
          empty: data.length === 0,
          forEach: (c) => docs.forEach(c),
          metadata: { fromCache: true }
        });
      } else {
        cb({
          exists: () => data !== null,
          data: () => data,
          id: path.split('/').pop(),
          metadata: { fromCache: true }
        });
      }
    });
  }
};

// --- INTERCEPTED FUNCTIONS ---

export const doc = (dbOrRef, path, ...childPaths) => {
  const fullPath = [path, ...childPaths].filter(Boolean).join('/');
  const finalPath = (dbOrRef instanceof MockCollectionRef || dbOrRef instanceof MockDocRef) 
    ? `${dbOrRef.path}/${fullPath}` 
    : fullPath;

  if (isLocalGuest(finalPath)) {
    return new MockDocRef(finalPath);
  }
  return real.doc(dbOrRef, path, ...childPaths);
};

export const collection = (dbOrRef, path, ...childPaths) => {
  const fullPath = [path, ...childPaths].filter(Boolean).join('/');
  const finalPath = (dbOrRef instanceof MockCollectionRef || dbOrRef instanceof MockDocRef) 
    ? `${dbOrRef.path}/${fullPath}` 
    : fullPath;

  if (isLocalGuest(finalPath)) {
    return new MockCollectionRef(finalPath);
  }
  return real.collection(dbOrRef, path, ...childPaths);
};

export const query = (ref, ...constraints) => {
  if (ref instanceof MockCollectionRef) {
    // Return mock reference directly, bypassing query logic for local simulation
    return ref;
  }
  return real.query(ref, ...constraints);
};

export const getDoc = async (docRef) => {
  if (docRef instanceof MockDocRef) {
    const key = `mister11_mock_db_${docRef.path}`;
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : getSeededDoc(docRef.path);
    return {
      exists: () => data !== null,
      data: () => data,
      id: docRef.id
    };
  }
  return real.getDoc(docRef);
};

export const getDocs = async (queryRef) => {
  const ref = queryRef.collectionRef || queryRef;
  if (ref instanceof MockCollectionRef) {
    const list = getLocalCollectionData(ref.path);
    const docs = list.map(item => ({
      id: item.id,
      data: () => item,
      exists: () => true
    }));
    return {
      docs,
      empty: list.length === 0,
      forEach: (callback) => docs.forEach(callback),
      metadata: { fromCache: true }
    };
  }
  return real.getDocs(queryRef);
};

export const setDoc = async (docRef, data, options = {}) => {
  if (docRef instanceof MockDocRef) {
    const key = `mister11_mock_db_${docRef.path}`;
    let finalData = data;
    if (options.merge) {
      const stored = localStorage.getItem(key);
      const existing = stored ? JSON.parse(stored) : {};
      finalData = { ...existing, ...data };
    }
    localStorage.setItem(key, JSON.stringify(finalData));
    triggerListeners(docRef.path, finalData);
    
    // Also handle nested document lists for parent collection listeners
    const parts = docRef.path.split('/');
    const docId = parts.pop();
    const parentPath = parts.join('/');
    const parentKey = `mister11_mock_db_${parentPath}`;
    const storedParent = localStorage.getItem(parentKey);
    if (storedParent) {
      const list = JSON.parse(storedParent);
      const idx = list.findIndex(item => item.id === docId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...finalData };
      } else {
        list.push({ id: docId, ...finalData });
      }
      localStorage.setItem(parentKey, JSON.stringify(list));
      triggerListeners(parentPath, list);
    }
    return;
  }
  return real.setDoc(docRef, data, options);
};

export const addDoc = async (collectionRef, data) => {
  if (collectionRef instanceof MockCollectionRef) {
    const list = getLocalCollectionData(collectionRef.path);
    const newId = 'local_' + Math.random().toString(36).substr(2, 9);
    const newDoc = { id: newId, ...data };
    list.push(newDoc);
    localStorage.setItem(`mister11_mock_db_${collectionRef.path}`, JSON.stringify(list));
    triggerListeners(collectionRef.path, list);
    return { id: newId };
  }
  return real.addDoc(collectionRef, data);
};

export const updateDoc = async (docRef, data) => {
  if (docRef instanceof MockDocRef) {
    const key = `mister11_mock_db_${docRef.path}`;
    const stored = localStorage.getItem(key);
    const existing = stored ? JSON.parse(stored) : {};
    const finalData = { ...existing, ...data };
    localStorage.setItem(key, JSON.stringify(finalData));
    triggerListeners(docRef.path, finalData);

    const parts = docRef.path.split('/');
    const docId = parts.pop();
    const parentPath = parts.join('/');
    const parentKey = `mister11_mock_db_${parentPath}`;
    const storedParent = localStorage.getItem(parentKey);
    if (storedParent) {
      const list = JSON.parse(storedParent);
      const idx = list.findIndex(item => item.id === docId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...finalData };
        localStorage.setItem(parentKey, JSON.stringify(list));
        triggerListeners(parentPath, list);
      }
    }
    return;
  }
  return real.updateDoc(docRef, data);
};

export const deleteDoc = async (docRef) => {
  if (docRef instanceof MockDocRef) {
    const path = docRef.path;
    const parts = path.split('/');
    const docId = parts.pop();
    const parentPath = parts.join('/');
    
    const key = `mister11_mock_db_${path}`;
    localStorage.removeItem(key);

    const parentKey = `mister11_mock_db_${parentPath}`;
    const storedParent = localStorage.getItem(parentKey);
    if (storedParent) {
      let list = JSON.parse(storedParent);
      list = list.filter(item => item.id !== docId);
      localStorage.setItem(parentKey, JSON.stringify(list));
      triggerListeners(parentPath, list);
    }
    
    triggerListeners(path, null);
    return;
  }
  return real.deleteDoc(docRef);
};

export const onSnapshot = (refOrQuery, callback, onError) => {
  const ref = refOrQuery.collectionRef || refOrQuery;
  if (ref instanceof MockCollectionRef || ref instanceof MockDocRef) {
    const path = ref.path;
    if (!listeners[path]) {
      listeners[path] = [];
    }
    listeners[path].push(callback);
    
    const key = `mister11_mock_db_${path}`;
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : (ref instanceof MockCollectionRef ? getSeededCollection(path) : getSeededDoc(path));
    
    setTimeout(() => {
      if (Array.isArray(data)) {
        const docs = data.map(item => ({
          id: item.id,
          data: () => item,
          exists: () => true
        }));
        callback({
          docs,
          empty: data.length === 0,
          forEach: (c) => docs.forEach(c),
          metadata: { fromCache: true }
        });
      } else {
        callback({
          exists: () => data !== null,
          data: () => data,
          id: path.split('/').pop(),
          metadata: { fromCache: true }
        });
      }
    }, 0);

    return () => {
      listeners[path] = listeners[path].filter(cb => cb !== callback);
    };
  }
  return real.onSnapshot(refOrQuery, callback, onError);
};

export const writeBatch = (dbRef) => {
  const activeUid = localStorage.getItem('mister11_active_user_uid');
  if (activeUid === 'invitado-local') {
    const operations = [];
    return {
      set: (docRef, data, options) => {
        operations.push({ type: 'set', docRef, data, options });
      },
      update: (docRef, data) => {
        operations.push({ type: 'update', docRef, data });
      },
      delete: (docRef) => {
        operations.push({ type: 'delete', docRef });
      },
      commit: async () => {
        for (const op of operations) {
          if (op.type === 'set') {
            await setDoc(op.docRef, op.data, op.options);
          } else if (op.type === 'update') {
            await updateDoc(op.docRef, op.data);
          } else if (op.type === 'delete') {
            await deleteDoc(op.docRef);
          }
        }
      }
    };
  }
  return real.writeBatch(dbRef);
};

// Re-exports of static variables/functions from real Firestore
export const where = real.where;
export const orderBy = real.orderBy;
export const limit = real.limit;
export const Timestamp = real.Timestamp;
export const increment = real.increment;
export const initializeFirestore = real.initializeFirestore;
export const persistentLocalCache = real.persistentLocalCache;
export const persistentMultipleTabManager = real.persistentMultipleTabManager;

export const serverTimestamp = () => {
  const activeUid = localStorage.getItem('mister11_active_user_uid');
  if (activeUid === 'invitado-local') {
    return new Date().toISOString();
  }
  return real.serverTimestamp();
};
