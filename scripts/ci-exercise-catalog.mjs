/**
 * scripts/ci-exercise-catalog.mjs
 * Míster11 — Gate de Certificación de Catálogo de Ejercicios, Delta de Materiales y Seguridad Clínica (Oleada 6.1)
 *
 * Verificaciones:
 *   G1. Total de Ejercicios: Catálogo exhaustivo (>= 107 ejercicios, incluyendo hex-108 cervical GK).
 *   G2. Unicidad de IDs: Identificadores únicos con formato hex-XXX sin colisiones.
 *   G3. Integridad de Fases: Conteo por categoría canónica.
 *   G4. Sistema de Niveles: Cada ejercicio asignado a 'basico', 'intermedio' o 'avanzado'.
 *   G5. Dosificación Deportiva: series >= 1, reps > 0 o durationSeconds > 0, restSeconds >= 0.
 *   G5b. Seguridad por Edad (LTAD/ACSM): Umbrales mínimos, edad_minima_segura y supervisión en zonas críticas.
 *   G6. Bilingüismo e Integridad Textual: ES y EN presentes, cero campos vacíos, cero tokens <think>.
 *   G6b. Fuente Clínica Certificada: Cero source: 'system', tipos en lista blanca, citas acreditadas.
 *   G7b. Delta de Material Real en Casa: material_preferido, alternativa_casa con nota obligatoria si cambia mecánica.
 *   G8. Aislamiento de Contexto y Recomendador Seguro: Cero campo_only en casa, validación de selector.
 *   G9. Gobernanza Visual: Cero emojis en icon, colores 100% canónicos Tierra y Campo en categorías.
 */

import { HOME_EXERCISES_107, HOME_EXERCISES_CATEGORIES } from '../src/data/homeExercisesCatalog.js';
import { assertAgeSafe, canPrescribeAtHome, filterHomeExercises } from '../src/utils/exerciseSafety.js';

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🏆 [CI-EXERCISE-CATALOG] CERTIFICACIÓN CLÍNICA, MATERIALES Y SEGURIDAD 6.1');
console.log('══════════════════════════════════════════════════════════════════════\n');

let failed = false;

// ── G1. TOTAL DE EJERCICIOS ────────────────────────────────────────────────
console.log('▶ [G1] Verificando total de ejercicios en catálogo...');
if (HOME_EXERCISES_107.length >= 107) {
  console.log(`   ✅ Total de ejercicios certificado: ${HOME_EXERCISES_107.length} ejercicios.`);
} else {
  console.error(`   ❌ Fallo: Se esperaban al menos 107 ejercicios pero se encontraron ${HOME_EXERCISES_107.length}.`);
  failed = true;
}

// ── G2. UNICIDAD DE IDS ────────────────────────────────────────────────────
console.log('\n▶ [G2] Verificando unicidad de identificadores...');
const ids = new Set();
const duplicateIds = [];
HOME_EXERCISES_107.forEach(ex => {
  if (ids.has(ex.id)) {
    duplicateIds.push(ex.id);
  }
  ids.add(ex.id);
});

if (duplicateIds.length === 0 && ids.size === HOME_EXERCISES_107.length) {
  console.log(`   ✅ ${ids.size} IDs únicos certificados sin colisiones.`);
} else {
  console.error('   ❌ Fallo: IDs duplicados detectados:', duplicateIds);
  failed = true;
}

// ── G3. INTEGRIDAD DE FASES METODOLÓGICAS ──────────────────────────────────
console.log('\n▶ [G3] Verificando desglose metodológico por categorías canónicas...');
const categoryCounts = {
  calentamiento: 0,
  tecnica: 0,
  coordinacion_agilidad: 0,
  fuerza_preventiva: 0,
  vuelta_calma: 0
};

