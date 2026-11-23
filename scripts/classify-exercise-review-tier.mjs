/**
 * scripts/classify-exercise-review-tier.mjs
 * MÍSTER 11 — Clasificador Read-Only de Niveles de Revisión Humana (Oleada 10)
 *
 * Lee el catálogo completo de 118 ejercicios:
 *   - src/data/systemCoreExercises.js (10 ejercicios sys-1..sys-10)
 *   - src/data/homeExercisesCatalog.js (108 ejercicios hex-001..hex-108)
 *   - src/data/exerciseSafetyMap.js (CANONICAL_EXERCISE_SAFETY_MAP)
 *
 * Clasifica cada uno de los 118 ejercicios en 3 niveles de revisión humana:
 *   - Nivel C (profunda):
 *       * tier_riesgo === 'alto'
 *       * tier_riesgo === 'PENDIENTE-FISIO'
 *       * con salto / caída / impacto pliométrico (salto, aterrizaje, caída, drop jump, pliométric...)
 *       * con compromiso o zona cervical / cuello (cervical, cuello, cabeza/remate de cabeza)
 *   - Nivel B (vistazo dueño) — si no es Nivel C y cumple alguna de:
 *       * B1_APOYO_UNIPODAL: apoyo unipodal / una pierna / un pie / single-leg / monopodal / pata coja
 *       * B2_ROTACION: rotación / giro / torsión / circunducción / pivot
 *       * B3_CUADRUPEDIA_NO_VERTICAL: cuadrupedia / 4 apoyos / tumbado / supino / prono / decúbito / plancha / puente / sentado / rodillas / suelo
 *       * B4_MATERIAL_TOCA_CUERPO: material externo que toca o carga el cuerpo (banda, pelota/balón, silla, banco, pared, escalón, mochila/lastre, botella, toalla, cojín, marco de puerta)
 *       * B5_ASIMETRIA_LADOS: asimetría entre lados (unilateral, pierna adelantada/atrasada, zancada/lunge, lateral, alternando lados, izquierda/derecha)
 *       * B6_ANGULO_EXTREMO: ángulo articular extremo (>= 90°, flexión profunda, máxima dorsiflexión/extensión/abducción, sentadilla profunda)
 *   - Nivel A (auto):
 *       * El resto de ejercicios (bipedestación simétrica, sin material de contacto directo especial, sin riesgo alto ni banderas B/C).
 *
 * Modo: 100% Read-Only sobre src/. Genera docs/REVIEW_TIERS_OLEADA10.md si se invoca con --write-doc o por defecto.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_CORE_EXERCISES } from '../src/data/systemCoreExercises.js';
import { HOME_EXERCISES_108 } from '../src/data/homeExercisesCatalog.js';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../src/data/exerciseSafetyMap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDocPath = path.join(repoRoot, 'docs/REVIEW_TIERS_OLEADA10.md');

const ALL_EXERCISES = [...SYSTEM_CORE_EXERCISES, ...HOME_EXERCISES_108];

/**
 * Normaliza texto eliminando tildes para matching determinista y limpio.
 */
