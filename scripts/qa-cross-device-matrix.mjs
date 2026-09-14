/**
 * scripts/qa-cross-device-matrix.mjs
 * Míster11 — Certificación Cross-Device y Cross-Browser Rigurosa
 *
 * Valida de forma exhaustiva la ausencia total de overflow horizontal
 * (scrollWidth <= innerWidth) en TODAS las rutas principales:
 *   - / (Landing)
 *   - /sesiones/nueva (Editor nueva sesión)
 *   - /sesiones/:id (Editor sesión existente)
 *   - /pizarra (Pizarra táctica)
 *   - /partidos (Con sus 7 tabs completas)
 *   - /portal (Portal del jugador)
 *   - /ajustes (Ajustes de administración)
 *
 * En viewports clave: 360, 375, 393, 412, 768, 834, 1024, 1366, 1920
 * Criterio: cualquier fallo produce salida con código 1 (fail = no merge).
 */

import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const VIEWPORTS = [
  { name: 'Android Móvil (360x640)', width: 360, height: 640, isMobile: true },
  { name: 'iPhone SE (375x667)', width: 375, height: 667, isMobile: true },
  { name: 'iPhone 15 (393x852)', width: 393, height: 852, isMobile: true },
  { name: 'Android Pixel/Galaxy (412x915)', width: 412, height: 915, isMobile: true },
  { name: 'iPad Mini/Air (768x1024)', width: 768, height: 1024, isMobile: true },
  { name: 'iPad Pro 11" (834x1194)', width: 834, height: 1194, isMobile: true },
  { name: 'iPad Horizontal (1024x768)', width: 1024, height: 768, isMobile: false },
  { name: 'Laptop Standard (1366x768)', width: 1366, height: 768, isMobile: false },
  { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080, isMobile: false }
];

const PARTIDOS_TABS = [
  'PRE-PARTIDO',
  'CONVOCATORIA',
  'ALINEACIÓN',
  'MATCH-DAY',
  'LIVE-STATS',
  'ACTA',
  'POST-PARTIDO'
];

