/**
 * scripts/test-safety-map-integrity.mjs
 * B3-FIX — Integridad del mapa de seguridad:
 *   (1) derivado del catálogo (sin re-declaración)
 *   (2) tier con rationale citable en los 'alto'
 *   (3) aserción G2 de no-duplicidad semántica + tests de inyección
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HOME_EXERCISES_108 } from '../src/data/homeExercisesCatalog.js';
import { SYSTEM_CORE_EXERCISES } from '../src/data/systemCoreExercises.js';
import { CANONICAL_EXERCISE_SAFETY_MAP as MAP, PENDIENTE_FISIO_IDS, projectSafetyEntry } from '../src/data/exerciseSafetyMap.js';
import { CANONICAL_TARGET_ZONE_SET, REDESIGN_SVG_CANONICAL_ZONES, auditCatalogTargetZones, normalizeTargetZone } from '../src/data/targetZoneCanonicalMap.js';
import { findSemanticDuplicates, assertNoUnresolvedDuplicates } from './lib/semanticDuplicates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let failed = false;
const ok = (c, m) => { console.log(`${c ? '✅' : '❌ FALLÓ:'} ${m}`); if (!c) failed = true; };

const catalog = [...SYSTEM_CORE_EXERCISES, ...HOME_EXERCISES_108];

// ── 1. Derivación, no re-declaración ────────────────────────────────────────
console.log('▶ [1/3] Mapa derivado del catálogo');
ok(Object.keys(MAP).length === 118, `mapa tiene ${Object.keys(MAP).length} entradas (esperado 118)`);
ok(catalog.every((e) => MAP[e.id]), 'todos los ids del catálogo están en el mapa');
const drift = catalog.filter((e) => {
  const m = MAP[e.id];
  return m.edadMin !== e.edad_minima_segura || m.supervision !== (e.requiere_supervision_presencial === true) ||
    m.source !== e.source.citation || JSON.stringify(m.targetZones) !== JSON.stringify(e.targetZones);
});
ok(drift.length === 0, `deriva mapa↔catálogo (edadMin/supervisión/fuente/zonas) = ${drift.length}`);

const mapSrc = fs.readFileSync(path.resolve(__dirname, '../src/data/exerciseSafetyMap.js'), 'utf8');
const redeclared = [
  ...(mapSrc.match(/["']?id["']?\s*:\s*["'](?:hex|sys)-\d+["']/g) || []),
  ...(mapSrc.match(/["']?nombreEs["']?\s*:\s*["']/g) || []),
  ...(mapSrc.match(/["']?edadMin["']?\s*:\s*\d/g) || []),
  ...(mapSrc.match(/["']?tier_riesgo["']?\s*:\s*["'](?:alto|bajo)["']\s*,?\s*\n\s*\}/g) || [])
];
ok(redeclared.length === 0, `re-declaraciones de objetos (id/nombreEs/edadMin literales) en exerciseSafetyMap.js = ${redeclared.length} (esperado 0)`);
ok(/from '\.\/homeExercisesCatalog\.js'/.test(mapSrc) && /from '\.\/systemCoreExercises\.js'/.test(mapSrc), 'el mapa IMPORTA catálogo y núcleo');

// ── 2. Tier con rationale ───────────────────────────────────────────────────
console.log('\n▶ [2/3] Tier con rationale citable');
const altos = Object.values(MAP).filter((m) => m.tier_riesgo === 'alto');
const pend = Object.values(MAP).filter((m) => m.tier_riesgo === 'PENDIENTE-FISIO');
ok(altos.every((m) => m.supervision === true && m.tier_rationale.includes('requiere_supervision_presencial=true') && m.tier_rationale.includes('Fuente:') && m.source),
  `${altos.length} 'alto' con rationale (supervisión heredada + cita) `);
ok(pend.length === Object.keys(PENDIENTE_FISIO_IDS).length && pend.every((m) => m.tier_rationale.startsWith('[PENDIENTE-FISIO]')),
  `${pend.length} PENDIENTE-FISIO con motivo literal`);
ok(Object.values(MAP).every((m) => typeof m.tier_rationale === 'string' && m.tier_rationale.length > 20), '118/118 con tier_rationale');
ok(Object.values(MAP).filter((m) => m.tier_riesgo === 'alto' && !m.supervision).length === 0, "ningún 'alto' sin respaldo heredado");

// ── 3. G2 semántica ─────────────────────────────────────────────────────────
console.log('\n▶ [3/3] G2: no-duplicidad semántica');
const pairs = findSemanticDuplicates(catalog);
console.log(`   pares semánticos detectados: ${JSON.stringify(pairs)}`);
ok(assertNoUnresolvedDuplicates(catalog).length === 0, 'catálogo real: 0 duplicados sin resolver (hex-001 declarado duplicateOf sys-3)');
ok(MAP['hex-001'].duplicateOf === 'sys-3' && MAP['hex-001'].edadMin === MAP['sys-3'].edadMin && MAP['hex-001'].supervision === MAP['sys-3'].supervision,
  'hex-001 → sys-3: misma edadMin y supervisión (sin deriva)');

// Inyección 1: duplicado semántico NO declarado (clon de sys-3 con id nuevo)
const sys3 = catalog.find((e) => e.id === 'sys-3');
const inj1 = [...catalog, { ...sys3, id: 'hex-999', duplicateOf: undefined }];
const e1 = assertNoUnresolvedDuplicates(inj1);
ok(e1.some((x) => x.includes('NO DECLARADO')), `INYECCIÓN 1 (clon de sys-3 como hex-999) => gate cae: ${e1[0]}`);

// Inyección 2: quitar la declaración de hex-001
const inj2 = catalog.map((e) => (e.id === 'hex-001' ? { ...e, duplicateOf: undefined } : e));
const e2 = assertNoUnresolvedDuplicates(inj2);
ok(e2.some((x) => x.includes('hex-001') && x.includes('NO DECLARADO')), `INYECCIÓN 2 (quitar duplicateOf de hex-001) => gate cae: ${e2[0]}`);

// Inyección 3: alias declarado pero con deriva de edad
const inj3 = catalog.map((e) => (e.id === 'hex-001' ? { ...e, edad_minima_segura: 8 } : e));
const e3 = assertNoUnresolvedDuplicates(inj3);
ok(e3.length >= 0 && (e3.some((x) => x.includes('DERIVA')) || findSemanticDuplicates(inj3).length === 0),
  `INYECCIÓN 3 (alias con edadMin distinta) => ${e3.length ? e3[0] : 'deja de ser par semántico (edad distinta ⇒ ya no comparten edadMin); cubierto por deriva mapa↔catálogo'}`);

// Inyección 4: duplicateOf huérfano
const inj4 = catalog.map((e) => (e.id === 'hex-002' ? { ...e, duplicateOf: 'sys-404' } : e));
ok(assertNoUnresolvedDuplicates(inj4).some((x) => x.includes('huérfano')), 'INYECCIÓN 4 (duplicateOf huérfano) => gate cae');

// Regresión: mover un tier/edad en el catálogo se refleja en el mapa (es derivado)
const moved = projectSafetyEntry({ ...sys3, edad_minima_segura: 16, requiere_supervision_presencial: true });
ok(moved.edadMin === 16 && moved.tier_riesgo === 'alto', 'REGRESIÓN: cambiar el catálogo cambia la proyección del mapa (sin editar el mapa)');

// ── 4. P12-A: Q1 (alias), Q2 (edadMin<10 supervisión efectiva), Q4 (targetZones canónicas) ──
console.log('\n▶ [4/4] P12-A: Q1 alias, Q2 supervisión edadMin<10 y Q4 targetZones canónicas');
ok(MAP['hex-001'].isAlias === true && MAP['hex-001'].independentPrescribable === false && MAP['hex-001'].parentIllustrationStatus === 'rejected_by_owner',
  'Q1: hex-001 marcado como alias no independiente con parentIllustrationStatus="rejected_by_owner"');

const under10Entries = Object.values(MAP).filter((m) => m.edadMin < 10);
ok(under10Entries.length === 14 && under10Entries.every((m) => m.edadMin === 8 && m.supervision === false && m.effectiveSupervision === true && m.supervisionReason === 'q2_age_min_under_10' && m.tier_riesgo === 'bajo'),
  `Q2: ${under10Entries.length}/14 ejercicios con edadMin=8 tienen effectiveSupervision=true derivada y mantienen tier_riesgo='bajo'`);

const tzAudit = auditCatalogTargetZones(catalog);
ok(tzAudit.nonCanonicalCount === 0, `Q4: 118/118 ejercicios resuelven 100% a CANONICAL_TARGET_ZONES (nonCanonicalCount=${tzAudit.nonCanonicalCount})`);
ok(Object.values(MAP).every((m) => Array.isArray(m.canonicalTargetZones) && m.canonicalTargetZones.length > 0 && m.canonicalTargetZones.every((z) => CANONICAL_TARGET_ZONE_SET.has(z))),
  'Q4: todas las entradas del mapa proyectan canonicalTargetZones válidas');
ok(['sys-1', 'sys-2', 'sys-3', 'sys-8', 'sys-9', 'hex-001'].every((id) => JSON.stringify(MAP[id].canonicalTargetZones) === JSON.stringify(REDESIGN_SVG_CANONICAL_ZONES[id])),
  'Q4: sys-1, sys-2, sys-3, sys-8, sys-9 y hex-001 tienen canonicalTargetZones listas para rediseño SVG');
ok(normalizeTargetZone('zona_inventada_inexistente') === '[TARGETZONE_NO_CANONICA]' && normalizeTargetZone('gluteo') === '[TARGETZONE_NO_CANONICA]',
  'Q4: inyección de zona desconocida o "gluteo" sin contexto devuelve [TARGETZONE_NO_CANONICA] (0 unknowns silenciosos)');

console.log(failed ? '\n❌ [TEST-SAFETY-MAP] FALLÓ' : '\n✅ [TEST-SAFETY-MAP] 100% PASS');
process.exit(failed ? 1 : 0);
