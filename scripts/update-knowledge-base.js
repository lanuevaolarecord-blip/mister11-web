#!/usr/bin/env node
/**
 * scripts/update-knowledge-base.js
 * MÍSTER11 — Validador y Sincronizador de la Base de Conocimiento de Aprendizaje Continuo
 * 
 * Uso: node scripts/update-knowledge-base.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ERROR_PATTERNS } from '../src/utils/errorPatterns.js';
import { SOLUTION_PATTERNS } from '../src/utils/solutionPatterns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('🔄 MÍSTER11 — ACTUALIZACIÓN Y VALIDACIÓN DE LA BASE DE CONOCIMIENTO');
console.log('==============================================================================\n');

let hasErrors = false;

// 1. Validar existencia y consistencia de documentos maestros
const requiredDocs = [
  'docs/LECCIONES_APRENDIDAS.md',
  'docs/CHECKLIST_IMPLEMENTACION.md',
  'docs/HOW_TO_CONTRIBUTE_LEARNINGS.md'
];

requiredDocs.forEach(docRel => {
  const fullPath = path.join(rootDir, docRel);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Falta documento requerido: ${docRel}`);
    hasErrors = true;
  } else {
    const stat = fs.statSync(fullPath);
    if (stat.size < 100) {
      console.warn(`⚠️  Documento posiblemente vacío o incompleto: ${docRel} (${stat.size} bytes)`);
    } else {
      console.log(`✅ Documento verificado: ${docRel} (${stat.size} bytes)`);
    }
  }
});

// 2. Validar integridad de ERROR_PATTERNS
const errorKeys = Object.keys(ERROR_PATTERNS);
console.log(`\n📋 Patrones de error registrados: ${errorKeys.length}`);
errorKeys.forEach(k => {
  const p = ERROR_PATTERNS[k];
  if (!p.description || !p.symptom || !p.solution || !p.prevention) {
    console.error(`❌ Patrón de error incompleto: ${k}`);
    hasErrors = true;
  }
});

// 3. Validar integridad de SOLUTION_PATTERNS
const solutionKeys = Object.keys(SOLUTION_PATTERNS);
console.log(`📋 Patrones de solución registrados: ${solutionKeys.length}`);
solutionKeys.forEach(k => {
  const s = SOLUTION_PATTERNS[k];
  if (!s.description || !s.template || !s.useCases || s.useCases.length === 0) {
    console.error(`❌ Patrón de solución incompleto: ${k}`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('\n❌ Se detectaron inconsistencias en la base de conocimiento.');
  process.exit(1);
} else {
  console.log('\n✨ Base de conocimiento íntegra, sincronizada y lista para asistir a Antigravity.\n');
  process.exit(0);
}
