/**
 * test-spellchecker.mjs
 * Test de validación automatizada para el motor ortográfico de Míster11.
 * Verifica:
 * 1. Cero falsos positivos en palabras comunes y vocabulario futbolístico ("control", "juego", "inicio", etc.).
 * 2. Detección precisa de acentos ("dinamica" -> "dinámica").
 * 3. Corrección de erratas reales y sugerencias coherentes.
 * 4. Diccionario personalizado dinámico (agregar palabra y validar eliminación de error).
 * 5. Función de ignorar palabra en sesión.
 * 6. Compatibilidad y preservación de mayúsculas al corregir.
 */

import {
  checkTextSpelling,
  applySpellingCorrection,
  addWordToCustomDictionary,
  ignoreWordForSession,
  getSpellingSuggestions
} from '../src/utils/spellCheckerEngine.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

console.log('🧪 ========================================================');
console.log('🧪 EJECUTANDO TEST SUITE DEL CORRECTOR ORTOGRÁFICO MÍSTER11');
console.log('🧪 ========================================================\n');

// --------------------------------------------------------------------------
// TEST 1: Frase exacta del usuario con "control", "juego", "dinamica"
// --------------------------------------------------------------------------
console.log('🔹 CASO 1: Frase del usuario ("un partido que se inicio con control del juego y mucha dinamica de movilidad y pases")');
const userPhrase = 'un partido que se inicio con control del juego y mucha dinamica de movilidad y pases';
const errors1 = checkTextSpelling(userPhrase, 'es');

const wordsWithErrors = errors1.map(e => e.word.toLowerCase());

assert(!wordsWithErrors.includes('control'), '"control" NO debe marcarse como error (antes falso positivo)');
assert(!wordsWithErrors.includes('juego'), '"juego" NO debe marcarse como error (antes falso positivo)');
assert(!wordsWithErrors.includes('inicio'), '"inicio" NO debe marcarse como error');
assert(!wordsWithErrors.includes('movilidad'), '"movilidad" NO debe marcarse como error');
assert(!wordsWithErrors.includes('pases'), '"pases" NO debe marcarse como error');
assert(!wordsWithErrors.includes('mucha'), '"mucha" NO debe marcarse como error');
assert(!wordsWithErrors.includes('partido'), '"partido" NO debe marcarse como error');

// "dinamica" debe detectarse por falta de tilde y sugerir "dinámica"
const dinamicaErr = errors1.find(e => e.word.toLowerCase() === 'dinamica');
assert(dinamicaErr !== undefined, '"dinamica" DEBE detectarse');
assert(dinamicaErr?.reason === 'accent', 'El motivo para "dinamica" debe ser "accent" (falta tilde)');
assert(dinamicaErr?.suggestions?.includes('dinámica'), 'La sugerencia para "dinamica" debe ser "dinámica"');

// --------------------------------------------------------------------------
// TEST 2: Aplicar la sugerencia
// --------------------------------------------------------------------------
console.log('\n🔹 CASO 2: Aplicar corrección sobre "dinamica" -> "dinámica"');
if (dinamicaErr) {
  const correctedText = applySpellingCorrection(userPhrase, dinamicaErr, 'dinámica');
  assert(
    correctedText === 'un partido que se inicio con control del juego y mucha dinámica de movilidad y pases',
    'El texto corregido reemplaza únicamente "dinamica" por "dinámica"'
  );
  const errorsAfterCorrection = checkTextSpelling(correctedText, 'es');
  assert(errorsAfterCorrection.length === 0, 'Tras aplicar la tilde, el texto tiene 0 errores');
}

// --------------------------------------------------------------------------
// TEST 3: Preservación de mayúsculas al corregir
// --------------------------------------------------------------------------
console.log('\n🔹 CASO 3: Preservación de mayúsculas al aplicar corrección');
const phraseCaps = 'Tactica defensiva';
const errorsCaps = checkTextSpelling(phraseCaps, 'es');
const tacticaErr = errorsCaps.find(e => e.word.toLowerCase() === 'tactica');
assert(tacticaErr !== undefined, '"Tactica" detectada con falta de tilde');
if (tacticaErr) {
  const fixedCaps = applySpellingCorrection(phraseCaps, tacticaErr, 'táctica');
  assert(fixedCaps.startsWith('Táctica'), 'Debe conservar la "T" mayúscula al inicio: "Táctica defensiva"');
}

