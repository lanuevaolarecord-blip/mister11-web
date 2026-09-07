import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const translationsFilePath = resolve(__dirname, '../src/i18n/translations.js');

async function loadTranslations() {
  const fileUrl = 'file:///' + translationsFilePath.replace(/\\/g, '/');
  const mod = await import(fileUrl);
  return mod.translations || mod.default;
}

// Palabras en español que NUNCA deberían aparecer en las traducciones al inglés
// Excepciones permitidas: nombres propios o términos universales si aplican
const SPANISH_STOPWORDS_IN_EN = [
  'probar', 'gratuito', 'guardar', 'eliminar', 'cancelar', 'confirmar',
  'equipo', 'jugadores', 'plantilla', 'sesiones', 'partidos', 'entrenamiento',
  'pizarra', 'campo', 'bloques', 'comunicado', 'asistencia', 'cuerpo técnico',
  'semana', 'mesociclo', 'microciclo', 'acciones', 'materiales', 'señalización',
  'portería', 'balón', 'coordinación', 'medidas', 'zonas', 'comodín', 'rival'
];

async function runQa() {
  console.log('🛡️ [QA-Language] Ejecutando verificación profunda de integridad lingüística...');
  const translations = await loadTranslations();

  const es = translations['Español (ES)'] || translations['es'];
  const en = translations['English (EN)'] || translations['en'];

  if (!es || !en) {
    console.error('❌ Error: Faltan diccionarios ES o EN.');
    process.exit(1);
  }

  let failures = 0;
  let warnings = 0;

  // 1. Detección de fugas de Español en el diccionario Inglés
  console.log('🔎 Verificando fugas de español en diccionario English (EN)...');
  const enEntries = Object.entries(en);
  for (const [key, text] of enEntries) {
    if (typeof text !== 'string') continue;
    const lower = text.toLowerCase();
    
    // Ignorar claves que expresamente representan términos invariantes o nombres de archivo
    if (key.includes('format') || key.includes('url') || key.includes('code') || key.startsWith('app.')) continue;

    for (const word of SPANISH_STOPWORDS_IN_EN) {
      // Coincidencia por palabra completa
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lower)) {
        console.error(`❌ [Fuga ES→EN] Clave "${key}" en EN contiene término en español "${word}": "${text}"`);
        failures++;
      }
    }
  }

  // 2. Verificación de integridad de plurales (Intl.PluralRules)
  console.log('🔎 Verificando estructura de plurales (Intl.PluralRules)...');
  const pluralPrefixes = new Set();
  for (const key of Object.keys(es)) {
    if ((key.endsWith('.one') || key.endsWith('.other')) && (key.includes('Count') || /\{(?:count|n)\}/.test(es[key] || ''))) {
      pluralPrefixes.add(key.replace(/\.(one|other)$/, ''));
    }
  }

  for (const prefix of pluralPrefixes) {
    const esOne = es[`${prefix}.one`];
    const esOther = es[`${prefix}.other`];
    const enOne = en[`${prefix}.one`];
    const enOther = en[`${prefix}.other`];

    if (!esOne || !esOther) {
      console.error(`❌ [Plural Incompleto ES] Clave plural "${prefix}" le falta .one o .other en Español.`);
      failures++;
    }
    if (!enOne || !enOther) {
      console.error(`❌ [Plural Incompleto EN] Clave plural "${prefix}" le falta .one o .other en Inglés.`);
      failures++;
    }
  }

  // 3. Verificación de strings vacíos o undefined
  console.log('🔎 Verificando valores no nulos y cadenas no vacías...');
  for (const [key, text] of Object.entries(es)) {
    if (!text || (typeof text === 'string' && text.trim().length === 0)) {
      console.error(`❌ [Cadena vacía ES] Clave "${key}" está vacía.`);
      failures++;
    }
  }
  for (const [key, text] of Object.entries(en)) {
    if (!text || (typeof text === 'string' && text.trim().length === 0)) {
      console.error(`❌ [Cadena vacía EN] Clave "${key}" está vacía.`);
      failures++;
    }
  }

  console.log('\n📊 Resumen de QA Lingüístico:');
  console.log(`   - Claves auditadas en ES: ${Object.keys(es).length}`);
  console.log(`   - Claves auditadas en EN: ${Object.keys(en).length}`);
  console.log(`   - Prefijos de plurales validados: ${pluralPrefixes.size}`);
  console.log(`   - Fugas o errores críticos detectados: ${failures}`);

  if (failures > 0) {
    console.error(`\n❌ QA-Language FALLÓ con ${failures} errores. Corrige las fugas antes de hacer release.\n`);
    process.exit(1);
  } else {
    console.log('\n✅ ¡QA-Language APROBADO al 100%! Cero fugas cruzadas detectadas.\n');
    process.exit(0);
  }
}

runQa().catch(err => {
  console.error('Error en qa-language:', err);
  process.exit(1);
});
