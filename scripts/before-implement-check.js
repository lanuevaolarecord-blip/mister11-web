#!/usr/bin/env node
/**
 * scripts/before-implement-check.js
 * MÍSTER11 — Consulta Previa Obligatoria de Lecciones Aprendidas y Patrones
 * 
 * Uso: node scripts/before-implement-check.js
 */

import { ERROR_PATTERNS } from '../src/utils/errorPatterns.js';
import { SOLUTION_PATTERNS } from '../src/utils/solutionPatterns.js';

console.log('==============================================================================');
console.log('📚 MÍSTER11 — SISTEMA DE APRENDIZAJE CONTINUO: CONSULTA PREVIA OBLIGATORIA');
console.log('==============================================================================\n');

console.log('Antes de escribir o modificar código, responde a las siguientes 3 preguntas:');
console.log('  1. ¿Esta funcionalidad/cambio es similar a algo ya resuelto en la app?');
console.log('  2. ¿Qué patrones de error y anti-patrones debo evitar conscientemente?');
console.log('  3. ¿Qué patrones de solución canónicos puedo y debo reutilizar?\n');

console.log('------------------------------------------------------------------------------');
console.log('🛠️  PATRONES DE SOLUCIÓN CANÓNICOS DISPONIBLES:');
console.log('------------------------------------------------------------------------------');
Object.values(SOLUTION_PATTERNS).forEach((sol, idx) => {
  console.log(`  ${idx + 1}. [${sol.name}]`);
  console.log(`     Descripción: ${sol.description}`);
  console.log(`     Casos de Uso: ${sol.useCases.join(', ')}\n`);
});

console.log('------------------------------------------------------------------------------');
console.log('⚠️   PATRONES DE ERROR A EVITAR:');
console.log('------------------------------------------------------------------------------');
Object.values(ERROR_PATTERNS).forEach((err, idx) => {
  console.log(`  ${idx + 1}. [${err.name}]`);
  console.log(`     Síntoma: ${err.symptom}`);
  console.log(`     Solución canónica: ${err.solution}`);
  console.log(`     Prevención: ${err.prevention}\n`);
});

console.log('------------------------------------------------------------------------------');
console.log('✅ RECUERDA:');
console.log('  - Touch targets mínimos: 48x48 dp (Android First).');
console.log('  - Paleta oficial: Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843). CERO azules.');
console.log('  - Cero emojis en botones y UI: Usar siempre iconos de Lucide React.');
console.log('  - Cero cadenas hardcodeadas: Todas en i18n/translations.js.');
console.log('  - Contraste certificado WCAG AA/AAA en Modo Claro y Modo Oscuro.');
console.log('==============================================================================\n');
