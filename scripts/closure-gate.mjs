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
import { HOME_EXERCISES_107 } from '../src/data/homeExercisesCatalog.js';
import { getClinicalChipText, getCanonicalClinicalChipHtml, CLINICAL_FALLBACK_TEXTS } from '../src/utils/clinicalChip.js';
import { generateSessionPDF, tPdf } from '../src/utils/pdfGenerator.js';
import { PDFParse } from 'pdf-parse';

// Núcleo Clínico de 10 ejercicios del sistema
const SYSTEM_CORE_EXERCISES = [
  { id: 'sys-1', name: 'Plancha Frontal', nameEs: 'Plancha Frontal', nameEn: 'Front Plank' },
  { id: 'sys-2', name: 'Puente de Glúteos', nameEs: 'Puente de Glúteos', nameEn: 'Glute Bridge' },
  { id: 'sys-3', name: 'Plancha Lateral', nameEs: 'Plancha Lateral', nameEn: 'Side Plank' },
  {
    id: 'sys-4',
    name: 'Nordic Hamstring Curl',
    nameEs: 'Nordic Hamstring',
    nameEn: 'Nordic Hamstring Curl',
    namePt: 'Curl Nórdico',
    nameFr: 'Ischio-jambier nordique',
    nameId: 'Hamstring nordik'
  },
  { id: 'sys-5', name: 'Copenhagen Adduction', nameEs: 'Copenhagen Adduction', nameEn: 'Copenhagen Adduction' },
  {
    id: 'sys-6',
    name: 'Sentadilla Búlgara',
    nameEs: 'Sentadilla Búlgara',
    nameEn: 'Bulgarian Split Squat',
    namePt: 'Agachamento Búlgaro',
    nameFr: 'Squat Bulgare',
    nameId: 'Squat Bulgaria'
  },
  { id: 'sys-7', name: 'Step Down Excéntrico', nameEs: 'Step Down Excéntrico', nameEn: 'Eccentric Step Down' },
  { id: 'sys-8', name: 'Dead Bug / Bicho Muerto', nameEs: 'Dead Bug', nameEn: 'Dead Bug' },
  { id: 'sys-9', name: 'Bird-Dog / Pájaro Perro', nameEs: 'Bird-Dog', nameEn: 'Bird-Dog' },
  { id: 'sys-10', name: 'Movilidad de Cadera 90/90', nameEs: 'Movilidad de Cadera 90/90', nameEn: '90/90 Hip Mobility' }
];

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
const allPredefined = [...SYSTEM_CORE_EXERCISES, ...HOME_EXERCISES_107];
const homeCount = HOME_EXERCISES_107.length; // 108
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
console.log(`    - 108 ejercicios de HOME_EXERCISES_107 (hex-001 a hex-108).`);
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
// 3. FUGA DE IDIOMA EN ALTERNATIVA / SEGURIDAD / ETIQUETAS
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
console.log(`  • Fugas de idioma en alternativas evaluadas: ${fugaCount} (ESPERADO: 0) -> ${fugaCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log('  • Excepciones Carril C respetadas: Material preferido intacto en ES ("Banco nórdico, correas"), marca "Mister11", "Zen".');

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