// --------------------------------------------------------------------------
// TEST 4: Diccionario Personalizado (Agregar palabra)
// --------------------------------------------------------------------------
console.log('\n🔹 CASO 4: Diccionario Personalizado dinámico');
const customWord = 'tikitaka';
const phraseWithCustom = `Jugamos al ${customWord} todo el segundo tiempo`;
const errorsBefore = checkTextSpelling(phraseWithCustom, 'es');
assert(errorsBefore.some(e => e.word.toLowerCase() === customWord), `"${customWord}" inicialmente no reconocida`);

// Agregar al diccionario personalizado
addWordToCustomDictionary(customWord);
const errorsAfter = checkTextSpelling(phraseWithCustom, 'es');
assert(!errorsAfter.some(e => e.word.toLowerCase() === customWord), `Tras agregar al diccionario, "${customWord}" ya NO es error`);

// --------------------------------------------------------------------------
// TEST 5: Ignorar palabra en la sesión
// --------------------------------------------------------------------------
console.log('\n🔹 CASO 5: Ignorar palabra en sesión');
const ignoreWord = 'gepressen';
const phraseToIgnore = `Aplicamos ${ignoreWord} intensivo`;
const errorsBeforeIgnore = checkTextSpelling(phraseToIgnore, 'es');
assert(errorsBeforeIgnore.some(e => e.word.toLowerCase() === ignoreWord), `"${ignoreWord}" inicialmente detectada`);

ignoreWordForSession(ignoreWord);
const errorsAfterIgnore = checkTextSpelling(phraseToIgnore, 'es');
assert(!errorsAfterIgnore.some(e => e.word.toLowerCase() === ignoreWord), `Tras ignorar, "${ignoreWord}" ya NO se marca en la sesión`);

// --------------------------------------------------------------------------
// TEST 6: Términos técnicos y deportivos comunes no deben fallar
// --------------------------------------------------------------------------
console.log('\n🔹 CASO 6: Vocabulario táctico y futbolístico en español');
const soccerTerms = [
  'portero', 'delantero', 'centrocampista', 'defensa', 'alineación',
  'saque', 'esquina', 'penalti', 'árbitro', 'suplente', 'titular',
  'calentamiento', 'estrategia', 'presión', 'transición', 'posesión',
  'bloque', 'remate', 'asistencia', 'desmarque', 'cobertura'
];

let failedTerms = 0;
for (const term of soccerTerms) {
  const errs = checkTextSpelling(term, 'es');
  if (errs.length > 0) {
    console.error(`  ⚠️ Término futbolístico falló: ${term} (errores: ${JSON.stringify(errs)})`);
    failedTerms++;
  }
}
assert(failedTerms === 0, `Los ${soccerTerms.length} términos futbolísticos clave son 100% reconocidos sin errores`);

// --------------------------------------------------------------------------
// TEST 7: Sugerencias coherentes para erratas tipográficas
// --------------------------------------------------------------------------
console.log('\n🔹 CASO 7: Sugerencias coherentes para erratas comunes');
const typo1 = getSpellingSuggestions('estratejia', 'es');
assert(typo1.includes('estrategia'), '"estratejia" sugiere "estrategia"');

const typo2 = getSpellingSuggestions('posesion', 'es');
assert(typo2.includes('posesión'), '"posesion" sugiere "posesión"');

// --------------------------------------------------------------------------
// RESUMEN FINAL
// --------------------------------------------------------------------------
console.log('\n📊 ========================================================');
console.log(`📊 TOTAL: ${totalTests} | PASADOS: ${passedTests} | FALLIDOS: ${failedTests}`);
console.log('📊 ========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✨ ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
  process.exit(0);
}
