/**
 * scripts/check-chart-palette.mjs
 * Míster11 — CI Linter Estricto de Paleta Canónica para Gráficas
 *
 * PROHIBICIÓN ESTRICTA:
 * - Cero colores azul marino / navy: #0D1B2A, #0F172A, #101828, #0B1317, etc.
 * - Cero azules eléctricos / slate / cyan: #1E3A8A, #3B82F6, #2563EB, #1D4ED8, etc.
 * - Cero variante #141A17 (usar únicamente el fondo institucional canónico #1B3A2D).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  { pattern: /#0[Dd]1[Bb]2[Aa]/g, name: 'Navy #0D1B2A' },
  { pattern: /#0[Ff]172[Aa]/g, name: 'Navy #0F172A' },
  { pattern: /#101828/gi, name: 'Navy #101828' },
  { pattern: /#0[Bb]1317/gi, name: 'Navy #0B1317' },
  { pattern: /#1[Ee]3[Aa]8[Aa]/gi, name: 'Azul #1E3A8A' },
  { pattern: /#3[Bb]82[Ff]6/gi, name: 'Azul Eléctrico #3B82F6' },
  { pattern: /#2196[Ff]3/gi, name: 'Azul Material #2196F3' },
  { pattern: /#2563[Ee][Bb]/gi, name: 'Azul #2563EB' },
  { pattern: /#1[Dd]4[Ee][Dd]8/gi, name: 'Azul #1D4ED8' },
  { pattern: /#60[Aa]5[Ff][Aa]/gi, name: 'Azul Claro #60A5FA' },
  { pattern: /#4[Cc]1[Dd]95/gi, name: 'Morado #4C1D95' },
  { pattern: /#8[Bb]5[Cc][Ff]6/gi, name: 'Morado #8B5CF6' },
  { pattern: /#0[Dd]9488/gi, name: 'Teal #0D9488 (Rojo de Gobernanza - Prohibido) [BLOQUEO-DUEÑO: A]' },
  { pattern: /#141[Aa]17/gi, name: 'Variante no canónica #141A17 (usar solo #1B3A2D)' },
  { pattern: /rgba?\(\s*15\s*,\s*23\s*,\s*42/gi, name: 'Navy rgb(15, 23, 42)' },
  { pattern: /rgba?\(\s*59\s*,\s*130\s*,\s*246/gi, name: 'Azul Eléctrico rgb(59, 130, 246)' },
  { pattern: /rgba?\(\s*33\s*,\s*150\s*,\s*243/gi, name: 'Azul Material rgb(33, 150, 243)' },
  { pattern: /rgba?\(\s*30\s*,\s*58\s*,\s*138/gi, name: 'Azul rgb(30, 58, 138)' },
  { pattern: /rgba?\(\s*13\s*,\s*148\s*,\s*136/gi, name: 'Teal rgb(13, 148, 136) [BLOQUEO-DUEÑO: A]' }
];

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
  'src/pages/AdminPanel.jsx'
];

console.log('==============================================================================');
console.log('MÍSTER 11 — CI LINTER DE PALETA CANÓNICA PARA GRÁFICAS Y CAPTURA (TIERRA Y CAMPO)');
console.log('==============================================================================\n');

let totalViolations = 0;
const ALLOWED_ACTION_COLORS = new Set([
  '#4CAF7D',
  '#D4A843',
  '#C85A32',
  '#9C6A3B',
  '#D97706',
  '#1B3A2D',
  '#235F2D'
]);
const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

// 1. Auditoría de archivos canónicos de gráficas
for (const relPath of TARGET_FILES) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('PROHIBICIÓN ESTRICTA') || line.includes('pattern:') || line.includes('FORBIDDEN_PATTERNS') || line.includes('PROHIBIDO')) {
      return;
    }

    for (const { pattern, name } of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        console.error(`❌ [${name}] en ${relPath}:${idx + 1}`);
        console.error(`   > ${line.trim()}`);
        totalViolations++;
      }
    }
  });
}

// 2. Auditoría exhaustiva de captura y modales:
//    - Cero emojis
//    - Cero #EF4444 (rojo de bandera)
//    - Validación estricta de todos los estilos inline '--action-color'
// 2. Auditoría de captura y modales:
const CAPTURE_COMPONENTS = [
  'src/components/LiveStats.jsx',
  'src/components/ShotCaptureModal.jsx',
  'src/components/PlayerChipRow.jsx',
  'src/components/player/PlayerPlansPortalTab.jsx'
];

for (const relPath of CAPTURE_COMPONENTS) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
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

if (totalViolations > 0) {
  console.error(`\n🚨 FALLO: Se encontraron ${totalViolations} violaciones de paleta en los componentes auditados.`);
  console.error('   Regla: Queda terminantemente prohibido el uso de azules/navy, rojo #EF4444, emojis y colores no canónicos en --action-color.');
  process.exit(1);
} else {
  console.log('✅ [PASS] 0 colores prohibidos, 0 emojis, y todos los --action-color son canónicos Tierra y Campo.');
}

// 3. Caso de prueba obligatorio (Oleada 6.2):
// Meter azul #3B82F6 en el botón de APK / estilo inline -> el linter DEBE fallar.
console.log('▶ [TEST OLEADA 6.2] Verificando que inyectar #3B82F6 en el botón APK hace fallar al linter...');
const simulatedApkButtonWithBlue = `
<button style={{
  background: 'linear-gradient(135deg, #4CAF7D, #3B82F6)',
  color: '#fff',
  fontWeight: 700
}}>
  DESCARGAR APK
</button>
`;

let simulatedFailCount = 0;
for (const { pattern, name } of FORBIDDEN_PATTERNS) {
  if (pattern.test(simulatedApkButtonWithBlue)) {
    simulatedFailCount++;
  }
}

if (simulatedFailCount === 0) {
  console.error('❌ FALLO CRÍTICO DE CI: El linter NO detectó el azul #3B82F6 inyectado en el botón APK.');
  process.exit(1);
} else {
  console.log(`✅ [PASS] El linter detectó el azul prohibido inyectado (${simulatedFailCount} coincidencia/s). Fallo garantizado si se mete azul.`);
}

console.log('==============================================================================\n');
