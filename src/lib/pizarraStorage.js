/**
 * Helper para persistencia local de la Pizarra Táctica.
 * Guarda el estado serializado con el sistema de coordenadas relativas
 * que ya usa el componente (serializarFrame / cargarFrame).
 * 
 * NO usa canvas.toJSON() porque los grupos personalizados de Fabric 
 * necesitan el flujo serializarFrame/cargarFrame para rehidratarse.
 */

const getStorageKey = (teamId, planId) => `mister11_pizarra_v2_${teamId}_${planId}`;

/**
 * Guarda el estado serializado (resultado de serializarFrame).
 * Llamar en cada onChange del canvas.
 */
export const savePizarraLocal = (teamId, planId, frameState) => {
  if (!teamId || !planId || !frameState) return;
  try {
    localStorage.setItem(getStorageKey(teamId, planId), JSON.stringify(frameState));
  } catch (e) {
    console.warn("[pizarraStorage] Error saving:", e);
  }
};

/**
 * Recupera el estado serializado o null si no existe.
 */
export const getPizarraLocal = (teamId, planId) => {
  if (!teamId || !planId) return null;
  try {
    const raw = localStorage.getItem(getStorageKey(teamId, planId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[pizarraStorage] Error reading:", e);
    return null;
  }
};

/**
 * Elimina el estado guardado (al reiniciar pizarra).
 */
export const clearPizarraLocal = (teamId, planId) => {
  if (!teamId || !planId) return;
  localStorage.removeItem(getStorageKey(teamId, planId));
};
