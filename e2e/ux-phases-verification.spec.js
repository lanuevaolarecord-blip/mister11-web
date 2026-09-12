import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Míster11 — E2E UX & Estadísticas: 4 Fases Verificación Integral', () => {

  const artifactDir = 'C:\\Users\\jhojan\\.gemini\\antigravity-ide\\brain\\50b57bce-b5a9-450c-aed5-b09f08ddbf03';

  test('Fase 1 & 2: Badge de Estado en Lista y Refinamiento Opcional', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/demo');
    await page.waitForTimeout(600);

    // Navegar a Partidos en Demo
    const matchNavBtn = page.locator('button, .demo-nav-btn, .nav-item').filter({ hasText: /Partidos|Match-Day|Matches/i }).first();
    if (await matchNavBtn.isVisible()) {
      await matchNavBtn.click();
      await page.waitForTimeout(500);
    }

    // 1. Verificar que los badges de partidos en lista deriven adecuadamente (FINALIZADO / EN EDICIÓN / PENDIENTE / NO DISPUTADO)
    const statusBadges = page.locator('.status-badge');
    const badgeCount = await statusBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(4);

    const foundStatuses = [];
    for (let i = 0; i < badgeCount; i++) {
      const badge = statusBadges.nth(i);
      const text = (await badge.innerText()).trim();
      foundStatuses.push(text);
      expect(['FINALIZADO', 'FINISHED', 'EN EDICIÓN', 'EN_EDICION', 'IN EDITING', 'PENDIENTE', 'PENDING', 'NO DISPUTADO', 'NO_DISPUTADO', 'NOT PLAYED']).toContain(text);
    }
    expect(foundStatuses.some(s => s.includes('FINALIZADO') || s.includes('FINISHED'))).toBeTruthy();
    expect(foundStatuses.some(s => s.includes('EDICIÓN') || s.includes('EDICION') || s.includes('EDITING'))).toBeTruthy();
    expect(foundStatuses.some(s => s.includes('PENDIENTE') || s.includes('PENDING'))).toBeTruthy();
    expect(foundStatuses.some(s => s.includes('DISPUTADO') || s.includes('PLAYED'))).toBeTruthy();

    // Capturar lista de partidos con badges correctos
    await page.screenshot({ path: path.join(artifactDir, 'match_list_statuses_desktop.png') });

    // 2. Verificar botón de Refinar Atribución: color neutro y texto opcional
    const refineBtn = page.locator('#livestats-unattributed-counter-btn, .jugador-unattributed-btn').first();
    await expect(refineBtn).toBeVisible();
    const btnText = await refineBtn.innerText();
    expect(btnText).toMatch(/Refinar atribución|Refine attribution/i);
    expect(btnText).toMatch(/opcionales|optional/i);

    // 3. Abrir modal de refinamiento
    await refineBtn.click();
    await page.waitForTimeout(400);

    const refineModal = page.locator('.unattr-modal-sheet');
    await expect(refineModal).toBeVisible();
    await expect(refineModal).toContainText(/Refinar atribución individual/i);
    await expect(refineModal).toContainText(/Los totales de equipo ya están computados/i);

    // Capturar modal de refinamiento
    await page.screenshot({ path: path.join(artifactDir, 'refine_modal_desktop.png') });

    // 4. Verificar grupos colapsados por defecto
    const groupCards = refineModal.locator('.unattr-group-card');
    const groupCount = await groupCards.count();
    expect(groupCount).toBeGreaterThan(0);

    // Por defecto colapsado
    await expect(groupCards.first()).toHaveClass(/collapsed/);

    // Expandir al hacer clic en el encabezado
    const groupHeader = groupCards.first().locator('.unattr-group-info');
    await groupHeader.click();
    await page.waitForTimeout(200);
    await expect(groupCards.first()).toHaveClass(/expanded/);

    // 5. Cerrar modal con botón Done / Listo (touch target >= 48dp)
    const doneBtn = refineModal.locator('.unattr-btn-done, .unattr-close-btn').first();
    await doneBtn.click();
    await page.waitForTimeout(300);
    await expect(refineModal).not.toBeVisible();
  });

  test('Fase 3 & 4: Campo & Táctica — Mapa de Eventos por Zona y Modo Teatro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile
    await page.goto('/demo');
    await page.waitForTimeout(600);

    // Navegar a Partidos
    const matchNavBtn = page.locator('button, .demo-nav-btn, .nav-item').filter({ hasText: /Partidos|Match-Day|Matches/i }).first();
    if (await matchNavBtn.isVisible()) {
      await matchNavBtn.click();
      await page.waitForTimeout(500);
    }

    // Ir a pestaña ESTADÍSTICAS
    const statsTab = page.locator('.tab-btn, button').filter({ hasText: /ESTADÍSTICAS|LIVE STATS/i }).first();
    await expect(statsTab).toBeVisible();
    await statsTab.click();
    await page.waitForTimeout(500);

    // Verificar presencia de Mapa de Eventos por Zona
    const zoneMap = page.locator('.zone-event-map-container');
    await expect(zoneMap).toBeVisible();
    await expect(zoneMap).toContainText(/Mapa de Eventos por Zona|Zone Event Map/i);
    await expect(zoneMap).toContainText(/Distribución territorial|Territorial distribution|recuperaciones/i);

    // Captura de Mapa de Eventos por Zona en móvil
    await page.screenshot({ path: path.join(artifactDir, 'zone_event_map_mobile.png') });

    // Simular dispositivo sin soporte nativo de fullscreen (iPhone Safari) para probar el fallback a Modo Teatro
    await page.evaluate(() => {
      delete Element.prototype.requestFullscreen;
      delete Document.prototype.requestFullscreen;
    });

    // Probar botón de Pantalla Completa / Modo Teatro
    const fsBtn = zoneMap.locator('button').filter({ hasText: /Pantalla Completa|Fullscreen|Modo Teatro/i }).first();
    await expect(fsBtn).toBeVisible();
    await fsBtn.click();
    await page.waitForTimeout(400);

    // Verificar que entra en modo teatro o fullscreen
    const theaterOverlay = page.locator('.theater-modal-overlay');
    const isTheaterVisible = await theaterOverlay.isVisible();
    expect(isTheaterVisible).toBeTruthy();

    // Captura en pantalla completa / modo teatro
    await page.screenshot({ path: path.join(artifactDir, 'theater_mode_mobile.png') });

    // Cerrar con botón de cierre o Escape
    const closeBtn = page.locator('.theater-close-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(300);
    await expect(theaterOverlay).not.toBeVisible();
  });

});
