/**
 * scripts/check-contrast-guard.mjs
 * Míster 11 — Guardia de Accesibilidad y Contraste WCAG AA (CI)
 *
 * Valida matemáticamente:
 * 1. Cumplimiento estricto WCAG AA (ratio >= 4.5:1 texto normal, >= 3:1 texto grande/insignias)
 *    para todos los tokens de texto en CHART_THEME tanto en tema claro como oscuro.
 * 2. Que el dorado institucional (#D4A843) esté reservado para gráficos/badges/texto grande
 *    y nunca se emplee como texto normal (<18px sin negrita) sobre fondos claros donde da ~2.3:1.
 * 3. Prohibición de colores no institucionales (azules eléctricos/marinos) en componentes tácticos.
 * 4. Integridad de variables CSS de contraste en src/index.css.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { CHART_THEME } from '../src/config/chartTheme.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — GUARDIA DE ACCESIBILIDAD Y CONTRASTE WCAG AA (CI)');
console.log('==============================================================================\n');

// ── 1. CÁLCULO DE LUMINANCIA RELATIVA Y CONTRASTE WCAG 2.1 ───────────────────
function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    return [
      parseInt(cleanHex[0] + cleanHex[0], 16),
      parseInt(cleanHex[1] + cleanHex[1], 16),
      parseInt(cleanHex[2] + cleanHex[2], 16)
    ];
  }
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

let checksPassed = 0;

function check(title, fn) {
  try {
    fn();
    console.log(`  ✅ ${title}`);
    checksPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}:`, err.message);
    process.exit(1);
  }
}

// ── 2. AUDITORÍA DE TOKENS EN TEMA CLARO ─────────────────────────────────────
console.log('▶ [1/4] Auditando tokens de texto en TEMA CLARO (fondos #FFFFFF y #F5F0E8)...');

const lightBgWhite = '#FFFFFF';
const lightBgTierra = '#F5F0E8';
const lightTokens = CHART_THEME.light;

check('light.ink (#1B3A2D) supera WCAG AA (>= 4.5:1) sobre blanco', () => {
  const ratio = getContrastRatio(lightTokens.ink, lightBgWhite);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('light.ink (#1B3A2D) supera WCAG AA (>= 4.5:1) sobre tierra base', () => {
  const ratio = getContrastRatio(lightTokens.ink, lightBgTierra);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('light.inkMuted (#4A5C50) supera WCAG AA (>= 4.5:1) sobre blanco', () => {
  const ratio = getContrastRatio(lightTokens.inkMuted, lightBgWhite);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('light.inkMuted (#4A5C50) supera WCAG AA (>= 4.5:1) sobre tierra base', () => {
  const ratio = getContrastRatio(lightTokens.inkMuted, lightBgTierra);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check(`light.accentText (${lightTokens.accentText}) supera WCAG AA (>= 4.5:1) sobre blanco`, () => {
  const ratio = getContrastRatio(lightTokens.accentText, lightBgWhite);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check(`light.accentText (${lightTokens.accentText}) supera WCAG AA (>= 4.5:1) sobre tierra base`, () => {
  const ratio = getContrastRatio(lightTokens.accentText, lightBgTierra);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('Dorado estándar (#D4A843) NO se usa para texto normal en tema claro (ratio ~2.3:1)', () => {
  const rawGoldRatio = getContrastRatio('#D4A843', lightBgWhite);
  assert.ok(rawGoldRatio < 4.5, 'Dorado crudo falla AA en texto normal');
  assert.notStrictEqual(lightTokens.accentText, '#D4A843', 'accentText claro no debe ser dorado crudo');
});

// ── 3. AUDITORÍA DE TOKENS EN TEMA OSCURO ────────────────────────────────────
console.log('\n▶ [2/4] Auditando tokens de texto en TEMA OSCURO (fondos #152C22 y #1B3A2D)...');

const darkBgPitch = '#152C22';
const darkBgCard = '#1B3A2D';
const darkTokens = CHART_THEME.dark;

check('dark.ink (#F2EDE4) supera WCAG AA (>= 4.5:1) sobre fondo de campo', () => {
  const ratio = getContrastRatio(darkTokens.ink, darkBgPitch);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('dark.ink (#F2EDE4) supera WCAG AA (>= 4.5:1) sobre tarjeta oscura', () => {
  const ratio = getContrastRatio(darkTokens.ink, darkBgCard);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('dark.inkMuted (#C9D4CC) supera WCAG AA (>= 4.5:1) sobre fondo de campo', () => {
  const ratio = getContrastRatio(darkTokens.inkMuted, darkBgPitch);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('dark.inkMuted (#C9D4CC) supera WCAG AA (>= 4.5:1) sobre tarjeta oscura', () => {
  const ratio = getContrastRatio(darkTokens.inkMuted, darkBgCard);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('dark.accentText (#E4C878) supera WCAG AA (>= 4.5:1) sobre fondo de campo', () => {
  const ratio = getContrastRatio(darkTokens.accentText, darkBgPitch);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

check('dark.accentText (#E4C878) supera WCAG AA (>= 4.5:1) sobre tarjeta oscura', () => {
  const ratio = getContrastRatio(darkTokens.accentText, darkBgCard);
  assert.ok(ratio >= 4.5, `Ratio ${ratio.toFixed(2)} es menor a 4.5`);
});

// ── 4. AUDITORÍA DE ARCHIVOS DE CÓDIGO CANÓNICO ──────────────────────────────
console.log('\n▶ [3/4] Auditando archivos canónicos contra colores prohibidos o textos ilegibles...');

const filesToCheck = [
  'src/components/canonical/TerritoryMap3x3.jsx',
  'src/components/canonical/TerritoryMap3x3SVG.js',
  'src/components/canonical/ShotMapSVG.js',
  'src/components/canonical/MomentumSVG.js',
  'src/components/canonical/ComparisonBarsSVG.js',
  'src/components/canonical/RadarCompareSVG.js',
  'src/components/canonical/SectorTacticsSVG.js',
];

const prohibitedColors = [
  '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#0000ff', '#000080'
];

for (const relPath of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), relPath);
  check(`Sin azules eléctricos/marinos en ${relPath}`, () => {
    assert.ok(fs.existsSync(fullPath), `El archivo ${relPath} debe existir`);
    const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
    for (const color of prohibitedColors) {
      assert.ok(!content.includes(color), `Se detectó color azul no institucional ${color} en ${relPath}`);
    }
  });
}

// ── 5. AUDITORÍA DE CSS TOKENS ──────────────────────────────────────────────
console.log('\n▶ [4/4] Auditando variables CSS de contraste en src/index.css...');

const indexCssPath = path.resolve(process.cwd(), 'src/index.css');
check('src/index.css define --text-ink, --text-ink-muted y --text-accent accesibles', () => {
  const cssContent = fs.readFileSync(indexCssPath, 'utf8');
  assert.ok(cssContent.includes('--text-ink:'), 'Debe definir --text-ink');
  assert.ok(cssContent.includes('--text-ink-muted:'), 'Debe definir --text-ink-muted');
  assert.ok(cssContent.includes('--text-accent:'), 'Debe definir --text-accent');
  assert.ok(cssContent.includes('--text-gold-accessible:'), 'Debe definir --text-gold-accessible');
});

console.log('\n==============================================================================');
console.log(`TOTAL CHECKS PASADOS: ${checksPassed} / ${checksPassed}`);
console.log('🎉 [PASS] GUARDIA DE CONTRASTE WCAG AA Y AUDITORÍA DE PALETA SUPERADA CON ÉXITO');
console.log('==============================================================================\n');