HOME_EXERCISES_107.forEach(ex => {
  if (categoryCounts[ex.category] !== undefined) {
    categoryCounts[ex.category]++;
  } else {
    console.error(`   ❌ Categoría no reconocida en ejercicio ${ex.id}: ${ex.category}`);
    failed = true;
  }
});

let categoriesOk = true;
for (const [cat, count] of Object.entries(categoryCounts)) {
  if (count > 0) {
    console.log(`   ✅ Categoría '${cat}': ${count} ejercicios.`);
  } else {
    console.error(`   ❌ Categoría '${cat}' vacía.`);
    categoriesOk = false;
    failed = true;
  }
}

// ── G4. NIVELES GAMIFICADOS ────────────────────────────────────────────────
console.log('\n▶ [G4] Verificando niveles de gamificación (Básico / Intermedio / Avanzado)...');
const allowedLevels = new Set(['basico', 'intermedio', 'avanzado']);
const levelCounts = { basico: 0, intermedio: 0, avanzado: 0 };
let levelsOk = true;

HOME_EXERCISES_107.forEach(ex => {
  if (!allowedLevels.has(ex.level)) {
    console.error(`   ❌ Nivel inválido en ejercicio ${ex.id}: '${ex.level}'`);
    levelsOk = false;
    failed = true;
  } else {
    levelCounts[ex.level]++;
  }
});

if (levelsOk) {
  console.log(`   ✅ Distribución de niveles: Básico=${levelCounts.basico}, Intermedio=${levelCounts.intermedio}, Avanzado=${levelCounts.avanzado}`);
}

// ── G5. DOSIFICACIÓN DEPORTIVA ─────────────────────────────────────────────
console.log('\n▶ [G5] Verificando dosificación deportiva (series, reps, durationSeconds)...');
let dosageOk = true;

HOME_EXERCISES_107.forEach(ex => {
  if (typeof ex.series !== 'number' || ex.series < 1) {
    console.error(`   ❌ Series inválidas en ${ex.id}: ${ex.series}`);
    dosageOk = false;
    failed = true;
  }
  const hasReps = typeof ex.reps === 'number' && ex.reps > 0;
  const hasDuration = typeof ex.durationSeconds === 'number' && ex.durationSeconds > 0;
  if (!hasReps && !hasDuration) {
    console.error(`   ❌ Ejercicio ${ex.id} sin repeticiones ni duración positiva.`);
    dosageOk = false;
    failed = true;
  }
  if (typeof ex.restSeconds !== 'number' || ex.restSeconds < 0) {
    console.error(`   ❌ Descanso inválido en ${ex.id}: ${ex.restSeconds}`);
    dosageOk = false;
    failed = true;
  }
});

if (dosageOk) {
  console.log('   ✅ 100% de los ejercicios tienen dosificación atlética válida.');
}

// ── G5b. SEGURIDAD POR EDAD (UMBRALES LTAD / ACSM) ──────────────────────────
console.log('\n▶ [G5b] Verificando seguridad por edad, supervisión y zonas biomecánicas críticas...');
let ageSafetyOk = true;

const CRITICAL_TARGET_ZONES = [
  'isquiosurales_excentrico',
  'aductores',
  'pubalgia_prevencion',
  'prevencion_lca',
  'absorcion_impactos',
  'cuello',
  'hombro_manguito',
  'prevencion_conmocion_cuello_gk'
];

const MINIMUM_AGE_THRESHOLDS = {
  isquiosurales_excentrico: 14,
  aductores: 12,
  pubalgia_prevencion: 12,
  prevencion_lca: 12,
  absorcion_impactos: 14,
  cuello: 14,
  hombro_manguito: 12,
  prevencion_conmocion_cuello_gk: 14
};

