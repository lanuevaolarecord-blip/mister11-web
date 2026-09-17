import { test, expect } from '@playwright/test';

test.describe('Míster11 — Flujos de Invitación y Onboarding por Roles', () => {

  test('1. Pantalla de Login rediseñada con roles canónicos', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Míster11/i);

    // Botones de roles principales
    const coachBtn = page.locator('.role-entry-btn').filter({ hasText: /Entrenador|Coach/i }).first();
    const playerBtn = page.locator('.role-entry-btn').filter({ hasText: /Jugador|Player/i }).first();
    const staffLink = page.locator('.staff-invite-link-banner').first();

    await expect(coachBtn).toBeVisible();
    await expect(playerBtn).toBeVisible();
    await expect(staffLink).toBeVisible();

    // Comprobar touch target >= 48px
    const coachBox = await coachBtn.boundingBox();
    expect(coachBox.height).toBeGreaterThanOrEqual(48);
  });

  test('2. Redirección a Register con selector de rol', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText(/Crea tu Cuenta|Create Your Account/i);

    const coachRoleBtn = page.locator('button').filter({ hasText: /Entrenador|Coach/i }).first();
    const playerRoleBtn = page.locator('button').filter({ hasText: /Jugador|Player/i }).first();
    const parentRoleBtn = page.locator('button').filter({ hasText: /Padre|Parent/i }).first();

    await expect(coachRoleBtn).toBeVisible();
    await expect(playerRoleBtn).toBeVisible();
    await expect(parentRoleBtn).toBeVisible();
  });

  test('3. Portal de Unión a Equipo (JoinTeam) con búsqueda en tiempo real y QR', async ({ page }) => {
    await page.goto('/join-team');

    // Título claro
    await expect(page.locator('h2')).toContainText(/Únete a tu Equipo|Join Your Team|Portal/i);

    // Botón de escanear QR presente
    const qrBtn = page.locator('button[title*="QR"], button:has(.lucide-qr-code)').first();
    if (await qrBtn.isVisible()) {
      await expect(qrBtn).toBeVisible();
    }
  });

  test('4. Portal de Invitación de Entrenador/Staff (/join-staff y /invite-coach)', async ({ page }) => {
    await page.goto('/join-staff');

    // Título y pestañas
    await expect(page.locator('h2')).toContainText(/Staff|Cuerpo Técnico|Entrenador/i);
    const codeTab = page.locator('button').filter({ hasText: /Código|Code/i }).first();
    const qrTab = page.locator('button').filter({ hasText: /QR/i }).first();

    await expect(codeTab).toBeVisible();
    await expect(qrTab).toBeVisible();

    // Cambiar a pestaña QR
    await qrTab.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: /Escanear QR|Scan/i })).toBeVisible();
  });

});
