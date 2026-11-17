/**
 * src/data/exerciseSafetyMap.js
 * Míster11 — Mapa de Seguridad por ID (118 = 108 catálogo + 10 sistema)
 *
 * B3-FIX + P12-A (Q1, Q2, Q3, Q4):
 * Este módulo NO re-declara objetos. IMPORTA el catálogo
 * (homeExercisesCatalog.js + systemCoreExercises.js) y PROYECTA los campos
 * de seguridad, resolución de alias (Q1), supervisión efectiva para menores
 * de 10 años (Q2) y zonas biomecánicas canónicas (Q4).
 */

import { HOME_EXERCISES_108 } from './homeExercisesCatalog.js';
import { SYSTEM_CORE_EXERCISES } from './systemCoreExercises.js';
import { normalizeExerciseTargetZones } from './targetZoneCanonicalMap.js';

/**
 * Ids que B3 original marcó 'alto' sin respaldo heredado (sin supervisión requerida).
 * Valor = motivo literal del pendiente.
 */
export const PENDIENTE_FISIO_IDS = {
  'hex-022': "B3 lo marcó 'alto' con edadMin=10 y requiere_supervision_presencial=false: sin campo heredado que lo respalde. Pendiente de clasificación por el fisio.",
  'hex-057': "B3 lo marcó 'alto' con edadMin=12 y requiere_supervision_presencial=false: sin campo heredado que lo respalde. Pendiente de clasificación por el fisio.",
  'hex-077': "B3 lo marcó 'alto' con edadMin=12 y requiere_supervision_presencial=false: sin campo heredado que lo respalde. Pendiente de clasificación por el fisio."
};

const ALL_CATALOG_EXERCISES = [...SYSTEM_CORE_EXERCISES, ...HOME_EXERCISES_108];
const CATALOG_BY_ID = Object.fromEntries(ALL_CATALOG_EXERCISES.map((ex) => [ex.id, ex]));

export const deriveTier = (ex) => {
  const citation = ex.source?.citation || 'sin cita';
  if (PENDIENTE_FISIO_IDS[ex.id]) {
    return {
      tier_riesgo: 'PENDIENTE-FISIO',
      tier_rationale: `[PENDIENTE-FISIO] ${PENDIENTE_FISIO_IDS[ex.id]} Fuente del catálogo: ${citation}`
    };
  }
  if (ex.requiere_supervision_presencial === true) {
    return {
      tier_riesgo: 'alto',
      tier_rationale: `R1: el catálogo declara requiere_supervision_presencial=true (heredado), edad_minima_segura=${ex.edad_minima_segura}. Fuente: ${citation}`
    };
  }
  const q2Note = (typeof ex.edad_minima_segura === 'number' && ex.edad_minima_segura < 10)
    ? ' [Q2=B: edad_minima_segura < 10 exige supervisión presencial efectiva sin promocionar tier_riesgo a alto]'
    : '';
  return {
    tier_riesgo: 'bajo',
    tier_rationale: `R2: el catálogo no exige supervisión presencial ni marca riesgo (sin marca, no juicio clínico). edad_minima_segura=${ex.edad_minima_segura}.${q2Note} Fuente: ${citation}`
  };
};

export const projectSafetyEntry = (ex, byIdMap = CATALOG_BY_ID) => {
  const catalogSupervision = ex.requiere_supervision_presencial === true;
  const underTenSupervision = typeof ex.edad_minima_segura === 'number' && ex.edad_minima_segura < 10;
  const effectiveSupervision = catalogSupervision || underTenSupervision;

  const entry = {
    id: ex.id,
    nombreEs: ex.nameEs || ex.name,
    targetZones: ex.targetZones,
    canonicalTargetZones: normalizeExerciseTargetZones(ex, ex.id, byIdMap),
    source: ex.source?.citation,
    edadMin: ex.edad_minima_segura,
    supervision: catalogSupervision,
    effectiveSupervision,
    supervisionReason: catalogSupervision
      ? 'catalog_supervision_required'
      : (underTenSupervision ? 'q2_age_min_under_10' : null),
    illustrationStatus: ex.illustration?.status || null,
    ...deriveTier(ex)
  };

  if (ex.duplicateOf) {
    const parentEx = byIdMap ? byIdMap[ex.duplicateOf] : null;
    entry.duplicateOf = ex.duplicateOf;
    entry.isAlias = true;
    entry.independentPrescribable = false;
    entry.parentIllustrationStatus = parentEx?.illustration?.status || null;
  }

  return entry;
};

export const CANONICAL_EXERCISE_SAFETY_MAP = Object.fromEntries(
  ALL_CATALOG_EXERCISES.map((ex) => [ex.id, projectSafetyEntry(ex, CATALOG_BY_ID)])
);

export default CANONICAL_EXERCISE_SAFETY_MAP;