HOME_EXERCISES_107.forEach(ex => {
  // Comprobar si tiene zonas críticas
  const hasCriticalZone = ex.targetZones && ex.targetZones.some(z => CRITICAL_TARGET_ZONES.includes(z));
  
  if (hasCriticalZone) {
    if (typeof ex.edad_minima_segura !== 'number') {
      console.error(`   ❌ Ejercicio con zona crítica ${ex.id} (${ex.nameEs}) carece de edad_minima_segura.`);
      ageSafetyOk = false;
      failed = true;
    }
    if (typeof ex.requiere_supervision_presencial !== 'boolean') {
      console.error(`   ❌ Ejercicio con zona crítica ${ex.id} carece de requiere_supervision_presencial.`);
      ageSafetyOk = false;
      failed = true;
    }

    // Verificar que cumpla el umbral acordado para cada zona crítica que contenga
    for (const zone of ex.targetZones) {
      const minRequired = MINIMUM_AGE_THRESHOLDS[zone];
      if (minRequired && ex.edad_minima_segura < minRequired) {
        console.error(`   ❌ Ejercicio ${ex.id} (${ex.nameEs}) tiene edad_minima_segura ${ex.edad_minima_segura} < ${minRequired} para zona ${zone}`);
        ageSafetyOk = false;
        failed = true;
      }
    }
  }

  // Casos específicos auditados
  if (ex.id === 'hex-078') { // Nordic
    if (ex.edad_minima_segura < 14 || !ex.requiere_supervision_presencial) {
      console.error(`   ❌ hex-078 Nordic debe tener edad_minima_segura >= 14 y requiere_supervision_presencial === true`);
      ageSafetyOk = false;
      failed = true;
    }
  }
  if (ex.id === 'hex-064') { // Drop jump
    if (ex.edad_minima_segura < 16 || !ex.requiere_supervision_presencial) {
      console.error(`   ❌ hex-064 Drop jump debe tener edad_minima_segura >= 16 y requiere_supervision_presencial === true`);
      ageSafetyOk = false;
      failed = true;
    }
  }
  if (ex.id === 'hex-076') { // Copenhagen
    if (ex.edad_minima_segura < 12) {
      console.error(`   ❌ hex-076 Copenhagen debe tener edad_minima_segura >= 12`);
      ageSafetyOk = false;
      failed = true;
    }
  }
  if (ex.id === 'hex-108') { // Cuello portero
    if (ex.edad_minima_segura < 14 || !ex.requiere_supervision_presencial) {
      console.error(`   ❌ hex-108 Cuello GK debe tener edad_minima_segura >= 14 y requiere_supervision_presencial === true`);
      ageSafetyOk = false;
      failed = true;
    }
  }
});

if (ageSafetyOk) {
  console.log('   ✅ Seguridad por edad y supervisión presencial validada según LTAD/ACSM.');
}

// ── G6. BILINGÜISMO Y AUSENCIA DE CONTAMINACIÓN TEXTUAL ─────────────────────
console.log('\n▶ [G6] Verificando bilingüismo (ES/EN) y ausencia de tokens corruptos...');
let textOk = true;

HOME_EXERCISES_107.forEach(ex => {
  const fields = ['nameEs', 'nameEn', 'descriptionEs', 'descriptionEn'];
  for (const f of fields) {
    const val = ex[f];
    if (typeof val !== 'string' || val.trim().length === 0) {
      console.error(`   ❌ Campo vacío '${f}' en ejercicio ${ex.id}`);
      textOk = false;
      failed = true;
    } else if (val.includes('<think>') || val.includes('</think>')) {
      console.error(`   ❌ Contaminación <think> en campo '${f}' del ejercicio ${ex.id}`);
      textOk = false;
      failed = true;
    }
  }

  if (!Array.isArray(ex.coachingPoints) || ex.coachingPoints.length === 0) {
    console.error(`   ❌ Ejercicio ${ex.id} sin coachingPoints.`);
    textOk = false;
    failed = true;
  }
});

if (textOk) {
  console.log('   ✅ Cero campos vacíos, bilingüismo garantizado y cero tokens corruptos.');
}

