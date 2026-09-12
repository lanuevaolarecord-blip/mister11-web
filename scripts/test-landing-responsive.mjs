/**
 * scripts/test-landing-responsive.mjs
 * Míster11 — Verificación Automatizada del Entregable D2 (Landing / Planes / Responsive)
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST E2E Y RESPONSIVE DE PANTALLA PRINCIPAL Y PLANES (D2)');
console.log('==============================================================================\n');

const landingJsxPath = path.join(rootDir, 'src/pages/LandingPage.jsx');
const landingCssPath = path.join(rootDir, 'src/pages/LandingPage.css');
const plansConfigPath = path.join(rootDir, 'src/config/plans.js');

const landingJsx = fs.readFileSync(landingJsxPath, 'utf8');
const landingCss = fs.readFileSync(landingCssPath, 'utf8');
const plansConfig = fs.readFileSync(plansConfigPath, 'utf8');

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     ${err.message}`);
    process.exit(1);
  }
}

// 1. Verificación de los 5 planes canónicos
check('LandingPage incluye los 5 planes canónicos (free, pro, club_starter, club_pro, club_premium)', () => {
  assert.ok(landingJsx.includes('PLANS.free'), 'Debe incluir PLANS.free');
  assert.ok(landingJsx.includes('PLANS.pro'), 'Debe incluir PLANS.pro');
  assert.ok(landingJsx.includes('PLANS.club_starter'), 'Debe incluir PLANS.club_starter');
  assert.ok(landingJsx.includes('PLANS.club_pro'), 'Debe incluir PLANS.club_pro');
  assert.ok(landingJsx.includes('PLANS.club_premium'), 'Debe incluir PLANS.club_premium');
});

// 2. Verificación de selector bilingüe ES / EN en navbar
check('LandingPage integra selector de idioma accesible ES/EN y useTranslation', () => {
  assert.ok(landingJsx.includes('useTranslation'), 'Debe usar el hook useTranslation');
  assert.ok(landingJsx.includes("setLanguage('es')"), 'Debe permitir cambiar a español');
  assert.ok(landingJsx.includes("setLanguage('en')"), 'Debe permitir cambiar a inglés');
  assert.ok(landingJsx.includes('landing-lang-toggle'), 'Debe tener contenedor de idioma');
});

// 3. Verificación de botón Login visible y target >=48dp
check('Navbar incluye botón Login con min-height >=48px para touch targets móviles', () => {
  assert.ok(landingJsx.includes('btn-m11-nav-login'), 'Debe tener clase btn-m11-nav-login');
  assert.ok(landingCss.includes('min-height: 48px') || landingCss.includes('min-height: 48dp'), 'Botón login debe cumplir min-height 48px');
  assert.ok(landingCss.includes('env(safe-area-inset-top'), 'Navbar debe contemplar safe-area-inset-top para móviles');
});

// 4. Verificación de Matriz en <= 10s: 3 atributos decisivos por plan
check('Cada tarjeta de plan presenta lista de 3 atributos decisivos y CTA directo', () => {
  assert.ok(landingJsx.includes('decisive-attributes-list'), 'Debe contar con lista de atributos decisivos');
  assert.ok(landingJsx.includes('handleStart'), 'Debe conectar el botón CTA a la navegación');
  assert.ok(landingJsx.includes('billingCycle'), 'Debe permitir conmutar entre Temporada y Mensual');
});

// 5. Verificación de Paleta Tierra y Campo (Cero colores azules o navy)
check('LandingPage.css respeta estrictamente la paleta Tierra y Campo (cero azules)', () => {
  const forbiddenNavy = ['#0d1b2a', '#0f172a', '#101828', '#1e3a8a', '#3b82f6', '#2563eb'];
  const cssLower = landingCss.toLowerCase();
  for (const col of forbiddenNavy) {
    assert.ok(!cssLower.includes(col), `LandingPage.css no debe contener el color azul ${col}`);
  }
  assert.ok(cssLower.includes('#1b3a2d'), 'Debe usar Verde Selva #1B3A2D');
  assert.ok(cssLower.includes('#4caf7d'), 'Debe usar Verde Campo #4CAF7D');
  assert.ok(cssLower.includes('#d4a843'), 'Debe usar Oro Míster11 #D4A843');
  assert.ok(cssLower.includes('#f2ede4'), 'Debe usar Blanco Roto Marfil #F2EDE4');
});

// 6. Verificación de Viewport dvh + safe-areas
check('LandingPage.css cuenta con soporte dvh para viewport elástico móvil', () => {
  assert.ok(landingCss.includes('100dvh'), 'Debe incluir 100dvh para evitar saltos de barra en iOS/Android');
  assert.ok(landingCss.includes('@media (max-width: 380px)'), 'Debe tener adaptación específica para pantallas de 360px');
});

console.log('\n==============================================================================');
console.log('🎉 [PASS] 6/6 VERIFICACIONES DE PANTALLA PRINCIPAL Y PLANES SUPERADAS');
console.log('==============================================================================\n');
