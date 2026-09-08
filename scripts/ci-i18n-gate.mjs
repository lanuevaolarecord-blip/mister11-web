/**
 * scripts/ci-i18n-gate.mjs
 * Míster11 — Gate 7: Strict CI Gate, Parity, Literal Audit & Breakage Resilience Test
 *
 * Checks:
 *   1. Symmetric key parity (ES ↔ EN 100%)
 *   2. QA Linguistics (Zero Spanish leakage in EN, valid plural rules, non-empty values)
 *   3. Static Literal Audit (Zero hardcoded literals in JSX)
 *   4. Breakage Simulation Test (Proves that the gate correctly fails when a defect is introduced)
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🚀 [CI-I18N-GATE] INICIANDO VALIDACIÓN ESTRICTA DEL PROTOCOLO DE IDIOMA');
console.log('══════════════════════════════════════════════════════════════════════\n');

// ── PASO 1: Paridad Simétrica de Claves (check-i18n.js) ────────────────────────
console.log('▶ [Paso 1/4] Verificando paridad simétrica de claves ES ↔ EN...');
try {
  const out = execSync('node scripts/check-i18n.js', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Paridad 100% verificada.');
} catch (err) {
  console.error('   ❌ Error en paridad de claves:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 2: Integridad Lingüística (qa-language.js) ───────────────────────────
console.log('\n▶ [Paso 2/4] Verificando integridad lingüística y reglas de plurales...');
try {
  const out = execSync('node scripts/qa-language.js', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Integridad lingüística y plurales válidos.');
} catch (err) {
  console.error('   ❌ Error en integridad lingüística:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 3: Auditoría de Literales Estáticos (audit-literals.mjs) ─────────────
console.log('\n▶ [Paso 3/4] Auditando ausencia total de literales estáticos UI...');
try {
  const out = execSync('node scripts/audit-literals.mjs --fail-on-found', { cwd: rootDir, encoding: 'utf-8' });
  console.log('   ✅ Cero literales estáticos detectados (0 offenders).');
} catch (err) {
  console.error('   ❌ Error: se detectaron literales sin traducir:\n', err.stdout || err.message);
  process.exit(1);
}

// ── PASO 4: Breakage Resilience Test ──────────────────────────────────────────
console.log('\n▶ [Paso 4/4] Ejecutando Breakage Test (Prueba de rotura simulada)...');
const translationsPath = resolve(rootDir, 'src/i18n/translations.js');
const originalContent = readFileSync(translationsPath, 'utf-8');

try {
  // 1. Simular rotura: Inyectar clave solo en ES sin contraparte en EN
  const tamperedContent = originalContent.replace(
    "'nav.dashboard': 'DASHBOARD',",
    "'nav.dashboard': 'DASHBOARD',\n    'test.fakeBreakageKey': 'Texto falso para romper la paridad',"
  );
  writeFileSync(translationsPath, tamperedContent, 'utf-8');

  let breakageDetected = false;
  try {
    execSync('node scripts/check-i18n.js', { cwd: rootDir, stdio: 'pipe' });
  } catch (breakErr) {
    breakageDetected = true;
  }

  if (!breakageDetected) {
    throw new Error('El script check-i18n.js NO detectó la falta de clave en el diccionario inglés.');
  }
  console.log('   ✅ Simulación de clave huérfana: el CI bloqueó correctamente la rotura.');

  // 2. Simular rotura: Inyectar stopword en español en diccionario inglés
  const tamperedContent2 = originalContent.replace(
    "'English (EN)': {",
    "'English (EN)': {\n    'test.fakeLeakageKey': 'This is a test with equipo leaked word',"
  );
  writeFileSync(translationsPath, tamperedContent2, 'utf-8');

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
  // Restaurar archivo original intacto
  writeFileSync(translationsPath, originalContent, 'utf-8');
  console.log('   ♻️ Estado de translations.js restaurado al 100%.');
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('🎉 [CI-I18N-GATE] ¡TODOS LOS GATES LINGÜÍSTICOS APROBADOS CON ÉXITO! (4/4)');
console.log('══════════════════════════════════════════════════════════════════════\n');
process.exit(0);
