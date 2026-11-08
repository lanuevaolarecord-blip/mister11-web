/**
 * scripts/gen-rules-age-lists.mjs
 * Uso:  node scripts/gen-rules-age-lists.mjs --write   (regenera el bloque en firestore.rules)
 *       node scripts/gen-rules-age-lists.mjs --check   (falla si el bloque no coincide con el mapa)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CANONICAL_EXERCISE_SAFETY_MAP } from '../src/data/exerciseSafetyMap.js';
import { renderGeneratedBlock, injectIntoRules } from './lib/rulesAgeCodegen.mjs';

const rulesPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../firestore.rules');
const current = fs.readFileSync(rulesPath, 'utf8');
const next = injectIntoRules(current, renderGeneratedBlock(CANONICAL_EXERCISE_SAFETY_MAP));
const mode = process.argv[2];
if (mode === '--write') {
  fs.writeFileSync(rulesPath, next);
  console.log('firestore.rules: bloque GEN:AGE_LISTS regenerado desde exerciseSafetyMap.');
} else if (mode === '--check') {
  if (next !== current) {
    console.error('❌ firestore.rules NO coincide con la generación desde exerciseSafetyMap (¿edición manual o mapa cambiado?). Ejecuta --write.');
    process.exit(1);
  }
  console.log('✅ firestore.rules coincide con la generación desde exerciseSafetyMap.');
} else {
  console.error('Uso: --write | --check');
  process.exit(2);
}

