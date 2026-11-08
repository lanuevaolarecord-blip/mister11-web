/**
 * scripts/test-rules-age-codegen.mjs
 * B2-FIX — tests ejecutables sobre el TEXTO REAL de firestore.rules (sin reimplementar la regla):
 *   (a) cruce mapa↔reglas  (b) regresión de codegen  (c) cobertura OR (comodines)
 *   (d) aserciones estáticas anti-spoof / anti-escape-hatch / inmutabilidad
 * NOTA: no sustituye al emulador (scripts/test-rules-emulator.mjs); aquí no se evalúa CEL.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { CANONICAL_EXERCISE_SAFETY_MAP as MAP } from '../src/data/exerciseSafetyMap.js';
import { renderGeneratedBlock, injectIntoRules, parseGeneratedLists, bucketsFromMap } from './lib/rulesAgeCodegen.mjs';
import { applicableAllows, stripComments } from './lib/rulesCoverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const code = stripComments(rules);
let failed = false;
const ok = (c, m) => { console.log(`${c ? '✅' : '❌ FALLÓ:'} ${m}`); if (!c) failed = true; };

// ── (a) CRUCE mapa ↔ reglas ────────────────────────────────────────────────
console.log('▶ [a] Cruce mapa↔reglas');
const lists = parseGeneratedLists(rules);
const union = new Set(Object.values(lists).flat());
const expectedGated = new Set(Object.values(MAP).filter((e) => e.edadMin >= 12).map((e) => e.id));
console.log(`   listas en reglas: ${Object.entries(lists).map(([k, v]) => `${k}+:${v.length}`).join(' ')} | union=${union.size} | {edadMin>=12}=${expectedGated.size}`);
ok(union.size === expectedGated.size && [...union].every((i) => expectedGated.has(i)), 'union(listas) == {ids con edadMin>=12 en el mapa}');
const wrongBucket = [];
for (const [thr, ids] of Object.entries(lists)) for (const id of ids) if (MAP[id].edadMin !== Number(thr)) wrongBucket.push(`${id}@${thr}≠${MAP[id].edadMin}`);
ok(wrongBucket.length === 0, `cada id en el bucket que su edadMin dicta (desajustes: ${wrongBucket.length})`);
for (const [thr, ids] of Object.entries(bucketsFromMap(MAP))) {
  ok(JSON.stringify(ids) === JSON.stringify(lists[thr]), `bucket ${thr}+ coincide literal: ${JSON.stringify(ids)}`);
}
try { execSync('node scripts/gen-rules-age-lists.mjs --check', { cwd: root, stdio: 'pipe' }); ok(true, 'gen --check: reglas == generación desde el mapa'); }
catch { ok(false, 'gen --check falló'); }

// ── (b) REGRESIÓN de codegen ───────────────────────────────────────────────
console.log('\n▶ [b] Regresión de codegen');
const moved = JSON.parse(JSON.stringify(MAP));
moved['sys-4'].edadMin = 16;          // sys-4: 14 → 16
moved['sys-1'].edadMin = 12;          // sys-1: 10 → 12 (entra a listas)
const regen = parseGeneratedLists(injectIntoRules(rules, renderGeneratedBlock(moved)));
ok(regen[16].includes('sys-4') && !regen[14].includes('sys-4'), 'mover sys-4 14→16 en el mapa => la regla generada lo mueve al bucket 16');
ok(regen[12].includes('sys-1'), 'mover sys-1 10→12 en el mapa => la regla generada lo incluye en el bucket 12');
const handEdited = rules.replace("'hex-064', ", '');
ok(injectIntoRules(handEdited, renderGeneratedBlock(MAP)) !== handEdited, 'edición a mano de una lista => --check la detecta (regeneración difiere)');

// ── (c) COBERTURA OR: ningún comodín 'open' sobre rutas guardadas ──────────
console.log('\n▶ [c] Cobertura OR (comodines) sobre rutas guardadas');
const guardedPaths = [
  'teams/t1/playerPlans/p1', 'teams/t1/teamPlans/p1',
  'users/u1/teams/t1/playerPlans/p1', 'users/u1/teams/t1/teamPlans/p1',
  'equipos/t1/playerPlans/p1', 'equipos/t1/teamPlans/p1',
  'clubs/c1/teams/t1/playerPlans/p1', 'clubs/c1/teams/t1/teamPlans/p1',
  'team_codes/ABC', 'sharedPlans/s1', 'sharedSessions/s1'
];
function openWriters(text, p, op) { return applicableAllows(text, p, op).filter((a) => a.klass === 'open'); }
let bypass = 0;
for (const p of guardedPaths) {
  for (const op of ['create', 'update']) {
    const open = openWriters(rules, p, op);
    if (open.length) { bypass++; console.log(`   ⚠️ ${op} ${p}: allow abierto ${open.map((o) => o.pattern).join(' , ')}`); }
  }
}
ok(bypass === 0, `rutas guardadas con algún allow ABIERTO (isAuth) en create/update = ${bypass} (esperado 0)`);
const guardedHits = guardedPaths.every((p) => applicableAllows(rules, p, 'create').some((a) => a.klass === 'guarded'));
ok(guardedHits, 'cada ruta guardada tiene ≥1 allow create con condición no trivial (age-gate / coachUid)');

// Control positivo: las reglas ANTERIORES (HEAD~) SÍ tenían el bypass => el analizador no es vacuo
let oldRules = null;
try { oldRules = execSync('git show c7122fb:firestore.rules', { cwd: root, maxBuffer: 1 << 24 }).toString('utf8'); } catch { /* sin git */ }
if (oldRules) {
  let oldBypass = 0;
  for (const p of guardedPaths) for (const op of ['create', 'update']) if (openWriters(oldRules, p, op).length) oldBypass++;
  ok(oldBypass > 0, `CONTROL POSITIVO: reglas previas (c7122fb) => ${oldBypass} combinaciones ruta×op con allow abierto (el age-gate anterior era anulado por OR)`);
}
// Regresión: reinyectar un comodín abierto en teams => el gate cae
const reinjected = rules.replace("match /{colA}/{docA}/{restA=**} {\n        allow read, write: if isAuth() && !(colA in ['playerPlans', 'teamPlans']);",
  "match /{colA}/{docA}/{restA=**} {\n        allow read, write: if isAuth();");
