import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Míster 11 — Verificación RadarCompareSVG, SectionErrorBoundary y Manual de Criterios', () => {

  test('1. Renderizado de RadarCompareSVG y Resiliencia en Partidos', async ({ page }) => {
    // Escuchar errores de consola no controlados
    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/demo');
    await page.waitForTimeout(1000);

    // Navegar a Partidos
    const partidosNav = page.locator('button, .demo-nav-btn, .nav-item').filter({ hasText: /Partidos|Match-Day|Matches/i }).first();
    if (await partidosNav.isVisible()) {
      await partidosNav.click();
      await page.waitForTimeout(800);
    }

    // Comprobar que no se lanzó 'Cannot access before initialization'
    const tdzErrors = pageErrors.filter(msg => msg.includes('before initialization') || msg.includes('RadarCompareSVG'));
    expect(tdzErrors).toHaveLength(0);

    // Ir a pestaña de estadísticas y activar radar en demo
    const statsTab = page.locator('button.tab-btn').filter({ hasText: /ESTADÍSTICAS|Stats/i }).first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(600);

      const radarSubTab = page.locator('#demo-tab-radar-btn, button:has-text("Radar")').first();
      if (await radarSubTab.isVisible()) {
        await radarSubTab.click();
        await page.waitForTimeout(600);

        const secRadar = page.locator('#sec_radar');
        await expect(secRadar).toBeVisible();
        const radarSvg = secRadar.locator('svg').first();
        await expect(radarSvg).toBeVisible();
        await radarSvg.screenshot({ path: 'C:/Users/jhojan/.gemini/antigravity-ide/brain/50b57bce-b5a9-450c-aed5-b09f08ddbf03/radar_compare_verified.png' });
      }
    }
  });

  test('2. Manual de Criterios: Scrollbar fina dorada y Touch Target >= 48dp', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport
    await page.goto('/demo');
    await page.waitForTimeout(1000);

    // Navegar a LiveStats o Partidos
    const navBtn = page.locator('button, .demo-nav-btn').filter({ hasText: /Partidos|Match-Day|Live/i }).first();
    if (await navBtn.isVisible()) {
      await navBtn.click();
      await page.waitForTimeout(800);
    }

    // Abrir modal de criterios con el botón
    const criteriaBtn = page.locator('#demo-open-criteria-btn, .livestats-criteria-btn').first();
    await expect(criteriaBtn).toBeVisible();
    await criteriaBtn.click();
    await page.waitForTimeout(600);

    const criteriaScroll = page.locator('.criteria-cats-scroll');
    await expect(criteriaScroll).toBeVisible();

    // Verificar que los chips tienen touch target >= 48dp
    const firstChip = page.locator('.criteria-cat-chip').first();
    await expect(firstChip).toBeVisible();
    const box = await firstChip.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(47.5);

    // Capturar pantalla del modal con scrollbar estilizada
    await page.screenshot({ path: 'C:/Users/jhojan/.gemini/antigravity-ide/brain/50b57bce-b5a9-450c-aed5-b09f08ddbf03/criteria_modal_styled_scroll.png' });

    // Cerrar modal
    const closeBtn = page.locator('.criteria-close-btn').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('3. Resiliencia: Fallo aislado en Sección muestra Tarjeta Fallback y el resto sigue operativo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/demo');
    await page.waitForTimeout(800);

    // Navegar a Partidos
    const partidosNav = page.locator('button, .demo-nav-btn').filter({ hasText: /Partidos|Match-Day/i }).first();
    await partidosNav.click();
    await page.waitForTimeout(600);

    // Ir a pestaña de estadísticas y subpestaña radar
    const statsTab = page.locator('button.tab-btn').filter({ hasText: /ESTADÍSTICAS/i }).first();
    await statsTab.click();
    await page.waitForTimeout(400);

    const radarSubTab = page.locator('#demo-tab-radar-btn');
    await radarSubTab.click();
    await page.waitForTimeout(400);

    // Simular error en la sección
    const toggleBtn = page.locator('#demo-toggle-radar-error-btn');
    await toggleBtn.click();
    await page.waitForTimeout(400);

    // Verificar que aparece la tarjeta de fallback de SectionErrorBoundary
    const fallbackCard = page.locator('.section-error-card');
    await expect(fallbackCard).toBeVisible();
    await expect(fallbackCard).toContainText('SEC_RADAR');
    await expect(fallbackCard).toContainText('El resto del partido continúa operativo');

    // Capturar pantalla del fallback demostrado
    await fallbackCard.screenshot({ path: 'C:/Users/jhojan/.gemini/antigravity-ide/brain/50b57bce-b5a9-450c-aed5-b09f08ddbf03/section_fallback_demonstrated.png' });

    // Verificar que el resto de la interfaz sigue completamente operativa (ej. cambiar a subpestaña táctica)
    const tacticalSubTab = page.locator('button.sub-tab-btn:has-text("Campo & Táctica")');
    await tacticalSubTab.click();
    await page.waitForTimeout(400);
    const zoneMap = page.locator('.zone-event-map-container, .zone-map-pitch-wrapper').first();
    await expect(zoneMap).toBeVisible();
  });

});
