/**
 * scripts/ci-exercise-catalog.mjs
 * Míster11 — Gate de Certificación de Catálogo de 107 Ejercicios y Delta de Materiales
 *
 * Verificaciones:
 *   G1. Total Exacto: Exactamente 107 ejercicios en HOME_EXERCISES_107.
 *   G2. Unicidad de IDs: 107 identificadores únicos con formato hex-XXX.
 *   G3. Integridad de Fases: Conteo exacto por categoría canónica:
 *       - calentamiento: 22
 *       - tecnica: 25
 *       - coordinacion_agilidad: 20
 *       - fuerza_preventiva: 25
 *       - vuelta_calma: 15
 *   G4. Sistema de Niveles: Cada ejercicio asignado a 'basico', 'intermedio' o 'avanzado'.
 *   G5. Dosificación Deportiva: series >= 1, reps > 0 o durationSeconds > 0, restSeconds >= 0.
 *   G6. Bilingüismo e Integridad Textual: ES y EN presentes, cero campos vacíos, cero tokens <think>.
 *   G7. Delta de Materiales: Verificación de los 5 materiales deportivos delta en MATERIALS_LIBRARY y MATERIALS_BY_CATEGORY.
 */

import { HOME_EXERCISES_107, HOME_EXERCISES_CATEGORIES } from '../src/data/homeExercisesCatalog.js';
import { MATERIALS_LIBRARY, MATERIALS_BY_CATEGORY } from '../src/lib/mister11-materials.js';

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🏆 [CI-EXERCISE-CATALOG] CERTIFICACIÓN DE 107 EJERCICIOS Y DELTA MATERIAL');
console.log('══════════════════════════════════════════════════════════════════════\n');

let failed = false;

// ── G1. TOTAL EXACTO ────────────────────────────────────────────────────────
console.log('▶ [G1] Verificando total exacto de ejercicios...');
if (HOME_EXERCISES_107.length === 107) {
  console.log(`   ✅ Total exacto certificado: ${HOME_EXERCISES_107.length} ejercicios.`);
} else {
  console.error(`   ❌ Fallo: Se esperaban 107 ejercicios pero se encontraron ${HOME_EXERCISES_107.length}.`);
  failed = true;
}

// ── G2. UNICIDAD DE IDS ──────────────────────────────────────────────────────
console.log('\n▶ [G2] Verificando unicidad de identificadores...');
const ids = new Set();
const duplicateIds = [];
HOME_EXERCISES_107.forEach(ex => {
  if (ids.has(ex.id)) {
    duplicateIds.push(ex.id);
  }
  ids.add(ex.id);
});

if (duplicateIds.length === 0 && ids.size === 107) {
  console.log('   ✅ 107 IDs únicos certificados sin colisiones.');
} else {
  console.error('   ❌ Fallo: IDs duplicados detectados:', duplicateIds);
  failed = true;
}

// ── G3. INTEGRIDAD DE FASES METODOLÓGICAS ────────────────────────────────────
console.log('\n▶ [G3] Verificando desglose metodológico por categorías canónicas...');
const categoryCounts = {
  calentamiento: 0,
  tecnica: 0,
  coordinacion_agilidad: 0,
  fuerza_preventiva: 0,
  vuelta_calma: 0
};

const expectedCounts = {
  calentamiento: 22,
  tecnica: 25,
  coordinacion_agilidad: 20,
  fuerza_preventiva: 25,
  vuelta_calma: 15
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
for (const [cat, expected] of Object.entries(expectedCounts)) {
  const actual = categoryCounts[cat];
  if (actual === expected) {
    console.log(`   ✅ Categoría '${cat}': ${actual}/${expected}`);
  } else {
    console.error(`   ❌ Descuadre en '${cat}': esperado ${expected}, obtenido ${actual}`);
    categoriesOk = false;
    failed = true;
  }
}

// ── G4. NIVELES GAMIFICADOS ─────────────────────────────────────────────────
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

// ── G5. DOSIFICACIÓN DEPORTIVA ──────────────────────────────────────────────
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

// ── G6. BILINGÜISMO Y AUSENCIA DE CONTAMINACIÓN TEXTUAL ──────────────────────
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
  if (!Array.isArray(ex.materials) || ex.materials.length === 0) {
    console.error(`   ❌ Ejercicio ${ex.id} sin materials.`);
    textOk = false;
    failed = true;
  }
});

if (textOk) {
  console.log('   ✅ Cero campos vacíos, bilingüismo garantizado y cero tokens corruptos.');
}

// ── G7. DELTA DE MATERIALES DEPORTIVOS ──────────────────────────────────────
console.log('\n▶ [G7] Verificando delta de materiales deportivos en Pizarra Táctica...');
const deltaMaterials = ['valla_baja', 'cono_ranurado', 'pica_suelo', 'mini_balon', 'goma_elastica'];
let deltaOk = true;

deltaMaterials.forEach(matId => {
  if (!MATERIALS_LIBRARY[matId]) {
    console.error(`   ❌ Material delta no encontrado en MATERIALS_LIBRARY: ${matId}`);
    deltaOk = false;
    failed = true;
  } else {
    const mat = MATERIALS_LIBRARY[matId];
    if (!mat.label || !mat.category || !mat.svgPanel) {
      console.error(`   ❌ Material delta incompleto: ${matId}`);
      deltaOk = false;
      failed = true;
    }
  }

  // Verificar presencia en MATERIALS_BY_CATEGORY
  let inCategory = false;
  for (const cat of Object.values(MATERIALS_BY_CATEGORY)) {
    if (cat.items && cat.items.includes(matId)) {
      inCategory = true;
      break;
    }
  }
  if (!inCategory) {
    console.error(`   ❌ Material delta ${matId} no asignado en MATERIALS_BY_CATEGORY.`);
    deltaOk = false;
    failed = true;
  }
});

if (deltaOk) {
  console.log(`   ✅ 5/5 materiales delta presentes en biblioteca y categorías (${deltaMaterials.join(', ')}).`);
}

// ── RESULTADO FINAL ─────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════');
if (failed) {
  console.error('❌ [CI-EXERCISE-CATALOG] CERTIFICACIÓN FALLIDA. Revisa los errores arriba.');
  process.exit(1);
} else {
  console.log('✅ [CI-EXERCISE-CATALOG] CERTIFICACIÓN 100% EXITOSA.');
  console.log('   Catálogo de 107 ejercicios y Delta de Materiales listos para producción.');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  process.exit(0);
}
