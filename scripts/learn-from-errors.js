#!/usr/bin/env node
/**
 * scripts/learn-from-errors.js
 * MÍSTER11 — Analizador de Anti-patrones y Aprendizaje de Errores en Código
 * 
 * Uso: node scripts/learn-from-errors.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootSrc = path.resolve(__dirname, '../src');

// Colores prohibidos en Míster11 (ej. azules genéricos que no sean de marcas de terceros)
const FORBIDDEN_COLORS_REGEX = /#(?:3b82f6|2563eb|1d4ed8|1e40af|60a5fa|93c5fd)/gi;

// Emojis habituales en UI
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

function analyzeFile(filePath) {
  const relPath = path.relative(rootSrc, filePath);
  // Omitir utilidades de paleta, tests, mocks y librerías externas
  if (
    filePath.includes('__tests__') ||
    filePath.includes('node_modules') ||
    relPath.startsWith('assets') ||
    relPath.includes('errorPatterns.js') ||
    relPath.endsWith('.test.js') ||
    relPath.endsWith('.spec.js')
  ) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // 1. Detección de azules genéricos prohibidos
  const forbiddenMatches = content.match(FORBIDDEN_COLORS_REGEX);
  if (forbiddenMatches) {
    // Excluir integraciones oficiales de Google Sign-in donde #4285F4 está permitido
    const filtered = forbiddenMatches.filter(c => c.toLowerCase() !== '#4285f4');
    if (filtered.length > 0) {
      issues.push({
        type: 'HARDCODED_FORBIDDEN_COLOR',
        severity: 'ALTA',
        message: `Colores no institucionales detectados: ${[...new Set(filtered)].join(', ')}`,
        suggestion: 'Reemplazar por tokens de la Paleta Oficial Tierra y Campo (#1B3A2D, #4CAF7D, #D4A843, #F5F0E8)'
      });
    }
  }

  // 2. Detección de async con estados de carga sin finally
  if (
    (content.includes('setIsLoading(true)') || content.includes('setLoading(true)') || content.includes('setIsSaving(true)')) &&
    !content.includes('finally')
  ) {
    issues.push({
      type: 'MISSING_FINALLY_RESET',
      severity: 'CRÍTICA',
      message: 'Se activa un estado de carga (setIsLoading / setIsSaving) pero no se encontró bloque finally',
      suggestion: 'Envolver la operación en try/catch/finally y garantizar el reseteo del spinner en finally'
    });
  }

  // 3. Detección de búsquedas en tiempo real directas sin debounce
  if (
    content.includes('searchTeam') &&
    content.includes('onChange') &&
    !content.includes('setTimeout') &&
    !content.includes('debounce')
  ) {
    issues.push({
      type: 'SEARCH_WITHOUT_DEBOUNCE',
      severity: 'MEDIA',
      message: 'Se detectó invocación de búsqueda directa en onChange sin temporizador debounce',
      suggestion: 'Implementar debounce de 300 ms (ver solución REAL_TIME_SEARCH)'
    });
  }

  // 4. Detección de imágenes sin fallback visual
  if (
    content.includes('<img') &&
    (content.includes('player.photo') || content.includes('jugador.foto')) &&
    !content.includes('onError') &&
    !content.includes('PlayerAvatar')
  ) {
    issues.push({
      type: 'IMAGE_WITHOUT_FALLBACK',
      severity: 'MEDIA',
      message: 'Se detectó renderizado de foto de jugador sin manejador onError o fallback de avatar',
      suggestion: 'Utilizar el componente PlayerAvatar o añadir onError con fallback a inicial'
    });
  }

  return issues;
}

function scanDirectory(dir) {
  let issuesList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      issuesList = issuesList.concat(scanDirectory(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.css'))) {
      const fileIssues = analyzeFile(fullPath);
      fileIssues.forEach(iss => {
        iss.file = path.relative(path.resolve(__dirname, '..'), fullPath);
      });
      issuesList = issuesList.concat(fileIssues);
    }
  }

  return issuesList;
}

console.log('==============================================================================');
console.log('🔍 MÍSTER11 — AUDITORÍA AUTOMÁTICA DE ANTI-PATRONES Y LECCIONES APRENDIDAS');
console.log('==============================================================================\n');

const detectedIssues = scanDirectory(rootSrc);

if (detectedIssues.length === 0) {
  console.log('✅ ¡ENHORABUENA! No se encontraron anti-patrones en el código de src/');
  console.log('   - 0 colores azules prohibidos.');
  console.log('   - Todos los estados de carga contienen bloques finally.');
  console.log('   - Búsquedas con debounce y gestión segura de medios.\n');
  process.exit(0);
} else {
  console.log(`⚠️  Se encontraron ${detectedIssues.length} posibles anti-patrones en el código:\n`);
  detectedIssues.forEach((iss, index) => {
    console.log(`${index + 1}. [${iss.severity}] ${iss.type} en: ${iss.file}`);
    console.log(`   Detalle: ${iss.message}`);
    console.log(`   Sugerencia: ${iss.suggestion}\n`);
  });
  console.log('Por favor revisa y corrige estos puntos consultando docs/LECCIONES_APRENDIDAS.md.\n');
  process.exit(0);
}
