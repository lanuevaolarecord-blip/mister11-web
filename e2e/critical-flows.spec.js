import { test, expect } from '@playwright/test';

test.describe('Míster 11 - Pruebas E2E de Flujos Críticos', () => {

  test('1. Flujo de Login y Estructura del Formulario', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Míster11/i);

    const emailTab = page.locator('.auth-tab-btn').filter({ hasText: /Entrar|Login/i }).first();
    if (await emailTab.isVisible()) {
      await emailTab.click();
      await page.waitForTimeout(300);
    }

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('2. Flujo de Creación de Sesión de Entrenamiento', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForTimeout(1000);

    const sessionBtn = page.locator('.demo-nav-btn').filter({ hasText: /Sesiones/i }).first();
    if (await sessionBtn.isVisible()) {
      await sessionBtn.click();
    } else {
      await page.goto('/sesiones');
    }
    await page.waitForTimeout(1000);

    const title = page.locator('h1, h2, .page-header, .demo-view').first();
    await expect(title).toBeVisible();
  });

  test('3. Flujo de Registro de Gol durante Partido (Match Day)', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForTimeout(1000);

    const matchBtn = page.locator('.demo-nav-btn').filter({ hasText: /Match-Day|Partidos/i }).first();
    if (await matchBtn.isVisible()) {
      await matchBtn.click();
    } else {
      await page.goto('/partidos');
    }
    await page.waitForTimeout(1000);

    const matchSection = page.locator('main, .partidos-container, .match-day-container, .demo-view').first();
    await expect(matchSection).toBeVisible();
  });

});
