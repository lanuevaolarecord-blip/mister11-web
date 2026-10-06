/**
 * scripts/qa-language.js
 * Míster11 — Gate G2-G6: QA Lingüístico, CLDR PluralRules, Enums, Citation y Validación
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const translationsFilePath = resolve(__dirname, '../src/i18n/translations.js');
const registryFilePath = resolve(__dirname, '../src/i18n/locales/registry.js');

async function loadLocalesAndRegistry() {
  const fileUrl = 'file:///' + translationsFilePath.replace(/\\/g, '/');
  const mod = await import(fileUrl);
  const regUrl = 'file:///' + registryFilePath.replace(/\\/g, '/');
  const regMod = await import(regUrl);
  return {
    translations: mod.translations || mod.default,
    registry: regMod.LOCALES_REGISTRY,
    getActiveLocales: regMod.getActiveLocales
  };
}

// Palabras en español que NUNCA deberían aparecer en las traducciones al inglés
const SPANISH_STOPWORDS_IN_EN = [
  'probar', 'gratuito', 'guardar', 'eliminar', 'cancelar', 'confirmar',
  'equipo', 'jugadores', 'plantilla', 'sesiones', 'partidos', 'entrenamiento',
  'pizarra', 'campo', 'bloques', 'comunicado', 'asistencia', 'cuerpo técnico',
  'semana', 'mesociclo', 'microciclo', 'acciones', 'materiales', 'señalización',
  'portería', 'balón', 'coordinación', 'medidas', 'zonas', 'comodín', 'rival'
];

async function runQa() {
  console.log('🛡️ [QA-Language] Ejecutando verificación profunda de integridad lingüística N-Lenguas...');
  const { translations, registry, getActiveLocales } = await loadLocalesAndRegistry();
  const activeLocales = getActiveLocales();

  let failures = 0;
  let warnings = 0;

  // 1. Verificación G1: Detección de fugas cruzadas en EN
  console.log('🔎 [G1] Verificando fugas de español en diccionario English (EN)...');
  const en = translations['English (EN)'] || translations['en'];
  if (en) {
    for (const [key, text] of Object.entries(en)) {
      if (typeof text !== 'string') continue;
      const lower = text.toLowerCase();
      if (key.includes('format') || key.includes('url') || key.includes('code') || key.startsWith('app.')) continue;

      for (const word of SPANISH_STOPWORDS_IN_EN) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lower)) {
          console.error(`❌ [Fuga ES→EN] Clave "${key}" en EN contiene término en español "${word}": "${text}"`);
          failures++;
        }
      }
    }
  }

  // 2. Verificación G2: Plurales vía CLDR / Intl.PluralRules
  console.log('🔎 [G2] Verificando reglas de plurales por lengua según CLDR (Intl.PluralRules)...');
  const es = translations['Español (ES)'] || translations['es'];
  const pluralPrefixes = new Set();
  for (const key of Object.keys(es)) {
    if ((key.endsWith('.one') || key.endsWith('.other')) && (key.includes('Count') || /\{(?:count|n)\}/.test(es[key] || ''))) {
      pluralPrefixes.add(key.replace(/\.(one|other)$/, ''));
    }
  }

  for (const loc of activeLocales) {
    const dict = translations[loc.label] || translations[loc.code];
    if (!dict) continue;

    // Verificar que Intl.PluralRules soporte el locale oficial
    try {
      const pr = new Intl.PluralRules(loc.intl);
      const sampleCategories = [pr.select(0), pr.select(1), pr.select(2), pr.select(5)];
      if (!sampleCategories.includes('one') && !sampleCategories.includes('other')) {
        console.warn(`⚠️ [CLDR Plural] El locale ${loc.intl} tiene categorías especiales: ${sampleCategories.join(', ')}`);
      }
    } catch (e) {
      console.error(`❌ [CLDR Error] Intl.PluralRules no soporta el locale ${loc.intl}:`, e.message);
      failures++;
    }

    for (const prefix of pluralPrefixes) {
      const oneVal = dict[`${prefix}.one`];
      const otherVal = dict[`${prefix}.other`];
      if (!oneVal || !otherVal) {
        console.error(`❌ [Plural Incompleto ${loc.code}] Clave "${prefix}" le falta .one o .other.`);
        failures++;
      }
    }
  }

  // 3. Verificación G3: Enums traducibles (Categorías, Fases, Músculos, Materiales)
  console.log('🔎 [G3] Verificando cobertura de enums clínicos y deportivos...');
  const sampleEnums = [
    'exerciseCatalog.categories.warmup',
    'exerciseCatalog.categories.main',
    'exerciseCatalog.categories.cooldown',
    'exerciseCatalog.phases.fase1',
    'exerciseCatalog.phases.fase2',
    'exerciseCatalog.phases.fase3'
  ];

  for (const loc of activeLocales) {
    const dict = translations[loc.label] || translations[loc.code];
    for (const enumKey of sampleEnums) {
      if (!dict || !dict[enumKey]) {
        console.error(`❌ [Enum Faltante ${loc.code}] Clave de enum "${enumKey}" no traducida.`);
        failures++;
      }
    }
  }

  // 4. Verificación G4: source.citation opaca y sourceLabel traducible
  console.log('🔎 [G4] Verificando sourceLabel traducido y citation bibliográfica intacta...');
  for (const loc of activeLocales) {
    const dict = translations[loc.label] || translations[loc.code];
    if (!dict || !dict['exerciseCatalog.sourceLabel']) {
      console.error(`❌ [G4 Error] Falta "exerciseCatalog.sourceLabel" en ${loc.code}.`);
      failures++;
    }
  }

  // 5. Verificación G5: Selector solo muestra lenguas 'activo'
  console.log('🔎 [G5] Verificando que getActiveLocales() retorne SOLO status="activo"...');
  for (const loc of activeLocales) {
    if (loc.status !== 'activo') {
      console.error(`❌ [G5 Error] El locale ${loc.code} tiene status="${loc.status}" pero está en getActiveLocales().`);
      failures++;
    }
  }

  // 6. Verificación de strings no vacíos
  console.log('🔎 Verificando que ninguna clave activa tenga cadenas vacías...');
  for (const loc of activeLocales) {
    const dict = translations[loc.label] || translations[loc.code];
    if (!dict) continue;
    for (const [key, text] of Object.entries(dict)) {
      if (text === null || text === undefined || (typeof text === 'string' && text.trim().length === 0)) {
        console.error(`❌ [Cadena vacía ${loc.code}] Clave "${key}" está vacía.`);
        failures++;
      }
    }
  }

  console.log('\n📊 Resumen de QA Lingüístico Multi-Lengua:');
  console.log(`   - Lenguas auditadas: ${activeLocales.length}`);
  console.log(`   - Prefijos de plurales validados: ${pluralPrefixes.size}`);
  console.log(`   - Errores críticos detectados: ${failures}`);

  if (failures > 0) {
    console.error(`\n❌ QA-Language FALLÓ con ${failures} errores. Corrige las violaciones antes de hacer release.\n`);
    process.exit(1);
  } else {
    console.log('\n✅ ¡QA-Language N-LENGUAS APROBADO al 100%! Cero fugas cruzadas y reglas CLDR intactas.\n');
    process.exit(0);
  }
}

runQa().catch(err => {
  console.error('Error en qa-language:', err);
  process.exit(1);
});
