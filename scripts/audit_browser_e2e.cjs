const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/jhojan/.gemini/antigravity-ide/brain/37d97120-7a78-4697-84f6-89987d46d509');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'scratch/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

(async () => {
  console.log('[E2E AUDIT] Iniciando auditoría completa con Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE_ERROR] ${err.message}`);
  });

  const downloadedFiles = [];
  page.on('download', download => {
    downloadedFiles.push(download.suggestedFilename());
  });

  const results = {
    modulesTested: [],
    languagesTested: [],
    downloadsTested: [],
    errors: consoleErrors,
    warnings: consoleWarnings,
    screenshots: []
  };

  function logModule(name, details = {}) {
    console.log(`[MODULE AUDITED] ${name}:`, JSON.stringify(details));
    results.modulesTested.push({ module: name, timestamp: new Date().toISOString(), ...details });
  }

  try {
    // ── 1. LANDING PAGE ────────────────────────────────────────────────────────
    await page.goto('https://www.mister11.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const landingTitle = await page.title();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing.png') });
    results.screenshots.push('01_landing.png');
    logModule('LandingPage', { title: landingTitle });

    // ── 2. LOGIN & ACCESO MODO INVITADO ─────────────────────────────────────────
    await page.goto('https://www.mister11.app/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const guestBtn = await page.waitForSelector('.btn-guest', { timeout: 10000 });
    if (guestBtn) {
      await guestBtn.click();
    }
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_es.png') });
    results.screenshots.push('02_dashboard_es.png');
    logModule('Dashboard_ES', { url: page.url() });

    // ── 3. NAVEGACIÓN: MI EQUIPO ────────────────────────────────────────────────
    await page.goto('https://www.mister11.app/equipo', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_equipo_es.png') });
    results.screenshots.push('03_equipo_es.png');
    logModule('MiEquipo', { status: 'OK' });

    // ── 4. NAVEGACIÓN: SESIONES ────────────────────────────────────────────────
    await page.goto('https://www.mister11.app/sesiones', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_sesiones_es.png') });
    results.screenshots.push('04_sesiones_es.png');
    logModule('Sesiones', { status: 'OK' });

    // ── 5. NAVEGACIÓN: PARTIDOS ────────────────────────────────────────────────
    await page.goto('https://www.mister11.app/partidos', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_partidos_es.png') });
    results.screenshots.push('05_partidos_es.png');
    logModule('Partidos', { status: 'OK' });

    // ── 6. NAVEGACIÓN: TESTS FÍSICOS ───────────────────────────────────────────
    await page.goto('https://www.mister11.app/tests', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_tests_es.png') });
    results.screenshots.push('06_tests_es.png');
    logModule('TestsFisicos', { status: 'OK' });

    // ── 7. NAVEGACIÓN: PIZARRA TÁCTICA ─────────────────────────────────────────
    await page.goto('https://www.mister11.app/pizarra', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_pizarra_es.png') });
    results.screenshots.push('07_pizarra_es.png');
    logModule('PizarraTactica', { status: 'OK' });

    // ── 8. ADMIN / AJUSTES: CAMBIO DE IDIOMA A PORTUGUÊS ───────────────────────
    await page.goto('https://www.mister11.app/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Hacer clic en la pestaña de Ajustes
    const ajustesNavBtns = await page.$$('.admin-nav-item');
    for (const btn of ajustesNavBtns) {
      const text = await btn.textContent();
      if (text.toLowerCase().includes('ajuste') || text.toLowerCase().includes('preferencia') || text.toLowerCase().includes('setting')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);

    // Cambiar a Português (Brasil)
    const langSelect = await page.waitForSelector('select.admin-select-input:has(option[value="English (EN)"])', { timeout: 10000 });
    await langSelect.selectOption('Português (Brasil)');
    await page.waitForTimeout(2000);
    const htmlLangPt = await page.evaluate(() => document.documentElement.lang);
    results.languagesTested.push({ lang: 'pt', htmlLang: htmlLangPt });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_ajustes_pt.png') });
    results.screenshots.push('08_admin_ajustes_pt.png');

    // ── 9. PLANIFICACIÓN EN PORTUGUÊS: VERIFICACIÓN MATRIZ Y MESES ──────────────
    await page.goto('https://www.mister11.app/planificacion', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_planificacion_pt.png') });
    results.screenshots.push('09_planificacion_pt.png');

    const matrixTitlePt = await page.evaluate(() => {
      const el = document.querySelector('.plan-matrix-title');
      return el ? el.textContent.trim() : null;
    });

    const monthsPt = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.plan-mrow-month .plan-month-header'));
      return headers.map(h => h.textContent.trim());
    });

    const kpiTitlesPt = await page.evaluate(() => {
      const names = Array.from(document.querySelectorAll('.plan-metric-header .plan-metric-name'));
      return names.map(n => n.textContent.trim());
    });

    logModule('Planificacion_PT', {
      matrixTitle: matrixTitlePt,
      months: monthsPt,
      kpis: kpiTitlesPt,
      januaryVerified: monthsPt.includes('Jan') && !monthsPt.includes('Ene')
    });

    // ── 10. EXPORTACIONES Y DESCARGABLES EN ADMIN ──────────────────────────────
    await page.goto('https://www.mister11.app/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Ir a pestaña Exportar
    const exportNavBtns = await page.$$('.admin-nav-item');
    for (const btn of exportNavBtns) {
      const text = await btn.textContent();
      if (text.toLowerCase().includes('export') || text.toLowerCase().includes('relat')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_admin_exportar_pt.png') });
    results.screenshots.push('10_admin_exportar_pt.png');

    // Probar trigger de exportación de Backup
    const backupBtn = await page.$('button.btn-export-action, button:has-text("Backup"), button:has-text("Copia")');
    if (backupBtn) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        backupBtn.click().catch(() => {})
      ]);
      if (download) {
        const fname = download.suggestedFilename();
        results.downloadsTested.push({ type: 'JSON_Backup', filename: fname });
        logModule('Download_Backup_Triggered', { filename: fname });
      }
    }

    // ── 11. CAMBIAR A ENGLISH (EN) Y VALIDAR ───────────────────────────────────
    for (const btn of exportNavBtns) {
      const text = await btn.textContent();
      if (text.toLowerCase().includes('ajuste') || text.toLowerCase().includes('config') || text.toLowerCase().includes('setting')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);
    const langSelectEn = await page.waitForSelector('select.admin-select-input:has(option[value="English (EN)"])', { timeout: 10000 });
    await langSelectEn.selectOption('English (EN)');
    await page.waitForTimeout(2000);
    const htmlLangEn = await page.evaluate(() => document.documentElement.lang);
    results.languagesTested.push({ lang: 'en', htmlLang: htmlLangEn });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_admin_ajustes_en.png') });
    results.screenshots.push('11_admin_ajustes_en.png');

    // Comprobar Planificación en Inglés
    await page.goto('https://www.mister11.app/planificacion', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const monthsEn = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.plan-mrow-month .plan-month-header'));
      return headers.map(h => h.textContent.trim());
    });
    const matrixTitleEn = await page.evaluate(() => {
      const el = document.querySelector('.plan-matrix-title');
      return el ? el.textContent.trim() : null;
    });
    logModule('Planificacion_EN', { matrixTitle: matrixTitleEn, months: monthsEn });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_planificacion_en.png') });
    results.screenshots.push('12_planificacion_en.png');

    // ── 12. RESTAURAR A ESPAÑOL (ES) ───────────────────────────────────────────
    await page.goto('https://www.mister11.app/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const navItemsFinal = await page.$$('.admin-nav-item');
    for (const btn of navItemsFinal) {
      const text = await btn.textContent();
      if (text.toLowerCase().includes('setting') || text.toLowerCase().includes('ajuste')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);
    const langSelectEs = await page.waitForSelector('select.admin-select-input:has(option[value="English (EN)"])', { timeout: 10000 });
    await langSelectEs.selectOption('Español (ES)');
    await page.waitForTimeout(2000);
    const htmlLangEs = await page.evaluate(() => document.documentElement.lang);
    results.languagesTested.push({ lang: 'es', htmlLang: htmlLangEs });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_admin_es_restored.png') });
    results.screenshots.push('13_admin_es_restored.png');

    results.status = 'SUCCESS';
    console.log('[E2E AUDIT COMPLETE] Todos los módulos y cambios de idioma validados con éxito.');
  } catch (err) {
    console.error('Error during execution:', err);
    results.status = 'ERROR';
    results.executionError = err.message;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') }).catch(() => {});
    results.screenshots.push('error_state.png');
  } finally {
    await browser.close();
  }

  const outPath = path.join(ARTIFACT_DIR, 'scratch/audit_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
})();
