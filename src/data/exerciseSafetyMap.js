/**
 * src/data/exerciseSafetyMap.js
 * Míster11 — Mapa de Seguridad por ID (118 = 108 catálogo + 10 sistema)
 *
 * B3-FIX: este módulo ya NO re-declara objetos. IMPORTA el catálogo
 * (homeExercisesCatalog.js + systemCoreExercises.js) y PROYECTA solo los campos
 * de seguridad. Una única fuente de contenido: el catálogo.
 *
 * Campos HEREDADOS (copiados tal cual del catálogo):
 *   nombreEs, targetZones, source (source.citation), edadMin (edad_minima_segura),
 *   supervision (requiere_supervision_presencial), duplicateOf (si existe).
 *
 * Campo DERIVADO por regla explícita (NO es juicio clínico del agente):
 *   tier_riesgo ∈ { 'alto', 'bajo', 'PENDIENTE-FISIO' } + tier_rationale
 *     R1  requiere_supervision_presencial === true  → 'alto'
 *         (rationale = el campo heredado + la cita de fuente del propio catálogo)
 *     R3  id ∈ PENDIENTE_FISIO_IDS                  → 'PENDIENTE-FISIO'
 *         (B3 original los marcó 'alto' SIN campo heredado que lo respalde;
 *          se revierte a pendiente hasta clasificación del fisio)
 *     R2  resto                                     → 'bajo'
 *         (= sin supervisión presencial requerida ni marca de riesgo en el catálogo;
 *          significa "sin marca", NO "clínicamente inocuo")
 *
 * El age-gate NO depende de tier_riesgo: depende de edadMin (heredado).
 */

import { HOME_EXERCISES_108 } from './homeExercisesCatalog.js';
import { SYSTEM_CORE_EXERCISES } from './systemCoreExercises.js';

/**
 * Ids que B3 original marcó 'alto' sin respaldo heredado (sin supervisión requerida).
 * Valor = motivo literal del pendiente.
 */
export const PENDIENTE_FISIO_IDS = {
  'hex-022': "B3 lo marcó 'alto' con edadMin=10 y requiere_supervision_presencial=false: sin campo heredado que lo respalde. Pendiente de clasificación por el fisio.",
  'hex-057': "B3 lo marcó 'alto' con edadMin=12 y requiere_supervision_presencial=false: sin campo heredado que lo respalde. Pendiente de clasificación por el fisio.",
  'hex-077': "B3 lo marcó 'alto' con edadMin=12 y requiere_supervision_presencial=false: sin campo heredado que lo respalde. Pendiente de clasificación por el fisio."
};

export const deriveTier = (ex) => {
  const citation = ex.source?.citation || 'sin cita';
  if (PENDIENTE_FISIO_IDS[ex.id]) {
    return { tier_riesgo: 'PENDIENTE-FISIO', tier_rationale: `[PENDIENTE-FISIO] ${PENDIENTE_FISIO_IDS[ex.id]} Fuente del catálogo: ${citation}` };
  }
  if (ex.requiere_supervision_presencial === true) {
    return {
      tier_riesgo: 'alto',
      tier_rationale: `R1: el catálogo declara requiere_supervision_presencial=true (heredado), edad_minima_segura=${ex.edad_minima_segura}. Fuente: ${citation}`
    };
  }
  return {
    tier_riesgo: 'bajo',
    tier_rationale: `R2: el catálogo no exige supervisión presencial ni marca riesgo (sin marca, no juicio clínico). edad_minima_segura=${ex.edad_minima_segura}. Fuente: ${citation}`
  };
};

export const projectSafetyEntry = (ex) => {
  const entry = {
    id: ex.id,
    nombreEs: ex.nameEs || ex.name,
    targetZones: ex.targetZones,
    source: ex.source?.citation,
    edadMin: ex.edad_minima_segura,
    supervision: ex.requiere_supervision_presencial === true,
    ...deriveTier(ex)
  };
  if (ex.duplicateOf) entry.duplicateOf = ex.duplicateOf;
  return entry;
};

export const CANONICAL_EXERCISE_SAFETY_MAP = Object.fromEntries(
  [...SYSTEM_CORE_EXERCISES, ...HOME_EXERCISES_108].map((ex) => [ex.id, projectSafetyEntry(ex)])
);

export default CANONICAL_EXERCISE_SAFETY_MAP;
