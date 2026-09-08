// FASE 0 — audit-literals.mjs
// Detector estático de literales UI hardcodeados en src/**
// Node ESM puro, sin dependencias, cross-platform (Windows/Linux/macOS)
// Genera: OFFENDERS-STATIC.json
// Uso:    node scripts/audit-literals.mjs [--fail-on-found]

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { resolve, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SRC_DIR   = resolve(__dirname, '../src');
const OUT_FILE  = resolve(__dirname, '../OFFENDERS-STATIC.json');
const FAIL_ON   = process.argv.includes('--fail-on-found');

// ── Dirs/files to skip ────────────────────────────────────────────────────────
const SKIP_DIRS  = new Set(['node_modules', '.git', 'dist', 'build', '__tests__', 'coverage']);
const SKIP_FILES = new Set(['translations.js', 'i18n-singleton.js', 'index.js', 'I18nDevOverlay.jsx']);

// ── Line-level early exits (not UI literals) ──────────────────────────────────
function shouldSkipLine(line) {
  const t = line.trimStart();
  return (
    t.startsWith('//') ||
    t.startsWith('*') ||
    t.startsWith('/*') ||
    t.startsWith('import ') ||
    t.startsWith('export ') ||
    line.includes('console.log') ||
    line.includes('console.warn') ||
    line.includes('console.error') ||
    line.includes("'mister11_") ||
    line.includes('"mister11_') ||
    line.includes('firebasestorage') ||
    line.includes('firebase.com') ||
    line.includes('className=') ||
    line.includes('// ')
  );
}

// ── Detection rules ───────────────────────────────────────────────────────────
// Each rule: cat (category), test(line) → match|null, exclude(line) → bool
const RULES = [
  {
    cat: 'NATIVE_DIALOG',
    desc: 'window.alert()/confirm() con literal hardcodeado',
    test: (line) => {
      // Matches: alert("...") or confirm("...") or window.alert("...")
      const m = line.match(/(?:window\.)?(?:alert|confirm)\s*\(\s*["'`]([^"'`\n]{5,})["'`]/);
      return m ? m[1] : null;
    },
    exclude: (line) => line.includes('isEn') || line.includes('{t(')
  },
  {
    cat: 'TOAST_HARDCODED',
    desc: 'showToast/showAlert/showConfirm con literal sin isEn',
    test: (line) => {
      const m = line.match(/show(?:Toast|Alert|Confirm)\s*\(\s*["'`]([^"'`\n]{5,})["'`]/);
      return m ? m[1] : null;
    },
    exclude: (line) => line.includes('isEn') || line.includes('{t(')
  },
  {
    cat: 'PLACEHOLDER_HARDCODED',
    desc: 'placeholder="" con texto hardcodeado sin t()/isEn',
    test: (line) => {
      const m = line.match(/placeholder\s*=\s*["']([^"']{5,})["']/);
      return m ? m[1] : null;
    },
    exclude: (line) => line.includes('{t(') || line.includes('isEn') || line.includes('placeholder={')
  },
  {
    cat: 'TITLE_HARDCODED',
    desc: 'title="" atributo con literal sin t()/isEn',
    test: (line) => {
      const m = line.match(/\btitle\s*=\s*["']([^"']{6,})["']/);
      return m ? m[1] : null;
    },
    exclude: (line) => line.includes('{t(') || line.includes('isEn') || line.includes('title={')
  },
  {
    cat: 'ARIA_HARDCODED',
    desc: 'aria-label con literal sin t()/isEn',
    test: (line) => {
      const m = line.match(/aria-label\s*=\s*["']([^"']{5,})["']/);
      return m ? m[1] : null;
    },
    exclude: (line) => line.includes('{t(') || line.includes('isEn')
  },
  {
    cat: 'LOCALE_DATE_NO_LOCALE',
    desc: 'toLocaleDateString() sin argumento de locale',
    test: (line) => {
      const m = line.match(/\.toLocaleDateString\(\s*\)/);
      return m ? '.toLocaleDateString()' : null;
    },
    exclude: () => false
  },
  {
    cat: 'SETSTATE_MSG_HARDCODED',
    desc: 'setXxxModal/setCaptureToast con msg literal sin isEn',
    test: (line) => {
      const m = line.match(/(?:setUpgradeModal|setCaptureToast|setError|setMsg)\s*\(\s*\{[^}]*(?:msg|message)\s*:\s*["'`]([^"'`]{6,})["'`]/);
      return m ? m[1] : null;
    },
    exclude: (line) => line.includes('isEn') || line.includes('{t(')
  }
];

// ── File walker ───────────────────────────────────────────────────────────────
function walk(dir) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir); } catch (_) { return results; }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch (_) { continue; }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) results.push(...walk(full));
    } else if (
      (name.endsWith('.jsx') || name.endsWith('.js')) &&
      !SKIP_FILES.has(name)
    ) {
      results.push(full);
    }
  }
  return results;
}

// ── Per-file analysis ─────────────────────────────────────────────────────────
function analyzeFile(filePath) {
  let content;
  try { content = readFileSync(filePath, 'utf-8'); } catch (_) { return []; }
  const lines = content.split('\n');
  const offenders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (shouldSkipLine(line)) continue;

    for (const rule of RULES) {
      let literal;
      try { literal = rule.test(line); } catch (_) { continue; }
      if (!literal) continue;

      let excluded = false;
      try { excluded = rule.exclude(line); } catch (_) {}
      if (excluded) continue;

      literal = String(literal).trim();
      if (literal.length < 4) continue;
      if (/^\d+$/.test(literal)) continue;          // pure number
      if (/^https?:\/\//.test(literal)) continue;   // URL

      offenders.push({
        file: relative(SRC_DIR, filePath).replace(/\\/g, '/'),
        line: i + 1,
        cat: rule.cat,
        desc: rule.desc,
        literal: literal.slice(0, 120),
        context: line.trim().slice(0, 150)
      });
      break; // one rule per line
    }
  }
  return offenders;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = walk(SRC_DIR);
console.log('\n=== FASE 0: audit-literals.mjs ===');
console.log('Archivos escaneados: ' + files.length);

const allOffenders = [];
const byCat = {};
const byFile = {};

for (const f of files) {
  const found = analyzeFile(f);
  for (const o of found) {
    allOffenders.push(o);
    byCat[o.cat] = (byCat[o.cat] || 0) + 1;
    if (!byFile[o.file]) byFile[o.file] = [];
    byFile[o.file].push(o);
  }
}

// Print summary
console.log('\nCategorías detectadas:');
for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + cat.padEnd(30) + count);
}

console.log('\nTop 15 archivos con más offenders:');
Object.entries(byFile)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15)
  .forEach(([f, items]) => console.log('  [' + String(items.length).padStart(3) + ']  ' + f));

// Save JSON
const report = {
  generated: new Date().toISOString(),
  totalFiles: files.length,
  totalOffenders: allOffenders.length,
  byCategory: byCat,
  offenders: allOffenders
};

writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), 'utf-8');
console.log('\nGuardado: OFFENDERS-STATIC.json');
console.log('TOTAL offenders: ' + allOffenders.length + '\n');

if (FAIL_ON && allOffenders.length > 0) {
  console.error('ERROR: --fail-on-found activo con ' + allOffenders.length + ' literales.');
  process.exit(1);
}
