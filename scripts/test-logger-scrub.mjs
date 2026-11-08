/**
 * scripts/test-logger-scrub.mjs
 * MÍSTER11 — E15: Validación de Sanitización de PII (Scrubbing) y Conteo de console.log
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrubPII, logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🛡️ [TEST-LOGGER-SCRUB] VERIFICACIÓN DE SANITIZACIÓN PII Y CONTEO');
console.log('══════════════════════════════════════════════════════════════════════\n');

// 1. Conteo exhaustivo de console.log en src/
let consoleLogCount = 0;
function countLogs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      countLogs(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(/console\.log\s*\(/g);
      if (matches) consoleLogCount += matches.length;
    }
  }
}
countLogs(path.resolve(rootDir, 'src'));
console.log(`▶ [1/2] Conteo de console.log restantes en src/: ${consoleLogCount} ocurrencias`);

// 2. Test de Scrubbing en Acción
console.log('\n▶ [2/2] Ejecutando pruebas de scrubbing PII (Email, Teléfono, DNI, Secret)...');

const rawPayload = {
  user: 'Carlos Entrenador',
  email: 'carlos.entrenador@mister11.com',
  phone: '612 345 6789',
  dni: '12345678Z',
  nie: 'X1234567Y',
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
    password: 'PasswordSuperSegura123!'
  },
  playerName: 'Mateo Menor',
  birthDate: '2012-05-14',
  diagnosticMessage: 'El jugador con DNI 87654321A llamó desde el +34 600 123 456'
};

const scrubbed = scrubPII(rawPayload);

console.log('--- PAYLOAD ORIGINAL (CON PII) ---');
console.log(JSON.stringify(rawPayload, null, 2));

console.log('\n--- PAYLOAD SANITIZADO (SCRUBBED) ---');
console.log(JSON.stringify(scrubbed, null, 2));

let errors = 0;

// Verificaciones
if (scrubbed.email !== '[REDACTED_EMAIL]') {
  console.error('❌ Fallo al sanitizar email directo'); errors++;
}
if (scrubbed.dni !== '[REDACTED_DNI_NIE]') {
  console.error('❌ Fallo al sanitizar DNI directo'); errors++;
}
if (scrubbed.nie !== '[REDACTED_DNI_NIE]') {
  console.error('❌ Fallo al sanitizar NIE directo'); errors++;
}
if (scrubbed.auth.token !== '[REDACTED_SECRET]' || scrubbed.auth.password !== '[REDACTED_SECRET]') {
  console.error('❌ Fallo al sanitizar tokens/passwords'); errors++;
}
if (scrubbed.diagnosticMessage.includes('87654321A')) {
  console.error('❌ Fallo al sanitizar DNI dentro de texto libre'); errors++;
}
if (scrubbed.diagnosticMessage.includes('600 123 456') || !scrubbed.diagnosticMessage.includes('[REDACTED_PHONE]')) {
  console.error('❌ Fallo al sanitizar teléfono inline dentro de texto libre'); errors++;
}
if (scrubbed.playerName !== '[REDACTED_MINOR_PII]') {
  console.error('❌ Fallo al sanitizar playerName de menor'); errors++;
}
if (scrubbed.birthDate !== '[REDACTED_DOB]') {
  console.error('❌ Fallo al sanitizar birthDate de menor'); errors++;
}

// Probar logger.log interceptado
let loggedOutput = [];
const originalConsoleLog = console.log;
console.log = (...args) => {
  loggedOutput.push(args.join(' '));
  originalConsoleLog(...args);
};

console.log('\n--- PRUEBA VÍA LOGGER.LOG ---');
logger.log('Evento de usuario:', rawPayload);
console.log = originalConsoleLog;

const capturedText = loggedOutput.join(' ');
if (capturedText.includes('carlos.entrenador@mister11.com') || capturedText.includes('12345678Z')) {
  console.error('❌ FUGA DETECTADA: logger.log emitió PII sin sanitizar');
  errors++;
} else {
  console.log('\n✅ logger.log interceptó y sanitizó toda la salida con éxito.');
}

if (errors > 0) {
  console.error(`\n❌ [FAIL] ${errors} fallos en el sistema de scrubbing.`);
  process.exit(1);
} else {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('✅ [TEST-LOGGER-SCRUB] 100% PASS — CERO FUGAS DE PII.');
  console.log('══════════════════════════════════════════════════════════════════════');
}

