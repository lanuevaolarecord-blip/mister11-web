/**
 * scripts/lib/rulesAgeCodegen.mjs
 * Codegen de las listas restrictivas de edad para firestore.rules.
 * Las reglas NO importan JS: el bloque entre los marcadores se GENERA desde
 * CANONICAL_EXERCISE_SAFETY_MAP en deploy. Prohibido editarlo a mano.
 */
export const BEGIN_MARK = '// <<GEN:AGE_LISTS BEGIN>>';
export const END_MARK = '// <<GEN:AGE_LISTS END>>';
export const MIN_GATED_AGE = 12;       // ids con edadMin >= 12 entran en las listas
export const MAX_PLAN_EXERCISES = 20;  // tope duro (las reglas no iteran: se desenrolla)

/** { threshold(number) : [ids] } para todo id con edadMin >= MIN_GATED_AGE */
export function bucketsFromMap(map) {
  const buckets = {};
  for (const e of Object.values(map)) {
    if (typeof e.edadMin === 'number' && e.edadMin >= MIN_GATED_AGE) {
      (buckets[e.edadMin] = buckets[e.edadMin] || []).push(e.id);
    }
  }
  for (const k of Object.keys(buckets)) buckets[k].sort();
  return buckets;
}

const list = (ids) => `[${ids.map((i) => `'${i}'`).join(', ')}]`;

export function renderGeneratedBlock(map) {
  const buckets = bucketsFromMap(map);
  const thresholds = Object.keys(buckets).map(Number).sort((a, b) => b - a); // desc
  const L = [];
  L.push(`    ${BEGIN_MARK}`);
  L.push('    // GENERADO por scripts/gen-rules-age-lists.mjs desde src/data/exerciseSafetyMap.js.');
  L.push('    // NO EDITAR A MANO: `node scripts/gen-rules-age-lists.mjs --write`.');
  for (const t of thresholds) {
    L.push(`    function getRestricted${t}Exercises() {`);
    L.push(`      return ${list(buckets[t])};`);
    L.push('    }');
  }
  // restrictedForAge(age): unión de las listas cuyo umbral > edad (de mayor a menor)
  const chain = [];
  chain.push(`age >= ${thresholds[0]} ? []`);
  for (let i = 1; i < thresholds.length; i++) {
    const above = thresholds.slice(0, i).map((t) => `getRestricted${t}Exercises()`).join(' + ');
    chain.push(`age >= ${thresholds[i]} ? ${i > 1 ? `(${above})` : above}`);
  }
  const all = thresholds.map((t) => `getRestricted${t}Exercises()`).join(' + ');
  const restrictedExpr = `${chain.join(' : ')} : (${all})`;
  L.push('    function restrictedForAge(age) {');
  L.push(`      return ${restrictedExpr};`);
  L.push('    }');
  // planHasAny desenrollado (las reglas no tienen bucles)
  const unrolled = [];
  for (let i = 0; i < MAX_PLAN_EXERCISES; i++) {
    unrolled.push(`(ex.size() > ${i} && ex[${i}].exerciseId in restricted)`);
  }
  L.push('    function planWithinCap(data) {');
  L.push(`      return data.get('exercises', []).size() <= ${MAX_PLAN_EXERCISES} && data.get('exerciseIds', []).size() <= ${MAX_PLAN_EXERCISES};`);
  L.push('    }');
  L.push('    function planHasAny(data, restricted) {');
  L.push("      let ex = data.get('exercises', []);");
  L.push("      return data.get('exerciseIds', []).hasAny(restricted) ||");
  L.push(`        ${unrolled.join(' ||\n        ')};`);
  L.push('    }');
  L.push(`    ${END_MARK}`);
  return L.join('\n');
}

export function injectIntoRules(rulesText, block) {
  const b = rulesText.indexOf(BEGIN_MARK);
  const e = rulesText.indexOf(END_MARK);
  if (b < 0 || e < 0 || e < b) throw new Error('Marcadores GEN:AGE_LISTS no encontrados en firestore.rules');
  const lineStart = rulesText.lastIndexOf('\n', b) + 1;
  const lineEnd = rulesText.indexOf('\n', e);
  const end = lineEnd < 0 ? rulesText.length : lineEnd;
  return rulesText.slice(0, lineStart) + block + rulesText.slice(end);
}

/** { threshold : [ids] } leído del texto de las reglas */
export function parseGeneratedLists(rulesText) {
  const out = {};
  const re = /function getRestricted(\d+)Exercises\(\)\s*\{\s*return\s*\[([^\]]*)\];/g;
  let m;
  while ((m = re.exec(rulesText))) {
    out[Number(m[1])] = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
  }
  return out;
}
