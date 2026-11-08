/**
 * scripts/test-i18n-typecheck-breakage.mjs
 * MÍSTER11 — E16: Verificación de Tipos Estáticos (tsc --noEmit) y Sello de Rotura
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('📘 [TEST-I18N-TYPECHECK-BREAKAGE] VERIFICACIÓN ESTÁTICA TSC');
console.log('══════════════════════════════════════════════════════════════════════\n');

// 1. Corrida limpia
console.log('▶ [1/2] Ejecutando tsc --noEmit en estado limpio...');
try {
  const cleanOutput = execSync('npx tsc --noEmit', { cwd: rootDir, encoding: 'utf-8' });
  console.log('✅ tsc --noEmit ejecutó con éxito (cero errores de tipo en el codebase).');
  if (cleanOutput.trim()) console.log(cleanOutput);
} catch (err) {
  console.error('❌ Fallo inesperado en tsc limpio:', err.stdout || err.message);
  process.exit(1);
}

// 2. Corrida con clave faltante inyectada
console.log('\n▶ [2/2] Inyectando diccionario incompleto para verificar rotura estática...');
const testFilePath = path.resolve(rootDir, 'src/types/test-breakage.ts');
const brokenContent = `
import { ExactCoreDictionary } from './i18n.d';

// Objeto al que le falta 'player.tab.plans' de forma intencional
export const brokenLocaleDictionary: ExactCoreDictionary = {
  'player.nav.profile': 'Perfil',
  'player.nav.stats': 'Estadísticas',
  'player.nav.chat': 'Mister',
  'player.nav.physical': 'Físico',
  'nav.schedule': 'Calendario'
  // 'player.tab.plans' OMITIDO
};
`;

fs.writeFileSync(testFilePath, brokenContent, 'utf-8');

let caughtBreakage = false;
let breakageMessage = '';
try {
  execSync('npx tsc --noEmit', { cwd: rootDir, encoding: 'utf-8' });
} catch (err) {
  caughtBreakage = true;
  breakageMessage = (err.stdout || err.stderr || err.message).toString();
} finally {
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
}

if (caughtBreakage && breakageMessage.includes('player.tab.plans')) {
  console.log('✅ tsc detectó correctamente la clave faltante y rompió la compilación (Fail-Closed):');
  console.log('----------------------------------------------------------------------');
  console.log(breakageMessage.trim());
  console.log('----------------------------------------------------------------------');
} else {
  console.error('❌ FALLO: tsc no detectó la clave i18n faltante.');
  process.exit(1);
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('✅ [TEST-I18N-TYPECHECK-BREAKAGE] 100% PASS — SELLO DE TIPOS ACTIVO.');
console.log('══════════════════════════════════════════════════════════════════════');

