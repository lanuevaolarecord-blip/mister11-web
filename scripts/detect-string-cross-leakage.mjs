/**
 * scripts/detect-string-cross-leakage.mjs
 * Míster11 — Detector por Cadena de Igualdad Multi-Lengua, Tokens Cruzados y Mezclas (Oleada 6.2 - P1)
 *
 * Instrumento de inventario (no certificación):
 * (a) Igualdad con CUALQUIER otra lengua activa (copia sin traducir, ej. PT === ES).
 * (b) Tokens de otro idioma imposibles en L (ej. en PT: ' y ', ' de la ', 'sesión', 'configuración', 'ñ', '¿', '¡'; en FR: tokens ES/EN).
 * (c) Mezcla de dos idiomas en la misma cadena (ej. 'Upcoming Sessões', 'ENREGISTRER Configuración', 'No hay sessões').
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, '../src/i18n/locales');

const ACTIVE_LOCALES = ['es', 'es-419', 'en', 'pt', 'fr', 'id'];

// Tokens y stopwords prohibidas por lengua activa
const FORBIDDEN_TOKENS = {
  pt: [
    { regex: /\bde la\b/i, name: 'token "de la"' },
    { regex: /\b y \b/i, name: 'conjunción " y "' },
    { regex: /\bsesi[oó]n\b/i, name: 'palabra "sesión"' },
    { regex: /\bconfiguraci[oó]n\b/i, name: 'palabra "configuración"' },
    { regex: /\bguardar\b/i, name: 'verbo "guardar"' },
    { regex: /\bversi[oó]n\b/i, name: 'palabra "versión"' },
    { regex: /[ñ¿¡]/, name: 'caracteres españoles (ñ, ¿, ¡)' },
    { regex: /\bno hay\b/i, name: 'frase "no hay"' }
  ],
  fr: [
    { regex: /\bde la\b/i, name: 'token "de la"' },
    { regex: /(?<![iI]l\s)\by\b/, name: 'conjunción " y "' },
    { regex: /\bsesi[oó]n\b/i, name: 'palabra "sesión"' },
    { regex: /\bconfiguraci[oó]n\b/i, name: 'palabra "configuración"' },
    { regex: /\bguardar\b/i, name: 'verbo "guardar"' },
    { regex: /\bbuscar\b/i, name: 'verbo "buscar"' },
    { regex: /\bversi[oó]n\b/i, name: 'palabra "versión"' },
    { regex: /[ñ¿¡]/, name: 'caracteres españoles (ñ, ¿, ¡)' },
    { regex: /\bupcoming\b/i, name: 'anglicismo "upcoming"' },
    { regex: /\bsettings\b/i, name: 'anglicismo "settings"' }
  ],
  en: [
    { regex: /\bde la\b/i, name: 'token "de la"' },
    { regex: /\bdel\b/i, name: 'token "del"' },
    { regex: /\b y \b/i, name: 'conjunción " y "' },
    { regex: /[ñ¿¡]/, name: 'caracteres españoles (ñ, ¿, ¡)' },
    { regex: /\bconfiguraci[oó]n\b/i, name: 'palabra "configuración"' },
    { regex: /\bguardar\b/i, name: 'verbo "guardar"' }
  ]
};

// Heurísticas de mezcla (dos lenguas en una sola cadena)
const MIXTURE_PATTERNS = [
  { regex: /\bupcoming\s+\S*sess[oõ]es/i, name: 'Mezcla EN+PT ("Upcoming Sessões")' },
  { regex: /\benregistrer\s+configuraci[oó]n/i, name: 'Mezcla FR+ES ("ENREGISTRER Configuración")' },
  { regex: /\bno\s+hay\s+\S*sess[oõ]es/i, name: 'Mezcla ES+PT ("No hay sessões")' },
  { regex: /\bexecrcices\b/i, name: 'Errata tipográfica FR ("Execrcices" -> "Exercices")' }
];

// Cadenas canónicas que son universales o marcas permitidas
const UNIVERSAL_TOKENS = new Set([
  'MISTER11', 'Mister11', 'mister11.app', 'APK', 'GPS', 'XP', 'OK', 'ID', 'PDF', 'CSV', 'JSON',
  'Groq', 'Capacitor', 'Android', 'iOS', 'Web', 'DASHBOARD', 'RPE', 'TSS', 'ACWR', 'EVA', 'DNI', 'NIE'
]);

export async function runStringCrossLeakageAudit() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🔍 [DETECTOR MULTI-LENGUA] AUDITORÍA DE IGUALDADES, TOKENS CRUZADOS Y MEZCLAS');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const dicts = {};
  for (const loc of ACTIVE_LOCALES) {
    const filePath = path.join(localesDir, `${loc}.js`);
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    const mod = await import(fileUrl);
    const key = loc === 'es-419' ? 'es_419' : loc;
    dicts[loc] = mod[key] || mod[loc] || Object.values(mod)[0];
  }

  const inventory = {
    mixtures: [],
    crossTokens: [],
    identicalCrossLanguage: []
  };

  const allKeys = Object.keys(dicts.es);

  for (const key of allKeys) {
    // 1. Detectar mezclas rotas en cualquier lengua activa
    for (const loc of ACTIVE_LOCALES) {
      const val = dicts[loc]?.[key];
      if (typeof val !== 'string') continue;

      for (const mix of MIXTURE_PATTERNS) {
        if (mix.regex.test(val)) {
          inventory.mixtures.push({
            locale: loc,
            key,
            value: val,
            reason: mix.name
          });
        }
      }
    }

    // 2. Detectar tokens prohibidos por lengua (PT, FR, EN)
    for (const [loc, rules] of Object.entries(FORBIDDEN_TOKENS)) {
      const val = dicts[loc]?.[key];
      if (typeof val !== 'string') continue;
      if (UNIVERSAL_TOKENS.has(val.trim())) continue;

      for (const rule of rules) {
        if (rule.regex.test(val)) {
          inventory.crossTokens.push({
            locale: loc,
            key,
            value: val,
            reason: rule.name
          });
        }
      }
    }

    // 3. Detectar igualdad entre PT/FR y ES (sospecha de copia sin traducir)
    for (const targetLoc of ['pt', 'fr']) {
      const targetVal = dicts[targetLoc]?.[key];
      const esVal = dicts.es?.[key];

      if (typeof targetVal === 'string' && typeof esVal === 'string') {
        const cleanT = targetVal.trim();
        const cleanE = esVal.trim();

        // Ignorar si es idéntico a una palabra universal/marca o menor a 6 caracteres (ej. 'OK', 'Email', etc.)
        if (cleanT.length >= 7 && cleanT === cleanE && !UNIVERSAL_TOKENS.has(cleanT)) {
          // Solo si no es universal idéntica legítima (ej: 'Email', 'Password' si fuesen >6)
          inventory.identicalCrossLanguage.push({
            locale: targetLoc,
            key,
            value: cleanT,
            matchedWith: 'es'
          });
        }
      }
    }
  }

  // Reporte del inventario
  console.log(`▶ [Mezclas detectadas]: ${inventory.mixtures.length}`);
  if (inventory.mixtures.length > 0) {
    inventory.mixtures.forEach(m => {
      console.error(`   ❌ [${m.locale.toUpperCase()}] ${m.key}: "${m.value}" (${m.reason})`);
    });
  } else {
    console.log('   ✅ Cero mezclas rotas (Upcoming Sessões, ENREGISTRER Configuración, etc.)');
  }

  console.log(`\n▶ [Tokens cruzados prohibidos]: ${inventory.crossTokens.length}`);
  if (inventory.crossTokens.length > 0) {
    inventory.crossTokens.slice(0, 15).forEach(t => {
      console.warn(`   ⚠️ [${t.locale.toUpperCase()}] ${t.key}: "${t.value}" -> ${t.reason}`);
    });
    if (inventory.crossTokens.length > 15) {
      console.warn(`   ... y ${inventory.crossTokens.length - 15} sospechosos más en inventario.`);
    }
  } else {
    console.log('   ✅ Cero tokens cruzados prohibidos detectados.');
  }

  console.log(`\n▶ [Igualdad cruzada con español (PT/FR === ES, len >= 7)]: ${inventory.identicalCrossLanguage.length}`);
  if (inventory.identicalCrossLanguage.length > 0) {
    console.log(`   ℹ️ Inventario: ${inventory.identicalCrossLanguage.length} cadenas idénticas a ES listadas para inspección visual.`);
  }

  const criticalViolations = inventory.mixtures.length;
  if (criticalViolations > 0) {
    console.error(`\n🚨 FALLO CRÍTICO: Se encontraron ${criticalViolations} mezclas lingüísticas rotas en diccionarios activos.`);
    process.exit(1);
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('✅ [DETECTOR MULTI-LENGUA] INVENTARIO COMPLETADO SATISFACTORIAMENTE');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  return inventory;
}

if (process.argv[1] && process.argv[1].endsWith('detect-string-cross-leakage.mjs')) {
  runStringCrossLeakageAudit();
}