ok(reinjected !== rules && openWriters(reinjected, 'teams/t1/playerPlans/p1', 'create').length > 0, 'REGRESIÓN: reinyectar comodín abierto en /teams => el analizador lo detecta');

// No-sobrerestricción: rutas normales siguen abiertas a autenticados
const normalPaths = ['teams/t1/players/p1', 'users/u1', 'users/u1/teams/t1/matches/m1', 'users/u1/teams/t1/players/p1/cognitive/c1',
  'users/u1/other/o1', 'clubs/c1/customFormations/f1', 'clubs/c1/teams/t1/players/p1', 'equipos/t1/sessions/s1', 'foo/bar', 'foo/bar/baz/qux', 'gameAssignments/g1'];
const locked = normalPaths.filter((p) => !['read', 'create', 'update'].every((op) => applicableAllows(rules, p, op).some((a) => a.klass === 'open' || a.klass === 'guarded')));
ok(locked.length === 0, `rutas no guardadas aún accesibles a autenticados (bloqueadas por error: ${JSON.stringify(locked)})`);

// ── (d) Aserciones estáticas ───────────────────────────────────────────────
console.log('\n▶ [d] Aserciones estáticas anti-spoof / anti-escape-hatch / inmutabilidad');
const fnBodies = code.slice(code.indexOf('function yearsSince'), code.indexOf('match /playerIdentity/'));
ok(!/playerAge|\bdata\.age\b|\bdata\.edad\b|'age'|'edad'/.test(code), 'las reglas NO leen playerAge/age/edad del payload');
ok(/function birthOfPlayer[\s\S]*get\(playerDocPath/.test(fnBodies), 'la edad se deriva con get() del doc .../players/{playerId}');
ok(/function isTeamStaff[\s\S]*ownerId[\s\S]*staffMembers/.test(fnBodies), 'autoridad del coach: ownerId/staffMembers del doc del equipo');
ok(!/!\(\s*'coachUid'\s+in\s+resource\.data\s*\)/.test(code), "sin escape-hatch !('coachUid' in resource.data)");
const tc = code.slice(code.indexOf('match /team_codes/'), code.indexOf('match /staff_codes/'));
ok(/allow update:[\s\S]*resource\.data\.get\('coachUid', null\) == request\.auth\.uid[\s\S]*request\.resource\.data\.get\('coachUid', null\) == resource\.data\.get\('coachUid', null\)/.test(tc),
  'team_codes update: dueño ACTUAL (resource) + coachUid inmutable');
ok(!/request\.resource\.data\.coachUid == request\.auth\.uid\);\s*allow delete/.test(tc) && !/\|\| request\.resource\.data\.coachUid/.test(tc), 'team_codes: sin `|| request.resource.coachUid == me` (apropiación)');
const sp = code.slice(code.indexOf('match /sharedPlans/'), code.indexOf('match /team_codes/'));
ok(!/createdBy/.test(sp) && (sp.match(/get\('coachUid', null\) == request\.auth\.uid/g) || []).length >= 6, 'shared*: autoridad solo por coachUid (sin createdBy ni huérfanos)');

console.log(failed ? '\n❌ [TEST-RULES-AGE-CODEGEN] FALLÓ' : '\n✅ [TEST-RULES-AGE-CODEGEN] 100% PASS');
process.exit(failed ? 1 : 0);

