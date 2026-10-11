import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const REGEX_FLAGS = /[\u{1F1E6}-\u{1F1FF}]/u;

async function runAudit() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🚀 INICIANDO AUDITORÍA TRASFONDO E2E (PARTE A + PARTE B)');
  console.log('══════════════════════════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const baseUrl = 'https://www.mister11.app';

  try {
    // =========================================================================
    // PARTE A1, A2, A4: LANDING PAGE REACTIVIDAD Y ELIMINACIÓN DE BANDERAS
    // =========================================================================
    console.log('\n--- PASO 1.1: LANDING INICIAL (ES) ---');
    await page.goto(`${baseUrl}/landing`, { waitUntil: 'networkidle' });

    const titleInitial = await page.title();
    console.log('Title inicial:', titleInitial);

    const footerTextInitial = await page.locator('.landing-footer').innerText();
    const flagsFooterInitial = (footerTextInitial.match(REGEX_FLAGS) || []).length;
    console.log('Banderas en Footer inicial (esperado 0):', flagsFooterInitial);

    // PASO 1.2: CLIC EN PORTUGUÊS
    console.log('\n--- PASO 1.2: CLIC EN PORTUGUÊS ---');
    const ptChip = page.locator('.footer-lang-chip:has-text("Português")');
    await ptChip.click();
    await page.waitForTimeout(600);

    const langPT = await page.evaluate(() => document.documentElement.lang);
    const heroTitlePT = await page.locator('.hero-title').innerText();
    const badgePT = await page.locator('.badge-promo .badge-text').innerText();
    const btnPrimaryPT = await page.locator('.hero-cta').innerText();
    const btnSecondaryPT = await page.locator('.hero-secondary').innerText();
    const btnLoginPT = await page.locator('.btn-m11-nav-login').innerText();
    const footerTextPT = await page.locator('.landing-footer').innerText();
    const flagsFooterPT = (footerTextPT.match(REGEX_FLAGS) || []).length;

    console.log('document.documentElement.lang =', langPT);
    console.log('TEXTOS_DOM PT:');
    console.log('  heroTitle:', heroTitlePT);
    console.log('  badge:', badgePT);
    console.log('  btnPrimary:', btnPrimaryPT);
    console.log('  btnSecondary:', btnSecondaryPT);
    console.log('  btnLogin:', btnLoginPT);
    console.log('Regex banderas footer PT:', flagsFooterPT);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_pt.png'), fullPage: false });

    // PASO 1.3: F5 PERSISTENCIA PORTUGUÊS
    console.log('\n--- PASO 1.3: F5 PERSISTENCIA (PORTUGUÊS) ---');
    await page.reload({ waitUntil: 'networkidle' });
    const reloadLangPT = await page.evaluate(() => document.documentElement.lang);
    const reloadHeroTitlePT = await page.locator('.hero-title').innerText();
    console.log('document.documentElement.lang tras F5 =', reloadLangPT);
    console.log('heroTitle tras F5 =', reloadHeroTitlePT);

    // PASO 1.4: CLIC EN FRANÇAIS
    console.log('\n--- PASO 1.4: CLIC EN FRANÇAIS ---');
    const frChip = page.locator('.footer-lang-chip:has-text("Français")');
    await frChip.click();
    await page.waitForTimeout(600);

    const langFR = await page.evaluate(() => document.documentElement.lang);
    const heroTitleFR = await page.locator('.hero-title').innerText();
    const badgeFR = await page.locator('.badge-promo .badge-text').innerText();
    const btnPrimaryFR = await page.locator('.hero-cta').innerText();
    const btnLoginFR = await page.locator('.btn-m11-nav-login').innerText();
    const footerTextFR = await page.locator('.landing-footer').innerText();
    const flagsFooterFR = (footerTextFR.match(REGEX_FLAGS) || []).length;

    console.log('document.documentElement.lang =', langFR);
    console.log('TEXTOS_DOM FR:');
    console.log('  heroTitle:', heroTitleFR);
    console.log('  badge:', badgeFR);
    console.log('  btnPrimary:', btnPrimaryFR);
    console.log('  btnLogin:', btnLoginFR);
    console.log('Regex banderas footer FR:', flagsFooterFR);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_landing_fr.png'), fullPage: false });

    // PASO 1.5: CLIC EN BAHASA INDONESIA
    console.log('\n--- PASO 1.5: CLIC EN BAHASA INDONESIA ---');
    const idChip = page.locator('.footer-lang-chip:has-text("Bahasa")');
    await idChip.click();
    await page.waitForTimeout(600);

    const langID = await page.evaluate(() => document.documentElement.lang);
    const heroTitleID = await page.locator('.hero-title').innerText();
    const badgeID = await page.locator('.badge-promo .badge-text').innerText();
    const btnPrimaryID = await page.locator('.hero-cta').innerText();
    const btnLoginID = await page.locator('.btn-m11-nav-login').innerText();
    const footerTextID = await page.locator('.landing-footer').innerText();
    const flagsFooterID = (footerTextID.match(REGEX_FLAGS) || []).length;

    console.log('document.documentElement.lang =', langID);
    console.log('TEXTOS_DOM ID:');
    console.log('  heroTitle:', heroTitleID);
    console.log('  badge:', badgeID);
    console.log('  btnPrimary:', btnPrimaryID);
    console.log('  btnLogin:', btnLoginID);
    console.log('Regex banderas footer ID:', flagsFooterID);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_landing_id.png'), fullPage: false });

    // =========================================================================
    // INICIAR SESIÓN LOCAL / MOCK PARA AUDITORÍA DE APP
    // =========================================================================
    console.log('\n--- CONFIGURANDO SESIÓN DE AUDITORÍA CON FIXTURE CANÓNICO ---');
    await page.goto(`${baseUrl}/landing`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      localStorage.setItem('mister11_active_coach_team', 'team-invitado');
      localStorage.setItem('mister11_active_mode', 'coach');
      localStorage.setItem('mister11_language', 'pt');
    });

    // =========================================================================
    // PASO 2: ROLES DEL STAFF SIN EMOJIS (A3, A4)
    // =========================================================================
    console.log('\n--- PASO 2: ROLES DEL STAFF EN LA APP ---');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const appTitle = await page.title();
    console.log('Title en app:', appTitle);

    // Opciones del selector de rol
    const roleSelect = page.locator('select[aria-label*="rol"], select[aria-label*="role"]').first();
    let roleTexts = [];
    if (await roleSelect.count() > 0) {
      roleTexts = await roleSelect.locator('option').allInnerTexts();
    }
    console.log('Opciones de rol en Header:', roleTexts);
    const roleEmojiMatch = (roleTexts.join(' ').match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    console.log('Regex emojis en roles (esperado 0):', roleEmojiMatch);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_staff_roles.png'), fullPage: false });

    // =========================================================================
    // PARTE B - B1: PANEL PIZARRA EN PT Y FR CON CLIC EN AJUSTES
    // =========================================================================
    console.log('\n--- PASO B1: PANEL PIZARRA EN PT Y FR (CLIC EN AJUSTES ANTES) ---');
    await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // HACER CLIC en la pestaña "Ajustes" ANTES de leer el selector
    console.log('Haciendo clic en la pestaña "Ajustes" en /admin...');
    const tabAjustes = page.locator('button:has-text("Ajustes"), [data-tab="ajustes"], .admin-tab-btn:has-text("Ajustes")').first();
    if (await tabAjustes.count() > 0) {
      await tabAjustes.click();
      await page.waitForTimeout(600);
    }

    // Seleccionar Português en el selector de idioma de Ajustes
    const adminLangSelect = page.locator('select.admin-select-input, select[aria-label*="idioma"], select[aria-label*="language"]').first();
    if (await adminLangSelect.count() > 0) {
      console.log('Conmutando idioma a Português...');
      await adminLangSelect.selectOption({ label: 'Português (Brasil)' }).catch(async () => {
        await adminLangSelect.selectOption('Português (Brasil)');
      });
      await page.waitForTimeout(800);
    }

    // En /pizarra extraer las 8 cabeceras en PT
    console.log('Navegando a /pizarra para extraer las 8 cabeceras en PT...');
    await page.goto(`${baseUrl}/pizarra`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const headersPT = await page.evaluate(() => {
      // Extrae títulos de secciones de herramientas y paneles de pizarra
      const titles = Array.from(document.querySelectorAll('.accordion-header-title, .pizarra-tool-group h4, .pizarra-tab-label, .board-header-section, .tool-section-title, .accordion-title, .pizarra-panel-title'));
      return titles.map(el => el.textContent.trim()).filter(Boolean);
    });
    console.log('Cabeceras /pizarra en PT (total ' + headersPT.length + '):', headersPT);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_pizarra_pt.png'), fullPage: false });

    // Volver a /admin, clic en Ajustes, y seleccionar Français
    console.log('Volviendo a /admin para conmutar a Français...');
    await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    if (await tabAjustes.count() > 0) {
      await tabAjustes.click();
      await page.waitForTimeout(600);
    }

    if (await adminLangSelect.count() > 0) {
      console.log('Conmutando idioma a Français...');
      await adminLangSelect.selectOption({ label: 'Français (FR)' }).catch(async () => {
        await adminLangSelect.selectOption('Français (FR)');
      });
      await page.waitForTimeout(800);
    }

    // En /pizarra extraer las 8 cabeceras en FR
    console.log('Navegando a /pizarra para extraer las 8 cabeceras en FR...');
    await page.goto(`${baseUrl}/pizarra`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const headersFR = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.accordion-header-title, .pizarra-tool-group h4, .pizarra-tab-label, .board-header-section, .tool-section-title, .accordion-title, .pizarra-panel-title'));
      return titles.map(el => el.textContent.trim()).filter(Boolean);
    });
    console.log('Cabeceras /pizarra en FR (total ' + headersFR.length + '):', headersFR);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_pizarra_fr.png'), fullPage: false });

    // =========================================================================
    // PARTE A5: VERIFICACIÓN DEL CHIP DE FALLBACK CLÍNICO (NORDIC / COPENHAGEN)
    // =========================================================================
    console.log('\n--- PASO A5: CHIP DE FALLBACK CLÍNICO VISIBLE EN PT/FR/ID ---');
    // Navegar a sesiones o catálogo de ejercicios
    await page.goto(`${baseUrl}/sesiones`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Clic en pestaña Biblioteca / Ejercicios si existe
    const biblioTab = page.locator('button:has-text("Biblioteca"), button:has-text("Ejercicios"), button:has-text("Exercises"), [data-tab="ejercicios"]').first();
    if (await biblioTab.count() > 0) {
      await biblioTab.click();
      await page.waitForTimeout(800);
    }

    // Buscar Nordic o Copenhagen o filtro prevención
    const prevFilter = page.locator('select.category-filter, select[value="prevencion"]').first();
    if (await prevFilter.count() > 0) {
      await prevFilter.selectOption('prevencion').catch(() => {});
      await page.waitForTimeout(600);
    }

    const clinicalChips = await page.locator('.clinical-fallback-chip').allInnerTexts().catch(() => []);
    console.log('Chips clínicos encontrados en UI:', clinicalChips);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_clinical_fallback_chip_visible.png'), fullPage: false });

    // =========================================================================
    // PARTE B - B2: CARRIL C CON DATOS REALES DE CONVOCATORIA EN PT Y FR
    // =========================================================================
    console.log('\n--- PASO B2: CARRIL C CONVOCATORIA REAL (NOMBRES Y ABREVIATURAS) ---');
    // Cargar fixture canónico de convocatoria en el estado de localStorage / indexedDB
    await page.evaluate(() => {
      const realPlayers = [
        { id: 'p-17', name: 'Anas Barhoun', dorsal: 17, number: 17, position: 'MC', posicion: 'MC' },
        { id: 'p-45', name: 'Quim Micó', dorsal: 45, number: 45, position: 'LTI', posicion: 'LTI' },
        { id: 'p-3', name: 'Xavi Cortecero', dorsal: 3, number: 3, position: 'LTD', posicion: 'LTD' },
        { id: 'p-23', name: 'Francesc Font Pitarc', dorsal: 23, number: 23, position: 'DEL', posicion: 'DEL' },
        { id: 'p-22', name: 'Jordi safont', dorsal: 22, number: 22, position: 'EXT', posicion: 'EXT' },
        { id: 'p-1', name: 'Alan Sánchez Muñoz', dorsal: 1, number: 1, position: 'POR', posicion: 'POR' },
      ];
      localStorage.setItem('mister11_fixture_convocatoria', JSON.stringify(realPlayers));
    });

    await page.goto(`${baseUrl}/partidos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const convRows = await page.locator('.convocado-row, .convocatoria-player-item, .player-row-convocatoria, .roster-item').allInnerTexts().catch(() => []);
    console.log('Filas de convocatoria obtenidas:', convRows.slice(0, 6));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_convocatoria_carril_c.png'), fullPage: false });

    console.log('\n--- RESUMEN FINAL ---');
    console.log('console_errors:', consoleErrors);

  } catch (err) {
    console.error('Error durante la ejecución:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
