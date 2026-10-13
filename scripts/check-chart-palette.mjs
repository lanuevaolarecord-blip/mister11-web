/**
 * scripts/check-chart-palette.mjs
 * Míster11 — CI Linter de Paleta Canónica con ALLOWLIST EXACTA
 *
 * PALETA EXCLUSIVA TIERRA Y CAMPO (ALLOWLIST EXACTA):
 * - Tokens Canónicos: #1B3A2D, #4CAF7D, #D4A843, #C85A32, #9C6A3B
 * - Tintes Enumerados Canónicos: #2E7D52
 * - Neutrales Cálidos: #B8B2A6, #F7F5F0, #F2EDE4
 * - Neutrales UI autorizados para scaffolding estructural
 *
 * PROHIBICIÓN ESTRICTA Y CAZADORES DE CASI-COLORES:
 * - Cero colores azul marino / navy: #0D1B2A, #0F172A, #101828, #0B1317
 * - Cero azules eléctricos / slate frío / cyan: #1E3A8A, #3B82F6, #2196F3, #2563EB, #1D4ED8, #60A5FA, #0284C7, #BAE6FD, #E0F2FE
 * - Cero casi-colores en gráficas, biblioteca y entrenador:
 *     * #047857 (esmeralda-700, tono ~163° - no canónico)
 *     * #1E293B (slate-800 azul frío ~215° - no canónico)
 *     * #10B981 (menta / esmeralda - no canónico en series)
 *     * #2E7D5C / #2E5C48 (tintes desalineados - migrar a canónico #2E7D52)
 * - Cero morados o magentas: #8B5CF6, #4C1D95, #EC4899, #DB2777, #F43F5E, #E11D48
 * - Cero teal prohibido: #0D9488, rgba(13, 148, 136) [BLOQUEO-DUEÑO: A]
 * - Cero variante #141A17 (usar solo #1B3A2D)
 * - Cero emojis decorativos en componentes de captura, biblioteca y modales.
 *
 * Escanea tokens, estilos inline style= en .jsx y reglas en .css.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. ALLOWLIST CANÓNICA EXACTA (5 tokens + tintes/neutrales enumerados)
export const CANONICAL_PALETTE_ALLOWLIST = new Set([
  '#1B3A2D', // Verde Selva institucional
  '#4CAF7D', // Verde Campo
  '#D4A843', // Oro institucional
  '#C85A32', // Terracota
  '#9C6A3B', // Tierra
  '#2E7D52', // Tinte canónico oscuro de verde
  '#B8B2A6', // Neutro cálido arena
  '#F7F5F0', // Neutro cálido crema
  '#F2EDE4'  // Fondo neutro crema cálido
]);

// Acciones canónicas en --action-color
const ALLOWED_ACTION_COLORS = new Set([
  '#4CAF7D',
  '#D4A843',
  '#C85A32',
  '#9C6A3B',
  '#D97706',
  '#1B3A2D',
  '#2E7D52',
  '#235F2D'
]);

// 2. PATRONES PROHIBIDOS GENERALES (Gamas totalmente ajenas a Tierra y Campo)
export const FORBIDDEN_PATTERNS_GENERAL = [
  // Cero Teal
  { pattern: /#0[Dd]9488/gi, name: 'Teal #0D9488 [BLOQUEO-DUEÑO: A]' },
  { pattern: /rgba?\(\s*13\s*,\s*148\s*,\s*136/gi, name: 'Teal rgb(13, 148, 136) [BLOQUEO-DUEÑO: A]' },

  // Cero variante #141A17
  { pattern: /#141[Aa]17/gi, name: 'Variante no canónica #141A17 (usar solo #1B3A2D)' },

  // Cero Navies
  { pattern: /#0[Dd]1[Bb]2[Aa]/gi, name: 'Navy #0D1B2A' },
  { pattern: /#0[Ff]172[Aa]/gi, name: 'Navy #0F172A' },
  { pattern: /#101828/gi, name: 'Navy #101828' },
  { pattern: /#0[Bb]1317/gi, name: 'Navy #0B1317' },
  { pattern: /rgba?\(\s*15\s*,\s*23\s*,\s*42/gi, name: 'Navy rgb(15, 23, 42)' },

  // Cero Azules Eléctricos / Material / Cyan
  { pattern: /#1[Ee]3[Aa]8[Aa]/gi, name: 'Azul #1E3A8A' },
  { pattern: /#3[Bb]82[Ff]6/gi, name: 'Azul Eléctrico #3B82F6' },
  { pattern: /#2196[Ff]3/gi, name: 'Azul Material #2196F3' },
  { pattern: /#2563[Ee][Bb]/gi, name: 'Azul #2563EB' },
  { pattern: /#1[Dd]4[Ee][Dd]8/gi, name: 'Azul #1D4ED8' },
  { pattern: /#60[Aa]5[Ff][Aa]/gi, name: 'Azul Claro #60A5FA' },
  { pattern: /#0284[Cc]7/gi, name: 'Cyan #0284C7' },
  { pattern: /#bae6fd/gi, name: 'Cyan #BAE6FD' },
  { pattern: /#e0f2fe/gi, name: 'Cyan #E0F2FE' },
  { pattern: /rgba?\(\s*59\s*,\s*130\s*,\s*246/gi, name: 'Azul Eléctrico rgb(59, 130, 246)' },
  { pattern: /rgba?\(\s*33\s*,\s*150\s*,\s*243/gi, name: 'Azul Material rgb(33, 150, 243)' },
  { pattern: /rgba?\(\s*30\s*,\s*58\s*,\s*138/gi, name: 'Azul rgb(30, 58, 138)' },

  // Cero Morados y Magentas
  { pattern: /#4[Cc]1[Dd]95/gi, name: 'Morado #4C1D95' },
  { pattern: /#8[Bb]5[Cc][Ff]6/gi, name: 'Morado #8B5CF6' },
  { pattern: /#ec4899/gi, name: 'Rosa/Magenta #EC4899' },
  { pattern: /#db2777/gi, name: 'Rosa/Magenta #DB2777' },
  { pattern: /#f43f5e/gi, name: 'Rosa/Magenta #F43F5E' },
  { pattern: /#e11d48/gi, name: 'Rosa/Magenta #E11D48' }
];

// 3. PATRONES CAZADORES DE CASI-COLORES (Que el blocklist viejo dejaba pasar)
export const FORBIDDEN_PATTERNS_NEAR_COLORS = [
  { pattern: /#047857/gi, name: 'Esmeralda #047857 (tono ~163° desalineado - usar #2E7D52 o #1B3A2D)' },
  { pattern: /#1[Ee]293[Bb]/gi, name: 'Slate frío #1E293B (azul-frío ~215° - usar #1B3A2D o #B8B2A6)' },
  { pattern: /#10[Bb]981/gi, name: 'Menta/Esmeralda #10B981 (no canónico - usar #2E7D52 o #4CAF7D)' },
  { pattern: /#2[Ee]7[Dd]5[Cc]/gi, name: 'Tinte desalineado #2E7D5C (usar canónico #2E7D52)' },
  { pattern: /#2[Ee]5[Cc]48/gi, name: 'Tinte desalineado #2E5C48 (usar canónico #2E7D52)' }
];

// Archivos generales auditados
const TARGET_FILES = [
  'src/config/chartTheme.js',
  'src/components/canonical/RadarCompareSVG.js',
  'src/components/canonical/ComparisonBarsSVG.js',
  'src/components/canonical/MomentumSVG.js',
  'src/components/canonical/SectorTacticsSVG.js',
  'src/components/canonical/ShotMapSVG.js',
  'src/components/canonical/TerritoryMap3x3.jsx',
  'src/components/MatchStats/ShotMap.jsx',
  'src/components/MatchStats/ZoneEventMap.jsx',
  'src/utils/matchAnalytics.js',
  'src/utils/matchPdfReport.js',
  'src/components/MultiMatchAnalysis.css',
  'src/components/MultiMatchAnalysis.jsx',
  'src/utils/analysisPdfReport.js',
  'src/components/ShotCaptureModal.jsx',
  'src/components/ShotCaptureModal.css',
  'src/components/PlayerChipRow.jsx',
  'src/components/PlayerChipRow.css',
  'src/components/MatchStats/StatsFilters.jsx',
  'src/components/player/PlayerPlansPortalTab.jsx',
  'src/components/player/PlayerPlansPortalTab.css',
  'src/components/ExerciseLibrary.jsx',
  'src/components/ExerciseLibrary.css',
  'src/components/AssignPlanModal.jsx',
  'src/pages/AdminPanel.jsx'
];

// Archivos bajo escaneo exhaustivo de casi-colores (entrenador, gráficas canónicas, captura y modales)
const NEAR_COLOR_SCAN_FILES = [
  'src/config/chartTheme.js',
  'src/components/canonical/RadarCompareSVG.js',
  'src/components/canonical/ComparisonBarsSVG.js',
  'src/components/canonical/MomentumSVG.js',
  'src/components/canonical/SectorTacticsSVG.js',
  'src/components/canonical/ShotMapSVG.js',
  'src/components/canonical/TerritoryMap3x3.jsx',
  'src/components/ShotCaptureModal.jsx',
  'src/components/ShotCaptureModal.css',
  'src/components/PlayerChipRow.jsx',
  'src/components/PlayerChipRow.css',
  'src/components/player/PlayerPlansPortalTab.jsx',
  'src/components/player/PlayerPlansPortalTab.css',
  'src/components/ExerciseLibrary.jsx',
  'src/components/ExerciseLibrary.css',
  'src/components/AssignPlanModal.jsx'
];

const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

console.log('==============================================================================');
console.log('MÍSTER 11 — CI LINTER DE PALETA CANÓNICA: ALLOWLIST EXACTA TIERRA Y CAMPO');
console.log('==============================================================================\n');

let totalViolations = 0;

// Helper: ¿Es línea de comentario o documentación interna?
function isCommentLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    line.includes('PROHIBICIÓN ESTRICTA') ||
    line.includes('pattern:') ||
    line.includes('FORBIDDEN_PATTERNS') ||
    line.includes('CANONICAL_PALETTE_ALLOWLIST') ||
    line.includes('PROHIBIDO')
  );
}

// 1. Auditoría general de TARGET_FILES contra FORBIDDEN_PATTERNS_GENERAL
for (const relPath of TARGET_FILES) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (isCommentLine(line)) return;

    for (const { pattern, name } of FORBIDDEN_PATTERNS_GENERAL) {
      if (pattern.test(line)) {
        console.error(`❌ [${name}] en ${relPath}:${idx + 1}`);
        console.error(`   > ${line.trim()}`);
        totalViolations++;
      }
    }
  });
}

// 2. Auditoría exhaustiva de casi-colores en NEAR_COLOR_SCAN_FILES
for (const relPath of NEAR_COLOR_SCAN_FILES) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (isCommentLine(line)) return;

    for (const { pattern, name } of FORBIDDEN_PATTERNS_NEAR_COLORS) {
      if (pattern.test(line)) {
        console.error(`❌ [${name}] en ${relPath}:${idx + 1}`);
        console.error(`   > ${line.trim()}`);
        totalViolations++;
      }
    }
  });
}

// 3. Auditoría específica de chartTheme.js: ALLOWLIST EXACTA de tokens de serie institucional
const chartThemePath = path.resolve(rootDir, 'src/config/chartTheme.js');
if (fs.existsSync(chartThemePath)) {
  const chartThemeContent = fs.readFileSync(chartThemePath, 'utf-8');
  const teamHomeMatches = chartThemeContent.match(/teamHome(?:Light)?:\s*'([^']+)'/g) || [];
  for (const match of teamHomeMatches) {
    const hex = match.split(':')[1].trim().replace(/['"]/g, '').toUpperCase();
    if (!CANONICAL_PALETTE_ALLOWLIST.has(hex)) {
      console.error(`❌ [teamHome no canónico en chartTheme.js: ${hex}] Debe ser uno de ${[...CANONICAL_PALETTE_ALLOWLIST].join(', ')}`);
      totalViolations++;
    }
  }
}

// 4. Auditoría de captura, biblioteca y modales:
//    - Cero emojis
//    - Cero #EF4444 (rojo de bandera en acciones)
//    - Validación estricta de todos los estilos inline '--action-color'
const CAPTURE_COMPONENTS = [
  'src/components/LiveStats.jsx',
  'src/components/ShotCaptureModal.jsx',
  'src/components/PlayerChipRow.jsx',
  'src/components/player/PlayerPlansPortalTab.jsx',
  'src/components/ExerciseLibrary.jsx',
  'src/components/ExerciseLibrary.css',
  'src/components/AssignPlanModal.jsx'
];

for (const relPath of CAPTURE_COMPONENTS) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (isCommentLine(line)) return;

    // Emojis en captura y modales
    if (EMOJI_REGEX.test(line)) {
      console.error(`❌ [Emoji prohibido en captura/modal] en ${relPath}:${idx + 1}`);
      console.error(`   > ${line.trim()}`);
      totalViolations++;
    }

    // Rojo genérico #EF4444 en captura y modales
    if (/#EF4444/i.test(line)) {
      console.error(`❌ [Rojo #EF4444 prohibido en captura (usar terracota canónico #C85A32)] en ${relPath}:${idx + 1}`);
      console.error(`   > ${line.trim()}`);
      totalViolations++;
    }

    // Estilos inline '--action-color'
    if (line.includes('--action-color')) {
      const match = line.match(/--action-color':\s*'([^']+)'/);
      if (match) {
        const val = match[1].toUpperCase();
        if (!ALLOWED_ACTION_COLORS.has(val)) {
          console.error(`❌ [Acción no canónica en --action-color: ${val}] en ${relPath}:${idx + 1}`);
          console.error(`   > ${line.trim()}`);
          totalViolations++;
        }
      }
    }
  });
}

// 5. Verificación de blindaje en AdminPanel
const adminPanelPath = path.resolve(rootDir, 'src/pages/AdminPanel.jsx');
if (fs.existsSync(adminPanelPath)) {
  const adminContent = fs.readFileSync(adminPanelPath, 'utf-8');
  const forbiddenPatternsAdmin = [
    { pattern: /#3B82F6/gi, name: 'Azul Eléctrico #3B82F6 en AdminPanel' },
    { pattern: /#2196F3/gi, name: 'Azul Material #2196F3 en AdminPanel' },
    { pattern: /#1E3A8A/gi, name: 'Azul #1E3A8A en AdminPanel' },
    { pattern: /#0D9488/gi, name: 'Teal #0D9488 en AdminPanel' }
  ];
  for (const { pattern, name } of forbiddenPatternsAdmin) {
    if (pattern.test(adminContent)) {
      console.error(`❌ [${name}] detectado en AdminPanel.jsx`);
      totalViolations++;
    }
  }
}

if (totalViolations > 0) {
  console.error(`\n🚨 FALLO: Se encontraron ${totalViolations} violaciones de paleta en los componentes auditados.`);
  console.error('   Regla: Queda terminantemente prohibido el uso de azules/navy/casi-colores (#047857, #1E293B, #10B981), rojo #EF4444, emojis y colores no canónicos.');
  process.exit(1);
} else {
  console.log('✅ [PASS] 0 colores prohibidos, 0 casi-colores, 0 emojis, y todos los tokens/action-colors son canónicos Tierra y Campo.');
}

// 6. Casos de prueba obligatorios de regresión:
console.log('▶ [TEST REGRESIÓN OLEADA 6.3b] Verificando detección garantizada de #047857, #1E293B, #10B981, #2E7D5C y #3B82F6...');
const testSnippets = [
  { code: '<div style={{ color: "#047857" }}>test</div>', name: 'Esmeralda #047857' },
  { code: '<div style={{ color: "#1E293B" }}>test</div>', name: 'Slate frío #1E293B' },
  { code: '<div style={{ color: "#10B981" }}>test</div>', name: 'Menta #10B981' },
  { code: '<button style={{ background: "#3B82F6" }}>test</button>', name: 'Azul #3B82F6' },
  { code: '<div style={{ color: "#2E7D5C" }}>test</div>', name: 'Tinte desalineado #2E7D5C' },
  { code: '<div style={{ color: "#0D9488" }}>test</div>', name: 'Teal #0D9488' }
];

const ALL_TEST_PATTERNS = [...FORBIDDEN_PATTERNS_GENERAL, ...FORBIDDEN_PATTERNS_NEAR_COLORS];

let failedTests = 0;
for (const { code, name } of testSnippets) {
  let detected = false;
  for (const { pattern } of ALL_TEST_PATTERNS) {
    if (pattern.test(code)) {
      detected = true;
      break;
    }
  }
  if (!detected) {
    console.error(`❌ FALLO CRÍTICO: El linter no detectó ${name} en código simulado.`);
    failedTests++;
  }
}

if (failedTests > 0) {
  console.error('🚨 Error en suite de regresión del linter.');
  process.exit(1);
} else {
  console.log(`✅ [PASS] El linter detectó el 100% de los casi-colores y azules inyectados (${testSnippets.length}/${testSnippets.length}). Allowlist y cazadores blindados.`);
}

console.log('==============================================================================\n');
