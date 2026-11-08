/**
 * scripts/lib/semanticDuplicates.mjs
 * Aserción G2: no-duplicidad SEMÁNTICA (no solo de ID).
 *
 * Dos ejercicios son duplicado semántico si TODO esto se cumple:
 *   - misma cita de fuente (source.citation)
 *   - misma edad_minima_segura
 *   - targetZones con intersección no vacía
 *   - mismo conjunto material_preferido
 *   - similitud Jaccard de descripcionEs >= SIMILARITY_THRESHOLD
 *
 * Un duplicado queda RESUELTO solo si uno declara duplicateOf = <canónico> y:
 *   - el canónico existe y NO es a su vez duplicateOf de otro
 *   - ambos comparten edadMin y supervisión (sin deriva de seguridad)
 */
export const SIMILARITY_THRESHOLD = 0.5;

const tokens = (t = '') => new Set(
  String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter((w) => w.length > 3)
);

const jaccard = (a, b) => {
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
};

const matKey = (e) => [...(e.material_preferido || [])].sort().join('|');

export function findSemanticDuplicates(catalog) {
  const pairs = [];
  for (let i = 0; i < catalog.length; i++) {
    for (let j = i + 1; j < catalog.length; j++) {
      const a = catalog[i];
      const b = catalog[j];
      if (a.source?.citation !== b.source?.citation) continue;
      if (a.edad_minima_segura !== b.edad_minima_segura) continue;
      if (!(a.targetZones || []).some((z) => (b.targetZones || []).includes(z))) continue;
      if (matKey(a) !== matKey(b)) continue;
      const sim = jaccard(tokens(a.descriptionEs), tokens(b.descriptionEs));
      if (sim >= SIMILARITY_THRESHOLD) pairs.push({ a: a.id, b: b.id, similarity: Number(sim.toFixed(2)) });
    }
  }
  return pairs;
}

export function assertNoUnresolvedDuplicates(catalog) {
  const byId = Object.fromEntries(catalog.map((e) => [e.id, e]));
  const errors = [];
  for (const p of findSemanticDuplicates(catalog)) {
    const A = byId[p.a];
    const B = byId[p.b];
    const aliasOf = (A.duplicateOf === B.id) ? [A, B] : (B.duplicateOf === A.id) ? [B, A] : null;
    if (!aliasOf) {
      errors.push(`DUPLICADO SEMÁNTICO NO DECLARADO: ${p.a} ≈ ${p.b} (Jaccard ${p.similarity})`);
      continue;
    }
    const [alias, canon] = aliasOf;
    if (canon.duplicateOf) errors.push(`CADENA DE ALIAS: ${alias.id} → ${canon.id} → ${canon.duplicateOf}`);
    if (alias.edad_minima_segura !== canon.edad_minima_segura ||
        (alias.requiere_supervision_presencial === true) !== (canon.requiere_supervision_presencial === true)) {
      errors.push(`DERIVA DE SEGURIDAD entre alias ${alias.id} y canónico ${canon.id}`);
    }
  }
  // duplicateOf apuntando a id inexistente
  for (const e of catalog) {
    if (e.duplicateOf && !byId[e.duplicateOf]) errors.push(`duplicateOf huérfano: ${e.id} → ${e.duplicateOf}`);
  }
  return errors;
}