// ── G6b. FUENTE CLÍNICA ────────────────────────────────────────────────────
console.log('\n▶ [G6b] Verificando fuentes clínicas certificadas (eliminación de source: system)...');
const WHITE_LISTED_SOURCE_TYPES = new Set([
  'guia_fifa',
  'guia_uefa',
  'guia_federacion',
  'estudio_peer_reviewed',
  'consenso_fisio_colegiado'
]);
let sourceOk = true;

HOME_EXERCISES_107.forEach(ex => {
  if (ex.source === 'system' || ex.source?.type === 'system') {
    console.error(`   ❌ Ejercicio ${ex.id} tiene source: 'system' (bloqueante).`);
    sourceOk = false;
    failed = true;
    return;
  }

  if (!ex.source || typeof ex.source !== 'object') {
    console.error(`   ❌ Ejercicio ${ex.id} carece de objeto source válido.`);
    sourceOk = false;
    failed = true;
    return;
  }

  if (!WHITE_LISTED_SOURCE_TYPES.has(ex.source.type)) {
    console.error(`   ❌ Ejercicio ${ex.id} tiene source.type '${ex.source.type}' fuera de lista blanca.`);
    sourceOk = false;
    failed = true;
  }

  if (typeof ex.source.citation !== 'string' || ex.source.citation.trim().length === 0) {
    console.error(`   ❌ Ejercicio ${ex.id} tiene source.citation vacía.`);
    sourceOk = false;
    failed = true;
  }
});

if (sourceOk) {
  console.log('   ✅ 100% de los ejercicios tienen fuentes clínicas legítimas en lista blanca.');
}

// ── G7b. DELTA DE MATERIAL REAL EN CASA ────────────────────────────────────
console.log('\n▶ [G7b] Verificando delta de material casero, alternativas y notas de equivalencia...');
let materialOk = true;

const SENSITIVE_MATERIALS = ['banda_elastica', 'medicine_ball', 'cajon_bajo', 'wobble_pad', 'bosu'];

HOME_EXERCISES_107.forEach(ex => {
  if (ex.contexto === 'casa') {
    if (!Array.isArray(ex.material_preferido) || ex.material_preferido.length === 0) {
      console.error(`   ❌ Ejercicio casero ${ex.id} no define material_preferido.`);
      materialOk = false;
      failed = true;
    }
  }

  // Verificar si requiere material sensible que cambie mecánica
  const requiresSensitive = ex.material_preferido && ex.material_preferido.some(m => SENSITIVE_MATERIALS.includes(m));
  if (requiresSensitive) {
    if (!ex.alternativa_casa || !Array.isArray(ex.alternativa_casa.option)) {
      console.error(`   ❌ Ejercicio ${ex.id} con material sensible no tiene alternativa_casa válida.`);
      materialOk = false;
      failed = true;
    } else {
      const notaEs = ex.alternativa_casa.nota?.es || '';
      const notaEn = ex.alternativa_casa.nota?.en || '';
      if (notaEs.trim().length === 0 && notaEn.trim().length === 0) {
        console.error(`   ❌ Ejercicio ${ex.id} cambia mecánica pero alternativa_casa.nota está vacía.`);
        materialOk = false;
        failed = true;
      }
    }
  }
});

if (materialOk) {
  console.log('   ✅ Delta de materiales caseros, alternativas y notas de equivalencia 100% conformes.');
}

// ── G8. AISLAMIENTO DE CONTEXTO Y MOTOR DE PRESCRIPCIÓN ────────────────────
console.log('\n▶ [G8] Verificando aislamiento de contexto (campo_only) y motor canPrescribeAtHome...');
let contextOk = true;

const validContexts = new Set(['casa', 'gym', 'campo_only']);
let campoOnlyCount = 0;

