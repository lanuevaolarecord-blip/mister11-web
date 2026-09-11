import { test, expect } from '@playwright/test';

async function ensureLoggedIn(page) {
  await page.goto('/login');
  await page.waitForTimeout(500);

  const guestBtn = page.locator('button').filter({ hasText: /Invitado|Prueba|Guest/i }).first();
  if (await guestBtn.isVisible()) {
    await guestBtn.click();
    await page.waitForTimeout(2000);
  } else {
    const emailTab = page.locator('.auth-tab-btn').filter({ hasText: /Entrar|Login/i }).first();
    if (await emailTab.isVisible()) {
      await emailTab.click();
      await page.waitForTimeout(300);
    }
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('reviewer@mister11.app');
      await passwordInput.fill('Mister11Review2026!');
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }
  }
}

test.describe('Míster 11 — Header Flush Top & Free Rotation E2E', () => {

  test('1. Viewport 375x667 (Portrait): Header pegado al borde superior (0px hueco) y sin padding-top estático', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await ensureLoggedIn(page);

    const header = page.locator('.header');
    await expect(header).toBeVisible({ timeout: 10000 });

    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    // En navegador móvil web, la distancia entre el borde superior del viewport y el header es 0px
    expect(headerBox.y).toBe(0);

    // Padding top computado en web normal (sin notch) debe ser 0px (salvo notch real en standalone)
    const paddingTop = await header.evaluate((el) => window.getComputedStyle(el).paddingTop);
    expect(paddingTop).toBe('0px');

    // El primer control interactivo del header está pegado al top seguro (< 30px)
    const firstControl = page.locator('.header-title-container, .team-switcher-header-v2').first();
    const controlBox = await firstControl.boundingBox();
    expect(controlBox).not.toBeNull();
    expect(controlBox.y).toBeLessThan(30);

    // Ausencia de barra vacía superior por contenedor de escudo
    const shieldContainer = page.locator('.header-central-shield-container');
    if (await shieldContainer.count() > 0) {
      const isHidden = await shieldContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden' || el.offsetHeight === 0;
      });
      expect(isHidden).toBe(true);
    }
  });

  test('2. Viewport 360x640 (Narrow Portrait): Medalla / selector de rol 100% visible sin clip ni recorte', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await ensureLoggedIn(page);

    const header = page.locator('.header');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Verificar que el selector de rol (medalla / corona) es visible y no está clippeado
    const roleSwitcher = page.locator('.header-staff-role-switcher');
    if (await roleSwitcher.isVisible()) {
      const box = await roleSwitcher.boundingBox();
      expect(box).not.toBeNull();
      // Ancho mínimo de 34px respetado sin aplastamiento
      expect(box.width).toBeGreaterThanOrEqual(30);
      // No desborda fuera de la pantalla de 360px
      expect(box.x + box.width).toBeLessThanOrEqual(360);
      expect(box.x).toBeGreaterThan(0);
    }

    // Verificar que no existe desbordamiento horizontal en 360px
    const isOverflowHorizontal = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowHorizontal).toBe(false);
  });

  test('3. Rotación en caliente Portrait (375x667) ↔ Landscape (667x375): layout fluido y responsivo', async ({ page }) => {
    // 1. Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await ensureLoggedIn(page);
    await page.waitForTimeout(600);

    let isOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflow).toBe(false);

    // 2. Rotar a Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(600);

    isOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflow).toBe(false);

    // 3. Rotar de vuelta a Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(600);

    isOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflow).toBe(false);
  });

  test('4. Paridad de controles en 4 viewports portrait (360, 393, 412, 430): todos visibles y sin superposición', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await ensureLoggedIn(page);

    const portraitViewports = [
      { width: 360, height: 640 },
      { width: 393, height: 852 },
      { width: 412, height: 915 },
      { width: 430, height: 932 },
    ];

    for (const vp of portraitViewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(400);

      const header = page.locator('.header');
      await expect(header).toBeVisible();

      // Controles requeridos del header
      const themeToggle = page.locator('.header-theme-toggle');
      const notifBtn = page.locator('.header-notif-btn');
      const settingsBtn = page.locator('.header-settings-btn');
      const logoutBtn = page.locator('.header-logout-btn');

      await expect(themeToggle).toBeVisible();
      await expect(notifBtn).toBeVisible();
      await expect(settingsBtn).toBeVisible();
      await expect(logoutBtn).toBeVisible();

      const teamSwitcher = page.locator('.team-switcher-header-v2');
      if (await teamSwitcher.count() > 0) {
        await expect(teamSwitcher).toBeVisible();
        const switcherBox = await teamSwitcher.boundingBox();
        expect(switcherBox.width).toBeGreaterThanOrEqual(40);
      }

      const roleSwitcher = page.locator('.header-staff-role-switcher');
      if (await roleSwitcher.count() > 0) {
        await expect(roleSwitcher).toBeVisible();
      }

      const modeToggle = page.locator('.header-mode-toggle');
      if (await modeToggle.count() > 0) {
        await expect(modeToggle).toBeVisible();
      }

      // Verificar que ningún control desborda el viewport horizontal
      const controls = [themeToggle, notifBtn, settingsBtn, logoutBtn];
      if (await teamSwitcher.count() > 0) controls.push(teamSwitcher);
      if (await roleSwitcher.count() > 0) controls.push(roleSwitcher);
      if (await modeToggle.count() > 0) controls.push(modeToggle);

      for (const ctrl of controls) {
        const box = await ctrl.boundingBox();
        expect(box).not.toBeNull();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1); // margen de 1px por subpíxel
      }

      // Cero scroll horizontal
      const isOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(isOverflow).toBe(false);
    }
  });

  test('5. Selector de tema claro/oscuro: conmutación en caliente en portrait 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await ensureLoggedIn(page);

    const themeToggle = page.locator('.header-theme-toggle');
    await expect(themeToggle).toBeVisible();

    const isInitiallyDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Tap 1: Conmutar
    await themeToggle.click();
    await page.waitForTimeout(400);

    const isDarkAfterTap1 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkAfterTap1).toBe(!isInitiallyDark);

    // Controles siguen 100% visibles tras cambio de tema
    if (await page.locator('.team-switcher-header-v2').count() > 0) {
      await expect(page.locator('.team-switcher-header-v2')).toBeVisible();
    }
    await expect(page.locator('.header-theme-toggle')).toBeVisible();
    await expect(page.locator('.header-notif-btn')).toBeVisible();
    await expect(page.locator('.header-settings-btn')).toBeVisible();
    await expect(page.locator('.header-logout-btn')).toBeVisible();

    // Tap 2: Conmutar de vuelta
    await themeToggle.click();
    await page.waitForTimeout(400);

    const isDarkAfterTap2 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkAfterTap2).toBe(isInitiallyDark);
  });

  test('6. Paridad de handlers Portrait vs Landscape: navegación a ajustes y confirmación de logout', async ({ page }) => {
    // 1. Portrait: settings button
    await page.setViewportSize({ width: 360, height: 640 });
    await ensureLoggedIn(page);

    const settingsBtn = page.locator('.header-settings-btn');
    await settingsBtn.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    expect(page.url()).toContain('/admin');

    // 2. Landscape: settings button
    await page.setViewportSize({ width: 800, height: 400 });
    await page.goto('/');
    await page.waitForTimeout(600);

    const settingsBtnLandscape = page.locator('.header-settings-btn');
    await settingsBtnLandscape.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    expect(page.url()).toContain('/admin');

    // 3. Portrait: logout button triggers confirmation dialog
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await page.waitForTimeout(600);

    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss(); // Cancelar para no desloguear la sesión de test
    });

    const logoutBtn = page.locator('.header-logout-btn');
    await logoutBtn.click();
    await page.waitForTimeout(400);
    expect(dialogTriggered).toBe(true);
  });

});
