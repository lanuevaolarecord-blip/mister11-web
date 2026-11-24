/**
 * src/data/hybridPilotAssets.js
 * Míster11 — Registro piloto local de ilustraciones híbridas Rayos-X 3D (Batch 01).
 * Mantiene la gobernanza D8: estado en revisión del dueño, sin alterar exerciseSafetyMap.
 */
export const HYBRID_PILOT_IDS = new Set([
  'sys-1',
  'sys-2',
  'sys-3',
  'sys-4',
  'sys-5',
  'sys-6',
  'sys-7',
  'sys-8',
  'sys-9',
  'sys-10',
  'hex-075'
]);

export const getHybridPilotUrl = (exerciseId) => {
  if (!exerciseId || !HYBRID_PILOT_IDS.has(exerciseId)) return null;
  return `/assets/exercises/hybrid-pilot/${exerciseId}.svg`;
};