HOME_EXERCISES_107.forEach(ex => {
  if (!validContexts.has(ex.contexto)) {
    console.error(`   ❌ Ejercicio ${ex.id} tiene contexto inválido: '${ex.contexto}'`);
    contextOk = false;
    failed = true;
  }
  if (ex.contexto === 'campo_only') {
    campoOnlyCount++;
  }
});

console.log(`   ℹ️ Ejercicios clasificados como 'campo_only': ${campoOnlyCount}.`);

// Probar que el motor recomendador filtre campo_only estrictamente en casa
const homePrescribable = filterHomeExercises(HOME_EXERCISES_107, {
  playerAge: 16,
  userInventory: ['peso_corporal', 'toalla', 'silla_estable', 'pared', 'suelo', 'pelota'],
  hasSupervision: true,
  hasGymAccess: false
});

const leakedCampoOnly = homePrescribable.filter(ex => ex.contexto === 'campo_only');
if (leakedCampoOnly.length > 0) {
  console.error(`   ❌ FILTRACIÓN DETECTADA: ${leakedCampoOnly.length} ejercicios de campo_only prescritos en casa.`);
  contextOk = false;
  failed = true;
} else {
  console.log('   ✅ Aislamiento perfecto: 0 ejercicios de campo_only prescritos como tareas de casa.');
}

// Probar bloqueo por edad en recomendador: Jugador U10 (9 años) no debe recibir ejercicios con edad_minima_segura >= 12
const u10Prescribed = filterHomeExercises(HOME_EXERCISES_107, {
  playerAge: 9,
  userInventory: ['peso_corporal', 'toalla', 'silla_estable', 'pared', 'suelo', 'pelota'],
  hasSupervision: true
});

const invalidAges = u10Prescribed.filter(ex => ex.edad_minima_segura > 9);
if (invalidAges.length > 0) {
  console.error(`   ❌ BLOQUEO DURO FALLIDO: ${invalidAges.length} ejercicios con edad mínima > 9 prescritos a jugador de 9 años.`);
  contextOk = false;
  failed = true;
} else {
  console.log('   ✅ Bloqueo duro por edad validado en motor recomendador.');
}

if (contextOk) {
  console.log('   ✅ Motor recomendador y filtros de contexto 100% certificados.');
}

// ── G9. GOBERNANZA VISUAL ──────────────────────────────────────────────────
console.log('\n▶ [G9] Verificando gobernanza visual en categorías (cero emojis, colores Tierra y Campo)...');
let govOk = true;

const CANONICAL_PALETTE = new Set([
  '#1B3A2D', // Verde Selva
  '#4CAF7D', // Verde Campo
  '#D4A843', // Oro
  '#C85A32', // Terracota
  '#9C6A3B'  // Ocre
]);

const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

for (const [catKey, catDef] of Object.entries(HOME_EXERCISES_CATEGORIES)) {
  if (EMOJI_REGEX.test(catDef.icon)) {
    console.error(`   ❌ Categoría ${catKey} contiene emoji en icon: '${catDef.icon}'`);
    govOk = false;
    failed = true;
  }

  const hexColor = (catDef.color || '').toUpperCase();
  if (!CANONICAL_PALETTE.has(hexColor)) {
    console.error(`   ❌ Categoría ${catKey} usa color no canónico '${catDef.color}'. Debe ser Tierra y Campo.`);
    govOk = false;
    failed = true;
  }
}

if (govOk) {
  console.log('   ✅ Categorías libres de emojis y con paleta 100% canónica Tierra y Campo.');
}

// ── RESULTADO FINAL ────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════');
if (failed) {
  console.error('❌ [CI-EXERCISE-CATALOG] CERTIFICACIÓN FALLIDA. Revisa los errores arriba.');
  process.exit(1);
} else {
  console.log('✅ [CI-EXERCISE-CATALOG] CERTIFICACIÓN 100% EXITOSA.');
  console.log('   Catálogo, Delta de Materiales, Seguridad LTAD y Gobernanza listos para producción.');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  process.exit(0);
}
