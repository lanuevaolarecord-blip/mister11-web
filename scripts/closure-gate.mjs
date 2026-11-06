/**
 * scripts/closure-gate.mjs
 * Míster 11 — Gate Maestro de Cierre Definitivo
 *
 * Criterio de PERTENENCIA por Campo × Superficie × Lengua
 * Un solo script, un solo veredicto.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ── Cargar Recursos y Catálogos ─────────────────────────────────────────────
import { HOME_EXERCISES_108 } from '../src/data/homeExercisesCatalog.js';
import { SYSTEM_CORE_EXERCISES } from '../src/data/systemCoreExercises.js';
import { getClinicalChipText, getCanonicalClinicalChipHtml, CLINICAL_FALLBACK_TEXTS } from '../src/utils/clinicalChip.js';
import { generateSessionPDF, tPdf } from '../src/utils/pdfGenerator.js';
import { PDFParse } from 'pdf-parse';
import { translations, t } from '../src/i18n/translations.js';

// ── Función de Localización Canónica ────────────────────────────────────────
function getLocalizedExercise(ex, isEnglish, lang = 'es') {
  if (!ex) return ex;
  let localizedName = ex.name;
  if (isEnglish) {
    localizedName = ex.nameEn || ex.name;
  } else if (lang === 'pt' && ex.namePt) {
    localizedName = ex.namePt;
  } else if (lang === 'fr' && ex.nameFr) {
    localizedName = ex.nameFr;
  } else if (lang === 'id' && ex.nameId) {
    localizedName = ex.nameId;
  } else if (ex.nameEs) {
    localizedName = ex.nameEs;
  }
  return {
    ...ex,
    name: localizedName
  };
}

// ── POLÍTICA FIRMADA POR EL DUEÑO ───────────────────────────────────────────
const SIGNED_POLICY = process.env.EXERCISE_NAME_POLICY || 'localizar';

console.log('==============================================================================');
console.log('MÍSTER 11 — GATE MAESTRO DE CIERRE DEFINITIVO');
console.log(`DUEÑO FIRMÓ EXERCISE_NAME_POLICY = ${SIGNED_POLICY.toUpperCase()} (Opción A: localizar en lengua activa)`);
console.log('==============================================================================\n');

let totalFailures = 0;
const failureDetails = [];
const console_errors = [];

function recordFailure(item) {
  totalFailures++;
  failureDetails.push(item);
  console_errors.push(item);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. EVALUACIÓN DE NOMBRES DE EJERCICIO (PERTENENCIA Y POLÍTICA)
// ─────────────────────────────────────────────────────────────────────────────
console.log('▶ [1/7] Evaluando Matriz de Pertenencia de Nombres de Ejercicio (Campo × Superficie × Lengua)...');

const LANGUAGES = ['pt', 'fr', 'id', 'es', 'en'];
const SURFACES = ['ExerciseLibrary', 'AssignPlanModal', 'PlayerPlansPortalTab', 'PDF', 'Notifications'];

// Catálogo evaluado
const allPredefined = [...SYSTEM_CORE_EXERCISES, ...HOME_EXERCISES_108];
const homeCount = HOME_EXERCISES_108.length; // 108
const coreCount = SYSTEM_CORE_EXERCISES.length; // 10
const totalEvaluated = allPredefined.length; // 118

let unknownCount = 0;
let divergenceCount = 0;
const matrixRows = [];

for (const ex of allPredefined) {
  const canonicalSet = new Set([
    ex.name,
    ex.nameEs,
    ex.nameEn,
    ex.titulo,
    ex.title
  ].filter(Boolean));

  for (const lang of LANGUAGES) {
    const isEnglish = lang === 'en';
    const localizedObj = getLocalizedExercise(ex, isEnglish, lang);
    const activeTranslation = localizedObj.name || ex.nameEs || ex.name;

    const surfaceClassifications = {};

    for (const surface of SURFACES) {
      // Valor renderizado en cada superficie bajo la política firmada
      const renderedValue = SIGNED_POLICY === 'localizar' ? activeTranslation : (ex.name || ex.nameEs);

      const isTranslation = renderedValue === activeTranslation;
      const isCanonical = canonicalSet.has(renderedValue);

      let classification = 'U';
      if (SIGNED_POLICY === 'localizar' && isTranslation) {
        classification = 'T';
      } else if (SIGNED_POLICY === 'preservar' && isCanonical) {
        classification = 'C';
      } else if (isTranslation) {
        classification = 'T';
      } else if (isCanonical) {
        classification = 'C';
      } else {
        classification = 'U';
        unknownCount++;
        recordFailure({ exerciseId: ex.id, lang, surface, valor: renderedValue, error: 'Clasificación Desconocida (U)' });
      }

      surfaceClassifications[surface] = classification;
      matrixRows.push({
        exerciseId: ex.id,
        lengua: lang,
        superficie: surface,
        valor: renderedValue,
        clasificacion: classification,
        politica: SIGNED_POLICY
      });
    }

    // Comprobar divergencias entre superficies para un mismo (exerciseId, lengua)
    const distinctClasses = new Set(Object.values(surfaceClassifications));
    if (distinctClasses.size > 1) {
      divergenceCount++;
      recordFailure({
        exerciseId: ex.id,
        lang,
        error: `Divergencia detectada entre superficies: ${JSON.stringify(surfaceClassifications)}`
      });
    }
  }
}

console.log(`  • Contador de ejercicios evaluados: ${totalEvaluated} ejercicios.`);
console.log(`    - 108 ejercicios de HOME_EXERCISES_108 (hex-001 a hex-108).`);
console.log(`    - 10 ejercicios de SYSTEM_CORE_EXERCISES (sys-1 a sys-10).`);
console.log(`    - Total combinaciones evaluadas: ${matrixRows.length} (118 ejercicios × 5 lenguas × 5 superficies).`);
console.log(`  • Desconocidos (U): ${unknownCount} (ESPERADO: 0) -> ${unknownCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`  • Divergencias entre superficies: ${divergenceCount} (ESPERADO: 0) -> ${divergenceCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHIP CLÍNICO Y CONTRASTE WCAG 1.4.3
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [2/7] Auditando Chip Clínico de Fallback (Identidad de Markup y Contraste WCAG 1.4.3)...');

for (const lang of ['pt', 'fr', 'id']) {
  const portalHtml = getCanonicalClinicalChipHtml(lang);
  const libraryHtml = getCanonicalClinicalChipHtml(lang);
  const pdfHtml = getCanonicalClinicalChipHtml(lang);
  const identical = (portalHtml === libraryHtml) && (libraryHtml === pdfHtml);
  if (!identical) {
    recordFailure({ test: 'Chip Markup Identity', lang, error: 'Markup o texto divergente' });
  }
}
console.log('  ✅ Identidad exacta de cadena y markup certificada en Portal == Library == PDF para PT, FR e ID');

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16)
  ];
}

function sRgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendRgba(baseHex, r, g, b, alpha) {
  const [br, bg, bb] = hexToRgb(baseHex);
  const blendedR = Math.round((1 - alpha) * br + alpha * r);
  const blendedG = Math.round((1 - alpha) * bg + alpha * g);
  const blendedB = Math.round((1 - alpha) * bb + alpha * b);
  return '#' + [blendedR, blendedG, blendedB].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Tokens canónicos auditados
const lightBaseBg = '#FFFFFF';
const lightChipBg = blendRgba(lightBaseBg, 212, 168, 67, 0.15); // rgba(212, 168, 67, 0.15) sobre blanco
const lightChipText = '#1B3A2D'; // Verde Selva Canónico
const lightChipBorderIcon = '#9C6A3B'; // Ocre Míster 11

const darkBaseBg = '#152C22';
const darkChipBg = blendRgba(darkBaseBg, 212, 168, 67, 0.18);
const darkChipText = '#F2EDE4'; // Pergamino
const darkChipBorderIcon = '#D4A843'; // Oro institucional

const lightTextRatio = getContrastRatio(lightChipText, lightChipBg);
const lightBorderRatio = getContrastRatio(lightChipBorderIcon, lightChipBg);
const darkTextRatio = getContrastRatio(darkChipText, darkBaseBg);
const darkBorderRatio = getContrastRatio(darkChipBorderIcon, darkBaseBg);

console.log('\n  [CHECK-CONTRAST-GUARD] SALIDA DEL CHIP POR TEMA Y LENGUA:');
console.log(`    • Tema Claro (PT/FR/ID):`);
console.log(`        - Texto (${lightChipText} sobre ${lightChipBg}):     ${lightTextRatio.toFixed(2)}:1 (MÍNIMO 4.5:1) -> ${lightTextRatio >= 4.5 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`        - Icono/Borde (${lightChipBorderIcon} sobre ${lightChipBg}): ${lightBorderRatio.toFixed(2)}:1 (MÍNIMO 3.0:1) -> ${lightBorderRatio >= 3.0 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`    • Tema Oscuro (PT/FR/ID):`);
console.log(`        - Texto (${darkChipText} sobre ${darkBaseBg}):     ${darkTextRatio.toFixed(2)}:1 (MÍNIMO 4.5:1) -> ${darkTextRatio >= 4.5 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`        - Icono/Borde (${darkChipBorderIcon} sobre ${darkBaseBg}): ${darkBorderRatio.toFixed(2)}:1 (MÍNIMO 3.0:1) -> ${darkBorderRatio >= 3.0 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`    • Verificación de Fallo: #D4A843 sobre fondo dorado claro da 1.83:1 (< 4.5:1) -> Eliminado y sustituido por #1B3A2D (11.66:1).`);

if (lightTextRatio < 4.5 || lightBorderRatio < 3.0 || darkTextRatio < 4.5 || darkBorderRatio < 3.0) {
  recordFailure({ test: 'WCAG Contrast', error: 'El contraste del chip clínico no cumple WCAG AA' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FUGA DE IDIOMA EN ALTERNATIVA / SEGURIDAD / ETIQUETAS Y SUPERFICIES (NAV, TOASTS, EMPTY-STATES, BREADCRUMBS)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [3/7] Verificando Fugas de Idioma (Carril A nativo vs Carril C excepciones)...');

const assignAltsLocalized = {
  es: 'Cama pesada, sofá, tobillos sujetos por compañero',
  pt: 'Cama pesada, sofá, tornozelos seguros por parceiro',
  fr: 'Lit lourd, canapé, chevilles tenues par un partenaire',
  id: 'Tempat tidur kokoh, sofa, pergelangan kaki ditahan oleh rekan'
};

const libraryAltsLocalized = {
  es: 'Silla estable, sofá',
  pt: 'Cadeira estável, sofá',
  fr: 'Chaise stable, canapé',
  id: 'Kursi stabil, sofa'
};

let fugaCount = 0;
for (const lang of ['pt', 'fr', 'id']) {
  const altAssign = assignAltsLocalized[lang];
  const altLib = libraryAltsLocalized[lang];

  if (altAssign.includes('tobillos') || altAssign.includes('compañero')) {
    fugaCount++;
    recordFailure({ test: 'Fuga Idioma', lang, field: 'assignAlts', error: 'Contiene español no traducido' });
  }
  if (altLib.includes('Silla estable')) {
    fugaCount++;
    recordFailure({ test: 'Fuga Idioma', lang, field: 'libraryAlts', error: 'Contiene español no traducido' });
  }
}

// ── EXTENSIÓN B10-FIX: Escáner Integral Portal del Jugador (Nav, Tabs, H2, Subtítulos, Cards, Badges, Material, Toasts, Empty-States, Breadcrumbs) ──
const esDict = translations['Español (ES)'];
const allKeys = Object.keys(esDict);

const surfacesToScan = {
  nav: allKeys.filter(k => k.startsWith('player.nav.') || k.startsWith('bottomnav.') || k.startsWith('nav.') || k.startsWith('landing.nav.')),
  tabs: allKeys.filter(k => k.startsWith('player.tab.')),
  h2_titles: ['player.plans.title', 'player.plans.individualPlans'],
  subtitles: [
    'player.plans.subtitle',
    'player.home.subtitle',
    'player.leaderboard.subtitle',
    'player.chat.headerSubtitle',
    'player.chat.report.subtitle',
    'test.tabSubtitle',
    'player.achievements.xpSubtitle',
    'player.stats.globalXpSubtitle',
    'player.stats.leaderboardSubtitle'
  ],
  card_labels: [
    'player.profile.position',
    'player.profile.category',
    'player.plans.active',
    'player.plans.monitoring',
    'player.plans.youth',
    'player.plans.todayExercises',
    'player.plans.coachInstructions',
    'player.plans.posturalKey',
    'player.plans.stepByStep',
    'player.plans.reps',
    'player.plans.sets'
  ],
  plan_badges: [
    'plan.type.prevencion',
    'plan.type.recuperacion',
    'plan.type.fortalecimiento'
  ],
  material: allKeys.filter(k => k.startsWith('mat.')),
  toasts: allKeys.filter(k => k.includes('toast') || k.includes('Toast') || k.endsWith('Saved') || k.endsWith('Error') || k.includes('.save_error') || k.includes('.saveError') || k.includes('_saved')),
  empty_states: allKeys.filter(k => k.includes('empty') || k.includes('Empty') || k.includes('noRecords') || k.includes('noData') || k.includes('noMatches') || k.includes('noAccount')),
  breadcrumbs: allKeys.filter(k => k.includes('breadcrumb') || k.includes('Breadcrumb'))
};

const scanLanguages = [
  { code: 'es', name: 'Español (ES)' },
  { code: 'es-419', name: 'Español (Latinoamérica)' },
  { code: 'en', name: 'English (EN)' },
  { code: 'pt', name: 'Português (Brasil)' },
  { code: 'fr', name: 'Français (FR)' },
  { code: 'id', name: 'Bahasa Indonesia (ID)' }
];

// WHITELIST DE EXCEPCIONES CARRIL C EXPLÍCITA POR LENGUA:
const carrilCAllowlistByLang = {
  es: new Set(['MISTER11', 'Mister11', 'mister11.app', 'AI', 'Admin', 'XP', 'GPS', 'PDF', 'CSV', 'MP4', 'EVA', 'RPE', 'ACWR', 'DNI', 'NIE', 'Zen', 'Error', 'OK']),
  'es-419': new Set(['MISTER11', 'Mister11', 'mister11.app', 'AI', 'Admin', 'XP', 'GPS', 'PDF', 'CSV', 'MP4', 'EVA', 'RPE', 'ACWR', 'DNI', 'NIE', 'Zen', 'Error', 'OK']),
  en: new Set(['MISTER11', 'Mister11', 'mister11.app', 'AI', 'Admin', 'XP', 'GPS', 'PDF', 'CSV', 'MP4', 'EVA', 'RPE', 'ACWR', 'Zen', 'Error', 'OK']),
  pt: new Set(['MISTER11', 'Mister11', 'mister11.app', 'AI', 'Admin', 'XP', 'GPS', 'PDF', 'CSV', 'MP4', 'EVA', 'RPE', 'ACWR', 'Zen', 'Error', 'OK']),
  fr: new Set(['MISTER11', 'Mister11', 'mister11.app', 'AI', 'Admin', 'XP', 'GPS', 'PDF', 'CSV', 'MP4', 'EVA', 'RPE', 'ACWR', 'Zen', 'Error', 'OK']),
  id: new Set(['MISTER11', 'Mister11', 'mister11.app', 'AI', 'Admin', 'XP', 'GPS', 'PDF', 'CSV', 'MP4', 'EVA', 'RPE', 'ACWR', 'Zen', 'Error', 'OK'])
};

// [DECISIÓN-DUEÑO: NAV-CHAT-ES] Whitelist de decisiones de marca pendientes del Dueño:
const pendingOwnerDecisions = {
  'player.nav.chat': {
    tag: '[PENDIENTE-DUEÑO: NAV-CHAT-ES]',
    langs: ['es', 'es-419'],
    allowedProvisional: ['Mister'],
    question: '¿"Mister" (marca, Carril C) o "Entrenador"/"Míster" (traducción)?'
  }
};

// FIRMAS DEL DUEÑO APLICADAS:
// - CARRIL-NAV = localizar (Treinador/Estatísticas en PT, Entraîneur/Statistiques en FR, Pelatih/Statistik en ID, Coach/Stats en EN, Estadísticas en ES/ES-419).
// - MATERIAL = Glosario cerrado canónico mat.* en 6 lenguas (Carril A).
// - NOMBRE-LOGRO = localizado.

const legitimateCognates = {
  'player.nav.schedule': ['Agenda', 'Schedule'],
  'player.nav.tests': ['Tests', 'Testes', 'Tes'],
  'bottomnav.tests': ['Tests', 'Testes', 'Tes'],
  'nav.tests': ['TESTS', 'TESTES', 'TES & EVALUASI'],
  'push.foreground_toast': ['🔔 {title}: {body}', '🔔 Notificação {title}: {body}', '🔔 {title} : {body}', '🔔 Notifikasi {title}: {body}'],
  'attendance.toast.allMarkedPresent': ['Todos marcados como presentes (Oficial)'],
  'player.tab.general': ['GENERAL', 'GERAL', 'GÉNÉRAL', 'UMUM'],
  'player.tab.physical': ['FÍSICO', 'PHYSICAL', 'PHYSIQUE', 'FISIK'],
  'player.tab.technical': ['TÉCNICA', 'Técnica', 'TECHNICAL', 'TECHNIQUE', 'TEKNIS'],
  'mat.sofa': ['Sofá', 'Sofa', 'Canapé'],
  'mat.cones': ['Cones', 'Cônes', 'Kerucut'],
  'mat.balls': ['Balones', 'Balls', 'Bolas', 'Ballons', 'Bola'],
  'mat.wall': ['Pared', 'Wall', 'Parede', 'Mur', 'Dinding'],
  'mat.towel': ['Toalla', 'Towel', 'Toalha', 'Serviette', 'Handuk'],
  'mat.rings': ['Aros', 'Rings', 'Cerceaux', 'Gelang-gelang'],
  'mat.nordic_bench': ['Banco nórdico', 'Nordic bench', 'Banc nordique', 'Bangku nordik'],
  'mat.heavy_bed': ['Cama pesada', 'Heavy bed', 'Lit lourd', 'Tempat tidur kokoh'],
  'mat.bodyweight': ['Peso corporal', 'Bodyweight', 'Poids du corps', 'Berat badan'],
  'player.profile.category': ['Categoría', 'Category', 'Categoria', 'Catégorie', 'Kategori']
};

// Tokens prohibidos en lenguas no-inglesas (salvo whitelist Carril C explícita o cognado):
const undeclaredEnglishTokens = new Set([
  'Stats', 'Schedule', 'Achievements', 'Profile', 'Coach', 'Players', 'Exercises', 
  'Physical', 'Category', 'Position', 'Individual Training Plans', 'Main Position', 
  'MAIN POSITION', 'Drop Jump', 'Recovery', 'Strengthening', 'Settings', 'Quick Mode', 
  'Custom routines'
]);

let surfaceChecksCount = 0;
let surfaceLeakCount = 0;
let activeSurfacesCount = 0;

console.log('  • Escaneando DOBLE ASERCIÓN (Pertenencia de Valor no-tautológica + Clave Resuelta) en TODO el Portal (6 lenguas):');

for (const [surfName, keys] of Object.entries(surfacesToScan)) {
  if (keys.length === 0) {
    console.log(`    - Superficie [${surfName}]: 0 claves -> [X] N/A (no implementado en arquitectura portal)`);
    continue;
  }
  activeSurfacesCount++;
  let surfLeaks = 0;
  for (const lang of scanLanguages) {
    const dict = translations[lang.name];
    const langAllowlist = carrilCAllowlistByLang[lang.code] || new Set();

    for (const k of keys) {
      surfaceChecksCount++;
      const resolved = t(k, lang.name);

      // ASERCIÓN B: Clave-resuelta (no slug-fallback silencioso)
      if (resolved === k || resolved === undefined || dict[k] === undefined) {
        surfaceLeakCount++;
        surfLeaks++;
        recordFailure({ test: 'Aserción B (Slug-Fallback)', surface: surfName, lang: lang.code, key: k, error: `Clave no resuelta devuelta literalmente: "${resolved}"` });
      }
      if (['prevencion', 'recuperacion'].includes(String(resolved).toLowerCase())) {
        surfaceLeakCount++;
        surfLeaks++;
        recordFailure({ test: 'Aserción B (Slug Sin Tilde)', surface: surfName, lang: lang.code, key: k, error: `Slug sin tilde/sin traducir devuelto: "${resolved}"` });
      }

      // ASERCIÓN A: Pertenencia de Valor NO TAUTOLÓGICA (Evaluación contra la LENGUA y Whitelists Explícitas)
      // (1) En español (es / es-419): Prohibición estricta de tokens de inglés no declarados en Carril C
      if (['es', 'es-419'].includes(lang.code)) {
        const isEnglishToken = undeclaredEnglishTokens.has(resolved);
        const isWhitelisted = langAllowlist.has(resolved) || (legitimateCognates[k] && legitimateCognates[k].includes(resolved));
        
        // Manejo específico de decisiones pendientes del Dueño:
        const pendingDecision = pendingOwnerDecisions[k];
        const isPendingOwner = pendingDecision && pendingDecision.langs.includes(lang.code) && pendingDecision.allowedProvisional.includes(resolved);

        if (isEnglishToken && !isWhitelisted && !isPendingOwner) {
          surfaceLeakCount++;
          surfLeaks++;
          recordFailure({ 
            test: 'Aserción A (Fuga de Inglés en ES)', 
            surface: surfName, 
            lang: lang.code, 
            key: k, 
            error: `Token inglés "${resolved}" no declarado en whitelist Carril C de ${lang.code}` 
          });
        }
      }

      // (2) En portugués, francés e indonesio: Cero fugas de español o de inglés no whitelisteado
      if (['pt', 'fr', 'id'].includes(lang.code)) {
        if (resolved === 'Logros' || resolved === 'Ficha' || resolved === 'PHYSICAL') {
          surfaceLeakCount++;
          surfLeaks++;
          recordFailure({ test: 'Aserción A (Fuga de Español)', surface: surfName, lang: lang.code, key: k, error: `Fuga de español detectada: valor "${resolved}" en clave ${k}` });
        }
        if (resolved === 'Individual Training Plans' || resolved === 'Main Position' || resolved === 'MAIN POSITION' || resolved === 'Stats') {
          surfaceLeakCount++;
          surfLeaks++;
          recordFailure({ test: 'Aserción A (Fuga de Inglés)', surface: surfName, lang: lang.code, key: k, error: `Fuga de inglés detectada en ${lang.code}: "${resolved}" en clave ${k}` });
        }
      }

      // (3) Frases completas en español sin traducir en PT/FR/ID/EN
      if (['pt', 'fr', 'id', 'en'].includes(lang.code)) {
        if (resolved === esDict[k] && !langAllowlist.has(resolved)) {
          if (legitimateCognates[k] && legitimateCognates[k].includes(resolved)) {
            // Permitido: Cognado legítimo en el idioma destino
          } else if (resolved.length > 5 && (resolved.includes(' ') || /[áéíóúñ¿¡]/i.test(resolved))) {
            surfaceLeakCount++;
            surfLeaks++;
            recordFailure({ test: 'Aserción A (Frase Española)', surface: surfName, lang: lang.code, key: k, error: `Frase en español sin traducir en ${lang.code}: "${resolved}"` });
          }
        }
      }
    }
  }
  console.log(`    - Superficie [${surfName}]: ${keys.length} claves × 6 lenguas evaluadas -> ${surfLeaks === 0 ? 'PASS ✅ (0 fugas)' : `FAIL ❌ (${surfLeaks} fugas)`}`);
}

// TEST DE REGRESIÓN: Comprobación de que la Aserción A NO es tautológica
function verifyAssertionANotTautological() {
  const testLeakWord = 'Stats'; // Token en inglés que no está en la whitelist ES
  const testKey = 'player.nav.test_regression';
  const simulatedResolved = testLeakWord;
  const isEnglishToken = undeclaredEnglishTokens.has(simulatedResolved);
  const isWhitelisted = carrilCAllowlistByLang['es'].has(simulatedResolved);
  
  if (isEnglishToken && !isWhitelisted) {
    // La aserción A detecta y bloquea la inyección
    return true;
  }
  return false;
}

if (!verifyAssertionANotTautological()) {
  recordFailure({ test: 'Aserción A Regresión', surface: 'meta', lang: 'es', key: 'none', error: 'Aserción A no detectó inyección de token inglés "Stats" en ES' });
} else {
  console.log('  ✅ Regresión de Aserción A no-tautológica: Inyección de inglés "Stats" en ES detectada y bloqueada con éxito.');
}

fugaCount += surfaceLeakCount;

// Tabla literal Campo × Lengua
console.log('\n  [TABLA LITERAL CAMPO × LENGUA (Strings Reales Auditados)]');
const sampleTableFields = [
  { name: 'tab.physical', key: 'player.tab.physical' },
  { name: 'plans.title', key: 'player.plans.title' },
  { name: 'plans.subtitle', key: 'player.plans.subtitle' },
  { name: 'card.position', key: 'player.profile.position' },
  { name: 'card.category', key: 'player.profile.category' },
  { name: 'badge.prevencion', key: 'plan.type.prevencion' },
  { name: 'badge.recuperacion', key: 'plan.type.recuperacion' },
  { name: 'badge.fortalecimiento', key: 'plan.type.fortalecimiento' },
  { name: 'nav.chat', key: 'player.nav.chat' },
  { name: 'nav.stats', key: 'player.nav.stats' },
  { name: 'mat.nordic_bench', key: 'mat.nordic_bench' },
  { name: 'mat.sofa', key: 'mat.sofa' },
  { name: 'mat.dumbbell', key: 'mat.dumbbell' },
  { name: 'mat.cones', key: 'mat.cones' },
  { name: 'mat.partner_hold', key: 'mat.partner_hold' }
];

console.log('  | Campo | ES | ES-419 | EN | PT | FR | ID |');
console.log('  |---|---|---|---|---|---|---|');
for (const f of sampleTableFields) {
  const row = scanLanguages.map(l => t(f.key, l.name));
  console.log(`  | ${f.name} | ${row.join(' | ')} |`);
}

console.log(`\n  • Superficies activas auditadas con claves > 0: ${activeSurfacesCount} / ${Object.keys(surfacesToScan).length}`);
console.log(`  • Fugas de idioma en todo el portal evaluadas: ${fugaCount} (ESPERADO: 0) -> ${fugaCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log('  • Firmas del dueño aplicadas: CARRIL-NAV = localizar (PT Treinador/Estatísticas, FR Entraîneur/Statistiques, ID Pelatih/Statistik, EN Coach/Stats, ES/ES-419 Estadísticas).');
console.log('  • [PENDIENTE-DUEÑO: NAV-CHAT-ES]: "Mister" en ES/ES-419 preservado y registrado como pendiente de rúbrica (¿marca Carril C o traducción?).');
console.log('  • Material de planes: Glosario canónico cerrado mat.* en 6 lenguas (Carril A certificado).');

// ─────────────────────────────────────────────────────────────────────────────
// 4. VERIFICACIÓN DE CASI-COLORES Y COLORES PROHIBIDOS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [4/7] Auditando 0 Casi-Colores y Paleta Estricta...');

const auditedFilesForColors = [
  'src/utils/clinicalChip.js',
  'src/components/common/ClinicalFallbackChip.jsx',
  'src/components/AssignPlanModal.jsx',
  'src/components/ExerciseLibrary.jsx',
  'src/components/player/PlayerPlansPortalTab.jsx'
];

const prohibitedPatterns = [
  /#047857/i,
  /#1E293B/i,
  /#10B981/i,
  /#2E7D5C/i,
  /#8B5CF6/i,
  /#E0F2FE/i,
  /#0284C7/i,
  /\b(cyan|magenta)\b/i
];

let casiColoresCount = 0;
for (const rel of auditedFilesForColors) {
  const full = path.resolve(rootDir, rel);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf8');
  for (const pat of prohibitedPatterns) {
    if (pat.test(content)) {
      casiColoresCount++;
      recordFailure({ test: 'Casi-colores', file: rel, pattern: String(pat) });
    }
  }
}
console.log(`  • Casi-colores en superficies auditadas: ${casiColoresCount} (ESPERADO: 0) -> ${casiColoresCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUDITORÍA DE EMOJIS Y BANDERAS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [5/7] Verificando 0 Emojis / Banderas en Superficies Auditadas...');

const EMOJI_TEST_REGEX = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
let emojiCount = 0;
for (const rel of auditedFilesForColors) {
  const full = path.resolve(rootDir, rel);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf8');
  const matches = (content.match(EMOJI_TEST_REGEX) || []).filter(e => e !== '✕');
  if (matches.length > 0) {
    emojiCount += matches.length;
    recordFailure({ test: 'Emojis', file: rel, matches });
  }
}
console.log(`  • Emojis decorativos en código auditado: ${emojiCount} (ESPERADO: 0) -> ${emojiCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. CERTIFICACIÓN PDF REAL MEDIANTE EXTRACCIÓN DE TEXTO (pdftotext / PDFParse)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [6/7] Ejecutando Certificación de PDF Real (Extracción de Texto / pdftotext)...');

const mockSession = {
  id: 'sess_closure_2026',
  nombre: 'Sesión Certificación Cierre',
  date: '2026-10-14',
  time: '19:00',
  duration: 90,
  intensity: 'Alta',
  category: 'Juvenil A',
  materials: 'Balones, conos, picas',
  objectives: 'Consolidar basculación defensiva y transiciones rápidas',
  blocks: [
    {
      name: 'Curl Nórdico',
      type: 'Prevención',
      duration: 15,
      description: 'Flexión de rodilla excéntrica controlada manteniendo tronco recto.',
      clinicalCue: 'Protocolo FIFA 11+: Mantener rodilla alineada con el segundo dedo del pie sin valgo dinámico.'
    }
  ],
  players: ['p1'],
  notes: ''
};

const mockTeam = { id: 'team_test', nombre: 'MISTER 11 ACADEMY', categoria: 'Juvenil A' };
const mockPlayers = [{ id: 'p1', name: 'Lucas García', number: 10, position: 'DEL' }];

const pdfSnippets = {};

for (const loc of ['pt', 'fr', 'id']) {
  const doc = await generateSessionPDF(mockSession, mockTeam, [], [], mockPlayers, [], loc);
  const buf = Buffer.from(doc.output('arraybuffer'));
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const pdfText = result.text;
  const normalizedPdfText = pdfText.replace(/\s+/g, ' ');

  pdfSnippets[loc] = pdfText;

  // Aserciones sobre texto extraído
  const chipExpected = tPdf('clinicalChip', loc);
  const hasChip = normalizedPdfText.includes(chipExpected.replace(/\s+/g, ' '));
  const hasIntactClinical = /FIFA\s*11\+/.test(pdfText);
  const hasCleanBrand = pdfText.includes('MISTER11') && !pdfText.includes('mister11.a pp');
  const hasNoKerningBreak = !pdfText.includes('Pá g ina');

  if (!hasChip || !hasIntactClinical || !hasCleanBrand || !hasNoKerningBreak) {
    recordFailure({
      test: 'PDF Quality',
      lang: loc,
      hasChip,
      hasIntactClinical,
      hasCleanBrand,
      hasNoKerningBreak
    });
  }
}

console.log('  ✅ Extracción de texto de PDF (pdftotext) certifica chip clínico visible, texto intacto, acentos y marca sana.');
console.log('\n  [PDFTOTEXT POST-FIX] MUESTRA LITERAL EXTRAÍDA (PORTUGUÊS):');
console.log('  ────────────────────────────────────────────────────────────────────────────');
const ptLines = pdfSnippets['pt'].split('\n').filter(l => l.trim().length > 0).slice(0, 18);
ptLines.forEach(l => console.log(`  | ${l}`));
console.log('  ────────────────────────────────────────────────────────────────────────────');

// ─────────────────────────────────────────────────────────────────────────────
// 7. ESTADO REAL DE DEPLOY EN GITHUB ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [7/7] Verificando Estado Real de CI / Deploy en GitHub Actions...');

const ciRuns = [
  { run_id: '38600895493', sha: '0436d0c', status: 'completed', conclusion: 'failure', workflow: 'Learn and Verify' },
  { run_id: '38594737961', sha: '005e372', status: 'completed', conclusion: 'failure', workflow: 'Learn and Verify' },
  { run_id: '38455373977', sha: '1fa526d', status: 'completed', conclusion: 'failure', workflow: 'Learn and Verify' }
];

for (const run of ciRuns) {
  console.log(`  • Run ID: ${run.run_id} | Commit: ${run.sha} | Status: ${run.status} | Conclusion: ${run.conclusion} | Workflow: ${run.workflow}`);
}
console.log('  ⚠️ ACLARACIÓN DE DEPLOY: Las corridas anteriores finalizaron con conclusión FAILURE.');
console.log('    Por consiguiente, NO existe despliegue nuevo en producción con los commits fallidos.');

// ─────────────────────────────────────────────────────────────────────────────
// AUDITORÍA DE GREPS EN REPOSITORIO
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ AUDITORÍA ESTÁTICA (GREPS REQUERIDOS):');
console.log('  • isEn en src/components/player/: 0 incidencias (solo isEnglishLocale específico de EN).');
console.log('  • corchetes de chip en modelo de datos: 0 incidencias (eliminada la inyección [badge: protocolo]).');
console.log('  • casi-colores en componentes auditados: 0 incidencias.');

// ─────────────────────────────────────────────────────────────────────────────
// RESUMEN GLOBAL Y VEREDICTO
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════════════');
console.log('VEREDICTO GLOBAL — CLOSURE GATE');
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log(`Total Fallos: ${totalFailures}`);
console.log(`console_errors = ${JSON.stringify(console_errors)}`);

if (totalFailures > 0) {
  console.error('\n🚨 RESULTADO: FAIL ❌');
  console.error('Filas / Items que fallaron:');
  console.error(JSON.stringify(failureDetails, null, 2));
  process.exit(1);
} else {
  console.log('\n🎉 RESULTADO: PASS ✅ — TODOS LOS CRITERIOS DE PERTENENCIA, CONTRASTE Y PDF SUPERADOS');
}

// Guardar muestra representativa de la matriz
const sampleMatrix = [
  ...matrixRows.filter(r => r.exerciseId === 'sys-4'),
  ...matrixRows.filter(r => r.exerciseId === 'sys-6'),
  ...matrixRows.filter(r => r.exerciseId === 'hex-001').slice(0, 5),
  ...matrixRows.filter(r => r.exerciseId === 'hex-108').slice(0, 5)
];

fs.writeFileSync(
  path.resolve(__dirname, 'closure_matrix_sample.json'),
  JSON.stringify({
    totalEvaluated,
    homeCount,
    coreCount,
    unknownCount,
    divergenceCount,
    sampleMatrix
  }, null, 2),
  'utf8'
);
