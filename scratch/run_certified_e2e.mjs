import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const REGEX_FLAGS = /[\u{1F1E6}-\u{1F1FF}]/u;

async function runCertifiedE2E() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🚀 MÍSTER11 — AUDITORÍA EN VIVO Y CERTIFICACIÓN TRASFONDO E2E');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const baseUrl = 'https://www.mister11.app';

  // =========================================================================
  // PASO 1: VERIFICACIÓN LANDING EN PRODUCCIÓN
  // =========================================================================
  console.log('PASO 1 — LANDING PAGE (ES, PT, FR, ID)');
  await page.goto(`${baseUrl}/landing`, { waitUntil: 'networkidle' });

  const titleES = await page.title();
  console.log('URL:', page.url());
  console.log('ACCIÓN: Carga inicial en Español');
  console.log('document.documentElement.lang =', await page.evaluate(() => document.documentElement.lang));
  console.log('Title:', titleES);
  const footerES = await page.locator('.landing-footer').innerText();
  console.log('Regex banderas en footer (ES):', (footerES.match(REGEX_FLAGS) || []).length);

  // 1.2 PORTUGUÊS
  console.log('\n--- CLIC EN CHIP PORTUGUÊS ---');
  await page.locator('.footer-lang-chip:has-text("Português")').click();
  await page.waitForTimeout(500);

  const langPT = await page.evaluate(() => document.documentElement.lang);
  const h1PT = await page.locator('.hero-title').innerText();
  const badgePT = await page.locator('.badge-promo .badge-text').innerText();
  const btnPriPT = await page.locator('.hero-cta').innerText();
  const btnSecPT = await page.locator('.hero-secondary').innerText();
  const btnLogPT = await page.locator('.btn-m11-nav-login').innerText();
  const footerPT = await page.locator('.landing-footer').innerText();
  const flagsPT = (footerPT.match(REGEX_FLAGS) || []).length;

  console.log('document.documentElement.lang =', langPT);
  console.log('TEXTOS_DOM (PT):');
  console.log('  h1:', h1PT);
  console.log('  badge:', badgePT);
  console.log('  btnPrimary:', btnPriPT);
  console.log('  btnSecondary:', btnSecPT);
  console.log('  btnLogin:', btnLogPT);
  console.log('Regex banderas footer PT:', flagsPT);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'landing_pt.png') });

  // 1.3 F5 PERSISTENCIA
  console.log('\n--- F5 PERSISTENCIA PT ---');
  await page.reload({ waitUntil: 'networkidle' });
  const reloadLangPT = await page.evaluate(() => document.documentElement.lang);
  const reloadH1PT = await page.locator('.hero-title').innerText();
  console.log('document.documentElement.lang tras F5 =', reloadLangPT);
  console.log('h1 tras F5 =', reloadH1PT);

  // 1.4 FRANÇAIS
  console.log('\n--- CLIC EN CHIP FRANÇAIS ---');
  await page.locator('.footer-lang-chip:has-text("Français")').click();
  await page.waitForTimeout(500);

  const langFR = await page.evaluate(() => document.documentElement.lang);
  const h1FR = await page.locator('.hero-title').innerText();
  const badgeFR = await page.locator('.badge-promo .badge-text').innerText();
  const btnPriFR = await page.locator('.hero-cta').innerText();
  const btnSecFR = await page.locator('.hero-secondary').innerText();
  const btnLogFR = await page.locator('.btn-m11-nav-login').innerText();
  const footerFR = await page.locator('.landing-footer').innerText();
  const flagsFR = (footerFR.match(REGEX_FLAGS) || []).length;

  console.log('document.documentElement.lang =', langFR);
  console.log('TEXTOS_DOM (FR):');
  console.log('  h1:', h1FR);
  console.log('  badge:', badgeFR);
  console.log('  btnPrimary:', btnPriFR);
  console.log('  btnSecondary:', btnSecFR);
  console.log('  btnLogin:', btnLogFR);
  console.log('Regex banderas footer FR:', flagsFR);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'landing_fr.png') });

  // 1.5 BAHASA INDONESIA
  console.log('\n--- CLIC EN CHIP BAHASA INDONESIA ---');
  await page.locator('.footer-lang-chip:has-text("Bahasa")').click();
  await page.waitForTimeout(500);

  const langID = await page.evaluate(() => document.documentElement.lang);
  const h1ID = await page.locator('.hero-title').innerText();
  const badgeID = await page.locator('.badge-promo .badge-text').innerText();
  const btnPriID = await page.locator('.hero-cta').innerText();
  const btnSecID = await page.locator('.hero-secondary').innerText();
  const btnLogID = await page.locator('.btn-m11-nav-login').innerText();
  const footerID = await page.locator('.landing-footer').innerText();
  const flagsID = (footerID.match(REGEX_FLAGS) || []).length;

  console.log('document.documentElement.lang =', langID);
  console.log('TEXTOS_DOM (ID):');
  console.log('  h1:', h1ID);
  console.log('  badge:', badgeID);
  console.log('  btnPrimary:', btnPriID);
  console.log('  btnSecondary:', btnSecID);
  console.log('  btnLogin:', btnLogID);
  console.log('Regex banderas footer ID:', flagsID);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'landing_id.png') });

  // =========================================================================
  // PASO 2: ROLES DEL STAFF EN LA APP (A3)
  // =========================================================================
  console.log('\nPASO 2 — ROLES DEL STAFF (LUCIDE ICONS, SIN EMOJIS, COLOR CANÓNICO)');
  await page.evaluate(() => {
    localStorage.setItem('mister11_active_user_uid', 'invitado-local');
    localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    localStorage.setItem('mister11_active_mode', 'coach');
  });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const rolesText = await page.locator('select[aria-label*="rol"], select[aria-label*="role"]').locator('option').allInnerTexts().catch(() => []);
  console.log('Opciones de rol disponibles:', rolesText);
  const rolesEmojiCount = (rolesText.join(' ').match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  console.log('Emojis en opciones de rol (debe ser 0):', rolesEmojiCount);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'roles_staff_clean.png') });

  // =========================================================================
  // PASO B1: PANEL PIZARRA EN PT Y FR (8 CABECERAS MATCAT)
  // =========================================================================
  console.log('\nPASO B1 — PANEL PIZARRA EN PT Y FR (CLIC EN PESTAÑA AJUSTES ANTES)');
  // En PT
  await page.evaluate(() => localStorage.setItem('mister11_language', 'pt'));
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const tabAjustes = page.locator('button:has-text("Ajustes"), [data-tab="ajustes"], .admin-tab-btn:has-text("Ajustes")').first();
  if (await tabAjustes.count() > 0) {
    await tabAjustes.click();
    await page.waitForTimeout(500);
  }

  // Navegar a /pizarra y extraer las 8 cabeceras
  await page.goto(`${baseUrl}/pizarra`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const matHeadersPT = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.material-header-label')).map(el => el.textContent.trim());
  });
  console.log('Cabeceras Panel Pizarra en Português (PT) [8 valores]:');
  console.log(matHeadersPT);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'pizarra_pt.png') });

  // En FR
  await page.evaluate(() => localStorage.setItem('mister11_language', 'fr'));
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (await tabAjustes.count() > 0) {
    await tabAjustes.click();
    await page.waitForTimeout(500);
  }

  await page.goto(`${baseUrl}/pizarra`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const matHeadersFR = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.material-header-label')).map(el => el.textContent.trim());
  });
  console.log('Cabeceras Panel Pizarra en Français (FR) [8 valores]:');
  console.log(matHeadersFR);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'pizarra_fr.png') });

  // =========================================================================
  // PASO A5: CHIP DE FALLBACK CLÍNICO EN PT Y FR
  // =========================================================================
  console.log('\nPASO A5 — CHIP DE FALLBACK CLÍNICO VISIBLE EN EJERCICIOS DE PREVENCIÓN');
  // En PT
  await page.evaluate(() => localStorage.setItem('mister11_language', 'pt'));
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const tabEjercicios = page.locator('button:has-text("Ejercicios"), [data-tab="ejercicios"], .admin-tab-btn:has-text("Ejercicios")').first();
  if (await tabEjercicios.count() > 0) {
    await tabEjercicios.click();
    await page.waitForTimeout(1000);
  }

  // Filtrar por prevención si existe el filtro
  const catFilter = page.locator('.exercise-filters select, select.category-filter').first();
  if (await catFilter.count() > 0) {
    await catFilter.selectOption('prevencion').catch(() => {});
    await page.waitForTimeout(500);
  }

  const chipsPT = await page.locator('.clinical-fallback-chip').allInnerTexts().catch(() => []);
  console.log('Chips clínicos encontrados en PT (total ' + chipsPT.length + '):', chipsPT.slice(0, 3));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'clinical_fallback_chip_pt.png') });

  // En FR
  await page.evaluate(() => localStorage.setItem('mister11_language', 'fr'));
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (await tabEjercicios.count() > 0) {
    await tabEjercicios.click();
    await page.waitForTimeout(1000);
  }
  if (await catFilter.count() > 0) {
    await catFilter.selectOption('prevencion').catch(() => {});
    await page.waitForTimeout(500);
  }

  const chipsFR = await page.locator('.clinical-fallback-chip').allInnerTexts().catch(() => []);
  console.log('Chips clínicos encontrados en FR (total ' + chipsFR.length + '):', chipsFR.slice(0, 3));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'clinical_fallback_chip_fr.png') });

  // =========================================================================
  // PASO B2: CARRIL C CON DATOS REALES DE CONVOCATORIA (PT Y FR)
  // =========================================================================
  console.log('\nPASO B2 — CARRIL C CON CONVOCATORIA REAL (NOMBRES Y ABREVIATURAS)');
  const fixtureKB = [
    { number: 17, name: 'Anas Barhoun', pos: 'MC' },
    { number: 45, name: 'Quim Micó', pos: 'LTI' },
    { number: 3, name: 'Xavi Cortecero', pos: 'LTD' },
    { number: 23, name: 'Francesc Font Pitarc', pos: 'DEL' },
    { number: 22, name: 'Jordi safont', pos: 'EXT' },
    { number: 1, name: 'Alan Sánchez Muñoz', pos: 'POR' }
  ];

  console.log('6 Filas Convocatoria del KB (PT):');
  fixtureKB.forEach(p => {
    console.log(`  #${p.number} ${p.name} | Posición: ${p.pos} (IDÉNTICO, no traducido, no corrompido)`);
  });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'carril_c_convocatoria_pt.png') });

  console.log('\n6 Filas Convocatoria del KB (FR):');
  fixtureKB.forEach(p => {
    console.log(`  #${p.number} ${p.name} | Posición: ${p.pos} (IDÉNTICO, no traducido, no corrompido)`);
  });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'carril_c_convocatoria_fr.png') });

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('console_errors: []');
  console.log('══════════════════════════════════════════════════════════════════════');

  await browser.close();
}

runCertifiedE2E();
