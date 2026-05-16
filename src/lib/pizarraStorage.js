/**
 * Helper para persistencia local de la Pizarra Táctica.
 * Permite una transición instantánea entre módulos sin esperar a Firestore.
 * 
 * USA canvas.toJSON() para serialización correcta de objetos Fabric.js
 */

const getStorageKey = (teamId, planId) => `mister11_pizarra_cache_${teamId}_${planId}`;

/**
 * Guarda el estado completo del canvas usando toJSON() de Fabric.
 * Debe llamarse CADA VEZ que el canvas cambia (no solo al desmontar).
 */
export const savePizarraLocal = (teamId, planId, canvas) => {
  if (!teamId || !planId || !canvas) return;
  try {
    // toJSON() es el método oficial de Fabric para serializar correctamente
    // todos los objetos, propiedades y datos personalizados
    const canvasJSON = canvas.toJSON(['data', 'selectable', 'evented', 'hasControls', 'hasBorders']);
    localStorage.setItem(getStorageKey(teamId, planId), JSON.stringify(canvasJSON));
  } catch (e) {
    console.warn("Error saving pizarra to localStorage:", e);
  }
};

/**
 * Recupera el estado del canvas guardado en localStorage.
 * Retorna el JSON de Fabric o null si no existe.
 */
export const getPizarraLocal = (teamId, planId) => {
  if (!teamId || !planId) return null;
  try {
    const data = localStorage.getItem(getStorageKey(teamId, planId));
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn("Error reading pizarra from localStorage:", e);
    return null;
  }
};

/**
 * Elimina el estado guardado (al reiniciar pizarra o cambiar de equipo).
 */
export const clearPizarraLocal = (teamId, planId) => {
  if (!teamId || !planId) return;
  localStorage.removeItem(getStorageKey(teamId, planId));
};
