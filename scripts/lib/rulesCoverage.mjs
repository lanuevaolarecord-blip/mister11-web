/**
 * scripts/lib/rulesCoverage.mjs
 * Analizador ESTÁTICO de cobertura de firestore.rules (sobre el TEXTO REAL del archivo).
 * Modela la semántica OR de Firestore: para una ruta concreta, reúne TODOS los `match`
 * que la cubren y devuelve sus `allow` con la condición evaluada si es trivial.
 *
 * NO evalúa CEL en general: solo (a) `isAuth()`, (b) `isAuth() && !(var in [..])`,
 * (c) `isAuth() && var != 'x'`. Cualquier otra condición se clasifica 'guarded'.
 * No sustituye al emulador; detecta la clase "comodín OR anula la cláusula".
 */

export function stripComments(text) {
  return text.replace(/\/\/[^\n]*/g, '');
}

function findMatching(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('llaves desbalanceadas');
}

/** Parsea bloques match anidados y sus allow directos. */
export function parseRules(text) {
  const src = stripComments(text);
  const start = src.indexOf('match /databases/{database}/documents');
  const open = src.indexOf('{', src.indexOf('documents', start) + 9);
  const close = findMatching(src, open);
  return parseBlock(src.slice(open + 1, close), '');
}

function parseBlock(body, prefix) {
  const node = { prefix, allows: [], children: [] };
  let i = 0;
  while (i < body.length) {
    const rest = body.slice(i);
    const mMatch = /^\s*match\s+(\/\S+)\s+\{/.exec(rest);
    const mAllow = /^\s*allow\s+([a-z, ]+?)\s*:\s*if\s+([\s\S]*?);/.exec(rest);
    const mFunc = /^\s*function\s+\w+\s*\([^)]*\)\s*\{/.exec(rest);
    if (mMatch) {
      const openIdx = i + mMatch[0].length - 1;
      const closeIdx = findMatching(body, openIdx);
      const child = parseBlock(body.slice(openIdx + 1, closeIdx), prefix + mMatch[1]);
      child.pattern = mMatch[1];
      node.children.push(child);
      i = closeIdx + 1;
    } else if (mFunc) {
      const openIdx = i + mFunc[0].length - 1;
      i = findMatching(body, openIdx) + 1;
    } else if (mAllow) {
      node.allows.push({ methods: mAllow[1].split(',').map((s) => s.trim()), cond: mAllow[2].replace(/\s+/g, ' ').trim() });
      i += mAllow[0].length;
    } else {
      i++;
    }
  }
  return node;
}

/** Aplana a [{pattern, allows}] con el patrón completo. */
export function flatten(node, out = []) {
  if (node.prefix) out.push({ pattern: node.prefix, allows: node.allows });
  for (const c of node.children) flatten(c, out);
  return out;
}

/** Empareja segmentos de ruta con un patrón; devuelve bindings o null. */
export function matchPattern(pattern, segments) {
  const pat = pattern.split('/').filter(Boolean);
  const rec = (pi, si, b) => {
    if (pi === pat.length) return si === segments.length ? b : null;
    const p = pat[pi];
    const rm = /^\{(\w+)=\*\*\}$/.exec(p);
    if (rm) {
      for (let take = 0; si + take <= segments.length; take++) {
        const r = rec(pi + 1, si + take, { ...b, [rm[1]]: segments.slice(si, si + take).join('/') });
        if (r) return r;
      }
      return null;
    }
    if (si >= segments.length) return null;
    const wm = /^\{(\w+)\}$/.exec(p);
    if (wm) return rec(pi + 1, si + 1, { ...b, [wm[1]]: segments[si] });
    return p === segments[si] ? rec(pi + 1, si + 1, b) : null;
  };
  return rec(0, 0, {});
}

/** 'open' = permite a cualquier autenticado; 'closed' = evaluada falsa; 'guarded' = condición no trivial */
export function classify(cond, bindings) {
  let m;
  if (/^isAuth\(\)$/.test(cond)) return 'open';
  if ((m = /^isAuth\(\) && !\(\s*(\w+)\s+in\s+\[([^\]]*)\]\s*\)$/.exec(cond))) {
    const list = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    return list.includes(bindings[m[1]]) ? 'closed' : 'open';
  }
  if ((m = /^isAuth\(\) && (\w+) != '([^']+)'$/.exec(cond))) {
    return bindings[m[1]] === m[2] ? 'closed' : 'open';
  }
  return 'guarded';
}

const covers = (methods, op) =>
  methods.includes(op) || (op === 'create' || op === 'update' || op === 'delete' ? methods.includes('write') : false) ||
  (op === 'read' && (methods.includes('get') || methods.includes('list')));

/** Para una ruta de DOCUMENTO y una operación, lista los allow aplicables con su clase. */
export function applicableAllows(rulesText, docPath, op) {
  const segs = docPath.split('/').filter(Boolean);
  const out = [];
  for (const blk of flatten(parseRules(rulesText))) {
    const b = matchPattern(blk.pattern, segs);
    if (!b) continue;
    for (const a of blk.allows) {
      if (covers(a.methods, op)) out.push({ pattern: blk.pattern, cond: a.cond, klass: classify(a.cond, b) });
    }
  }
  return out;
}
