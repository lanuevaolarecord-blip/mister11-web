/**
 * scripts/generate-duplication-breakdown.mjs
 * MÍSTER11 — Desglose Exhaustivo de Duplicación PT / FR / ID vs EN
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const localesDir = path.join(ROOT, 'src', 'i18n', 'locales');
const en = (await import(pathToFileURL(path.join(localesDir, 'en.js')).href)).default;
const pt = (await import(pathToFileURL(path.join(localesDir, 'pt.js')).href)).default;
const fr = (await import(pathToFileURL(path.join(localesDir, 'fr.js')).href)).default;
const id = (await import(pathToFileURL(path.join(localesDir, 'id.js')).href)).default;

function flatten(obj, prefix = '') {
  let res = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(res, flatten(v, key));
    } else {
      res[key] = String(v ?? '').trim();
    }
  }
  return res;
}

const flatEn = flatten(en);
const targetLocales = { pt: flatten(pt), fr: flatten(fr), id: flatten(id) };

function classifyKey(key, val) {
  const upper = val.toUpperCase();
  const trimmed = val.trim();
  
  if (['MC', 'DEF', 'LTI', 'EXT', 'POR', 'f8', 'MP', 'XI', 'DOR'].includes(trimmed)) {
    return '[ABREVIATURA PIZARRA]';
  }
  if (/^[A-Z0-9_\-\.\/]{1,8}$/.test(trimmed)) {
    return '[SIGLA/ACRÓNIMO]';
  }
  if (/Mister11|FIFA|Google|Apple|Chrome|Android|PWA|PDF|CSV|JSON|ACSI|MTQ|Nordic|Copenhagen/.test(val) && val.length < 35) {
    return '[NOMBRE PROPIO/MARCA]';
  }
  if (/^\{.*\}$/.test(trimmed) || /YYYY|HH:mm|km\/h|min|sec|%|\$|€/.test(val) && val.length < 25) {
    return '[FORMATO FECHA/HORA/NÚMERO]';
  }
  if (val.length > 15 && val.includes(' ')) {
    return '[FRASE UI SIN TRADUCIR]';
  }
  return '[OTRO]';
}

let reportMd = `# MÍSTER11 — Desglose Exhaustivo de Duplicación (PT, FR, ID vs EN)

**Fecha:** 2026-10-07  
**Auditor:** QA Sr. + Especialista en Localización  
**Propósito:** Transparencia radical. Identificar de forma explícita cada clave idéntica al inglés en las lenguas activas, agrupadas por categoría y namespace.

---

`;

for (const [code, dict] of Object.entries(targetLocales)) {
  const categories = {
    '[SIGLA/ACRÓNIMO]': [],
    '[NOMBRE PROPIO/MARCA]': [],
    '[FORMATO FECHA/HORA/NÚMERO]': [],
    '[ABREVIATURA PIZARRA]': [],
    '[FRASE UI SIN TRADUCIR]': [],
    '[OTRO]': []
  };

  const byNamespace = {};

  for (const [key, val] of Object.entries(dict)) {
    const valEn = flatEn[key];
    if (val === valEn && val.length > 0) {
      const cat = classifyKey(key, val);
      categories[cat].push({ key, val });

      const ns = key.split('.')[0] || 'general';
      if (!byNamespace[ns]) byNamespace[ns] = [];
      byNamespace[ns].push({ key, val, cat });
    }
  }

  const totalIdentical = Object.values(categories).reduce((acc, list) => acc + list.length, 0);

  reportMd += `## 1. Lengua: \`${code.toUpperCase()}\` (Total Claves Idénticas a EN: ${totalIdentical})\n\n`;
  reportMd += `### Resumen por Categoría:\n\n`;
  reportMd += `| Categoría | Conteo | Porcentaje |\n`;
  reportMd += `|---|---|---|\n`;
  for (const [catName, list] of Object.entries(categories)) {
    const pct = ((list.length / totalIdentical) * 100).toFixed(1);
    reportMd += `| **${catName}** | ${list.length} | ${pct}% |\n`;
  }
  reportMd += `\n`;

  reportMd += `### Claves por Namespace:\n\n`;
  for (const [ns, items] of Object.entries(byNamespace)) {
    reportMd += `#### Namespace: \`${ns}\` (${items.length} claves idénticas a EN)\n`;
    reportMd += `| Clave | Categoría | Valor Literal |\n`;
    reportMd += `|---|---|---|\n`;
    items.slice(0, 15).forEach(item => {
      const escaped = item.val.replace(/\|/g, '\\|').replace(/\n/g, ' ');
      reportMd += `| \`${item.key}\` | ${item.cat} | "${escaped.substring(0, 60)}..." |\n`;
    });
    if (items.length > 15) {
      reportMd += `| *... y ${items.length - 15} claves adicionales en este namespace* | | |\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `\n---\n\n`;
}

fs.writeFileSync(path.join(ROOT, 'docs', 'i18n-duplication-breakdown.md'), reportMd, 'utf-8');
console.log('✅ Desglose generado exitosamente en docs/i18n-duplication-breakdown.md');
