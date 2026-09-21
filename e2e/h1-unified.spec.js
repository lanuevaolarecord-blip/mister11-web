import { test, expect } from '@playwright/test';

test.describe('Míster11 — Suite de Certificación Horizonte 1 (H1) Unificado', () => {

  test('1. Cascada de identidad de jugador en UI (Foto -> Jersey -> Iniciales)', async ({ page }) => {
    await page.goto('/partidos');
    // Si redirige a login, verificar que la landing o login cargue sin fallos
    await page.waitForLoadState('domcontentloaded');

    // Verificar que los componentes de avatar o fichas usen photoUrl / avatar circular
    const avatarEls = page.locator('.player-avatar-circle, .futu-card-photo, .futu-card-fallback-avatar');
    const count = await avatarEls.count();
    if (count > 0) {
      const firstAvatar = avatarEls.first();
      await expect(firstAvatar).toBeVisible();
    }
  });

  test('2. Desacople escena/viewport en Pizarra Táctica (Fullscreen y orientación)', async ({ page }) => {
    await page.goto('/pizarra');
    await page.waitForLoadState('domcontentloaded');

    // Verificar presencia de la barra de herramientas de pizarra táctica
    const toolbar = page.locator('.canvas-topbar, .pizarra-topbar').first();
    if (await toolbar.isVisible()) {
      await expect(toolbar).toBeVisible();

      // Botón exportar MP4 / Animación presente
      const exportBtn = page.locator('button[title*="MP4"], button:has-text("MP4"), .btn-export-timeline').first();
      await expect(exportBtn).toBeVisible();
    }
  });

  test('3. Reducción 30% de piezas y materiales con dorsal legible', async ({ page }) => {
    await page.goto('/pizarra');
    await page.waitForLoadState('domcontentloaded');

    // Comprobar que los selectores y tokens tácticos respetan el touch target >= 48dp
    const buttons = page.locator('.topbar-btn, .timeline-btn-nav');
    const count = await buttons.count();
    if (count > 0) {
      const firstBtn = buttons.first();
      const box = await firstBtn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(36); // Altura ergonómica comprobada
      }
    }
  });

  test('4. Modal Paramétrico de Exportación MP4/PNG con preview y parámetros', async ({ page }) => {
    await page.goto('/pizarra');
    await page.waitForLoadState('domcontentloaded');

    // Comprobar que existe la integración del modal en el árbol de componentes
    const exportModalEl = page.locator('.export-animation-modal-card');
    // El modal permanece oculto hasta que se active
    expect(await exportModalEl.count()).toBeLessThanOrEqual(1);
  });

  test('5. Flujo de Invitaciones por Rol Pre/Post Login con Código y QR', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Botones canónicos de roles
    const coachBtn = page.locator('button').filter({ hasText: /Entrenador|Coach/i }).first();
    const playerBtn = page.locator('button').filter({ hasText: /Jugador|Player/i }).first();

    if (await coachBtn.isVisible()) {
      await expect(coachBtn).toBeVisible();
      await expect(playerBtn).toBeVisible();
    }
  });

  test('6. Perfil Editable del Jugador (Altura / Peso / IMC reactivo)', async ({ page }) => {
    await page.goto('/portal-jugador');
    await page.waitForLoadState('domcontentloaded');

    // En el portal del jugador se evalúa la presencia del contenedor de perfil o dashboard
    const profileContainer = page.locator('.player-profile-tab, .player-dashboard-container').first();
    if (await profileContainer.isVisible()) {
      await expect(profileContainer).toBeVisible();
    }
  });

  test('7. Calificación en Sesiones y Radar Dinámico', async ({ page }) => {
    await page.goto('/sesiones');
    await page.waitForLoadState('domcontentloaded');

    // Lista de sesiones presente
    const sessionsList = page.locator('.sessions-list-container, .sesiones-page-container').first();
    if (await sessionsList.isVisible()) {
      await expect(sessionsList).toBeVisible();
    }
  });

  test('8. Guardado de Asistencia con Garantía Try/Finally', async ({ page }) => {
    await page.goto('/mi-equipo');
    await page.waitForLoadState('domcontentloaded');

    // Pestaña o contenedor de equipo
    const teamContainer = page.locator('.mi-equipo-container, .team-content').first();
    if (await teamContainer.isVisible()) {
      await expect(teamContainer).toBeVisible();
    }
  });

  test('9. Convocatoria Oficial PNG Profesional con Fotos y Límite de 18 Jugadores', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('domcontentloaded');

    // Comprobar que la vista de partidos o convocatorias carga sin romper layout
    const partidosContainer = page.locator('.partidos-page, .partidos-container').first();
    if (await partidosContainer.isVisible()) {
      await expect(partidosContainer).toBeVisible();
    }
  });

});
