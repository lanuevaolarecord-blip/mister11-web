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
  { pattern: /#2563[Ee][Bb]/gi, name: 'Azul #2563EB' },
  { pattern: /#1[Dd]4[Ee][Dd]8/gi, name: 'Azul #1D4ED8' },
  { pattern: /#141[Aa]17/gi, name: 'Variante no canónica #141A17 (usar solo #1B3A2D)' }
];

const TARGET_FILES = [
  'src/config/chartTheme.js',
  'src/components/canonical/RadarCompareSVG.js',
  'src/components/canonical/ComparisonBarsSVG.js',
  'src/components/canonical/MomentumSVG.js',
  'src/components/canonical/SectorTacticsSVG.js',
  'src/components/canonical/ShotMapSVG.js',
  'src/components/MatchStats/ShotMap.jsx',
  'src/components/MatchStats/ZoneEventMap.jsx',
  'src/utils/matchAnalytics.js',
  'src/utils/matchPdfReport.js'
];

console.log('==============================================================================');
console.log('MÍSTER 11 — CI LINTER DE PALETA CANÓNICA PARA GRÁFICAS (TIERRA Y CAMPO)');
console.log('==============================================================================\n');

let totalViolations = 0;

for (const relPath of TARGET_FILES) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Ignorar líneas de comentarios explicativos de prohibición
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

if (totalViolations > 0) {
  console.error(`\n🚨 FALLO: Se encontraron ${totalViolations} violaciones de paleta en los componentes de gráficas.`);
  console.error('   Regla: Queda terminantemente prohibido el uso de azules/navy y de #141A17.');
  console.error('   Usa exclusivamente los tokens de src/config/chartTheme.js (fondo #1B3A2D).');
  process.exit(1);
} else {
  console.log('✅ [PASS] 0 colores prohibidos. Todas las gráficas cumplen con la paleta oficial Tierra y Campo.');
  console.log('==============================================================================\n');
}
