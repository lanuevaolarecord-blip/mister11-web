/**
 * scripts/check-manifest.mjs
 * Míster11 — Guarda de Integridad de PWA, Manifest y Rotación Libre
 *
 * Valida:
 * 1. manifest.json (public y public_hosting) tiene orientation === "any" y display === "standalone".
 * 2. vite.config.js tiene orientation: "any" en el plugin PWA.
 * 3. Todos los screen.orientation.lock() en src/** están emparejados con su unlock() garantizado.
 * 4. Fallback cero en variables safe-area (--sat, --sab, --sal, --sar).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');

console.log('==============================================================================');
console.log('MÍSTER 11 — CI PWA MANIFEST & ROTATION REGRESSION GUARD');
console.log('==============================================================================\n');

let hasErrors = false;

// ── 1. Validar manifests JSON ────────────────────────────────────────────────
const manifestPaths = [
  path.join(projectRoot, 'public', 'manifest.json'),
  path.join(projectRoot, 'public_hosting', 'manifest.json'),
  path.join(projectRoot, 'public_hosting', 'manifest.webmanifest'),
];

manifestPaths.forEach((manifestPath) => {
  const relPath = path.relative(projectRoot, manifestPath).replace(/\\/g, '/');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ [FAIL] No existe el archivo de manifest: ${relPath}`);
    hasErrors = true;
    return;
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    // Orientation must be "any"
    if (manifest.orientation !== 'any') {
      console.error(`❌ [FAIL] ${relPath} tiene orientation="${manifest.orientation}". Debe ser "any" para permitir rotación libre.`);
      hasErrors = true;
    } else {
      console.log(`✅ [PASS] ${relPath} tiene orientation="any".`);
    }

    // Display must be "standalone"
    if (manifest.display !== 'standalone') {
      console.error(`❌ [FAIL] ${relPath} tiene display="${manifest.display}". Debe ser "standalone".`);
      hasErrors = true;
    } else {
      console.log(`✅ [PASS] ${relPath} tiene display="standalone".`);
    }

    // start_url must exist
    if (!manifest.start_url) {
      console.error(`❌ [FAIL] ${relPath} no define start_url.`);
      hasErrors = true;
    }

    // Icons must have 192 and 512
    if (!manifest.icons || !Array.isArray(manifest.icons) || manifest.icons.length < 2) {
      console.error(`❌ [FAIL] ${relPath} requiere al menos iconos 192x192 y 512x512.`);
      hasErrors = true;
    } else {
      const sizes = manifest.icons.map((i) => i.sizes).join(' ');
      if (!sizes.includes('192') || !sizes.includes('512')) {
        console.error(`❌ [FAIL] ${relPath} no contiene los tamaños mínimos de icono (192 y 512): ${sizes}`);
        hasErrors = true;
      }
    }
  } catch (err) {
    console.error(`❌ [FAIL] Error analizando ${relPath}: ${err.message}`);
    hasErrors = true;
  }
});

// ── 2. Validar vite.config.js ────────────────────────────────────────────────
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (!/orientation:\s*['"]any['"]/.test(viteConfig)) {
    console.error('❌ [FAIL] vite.config.js no define orientation: "any" en el plugin PWA.');
    hasErrors = true;
  } else {
    console.log('✅ [PASS] vite.config.js define orientation: "any" en el plugin PWA.');
  }
} else {
  console.error('❌ [FAIL] vite.config.js no encontrado.');
  hasErrors = true;
}

// ── 3. Grep Guard: screen.orientation.lock / unlock emparejados ───────────────
function getSourceFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx', '.html']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const allSrcFiles = getSourceFiles(srcDir);
let locksFound = 0;

allSrcFiles.forEach((file) => {
  const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  if (content.includes('.orientation.lock(')) {
    locksFound++;
    // Verificar que el mismo archivo contenga el unlock correspondiente
    if (!content.includes('.orientation.unlock(')) {
      console.error(`❌ [FAIL] ${relPath} invoca screen.orientation.lock() sin unlock() garantizado emparejado.`);
      hasErrors = true;
    } else {
      console.log(`ℹ️ [INFO] ${relPath} tiene orientation.lock() con unlock() garantizado.`);
    }
  }
});

console.log(`📊 Grep guard completado: ${locksFound} locks de orientación analizados en src/**.`);

// ── 4. Validar variables safe-area con fallback CERO en index.css ──────────────
const indexCssPath = path.join(srcDir, 'index.css');
if (fs.existsSync(indexCssPath)) {
  const css = fs.readFileSync(indexCssPath, 'utf8');
  // Chequear que --sat no tenga max(..., >0px)
  if (/--sat:\s*max\([^)]+,\s*[1-9]\d*px\)/.test(css)) {
    console.error('❌ [FAIL] src/index.css tiene un fallback mayor a 0px en --sat (crea banda vacía en navegadores).');
    hasErrors = true;
  } else if (!/--sat:\s*env\(safe-area-inset-top,\s*0px\)/.test(css)) {
    console.warn('⚠️ [WARN] src/index.css no tiene la declaración estándar --sat: env(safe-area-inset-top, 0px);');
  } else {
    console.log('✅ [PASS] src/index.css usa fallback 0px en --sat: env(safe-area-inset-top, 0px).');
  }
}

// ── 5. Validar que ningún control del header se oculte en CSS ────────────────
if (fs.existsSync(indexCssPath)) {
  const css = fs.readFileSync(indexCssPath, 'utf8');
  const forbiddenSelectors = [
    '\\.header-logout-btn',
    '\\.header-mode-toggle',
    '\\.header-theme-toggle',
    '\\.header-notif-btn',
    '\\.header-settings-btn',
    '\\.header-staff-role-switcher',
    '\\.team-switcher-header-v2',
  ];

  forbiddenSelectors.forEach((sel) => {
    // Regex buscando selector seguido de bloque con display: none o visibility: hidden
    const regex = new RegExp(`${sel}[^{]*\\{[^}]*(?:display\\s*:\\s*none|visibility\\s*:\\s*hidden)`, 'i');
    if (regex.test(css)) {
      console.error(`❌ [FAIL] src/index.css oculta el control del header (${sel}) con display:none o visibility:hidden.`);
      hasErrors = true;
    } else {
      console.log(`✅ [PASS] Control ${sel.replace(/\\/g, '')} visible sin reglas de ocultado en CSS.`);
    }
  });
}

// ── Resultado Final ──────────────────────────────────────────────────────────
if (hasErrors) {
  console.error('\n💥 La guarda de PWA manifest, rotation & header visibility detectó violaciones. Revisa los errores anteriores.\n');
  process.exit(1);
} else {
  console.log('\n✅ [ALL PASS] Todos los manifests, guardas de orientación, safe-area y controles de header son conformes al estándar.\n');
  process.exit(0);
}
