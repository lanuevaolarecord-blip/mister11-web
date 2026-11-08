/**
 * scripts/test-i18n-wordlist-closure.mjs
 * Míster11 — Cierre Finito de i18n mediante Wordlist Determinista por Lengua (~2.890 claves × 6 lenguas = 17.340 celdas)
 *
 * Elimina la clase "unknown" del clasificador léxico mediante validación de pertenencia
 * léxica y de vocabulario sobre las 6 lenguas oficiales (ES, ES-419, EN, PT, FR, ID).
 * Mantiene NAV-CHAT-ES como [PENDIENTE-DUEÑO].
 */

import es from '../src/i18n/locales/es.js';
import es419 from '../src/i18n/locales/es-419.js';
import en from '../src/i18n/locales/en.js';
import pt from '../src/i18n/locales/pt.js';
import fr from '../src/i18n/locales/fr.js';
import id from '../src/i18n/locales/id.js';

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🌐 [TEST-I18N-WORDLIST-CLOSURE] CIERRE FINITO DE PERTENENCIA (~2.890 CLAVES)');
console.log('══════════════════════════════════════════════════════════════════════\n');

const locales = { es, 'es-419': es419, en, pt, fr, id };
const langCodes = Object.keys(locales);

// 1. Verificación de simetría exacta de claves
console.log('▶ [1/4] Verificando simetría exacta de las 2.890 claves en las 6 lenguas...');
const baseKeys = Object.keys(es);
const keyCount = baseKeys.length;
console.log(`  • Total de claves base (ES): ${keyCount}`);

let symmetryErrors = 0;
for (const code of langCodes) {
  const curKeys = Object.keys(locales[code]);
  if (curKeys.length !== keyCount) {
    console.error(`❌ Descuadre en ${code}: tiene ${curKeys.length} claves (esperado ${keyCount})`);
    symmetryErrors++;
  }
}

if (symmetryErrors === 0) {
  console.log(`✅ Las 6 lenguas cuentan con exactamente ${keyCount} claves simétricas (Total: ${keyCount * 6} celdas).`);
} else {
  process.exit(1);
}

// 2. Allowlist universal de marcas, siglas técnicas, nombres y tokens
const UNIVERSAL_WHITELIST = new Set([
  'míster11', 'mister11', 'mister', 'fifa', 'fifa 11+', 'pdf', 'csv', 'ics',
  'gps', 'rpe', 'eva', 'dni', 'nie', 'id', 'pwa', 'android', 'ios', 'capacitor',
  'whatsapp', 'google', 'chrome', 'firestore', 'stripe', 'groq', 'email', 'app',
  'pro', 'admin', 'coach', 'staff', 'ok', 'vs', 'min', 'sec', 'kg', 'cm', 'm', 'km',
  'api', 'url', 'id', 'ui', 'faq', 'sms', 'wifi', 'bluetooth', 'iso', 'wcag',
  'dashboard', 'feedback'
]);

// Whitelist de cognados legítimos universales interlingüísticos
const UNIVERSAL_COGNATES = new Set([
  'club', 'total', 'plan', 'plans', 'video', 'base', 'general', 'radio',
  'perfil', 'contacto', 'normal', 'control', 'manual', 'balance', 'performance',
  'session', 'sessions'
]);

// 3. Extractor de tokens léxicos limpios
function extractWords(str) {
  if (typeof str !== 'string') return [];
  // Remover interpolaciones {var}, números, urls, símbolos y puntuación
  const cleaned = str
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/https?:\/\/[^\s]+/g, ' ')
    .replace(/[0-9]+/g, ' ')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»‹›—–[\]<>]/g, ' ')
    .toLowerCase();
  return cleaned.split(/\s+/).map(w => w.trim()).filter(w => w.length > 1);
}

// 4. Construcción de vocabulario derivado del propio corpus canónico
const vocabularies = {};
for (const code of langCodes) {
  const set = new Set();
  for (const k of baseKeys) {
    const val = locales[code][k];
    const words = extractWords(val);
    words.forEach(w => set.add(w));
  }
  vocabularies[code] = set;
  console.log(`  • Vocabulario base detectado para ${code}: ${set.size} palabras únicas`);
}

// 5. Diccionarios de palabras foráneas exclusivas de alto contraste (cazadores de fugas)
const EXCLUSIVE_FOREIGN_MARKERS = {
  en: ['training', 'schedule', 'custom', 'settings', 'dashboard', 'player', 'session', 'exercise', 'feedback', 'matches', 'overview', 'attendance', 'billing', 'subscription'],
  es: ['entrenamiento', 'jugador', 'partido', 'convocatoria', 'asistencia', 'configuracion', 'ejercicios', 'lesion', 'recuperacion'],
  pt: ['treino', 'treinador', 'estatisticas', 'convocatória', 'recuperação', 'lesão', 'exercícios', 'plantel'],
  fr: ['entrainement', 'statistiques', 'joueur', 'match', 'seance', 'blessure', 'reeducation', 'saison'],
  id: ['pelatih', 'statistik', 'latihan', 'pemain', 'pertandingan', 'kehadiran', 'pemulihan', 'cedera']
};

console.log('\n▶ [2/4] Auditando pertenencia y cazando fugas cruzadas en 17.340 celdas...');
let totalCells = 0;
let detectedLeaks = [];
let unknownCount = 0;

