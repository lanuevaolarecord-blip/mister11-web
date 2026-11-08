/**
 * scripts/test-rules-emulator.mjs
 * B2-FIX — Tests CONDUCTUALES contra el emulador de Firestore (evalúa el CEL real de firestore.rules).
 * Requiere: Java + `npm i -D @firebase/rules-unit-testing` + emulador:
 *   firebase emulators:exec --only firestore "node scripts/test-rules-emulator.mjs"
 * Si falta algo, sale con código 3 y lo dice (NO se reporta como PASS).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let testing;
try { testing = await import('@firebase/rules-unit-testing'); }
catch { console.error('[NO EJECUTADO] falta @firebase/rules-unit-testing'); process.exit(3); }
if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('[NO EJECUTADO] FIRESTORE_EMULATOR_HOST no definido (usa firebase emulators:exec)'); process.exit(3); }

const { initializeTestEnvironment, assertFails, assertSucceeds } = testing;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = await initializeTestEnvironment({
  projectId: 'mister11-rules-test',
  firestore: { rules: fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8') }
});

const yearsAgo = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); d.setDate(d.getDate() - 3); return d.toISOString().slice(0, 10); };
const TEAM = 'users/coach1/teams/t1';
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await db.doc(TEAM).set({ ownerId: 'coach1', staffMembers: {} });
  await db.doc(`${TEAM}/players/p13`).set({ fechaNacimiento: yearsAgo(13) });
  await db.doc(`${TEAM}/players/p15`).set({ fechaNacimiento: yearsAgo(15) });
  await db.doc('team_codes/CODE1').set({ coachUid: 'coach1', teamId: 't1' });
  await db.doc('sharedPlans/orphan').set({ title: 'sin coachUid' });
});

const coach = env.authenticatedContext('coach1').firestore();
const other = env.authenticatedContext('mallory').firestore();
const plan = (playerId, ids, extra = {}) => ({ playerId, exerciseIds: ids, exercises: ids.map((exerciseId) => ({ exerciseId })), ...extra });
let n = 0, bad = 0;
const t = async (name, p) => { n++; try { await p; console.log(`✅ ${name}`); } catch (e) { bad++; console.log(`❌ ${name} :: ${e.message}`); } };

await t('SPOOF playerAge:99 + sys-4 a jugador de 13 => PERMISSION_DENIED', assertFails(coach.collection(`${TEAM}/playerPlans`).add(plan('p13', ['sys-4'], { playerAge: 99 }))));
await t('SPOOF solo en exercises[] (exerciseIds vacío) => DENIED', assertFails(coach.collection(`${TEAM}/playerPlans`).add({ playerId: 'p13', exerciseIds: [], exercises: [{ exerciseId: 'sys-4' }] })));
await t('legítimo: sys-1 a jugador de 13 => ALLOWED', assertSucceeds(coach.collection(`${TEAM}/playerPlans`).add(plan('p13', ['sys-1']))));
await t('legítimo: sys-4 (14+) a jugador de 15 => ALLOWED', assertSucceeds(coach.collection(`${TEAM}/playerPlans`).add(plan('p15', ['sys-4']))));
await t('hex-064 (16+) a jugador de 15 => DENIED', assertFails(coach.collection(`${TEAM}/playerPlans`).add(plan('p15', ['hex-064']))));
await t('playerId inexistente + id restringido => DENIED (fail-closed)', assertFails(coach.collection(`${TEAM}/playerPlans`).add(plan('ghost', ['sys-4']))));
await t('no-staff (mallory) crea plan => DENIED', assertFails(other.collection(`${TEAM}/playerPlans`).add(plan('p15', ['sys-1']))));
await t('team_codes: no-dueño pone coachUid=yo => DENIED', assertFails(other.doc('team_codes/CODE1').set({ coachUid: 'mallory' }, { merge: true })));
await t('team_codes: dueño actualiza conservando coachUid => ALLOWED', assertSucceeds(coach.doc('team_codes/CODE1').set({ teamName: 'x' }, { merge: true })));
await t('team_codes: dueño intenta cambiar coachUid => DENIED (inmutable)', assertFails(coach.doc('team_codes/CODE1').set({ coachUid: 'mallory' }, { merge: true })));
await t('sharedPlans huérfano (sin coachUid): cualquiera actualiza => DENIED', assertFails(other.doc('sharedPlans/orphan').set({ title: 'hack' }, { merge: true })));
await t('sharedPlans: crear sin coachUid => DENIED', assertFails(other.doc('sharedPlans/new1').set({ title: 'x' })));
await t('sharedPlans: crear con coachUid=yo => ALLOWED', assertSucceeds(other.doc('sharedPlans/new2').set({ title: 'x', coachUid: 'mallory' })));

await env.cleanup();
console.log(`\n${bad ? '❌' : '✅'} emulador: ${n - bad}/${n}`);
process.exit(bad ? 1 : 0);