function norm(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Extrae el corpus textual y metadatos de un ejercicio para evaluar banderas.
 */
function buildExerciseCorpus(ex, safety) {
  const nameEs = ex.nameEs || ex.name || '';
  const nameEn = ex.nameEn || '';
  const descEs = ex.descriptionEs || ex.description || '';
  const descEn = ex.descriptionEn || '';
  const coachingEs = Array.isArray(ex.coachingPointsEs)
    ? ex.coachingPointsEs.join(' ')
    : Array.isArray(ex.coachingPoints)
      ? ex.coachingPoints.join(' ')
      : '';
  const safetyEs = ex.safety_notes?.es || '';
  const safetyEn = ex.safety_notes?.en || '';
  const zones = [
    ...(Array.isArray(ex.targetZones) ? ex.targetZones : []),
    ...(Array.isArray(safety?.canonicalTargetZones) ? safety.canonicalTargetZones : []),
  ].join(' ');
  const materials = [
    ...(Array.isArray(ex.material_preferido) ? ex.material_preferido : []),
    ...(Array.isArray(ex.materials) ? ex.materials : []),
    ...(Array.isArray(ex.materialsEs) ? ex.materialsEs : []),
  ].join(' ');

  return {
    nameEs,
    nameEn,
    fullText: norm(`${nameEs} ${nameEn} ${descEs} ${descEn} ${coachingEs} ${safetyEs} ${safetyEn} ${zones}`),
    nameAndDesc: norm(`${nameEs} ${nameEn} ${descEs} ${descEn} ${zones}`),
    zonesText: norm(zones),
    materialsList: Array.from(
      new Set([
        ...(Array.isArray(ex.material_preferido) ? ex.material_preferido : []),
        ...(Array.isArray(ex.materials) ? ex.materials : []),
      ].map((m) => norm(m)))
    ),
    materialsText: norm(materials),
  };
}

/**
 * Evalúa las banderas de Nivel C (profunda) y Nivel B (vistazo dueño).
 */
export function classifyExercise(ex) {
  const safety = CANONICAL_EXERCISE_SAFETY_MAP[ex.id];
  if (!safety) {
    throw new Error(`Ejercicio ${ex.id} no encontrado en CANONICAL_EXERCISE_SAFETY_MAP`);
  }

  const c = buildExerciseCorpus(ex, safety);
  const flagsC = [];
  const flagsB = [];

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL C (PROFUNDA): tier_riesgo alto o PENDIENTE-FISIO, o salto/caída/cervical
  // ─────────────────────────────────────────────────────────────────────────
  if (safety.tier_riesgo === 'alto') {
    flagsC.push('C_TIER_ALTO');
  }
  if (safety.tier_riesgo === 'PENDIENTE-FISIO') {
    flagsC.push('C_PENDIENTE_FISIO');
  }

  // Salto / caída / aterrizaje pliométrico (en nombre, descripción o zonas)
  const hasJumpOrFall =
    /\b(salto|saltos|saltar|saltito\w*|aterrizaje|aterrizar|caida|drop jump|pliometri\w*|jump\w*|hop\w*|landing|bounding|countermovement|cmj)\b/.test(
      c.nameAndDesc
    );
  if (hasJumpOrFall) {
    flagsC.push('C_SALTO_O_CAIDA');
  }

  // Cervical / cuello (cuando el ejercicio trabaja o compromete directamente la región cervical en nombre o targetZones)
  const hasCervical =
    /\b(cervical\w*|cuello|neck|cabeceo|remate de cabeza|heading|esternocleidomastoideo)\b/.test(
      norm(`${c.nameEs} ${c.nameEn} ${c.zonesText}`)
    );
  if (hasCervical) {
    flagsC.push('C_CERVICAL');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL B (VISTAZO DUEÑO):
  //   1. Apoyo unipodal
  //   2. Rotación
  //   3. Cuadrupedia / postura no vertical
  //   4. Material que toca cuerpo
  //   5. Asimetría entre lados
  //   6. Ángulo articular extremo
  // ─────────────────────────────────────────────────────────────────────────

  // B1: Apoyo unipodal
  const hasUnipodal =
    /\b(unipodal\w*|monopodal\w*|una sola pierna|una pierna|un solo pie|un pie|single[- ]leg|one[- ]leg|pata coja|equilibrio sobre una|apoyo en un pie|apoyo sobre una pierna)\b/.test(
      c.fullText
    );
  if (hasUnipodal) {
    flagsB.push('B_APOYO_UNIPODAL');
  }

  // B2: Rotación
  const hasRotation =
    /\b(rotacion\w*|rotar|rotador\w*|giro\w*|girar|torsion\w*|circunduccion\w*|rotation\w*|twist\w*|pivot\w*)\b/.test(
      c.nameAndDesc
    );
  if (hasRotation) {
    flagsB.push('B_ROTACION');
  }

  // B3: Cuadrupedia / postura no vertical (tumbado, supino, prono, cuadrupedia, plancha, puente, sentado, de rodillas)
  const hasNonVerticalPosture =
    /\b(cuadrupedia|cuatro apoyos|4 apoyos|quadruped|tumbad\w+|boca arriba|boca abajo|supin\w+|pron\w+|decubito|plancha|plank|puente|bridge|sentad\w+ en el suelo|sentad\w+ sobre|de rodillas|kneeling|half[- ]kneeling|arrodillad\w+|bird[- ]dog|dead[- ]bug|gato[- ]camello|cat[- ]camel|copenhagen|nordic|nordico)\b/.test(
      c.nameAndDesc
    );
  if (hasNonVerticalPosture) {
    flagsB.push('B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL');
  }

  // B4: Material que toca el cuerpo (excluyendo 'peso_corporal', 'sin_material', 'suelo', 'colchoneta', 'esterilla', 'conos', 'escalera_o_cinta_suelo')
  // Solo materiales que fisicamente entran en contacto con el cuerpo y requieren validar anclaje/agarre/apoyo sobre objeto:
  // pared, silla_estable, banco, sofa_o_pared, escalon, pelota, balon, banda_elastica, toalla, botella, mochila_lastre, cojin, wobble_pad, marco_puerta, poste_o_pomo_puerta, cuerda.
  const NON_CONTACT_MATERIALS = new Set([
    'peso_corporal',
    'bodyweight',
    'sin_material',
    'no_equipment',
    'ninguno',
    'none',
    'suelo',
    'floor',
    'colchoneta',
    'esterilla',
    'mat',
    'espacio_libre',
    'conos',
    'conos_o_botellas',
    'escalera_o_cinta_suelo',
    'cinta_suelo',
    'cronometro',
  ]);
  const contactMaterials = c.materialsList
    .filter((m) => !NON_CONTACT_MATERIALS.has(m))
    .map((m) => m.replace(/_o_sin_material$/, ''));
  const uniqueContactMaterials = Array.from(new Set(contactMaterials));

  if (uniqueContactMaterials.length > 0) {
    flagsB.push(`B_MATERIAL_TOCA_CUERPO(${uniqueContactMaterials.join('+')})`);
  }

  // B5: Asimetría entre lados (zancada, split, lateral, pierna adelantada, unilateral, alternando lados)
  const hasAsymmetry =
    /\b(zancada|lunge|split squat|bulgara|bulgarian|pierna adelantada|pie adelantado|pierna contraria|brazo contrario|mano contraria|unilateral\w*|lateral|side|alternando|alternar|cada lado|izquierd\w+ y derech\w+|cruzad\w+|cross)\b/.test(
      c.nameAndDesc
    );
  if (hasAsymmetry) {
    flagsB.push('B_ASIMETRIA_ENTRE_LADOS');
  }

  // B6: Ángulo articular extremo (flexión/sentadilla/estiramiento profundo, pierna/cadera/rodilla a 90°, rango articular máximo, máxima dorsiflexión/abducción/extensión)
  const hasExtremeAngle =
    /\b(sentadilla profunda|flexion profunda|deep squat|cadera a 90|rodilla a 90|rodillas a 90|90 grados de flexion|pierna a 90|90°|dorsiflexion maxima|maxima amplitud|rango maximo|abduccion maxima|hiperextension|apertura maxima)\b/.test(
      c.nameAndDesc
    );
  if (hasExtremeAngle) {
    flagsB.push('B_ANGULO_ARTICULAR_EXTREMO');
  }

  let tier = 'A';
  let activeFlags = [];
  if (flagsC.length > 0) {
    tier = 'C';
    activeFlags = [...flagsC, ...flagsB];
  } else if (flagsB.length > 0) {
    tier = 'B';
    activeFlags = [...flagsB];
  } else {
    tier = 'A';
    activeFlags = ['A_BIPEDESTACION_SIMETRICA_SIN_BANDERAS'];
  }

  return {
    id: ex.id,
    nombreEs: ex.nameEs || ex.name,
    nombreEn: ex.nameEn || '',
    category: ex.category || '',
    tier_riesgo: safety.tier_riesgo,
    effectiveSupervision: safety.effectiveSupervision,
    edadMin: safety.edadMin,
    isAlias: Boolean(safety.isAlias),
    duplicateOf: safety.duplicateOf || null,
    reviewTier: tier,
    flagsC,
    flagsB,
    activeFlags,
    primaryTrigger:
      tier === 'C'
        ? flagsC.join(', ')
        : tier === 'B'
          ? flagsB.join(', ')
          : 'A_BIPEDESTACION_SIMETRICA_SIN_BANDERAS',
  };
}

export function classifyAllExercises() {
  const results = ALL_EXERCISES.map(classifyExercise);
  const tierC = results.filter((r) => r.reviewTier === 'C');
  const tierB = results.filter((r) => r.reviewTier === 'B');
  const tierA = results.filter((r) => r.reviewTier === 'A');
  return { results, tierC, tierB, tierA };
}

function generateMarkdownReport({ results, tierC, tierB, tierA }) {
  const countC = tierC.length;
  const countB = tierB.length;
  const countA = tierA.length;
  const total = results.length;

  const formatRow = (r) => {
    const aliasTag = r.isAlias ? ` *(alias de \`${r.duplicateOf}\`)*` : '';
    return `| \`${r.id}\` | **${r.nombreEs}**${aliasTag} | \`${r.tier_riesgo}\` | ${r.primaryTrigger} |`;
  };

  return `# Clasificación de Revisión Humana por Niveles (A / B / C) — Oleada 10 (118 Ejercicios)

> [!IMPORTANT]
> **Modo Read-Only sobre Producto**:
> Este documento y su generador (\`scripts/classify-exercise-review-tier.mjs\`) leen directamente \`src/data/systemCoreExercises.js\` (10), \`src/data/homeExercisesCatalog.js\` (108) y \`src/data/exerciseSafetyMap.js\` (118) sin modificar ningún archivo de \`src/\` ni auto-firmar \`reviewed_by_human\` o \`rigVerifiedBy\`.

---

## 1. Resumen Ejecutivo y Conteo por Nivel

| Nivel de Revisión | Criterio de Activación | Conteo | % del Catálogo (118) | Acción Requerida |
| :--- | :--- | :---: | :---: | :--- |
| **Nivel C (Revisión Profunda)** | \`tier_riesgo === 'alto'\`, \`tier_riesgo === 'PENDIENTE-FISIO'\`, o ejercicio con **salto / caída / aterrizaje pliométrico** o compromiso **cervical / cuello** | **${countC}** | **${((countC / total) * 100).toFixed(1)}%** | Revisión biomecánica y clínica detallada (fisio + dueño) antes de promoción |
| **Nivel B (Vistazo Dueño)** | No es Nivel C y activa al menos una bandera biomecánica: **apoyo unipodal**, **rotación**, **cuadrupedia/postura no vertical**, **material que toca cuerpo**, **asimetría entre lados** o **ángulo articular extremo** | **${countB}** | **${((countB / total) * 100).toFixed(1)}%** | Vistazo visual rápido del dueño sobre la lámina híbrida (contactos, orientación y lateralidad) |
| **Nivel A (Auto-Validación por Gate)** | El resto del catálogo (bipedestación simétrica sin material de contacto complejo ni banderas B/C), sujeto a las **4 banderas rojas automáticas** de \`test-hybrid-media-integrity.mjs\` | **${countA}** | **${((countA / total) * 100).toFixed(1)}%** | Validación automática por script de integridad píxel-exacta |
| **TOTAL CATÁLOGO** | \`10 sys-*\` + \`108 hex-*\` | **${total}** | **100.0%** | Cobertura 118/118 verificada |

---

## 2. Las 4 Banderas Rojas Automáticas en \`scripts/test-hybrid-media-integrity.mjs\`

Todo activo híbrido (tanto Nivel A como Niveles B y C) pasa obligatoriamente por las **4 banderas rojas automáticas** implementadas en \`scripts/test-hybrid-media-integrity.mjs\`:

1. \`RED_FLAG_1_ZERO_GREEN_GLOW_PIXELS\`: Falla si la máscara \`<id>-glow.webp\` tiene \`0\` píxeles verdes bioluminiscentes activos (\`g > 135 && g - r > 30 && a > 25\`).
2. \`RED_FLAG_2_SILHOUETTE_CUT_AT_BORDER\`: Falla si la silueta anatómica en \`<id>-card.webp\` aparece mutilada o cortada contra los bordes superior, izquierdo o derecho del lienzo.
3. \`RED_FLAG_3_GLOW_OUTSIDE_BODY\`: Falla si los píxeles iluminados de \`<id>-glow.webp\` caen fuera de la envolvente anatómica del cuerpo/vectores de \`<id>-card.webp\`.
4. \`RED_FLAG_4_INCONSISTENT_ASPECT_RATIO\`: Falla si existe discrepancia de proporción (\`width / height\`) entre \`<id>-card.webp\`, \`<id>-full.webp\`, \`<id>-glow.webp\`, \`<id>-microloop.webp\` y el \`viewBox\` de \`<id>-overlay.svg\`.

---

## 3. Lista Completa — Nivel C (Revisión Profunda: ${countC} ejercicios)

*Criterio: \`C_TIER_ALTO\`, \`C_PENDIENTE_FISIO\`, \`C_SALTO_O_CAIDA\`, \`C_CERVICAL\`.*

| ID | Nombre del Ejercicio | \`tier_riesgo\` | Banderas que Subieron el Ejercicio a Nivel C |
| :--- | :--- | :---: | :--- |
${tierC.map(formatRow).join('\n')}

---

## 4. Lista Completa — Nivel B (Vistazo Dueño: ${countB} ejercicios)

*Criterio: \`B_APOYO_UNIPODAL\`, \`B_ROTACION\`, \`B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL\`, \`B_MATERIAL_TOCA_CUERPO\`, \`B_ASIMETRIA_ENTRE_LADOS\`, \`B_ANGULO_ARTICULAR_EXTREMO\`.*

| ID | Nombre del Ejercicio | \`tier_riesgo\` | Banderas que Subieron el Ejercicio a Nivel B |
| :--- | :--- | :---: | :--- |
${tierB.map(formatRow).join('\n')}

---

## 5. Lista Completa — Nivel A (Auto-Validación por Gate: ${countA} ejercicios)

*Criterio: Bipedestación simétrica sin material de contacto directo sobre el cuerpo ni banderas de Nivel B o C.*

| ID | Nombre del Ejercicio | \`tier_riesgo\` | Estado de Banderas |
| :--- | :--- | :---: | :--- |
${tierA.map(formatRow).join('\n')}
`;
}

const summary = classifyAllExercises();
const md = generateMarkdownReport(summary);
fs.writeFileSync(outDocPath, md, 'utf8');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('📊 [CLASSIFY-EXERCISE-REVIEW-TIER] CLASIFICACIÓN 118 EJERCICIOS (A/B/C)');
console.log('══════════════════════════════════════════════════════════════════════');
console.log(` - Nivel C (Profunda)     : ${String(summary.tierC.length).padStart(3)} ejercicios`);
console.log(` - Nivel B (Vistazo Dueño): ${String(summary.tierB.length).padStart(3)} ejercicios`);
console.log(` - Nivel A (Auto)         : ${String(summary.tierA.length).padStart(3)} ejercicios`);
console.log(` - TOTAL                  : ${String(summary.results.length).padStart(3)} ejercicios`);
console.log(`📄 Reporte escrito en     : ${outDocPath}`);
console.log('══════════════════════════════════════════════════════════════════════');
