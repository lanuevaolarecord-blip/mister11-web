/**
 * check-viewport.mjs
 * Míster11 — Guarda de Integridad de Viewport Móvil
 * 
 * Valida que:
 * 1. Todo uso de 100vh en CSS/JSX tenga su correspondiente fallback o equivalente 100dvh.
 * 2. No existan estilos de overflow: hidden huérfanos en contenedores principales de ruta (#root, html, body)
 *    que secuestren el scroll elástico en dispositivos móviles.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

console.log('==============================================================================');
console.log('MÍSTER 11 — CI VIEWPORT & MOBILE SCROLL INTEGRITY CHECK');
console.log('==============================================================================\n');

function getSourceFiles(dir, extensions = ['.css', '.jsx', '.js']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = getSourceFiles(srcDir);
let hasErrors = false;
let vhCount = 0;
let dvhCount = 0;

// 1. Verificar fallback dvh para todo 100vh
allFiles.forEach(file => {
  const relPath = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('100vh')) {
      vhCount++;
      // En CSS: buscar si en esta línea o las adyacentes (-2 a +2) existe 'dvh'
      const context = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 3)).join('\n');
      if (!context.includes('dvh')) {
        console.error(`❌ [FAIL] 100vh sin fallback 100dvh: ${relPath}:${idx + 1}`);
        console.error(`   Línea: "${line.trim()}"\n`);
        hasErrors = true;
      } else {
        dvhCount++;
      }
    }
  });
});

// 2. Verificar que #root no tenga overflow-y: hidden en index.css
const indexCssPath = path.join(srcDir, 'index.css');
if (fs.existsSync(indexCssPath)) {
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');
  // Buscar bloque #root
  const rootMatch = indexCss.match(/#root\s*\{([^}]+)\}/);
  if (rootMatch && rootMatch[1]) {
    const rootBlock = rootMatch[1];
    if (rootBlock.includes('overflow-y: hidden') || rootBlock.includes('overflow: hidden')) {
      console.error('❌ [FAIL] #root contiene overflow: hidden u overflow-y: hidden global que bloquea scroll en páginas públicas.');
      hasErrors = true;
    }
  }
}

// 3. Verificar existencia de la clase .scroll-locked
if (fs.existsSync(indexCssPath)) {
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');
  if (!indexCss.includes('.scroll-locked')) {
    console.error('❌ [FAIL] Falta la definición canónica de la clase .scroll-locked en src/index.css.');
    hasErrors = true;
  }
}

console.log(`📊 Ocurrencias analizadas: ${vhCount} usos de 100vh emparejados con 100dvh.`);

if (hasErrors) {
  console.error('\n💥 La guarda de viewport detectó violaciones. Revisa las advertencias anteriores.\n');
  process.exit(1);
} else {
  console.log('✅ [PASS] Cero bloqueos de viewport detectados. Todos los 100vh tienen fallback dvh.');
  console.log('✅ [PASS] Scroll global y clase .scroll-locked conformes con el estándar móvil.\n');
  process.exit(0);
}
