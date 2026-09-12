import { test, expect } from '@playwright/test';

test.describe('Míster 11 — Estabilidad de Subtab en Fullscreen y Modo Teatro (Cero Ghosting)', () => {

  test('1. Abrir y cerrar pantalla completa en Campo & Táctica no resetea a Captura ni genera ghosting', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/demo');
    await page.waitForTimeout(1000);

    // Navegar a Partidos
    const partidosNav = page.locator('button, .demo-nav-btn, .nav-item').filter({ hasText: /Partidos|Match-Day|Matches/i }).first();
    if (await partidosNav.isVisible()) {
      await partidosNav.click();
      await page.waitForTimeout(800);
    }

    // Ir a pestaña de estadísticas
    const statsTab = page.locator('button.tab-btn').filter({ hasText: /ESTADÍSTICAS|Stats/i }).first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(600);
    }

    // Cambiar a la subtab "Campo & Táctica"
    const tacticalSubTab = page.locator('.stats-tab-btn, button.sub-tab-btn').filter({ hasText: /Campo & Táctica|Field & Tactics/i }).first();
    await expect(tacticalSubTab).toBeVisible({ timeout: 5000 });
    await tacticalSubTab.click();
    await page.waitForTimeout(600);

    // Aserción 1: La subtab Campo & Táctica está activa
    await expect(tacticalSubTab).toHaveClass(/active/);

    // Aserción 2: Cero Ghosting (la cuadrícula de botones de Captura en Vivo NO debe estar visible)
    const liveCaptureButtons = page.locator('.livestats-categories-grid, .livestats-buttons-grid');
    const isLiveCaptureVisible = await liveCaptureButtons.count() > 0 ? await liveCaptureButtons.first().isVisible() : false;
    expect(isLiveCaptureVisible).toBe(false);

    // Aserción 3: Los componentes de Campo & Táctica están renderizados
    const shotMapContainer = page.locator('.shot-map-container').first();
    await expect(shotMapContainer).toBeVisible({ timeout: 5000 });

    // Abrir pantalla completa en ShotMap
    const shotMapFsBtn = shotMapContainer.locator('.btn-fullscreen-match-card').first();
    await expect(shotMapFsBtn).toBeVisible();
    await shotMapFsBtn.click();
    await page.waitForTimeout(600);

    // Aserción 4: El overlay de modo teatro / portal está montado y visible
    const theaterOverlay = page.locator('.theater-modal-overlay');
    await expect(theaterOverlay).toBeVisible({ timeout: 5000 });

    // Aserción 5: Mientras el overlay está abierto, la subtab activa NO ha regresado a Captura
    await expect(tacticalSubTab).toHaveClass(/active/);
    const liveCaptureWhileFs = await liveCaptureButtons.count() > 0 ? await liveCaptureButtons.first().isVisible() : false;
    expect(liveCaptureWhileFs).toBe(false);

    // Cerrar el modal mediante el botón de cierre táctil (>=48dp)
    const closeBtn = page.locator('.theater-close-btn').first();
    await expect(closeBtn).toBeVisible();
    const box = await closeBtn.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await closeBtn.click({ force: true });
    await page.waitForTimeout(600);

    // Aserción 6: Tras el cierre, el overlay desaparece y la vista SIGUE en Campo & Táctica
    await expect(theaterOverlay).not.toBeVisible();
    await expect(tacticalSubTab).toHaveClass(/active/);
    await expect(shotMapContainer).toBeVisible();

    // Comprobar que no hubo errores de script durante todo el flujo
    expect(pageErrors).toHaveLength(0);
  });

  test('2. Cierre de Modo Teatro con tecla Escape restaura la vista en la misma subtab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/demo');
    await page.waitForTimeout(800);

    const partidosNav = page.locator('button, .demo-nav-btn').filter({ hasText: /Partidos|Match-Day/i }).first();
    if (await partidosNav.isVisible()) {
      await partidosNav.click();
      await page.waitForTimeout(600);
    }

    const statsTab = page.locator('button.tab-btn').filter({ hasText: /ESTADÍSTICAS/i }).first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(500);
    }

    const tacticalSubTab = page.locator('.stats-tab-btn, button.sub-tab-btn').filter({ hasText: /Campo & Táctica|Field & Tactics/i }).first();
    await tacticalSubTab.click();
    await page.waitForTimeout(500);

    const heatMapContainer = page.locator('.heat-map-container').first();
    await expect(heatMapContainer).toBeVisible();

    const heatMapFsBtn = heatMapContainer.locator('.btn-fullscreen-match-card').first();
    await heatMapFsBtn.click();
    await page.waitForTimeout(600);

    const theaterOverlay = page.locator('.theater-modal-overlay');
    await expect(theaterOverlay).toBeVisible();

    // Cerrar pulsando Escape en el teclado
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(theaterOverlay).not.toBeVisible();
    await expect(tacticalSubTab).toHaveClass(/active/);
  });

  test('3. Fallback inmediato a Modo Teatro en Safari móvil (sin APIs fullscreen nativas)', async ({ page }) => {
    // Simular ausencia de fullscreenEnabled (comportamiento Safari iOS)
    await page.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
      Object.defineProperty(document, 'webkitFullscreenEnabled', { value: false, configurable: true });
      Element.prototype.requestFullscreen = undefined;
      Element.prototype.webkitRequestFullscreen = undefined;
    });

    await page.setViewportSize({ width: 390, height: 844 }); // iPhone viewport
    await page.goto('/demo');
    await page.waitForTimeout(800);

    const partidosNav = page.locator('button, .demo-nav-btn').filter({ hasText: /Partidos|Match-Day/i }).first();
    if (await partidosNav.isVisible()) {
      await partidosNav.click();
      await page.waitForTimeout(600);
    }

    const statsTab = page.locator('button.tab-btn').filter({ hasText: /ESTADÍSTICAS/i }).first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(500);
    }

    const tacticalSubTab = page.locator('.stats-tab-btn, button.sub-tab-btn').filter({ hasText: /Campo & Táctica|Field & Tactics/i }).first();
    await tacticalSubTab.click();
    await page.waitForTimeout(500);

    const zoneMapContainer = page.locator('.zone-event-map-container').first();
    await expect(zoneMapContainer).toBeVisible();

    const fsBtn = zoneMapContainer.locator('.btn-fullscreen-match-card').first();
    await fsBtn.click();
    await page.waitForTimeout(600);

    // En Safari iOS, debe abrir directamente el modo teatro por portal sin lanzar errores
    const theaterOverlay = page.locator('.theater-modal-overlay');
    await expect(theaterOverlay).toBeVisible();

    // Cerrar y verificar estabilidad
    const closeBtn = page.locator('.theater-close-btn').first();
    await closeBtn.click({ force: true });
    await page.waitForTimeout(500);

    await expect(theaterOverlay).not.toBeVisible();
    await expect(tacticalSubTab).toHaveClass(/active/);
  });

});
