/**
 * Constructor de filtro canónico para planes individuales.
 * Prohibido consultar playerPlans sin el filtro where('playerId', '==', playerId).
 */
export const buildPlayerPlansFilter = (playerId) => {
  if (!playerId || typeof playerId !== 'string' || !playerId.trim()) {
    throw new Error('[usePlayerPlans] playerId es estrictamente OBLIGATORIO para consultar planes individuales. Prohibido consultar sin scope de pertenencia.');
  }
  return [{ field: 'playerId', operator: '==', value: playerId.trim() }];
};
