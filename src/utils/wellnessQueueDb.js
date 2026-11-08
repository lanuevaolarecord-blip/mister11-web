/**
 * src/utils/wellnessQueueDb.js
 * Míster 11 — Cola B: Persistencia Robusta en IndexedDB para Bienestar (Player Check-in)
 *
 * Resuelve la limitación de cuota móvil de localStorage (~5MB) migrando la cola de bienestar
 * m11_wellness_queue a IndexedDB nativo con redundancia de respaldo.
 *
 * REGLA DURA:
 * No altera en absoluto el flujo de auto-guardado, los timers con debounce ni el micro-indicador
 * "Sincronizado" / "saving".
 */

const DB_NAME = 'mister11_wellness_idb';
const DB_VERSION = 1;
const STORE_NAME = 'wellness_store';

let dbInstancePromise = null;

function getDbInstance() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!dbInstancePromise) {
    dbInstancePromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[wellnessQueueDb] Error abriendo IndexedDB, fallback a memoria/localStorage');
          resolve(null);
        };
      } catch (err) {
        console.warn('[wellnessQueueDb] IndexedDB no disponible:', err);
        resolve(null);
      }
    });
  }
  return dbInstancePromise;
}

/**
 * Guarda un elemento de la cola en IndexedDB (con réplica síncrona en localStorage por compatibilidad)
 */
export async function setWellnessQueueItem(key, value) {
  if (!key) return;
  // 1. Espejo síncrono inmediato en localStorage
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (_) {}

  // 2. Persistencia en IndexedDB sin límite de 5MB
  try {
    const db = await getDbInstance();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      await new Promise((res, rej) => {
        tx.oncomplete = () => res(true);
        tx.onerror = () => rej(tx.error);
      });
    }
  } catch (err) {
    console.warn('[wellnessQueueDb] Error guardando en IndexedDB:', err);
  }
}

/**
 * Lee un elemento de bienestar consultando IndexedDB con fallback instantáneo a localStorage
 */
export async function getWellnessQueueItem(key) {
  if (!key) return null;

  // 1. Intentar lectura de IndexedDB
  try {
    const db = await getDbInstance();
    if (db) {
      const val = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (val) {
        return typeof val === 'string' ? JSON.parse(val) : val;
      }
    }
  } catch (_) {}

  // 2. Fallback a localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrar asíncronamente a IndexedDB si aún no estaba
      setWellnessQueueItem(key, parsed).catch(() => {});
      return parsed;
    }
  } catch (_) {}

  return null;
}

/**
 * Versión síncrona de lectura rápida para render inicial sin parpadeos
 */
export function getWellnessQueueItemSync(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Elimina un elemento de bienestar
 */
export async function removeWellnessQueueItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}

  try {
    const db = await getDbInstance();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    }
  } catch (_) {}
}

export default {
  setWellnessQueueItem,
  getWellnessQueueItem,
  getWellnessQueueItemSync,
  removeWellnessQueueItem
};