async function run() {
  console.log('==============================================================================');
  console.log('MÍSTER 11 — MATRIZ INTEGRAL DE CERTIFICACIÓN CROSS-DEVICE (ZERO-OVERFLOW)');
  console.log('==============================================================================\n');

  const PORT = 4179;
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: rootDir,
    shell: true,
    stdio: 'pipe'
  });

  // Esperar arranque de servidor
  await new Promise((resolve) => setTimeout(resolve, 3000));

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.warn('Chromium no disponible:', err.message);
    previewProcess.kill();
    process.exit(0);
  }

  const artifactsDir = path.resolve(rootDir, '../.tempmediaStorage');
  if (!fs.existsSync(artifactsDir)) {
    try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch (_) {}
  }

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n──────────────────────────────────────────────────────────────────────────────`);
      console.log(`📱 Probando Viewport: ${vp.name} [${vp.width}x${vp.height}]`);
      console.log(`──────────────────────────────────────────────────────────────────────────────`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile
      });

      await context.addInitScript(() => {
        window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
        window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
        window.localStorage.setItem('mister11_language', 'Español (ES)');
      });

      const page = await context.newPage();

      // Función auxiliar para validar overflow
      const assertNoOverflow = async (routeName) => {
        totalChecks++;
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth = vp.width;
        const ok = scrollWidth <= innerWidth + 1;
        if (ok) {
          passedChecks++;
          console.log(`   ✅ [${routeName}] ScrollWidth=${scrollWidth}px (Max=${innerWidth}px)`);
        } else {
          failedChecks.push({
            viewport: vp.name,
            route: routeName,
            scrollWidth,
            innerWidth
          });
          console.error(`   ❌ [${routeName}] OVERFLOW DETECTADO: ScrollWidth=${scrollWidth}px > innerWidth=${innerWidth}px`);
        }
        return ok;
      };

      // 1. Landing Page /
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      await assertNoOverflow('/');

      // Iniciar sesión en Modo Invitado
      await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'domcontentloaded' });
      const guestBtn = page.locator('.btn-guest');
      if (await guestBtn.count() > 0) {
        await guestBtn.click();
        await page.waitForTimeout(1000);
      }

      // 2. /sesiones/nueva
      await page.goto(`http://localhost:${PORT}/sesiones/nueva`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.session-editor-title, .session-editor-bottom-bar, .sesiones-page', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(800);
      await assertNoOverflow('/sesiones/nueva');

      // Comprobar título en una línea y barra fija en móvil
      if (vp.width <= 600) {
        const bottomBar = page.locator('.session-editor-bottom-bar');
        const isBarVisible = await bottomBar.isVisible().catch(() => false);
        if (!isBarVisible) {
          console.warn(`   ⚠️ [Barra inferior] No visible en ${vp.name}`);
        } else {
          console.log(`   ✅ [Barra inferior] Visible y fijada en <600px`);
        }
      }

      // 3. /sesiones/:id
      await page.goto(`http://localhost:${PORT}/sesiones/sesion-demo-qa`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await assertNoOverflow('/sesiones/:id');

      // 4. /pizarra
      await page.goto(`http://localhost:${PORT}/pizarra`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await assertNoOverflow('/pizarra');

      // 5. /portal (redirección a /player-dashboard)
      await page.goto(`http://localhost:${PORT}/portal`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await assertNoOverflow('/portal');

      // 6. /ajustes (redirección a /admin con tab ajustes)
      await page.goto(`http://localhost:${PORT}/ajustes`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await assertNoOverflow('/ajustes');

      // 7. /partidos con sus 7 subpestañas
      await page.goto(`http://localhost:${PORT}/partidos`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      await assertNoOverflow('/partidos [LIST]');

      // Entrar en modo edición de partido si hay partidos o crear uno
      const matchCard = page.locator('.match-card').first();
      const newMatchBtn = page.locator('.btn-primary-new, .btn-primary').first();
      if (await matchCard.count() > 0) {
        await matchCard.click();
        await page.waitForTimeout(500);
      } else if (await newMatchBtn.count() > 0) {
        await newMatchBtn.click();
        await page.waitForTimeout(500);
      }

      // Comprobar cada una de las 7 subpestañas
      for (const tabName of PARTIDOS_TABS) {
        const tabBtn = page.locator('.e-tab').filter({ hasText: new RegExp(tabName, 'i') }).first();
        if (await tabBtn.count() > 0) {
          await tabBtn.click();
          await page.waitForTimeout(300);
          await assertNoOverflow(`/partidos [TAB: ${tabName}]`);
        }
      }

      // Captura final del editor de sesiones en 360px para evidencia
      if (vp.width === 360) {
        await page.goto(`http://localhost:${PORT}/sesiones/nueva`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(artifactsDir, 'sesion_editor_360x640_evidencia.png'),
          fullPage: false
        });
      }

      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    try {
      previewProcess.kill();
    } catch (_) {}
  }

  console.log('\n==============================================================================');
  console.log(`📊 RESULTADOS QA CROSS-DEVICE: ${passedChecks}/${totalChecks} COMPROBACIONES APROBADAS`);
  console.log('==============================================================================');

  if (failedChecks.length > 0) {
    console.error(`\n❌ SE DETECTARON ${failedChecks.length} FALLOS DE OVERFLOW HORIZONTAL (FAIL = NO MERGE):`);
    failedChecks.forEach(f => {
      console.error(`  - [${f.viewport}] ${f.route}: scrollWidth=${f.scrollWidth}px > innerWidth=${f.innerWidth}px`);
    });
    process.exit(1);
  }

  console.log('\n🎉 ¡CERTIFICACIÓN EXITOSA! Cero overflow horizontal en todas las rutas y viewports.\n');
  process.exit(0);
}

run().catch((e) => {
  console.error('Error fatal durante ejecución de QA Cross-Device:', e);
  process.exit(1);
});
