/**
 * Helper para persistencia local de la Pizarra Táctica.
 * Permite una transición instantánea entre módulos sin esperar a Firestore.
 */

const getStorageKey = (teamId, planId) => `mister11_pizarra_cache_${teamId}_${planId}`;

export const savePizarraLocal = (teamId, planId, canvas, frames) => {
  if (!teamId || !planId || !canvas) return;
  try {
    // Guardamos solo los objetos (jugadores, flechas, materiales)
    // Excluimos el fondo (field) para evitar duplicados al cargar el nuevo campo
    const objects = canvas.getObjects().filter(obj => !obj.data?.isField);
    const data = JSON.stringify({
      objects,
      frames: frames || []
    });
    localStorage.setItem(getStorageKey(teamId, planId), data);
  } catch (e) {
    console.error("Error saving to localStorage", e);
  }
};

export const getPizarraLocal = (teamId, planId) => {
  if (!teamId || !planId) return null;
  try {
    const data = localStorage.getItem(getStorageKey(teamId, planId));
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Error reading from localStorage", e);
    return null;
  }
};

export const clearPizarraLocal = (teamId, planId) => {
  if (!teamId || !planId) return;
  localStorage.removeItem(getStorageKey(teamId, planId));
};