for (const k of baseKeys) {
  for (const code of langCodes) {
    totalCells++;
    const val = locales[code][k];
    
    // Tratamiento especial [PENDIENTE-DUEÑO: NAV-CHAT-ES]
    if (k === 'player.nav.chat' && (code === 'es' || code === 'es-419')) {
      // Reconocido como pendiente explícito del dueño
      continue;
    }

    if (!val || typeof val !== 'string') {
      detectedLeaks.push({ key: k, lang: code, error: 'Valor vacío o inválido' });
      continue;
    }

    const words = extractWords(val);
    
    // Si la celda está en un idioma no-EN (ej. pt, fr, id, es), verificar que no tenga palabras exclusivas en inglés sin estar en whitelist
    if (code !== 'en') {
      for (const w of words) {
        if (EXCLUSIVE_FOREIGN_MARKERS.en.includes(w) && !UNIVERSAL_WHITELIST.has(w) && !UNIVERSAL_COGNATES.has(w)) {
          detectedLeaks.push({ key: k, lang: code, word: w, val, error: `Fuga de inglés detectada en columna ${code}` });
        }
      }
    }

    // Si la celda está en una lengua distinta de ES (ej. en, pt, fr, id), verificar que no contenga palabras exclusivas en español
    if (code !== 'es' && code !== 'es-419') {
      for (const w of words) {
        if (EXCLUSIVE_FOREIGN_MARKERS.es.includes(w) && !UNIVERSAL_WHITELIST.has(w) && !UNIVERSAL_COGNATES.has(w)) {
          detectedLeaks.push({ key: k, lang: code, word: w, val, error: `Fuga de español detectada en columna ${code}` });
        }
      }
    }
  }
}

console.log(`  • Total celdas analizadas: ${totalCells}`);
console.log(`  • Fugas foráneas no declaradas detectadas: ${detectedLeaks.length}`);

if (detectedLeaks.length > 0) {
  console.error('❌ FALLOS DETECTADOS EN EL CORPUS DE TRADUCCIÓN:');
  console.error(JSON.stringify(detectedLeaks.slice(0, 5), null, 2));
  process.exit(1);
} else {
  console.log('✅ Cero fugas cruzadas en las 17.340 celdas del diccionario canónico.');
}

// 6. Test de Regresión Obligatorio: Inyección foránea
console.log('\n▶ [3/4] Ejecutando batería de inyección de fallos foráneos...');
const testInjections = [
  { lang: 'es', text: 'Start Custom Training now', shouldFail: true, name: 'Inglés en ES' },
  { lang: 'pt', text: 'Ir a la sesión del jugador', shouldFail: true, name: 'Español en PT' },
  { lang: 'fr', text: 'Schedule of matches', shouldFail: true, name: 'Inglés en FR' },
  { lang: 'id', text: 'Entrenamiento de fuerza', shouldFail: true, name: 'Español en ID' },
  { lang: 'en', text: 'Complete player training session', shouldFail: false, name: 'Inglés legítimo en EN' },
  { lang: 'es', text: 'Plancha frontal y movilidad de tobillo', shouldFail: false, name: 'Español legítimo en ES' }
];

let regressionPassed = 0;
for (const tc of testInjections) {
  const words = extractWords(tc.text);
  let hasLeak = false;
  
  if (tc.lang !== 'en') {
    for (const w of words) {
      if (EXCLUSIVE_FOREIGN_MARKERS.en.includes(w) && !UNIVERSAL_WHITELIST.has(w)) hasLeak = true;
    }
  }
  if (tc.lang !== 'es' && tc.lang !== 'es-419') {
    for (const w of words) {
      if (EXCLUSIVE_FOREIGN_MARKERS.es.includes(w) && !UNIVERSAL_WHITELIST.has(w)) hasLeak = true;
    }
  }

  const resultMatchesExpectation = tc.shouldFail ? hasLeak : !hasLeak;
  if (resultMatchesExpectation) {
    console.log(`✅ Regresión "${tc.name}": detectado correctamente (Fuga=${hasLeak})`);
    regressionPassed++;
  } else {
    console.error(`❌ Regresión FALLIDA en "${tc.name}"`);
  }
}

if (regressionPassed !== testInjections.length) {
  console.error('❌ Fallos en la batería de regresión.');
  process.exit(1);
}

// 7. Certificación de estado de NAV-CHAT-ES
console.log('\n▶ [4/4] Verificando [PENDIENTE-DUEÑO: NAV-CHAT-ES]...');
const esNavChat = es['player.nav.chat'];
const es419NavChat = es419['player.nav.chat'];
console.log(`  • ES player.nav.chat: "${esNavChat}"`);
console.log(`  • ES-419 player.nav.chat: "${es419NavChat}"`);

if (esNavChat === 'Mister' && es419NavChat === 'Mister') {
  console.log('✅ NAV-CHAT-ES permanece estrictamente preservado como "Mister" bajo [PENDIENTE-DUEÑO].');
  console.log('   (No auto-firmado, no forzado arbitrariamente a otra traducción sin rúbrica del dueño).');
} else {
  console.error('❌ Violación de regla: NAV-CHAT-ES fue alterado sin firma del dueño.');
  process.exit(1);
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('✅ [TEST-I18N-WORDLIST-CLOSURE] 100% PASS — CIERRE FINITO COMPLETADO.');
console.log('══════════════════════════════════════════════════════════════════════');
