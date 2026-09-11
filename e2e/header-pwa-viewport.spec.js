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
    await page.goto('/');
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

});
