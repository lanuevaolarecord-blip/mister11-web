/**
 * scripts/reset-reviewer-account.js
 * ==============================================================================
 * MÍSTER11 — SCRIPT DE RESET: REGENERAR CUENTA DEMO DE REVISORES GOOGLE PLAY
 * ==============================================================================
 * Ejecuta una re-siembra limpia de la cuenta demo para dejar el equipo "Club Demo FC"
 * en su estado inicial óptimo, limpiando o sobreescribiendo datos alterados.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedScript = path.join(__dirname, 'seed-reviewer-account.js');

console.log('🔄 Iniciando reseteo de la cuenta de revisores de Google Play...');

const child = spawn(process.execPath, [seedScript], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ [Reset] Cuenta demo restaurada con éxito.');
  } else {
    console.error(`\n❌ [Reset] El proceso terminó con código ${code}.`);
    process.exit(code);
  }
});
