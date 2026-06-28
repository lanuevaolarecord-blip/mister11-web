/**
 * MISTER 11 - Screenshot Capture Script
 * Captures all modules for commercial video production
 * Run: node capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'screenshots-video');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:5173';

async function captureModule(page, name, url, waitFor, actions) {
  console.log(`\n📸 Capturando: ${name}...`);
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    if (actions) await actions(page);
    await page.waitForTimeout(1500);

    const filename = join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`   ✅ Guardado: ${filename}`);
    return filename;
  } catch (err) {
    console.error(`   ❌ Error en ${name}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🎬 MISTER 11 - Captura de módulos para video comercial');
  console.log('=====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // ── 1. Login / Landing ──────────────────────────────────────────
  await captureModule(page, '01_login', '/', null, async (p) => {
    await p.waitForTimeout(1000);
  });

  // ── 2. Login con invitado ────────────────────────────────────────
  try {
    const guestBtn = await page.$('button:has-text("Invitado"), button:has-text("invitado"), [data-testid="guest-btn"], button:has-text("Demo"), button:has-text("Explorar")');
    if (guestBtn) {
      await guestBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // Intentar con email/pass de demo
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      if (emailInput) {
        await emailInput.fill('invitado@mister11.app');
        const passInput = await page.$('input[type="password"]');
        if (passInput) await passInput.fill('demo1234');
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  } catch (e) {
    console.log('   ⚠️ Continuando sin login automático...');
  }

  // Capturar estado actual (post-login o login)
  await page.screenshot({ path: join(OUTPUT_DIR, '02_post_login.png'), fullPage: true });
  console.log('   ✅ Guardado: 02_post_login.png');

  // ── 3. Dashboard ─────────────────────────────────────────────────
  await captureModule(page, '03_dashboard', '/dashboard');

  // ── 4. Sesiones ──────────────────────────────────────────────────
  await captureModule(page, '04_sesiones', '/sesiones');

  // ── 5. Pizarra Táctica ───────────────────────────────────────────
  await captureModule(page, '05_pizarra_tactica', '/pizarra', null, async (p) => {
    await p.waitForTimeout(2000);
  });

  // ── 6. Tests ─────────────────────────────────────────────────────
  await captureModule(page, '06_tests', '/tests');

  // ── 7. Planificación ─────────────────────────────────────────────
  await captureModule(page, '07_planificacion', '/planificacion');

  // ── 8. IA Generadora ─────────────────────────────────────────────
  await captureModule(page, '08_ia_generadora', '/ia-generadora');

  // ── 9. Intentar abrir biblioteca en IA ───────────────────────────
  await captureModule(page, '09_ia_biblioteca', '/ia-generadora', null, async (p) => {
    try {
      const libBtn = await p.$('button:has-text("Biblioteca"), button:has-text("biblioteca"), [aria-label*="iblioteca"]');
      if (libBtn) {
        await libBtn.click();
        await p.waitForTimeout(1500);
      }
    } catch (e) {}
  });

  // ── 10. Volver al dashboard con sidebar visible ───────────────────
  await captureModule(page, '10_dashboard_sidebar', '/dashboard', null, async (p) => {
    try {
      // Intentar abrir sidebar/menu
      const menuBtn = await p.$('[aria-label*="menu"], [aria-label*="sidebar"], .hamburger, .menu-btn, [data-testid="menu"]');
      if (menuBtn) {
        await menuBtn.click();
        await p.waitForTimeout(1000);
      }
    } catch (e) {}
  });

  // ── 11. Captura móvil (375px - Android) ──────────────────────────
  console.log('\n📱 Capturando versión móvil...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });

  const mobileScreens = [
    { name: '11_mobile_dashboard', url: '/dashboard' },
    { name: '12_mobile_sesiones', url: '/sesiones' },
    { name: '13_mobile_pizarra', url: '/pizarra' },
    { name: '14_mobile_tests', url: '/tests' },
    { name: '15_mobile_ia', url: '/ia-generadora' },
  ];

  for (const s of mobileScreens) {
    try {
      await mobilePage.goto(`${BASE_URL}${s.url}`, { waitUntil: 'networkidle', timeout: 12000 });
      await mobilePage.waitForTimeout(2000);
      await mobilePage.screenshot({ path: join(OUTPUT_DIR, `${s.name}.png`), fullPage: true });
      console.log(`   ✅ Guardado: ${s.name}.png`);
    } catch (e) {
      console.error(`   ❌ Error en ${s.name}: ${e.message}`);
    }
  }

  await browser.close();

  console.log('\n\n🎬 ¡Captura completada!');
  console.log(`📁 Capturas guardadas en: ${OUTPUT_DIR}`);
  console.log('\nArchivos generados:');
  const { readdirSync } = await import('fs');
  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  files.forEach(f => console.log(`  • ${f}`));
}

main().catch(console.error);
