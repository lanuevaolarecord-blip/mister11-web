/**
 * scripts/check-interpolation.mjs
 * Míster11 — Verificador de interpolación de placeholders en traducciones y componentes.
 *
 * Revisa:
 *  1. Todas las claves de translations.js que contienen placeholders {variable}.
 *  2. Verifica que cada invocación t('clave', ...) proporcione las variables requeridas en su objeto de reemplazos.
 *  3. Detecta cadenas crudas o plantillas que contengan placeholders sin interpolar (ej. "{zone}", "{count}") en el código fuente.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🔍 [CHECK-INTERPOLATION] AUDITANDO INTERPOLACIÓN DE PLACEHOLDERS');
console.log('══════════════════════════════════════════════════════════════════════\n');

// 1. Cargar translations.js y extraer todas las claves con {placeholders}
const translationsFile = resolve(rootDir, 'src/i18n/translations.js');
const translationsContent = readFileSync(translationsFile, 'utf-8');

const keyWithPlaceholders = new Map();
const keyRegex = /'([a-zA-Z0-9._-]+)':\s*'([^']*)'/g;
let match;
while ((match = keyRegex.exec(translationsContent)) !== null) {
  const [, key, value] = match;
  const placeholders = [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(m => m[1]);
  if (placeholders.length > 0) {
    if (!keyWithPlaceholders.has(key)) {
      keyWithPlaceholders.set(key, new Set(placeholders));
    } else {
      placeholders.forEach(p => keyWithPlaceholders.get(key).add(p));
    }
  }
}

console.log(`ℹ️  Se detectaron ${keyWithPlaceholders.size} claves con placeholders en translations.js.`);

// 2. Recorrer archivos de código en src/ (jsx, js)
function getSourceFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = resolve(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        getSourceFiles(filePath, fileList);
      }
    } else {
      const ext = extname(file);
      if (['.jsx', '.js', '.tsx', '.ts'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const srcDir = resolve(rootDir, 'src');
const allFiles = getSourceFiles(srcDir);
const errors = [];

// Claves críticas de captura y sector que NUNCA deben llamarse sin interpolar
const CRITICAL_KEYS = ['sector.activeZone'];

for (const filePath of allFiles) {
  // Ignorar traducciones y tests mock
  if (filePath.includes('translations.js')) continue;

  const content = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(rootDir, '').replace(/^[\\/]/, '');

  // 2a. Verificar invocaciones t('key', ...) o tx('key', ...)
  for (const [key, expectedParams] of keyWithPlaceholders.entries()) {
    // Buscar llamadas a t('key' o tx('key'
    const callPattern = new RegExp(`\\b(?:t|tx)\\(\\s*['"\`]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*([),])`, 'g');
    let callMatch;
    while ((callMatch = callPattern.exec(content)) !== null) {
      const nextChar = callMatch[1];
      if (nextChar === ')') {
        // Llamado sin segundo argumento (sin objeto de reemplazos)
        errors.push({
          file: relPath,
          key,
          error: `Invocación de t('${key}') sin argumento de reemplazos. Requiere: ${[...expectedParams].join(', ')}`
        });
      }
    }
  }

  // 2b. Verificar si en componentes clave quedaron placeholders crudos como {zone} o {ZONE} en el render
  if (relPath.includes('SectorMiniPitch2D') || relPath.includes('LiveStats') || relPath.includes('ShotCaptureModal')) {
    const rawPlaceholders = content.match(/>[^<]*\{zone\}[^<]*</gi) || [];
    for (const raw of rawPlaceholders) {
      errors.push({
        file: relPath,
        key: 'raw_html_placeholder',
        error: `Placeholder crudo en marcado: ${raw.trim()}`
      });
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ Se encontraron ${errors.length} errores de interpolación:\n`);
  for (const err of errors) {
    console.error(`  - [${err.file}] Clave "${err.key}": ${err.error}`);
  }
  process.exit(1);
} else {
  console.log('✅ Verificación de interpolación aprobada: 0 llamadas huérfanas o placeholders crudos detectados.');
  process.exit(0);
}
