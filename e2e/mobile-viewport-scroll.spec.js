import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE (375x667)', width: 375, height: 667 },
  { name: 'iPad (768x1024)', width: 768, height: 1024 }
];

VIEWPORTS.forEach(({ name, width, height }) => {
  test.describe(`Mobile Viewport & Scroll Tests - ${name}`, () => {
    test.use({ viewport: { width, height } });

    test('Login: página scrolleable y CTA alcanzable', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Míster11/i);

      const loginCard = page.locator('.login-card');
      await expect(loginCard).toBeVisible();

      // Cambiar a modo registro con email
      const registerTab = page.locator('.auth-tab-btn').filter({ hasText: /Registro|Register/i });
      await expect(registerTab).toBeVisible();
      await registerTab.click();
      await page.waitForTimeout(300);

      // Verificar que el botón de envío sea alcanzable y visible o scrolleable
      const submitBtn = page.locator('.btn-submit-auth').first();
      await expect(submitBtn).toBeVisible();

      const btnBox = await submitBtn.boundingBox();
      expect(btnBox).not.toBeNull();
      expect(btnBox.height).toBeGreaterThanOrEqual(44); // Touch target móvil mínimo
    });

    test('JoinTeam: flujos Jugador y Padre con scroll y CTA alcanzable', async ({ page }) => {
      await page.goto('/join-team');
      
      const card = page.locator('.login-card, .join-team-container, .login-container').first();
      await expect(card).toBeVisible();

      // Verificar que el scroll vertical esté habilitado en document o login-page
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight || document.body.scrollHeight);
      expect(scrollHeight).toBeGreaterThanOrEqual(height - 100);

      // Si existe selector de rol, probar cambio a padre/tutor
      const parentBtn = page.locator('button').filter({ hasText: /padre|parent/i }).first();
      if (await parentBtn.count() > 0) {
        await parentBtn.click();
        await page.waitForTimeout(300);
      }

      const submitBtn = page.locator('button[type="submit"], .btn-submit-auth').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.scrollIntoViewIfNeeded();
        await expect(submitBtn).toBeVisible();
        const btnBox = await submitBtn.boundingBox();
        expect(btnBox.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('Demo / Dashboard: renderiza sin recortes de viewport', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(800);

      // Comprobar que no haya scrollbar horizontal roto
      const isOverflowHorizontal = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(isOverflowHorizontal).toBe(false);
    });
  });
});
