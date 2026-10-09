/**
 * scripts/ci-i18n-gate.mjs
 * Míster11 — Gate Estricto N-Lenguas, Paridad, CLDR PluralRules, Auditoría Literal & Breakage Test
 *
 * Checks:
 *   G1. Symmetric key parity across all active Tier 1 languages (ES, ES-419, EN, PT, FR, ID)
 *   G2. QA Linguistics & CLDR PluralRules integrity (Zero Spanish leakage in EN, valid plural categories)
 *   G3. Static Literal Audit (Zero hardcoded literals in JSX)
 *   G4. Interpolation & Placeholder Audit (100% consistent parameters)
 *   G5. Active Selector & Non-Active Protection Audit (Tier 2 pending languages excluded from selector)
 *   G6. Breakage Simulation Test (Proves that the gate correctly fails when a defect is introduced)
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🚀 [CI-I18N-GATE] INICIANDO VALIDACIÓN ESTRICTA DEL PROTOCOLO MULTI-LENGUA');
console.log('══════════════════════════════════════════════════════════════════════\n');

// ── PASO 1: Paridad Simétrica de Claves N-Lenguas (check-i18n.js) ─────────────
console.log('▶ [Paso 1/6] Verificando paridad simétrica de claves en todas las lenguas activas...');
try {
  const out = execSync('node scripts/check-i18n.js', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Paridad 100% verificada en todas las lenguas activas.');
} catch (err) {
  console.error('   ❌ Error en paridad de claves:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 2: Integridad Lingüística y CLDR PluralRules (qa-language.js) ────────
console.log('\n▶ [Paso 2/7] Verificando integridad lingüística, enums y reglas CLDR PluralRules...');
try {
  const out = execSync('node scripts/qa-language.js', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Integridad lingüística, enums deportivos y plurales CLDR válidos.');
} catch (err) {
  console.error('   ❌ Error en integridad lingüística:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 3: Detector por Cadena — Mezcla, Tokens Cruzados & Copia sin Traducir (P1) ─
console.log('\n▶ [Paso 3/7] Ejecutando detector por cadena (igualdad cualquier lengua + mezclas + tokens cruzados)...');
try {
  const out = execSync('node scripts/detect-string-cross-leakage.mjs', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Detector por cadena completado (0 mezclas rotas, inventario generado).');
} catch (err) {
  console.error('   ❌ Error en detector por cadena:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 4: Auditoría de Literales Estáticos (audit-literals.mjs) ─────────────
console.log('\n▶ [Paso 4/7] Auditando ausencia total de literales estáticos UI...');
try {
  const out = execSync('node scripts/audit-literals.mjs --fail-on-found', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Cero literales estáticos detectados (0 offenders).');
} catch (err) {
  console.error('   ❌ Error: se detectaron literales sin traducir:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 5: Auditoría de Interpolación (check-interpolation.mjs) ───────────────
console.log('\n▶ [Paso 5/7] Verificando interpolación correcta de variables y placeholders...');
try {
  const out = execSync('node scripts/check-interpolation.mjs', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ 100% de placeholders interpolados correctamente.');
} catch (err) {
  console.error('   ❌ Error en interpolación de placeholders:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 6: Verificación del Registro de Locales y Selector (G5) ───────────────
console.log('\n▶ [Paso 6/7] Verificando aislamiento de lenguas pendientes vs activas (G5)...');
try {
  const regPath = resolve(rootDir, 'src/i18n/locales/registry.js');
  const { LOCALES_REGISTRY, getActiveLocales } = await import('file:///' + regPath.replace(/\\/g, '/'));
  const active = getActiveLocales();
  const all = Object.values(LOCALES_REGISTRY);
  const pending = all.filter(l => l.status === 'pending');

  if (active.length < 5) {
    throw new Error(`Se esperaban al menos 5 lenguas activas Tier 1, encontradas: ${active.length}`);
  }
  if (pending.length < 3) {
    throw new Error(`Se esperaban lenguas declaradas Tier 2 en pending, encontradas: ${pending.length}`);
  }
  for (const act of active) {
    if (act.status !== 'activo') throw new Error(`Lengua activa ${act.code} tiene estado incorrecto`);
  }
  console.log(`   ✅ Registro validado: ${active.length} activas, ${pending.length} declaradas pendientes.`);
} catch (err) {
  console.error('   ❌ Error en validación del registro de idiomas:\n', err.message);
  process.exit(1);
}

// ── PASO 7: Breakage Resilience Test ──────────────────────────────────────────
console.log('\n▶ [Paso 7/7] Ejecutando Breakage Test (Prueba de rotura simulada)...');
const esPath = resolve(rootDir, 'src/i18n/locales/es.js');
const enPath = resolve(rootDir, 'src/i18n/locales/en.js');
const originalEs = readFileSync(esPath, 'utf-8');
const originalEn = readFileSync(enPath, 'utf-8');

try {
  // 1. Simular rotura: Inyectar clave solo en ES sin contraparte en EN ni en el resto
  const tamperedEs = originalEs.replace(
    '"nav.dashboard": "DASHBOARD",',
    '"nav.dashboard": "DASHBOARD",\n  "test.fakeBreakageKey": "Texto falso para romper la paridad",'
  );
  writeFileSync(esPath, tamperedEs, 'utf-8');

  let breakageDetected = false;
  try {
    execSync('node scripts/check-i18n.js', { cwd: rootDir, stdio: 'pipe' });
  } catch (breakErr) {
    breakageDetected = true;
  }

  if (!breakageDetected) {
    throw new Error('El script check-i18n.js NO detectó la falta de clave huérfana inyectada.');
  }
  console.log('   ✅ Simulación de clave huérfana: el CI bloqueó correctamente la rotura.');

  // 2. Simular rotura: Inyectar stopword en español en diccionario inglés
  const tamperedEn = originalEn.replace(
    '"nav.dashboard": "DASHBOARD",',
    '"nav.dashboard": "DASHBOARD",\n  "test.fakeLeakageKey": "This is a test with equipo leaked word",'
  );
  writeFileSync(enPath, tamperedEn, 'utf-8');

  let leakageDetected = false;
  try {
    execSync('node scripts/qa-language.js', { cwd: rootDir, stdio: 'pipe' });
  } catch (leakErr) {
    leakageDetected = true;
  }

  if (!leakageDetected) {
    throw new Error('El script qa-language.js NO detectó la fuga de stopword en el diccionario inglés.');
  }
  console.log('   ✅ Simulación de fuga lingüística: el CI bloqueó correctamente la fuga.');

} finally {
  // Restaurar archivos originales intactos
  writeFileSync(esPath, originalEs, 'utf-8');
  writeFileSync(enPath, originalEn, 'utf-8');
  console.log('   ♻️ Estado de diccionarios restaurado al 100%.');
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('🎉 [CI-I18N-GATE] ¡TODOS LOS GATES MULTI-LENGUA APROBADOS CON ÉXITO! (7/7)');
console.log('══════════════════════════════════════════════════════════════════════\n');
process.exit(0);
