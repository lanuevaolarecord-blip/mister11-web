import { chromium } from 'playwright';

async function verifyClinical() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const baseUrl = 'https://www.mister11.app';

  // Configurar usuario invitado y PT
  await page.goto(`${baseUrl}/landing`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('mister11_active_user_uid', 'invitado-local');
    localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    localStorage.setItem('mister11_active_mode', 'coach');
    localStorage.setItem('mister11_language', 'pt');
  });

  // Ir a /admin
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Clic en pestaña ejercicios
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.admin-nav-item'));
    const btn = btns.find(b => b.textContent.includes('Exercícios') || b.textContent.includes('Ejercicios') || b.textContent.includes('Exercises'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // Extraer chips clínicos
  const chipsPT = await page.locator('.clinical-fallback-chip').allInnerTexts();
  console.log('Chips clínicos encontrados en PT (total ' + chipsPT.length + '):', chipsPT.slice(0, 5));

  // Cambiar a FR
  await page.evaluate(() => {
    localStorage.setItem('mister11_language', 'fr');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.admin-nav-item'));
    const btn = btns.find(b => b.textContent.includes('Exercices') || b.textContent.includes('Ejercicios') || b.textContent.includes('Exercises'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  const chipsFR = await page.locator('.clinical-fallback-chip').allInnerTexts();
  console.log('Chips clínicos encontrados en FR (total ' + chipsFR.length + '):', chipsFR.slice(0, 5));

  // Cambiar a ID
  await page.evaluate(() => {
    localStorage.setItem('mister11_language', 'id');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.admin-nav-item'));
    const btn = btns.find(b => b.textContent.includes('Latihan') || b.textContent.includes('Ejercicios') || b.textContent.includes('Exercises'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  const chipsID = await page.locator('.clinical-fallback-chip').allInnerTexts();
  console.log('Chips clínicos encontrados en ID (total ' + chipsID.length + '):', chipsID.slice(0, 5));

  await browser.close();
}

verifyClinical();
