import { test, expect } from '@playwright/test';

test.describe('Mobile Session Editor & Verified Download Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Inicializar sesión de invitado local autónoma para pruebas deterministas
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
      window.localStorage.setItem('mister11_language', 'Español (ES)');
    });
  });

  test('360x640: /sesiones/nueva - cero scroll horizontal, título elíptico y barra fija 40/60', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });

    // Navegar directamente a /sesiones/nueva
    await page.goto('/sesiones/nueva');
    await page.waitForSelector('.session-editor-title, .session-editor-bottom-bar', { timeout: 10000 });
    await page.waitForTimeout(500);

    // 1. Cero scroll horizontal
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(overflow).toBe(false);

    // 2. Título de sesión elíptico en una sola línea (sin character wrapping)
    const titleStyles = await page.evaluate(() => {
      const title = document.querySelector('.session-editor-title');
      if (!title) return null;
      const cs = window.getComputedStyle(title);
      return {
        overflow: cs.overflow,
        textOverflow: cs.textOverflow,
        whiteSpace: cs.whiteSpace
      };
    });
    expect(titleStyles).not.toBeNull();
    expect(titleStyles.overflow).toBe('hidden');
    expect(titleStyles.textOverflow).toBe('ellipsis');
    expect(titleStyles.whiteSpace).toBe('nowrap');

    // 3. Barra inferior de acciones fija (40% cancelar / 60% guardar)
    const bottomBar = page.locator('.session-editor-bottom-bar');
    await expect(bottomBar).toBeVisible();

    const cancelBtn = bottomBar.locator('.btn-session-cancel');
    const saveBtn = bottomBar.locator('.btn-session-save');
    await expect(cancelBtn).toBeVisible();
    await expect(saveBtn).toBeVisible();

    const cancelBox = await cancelBtn.boundingBox();
    const saveBox = await saveBtn.boundingBox();
    expect(cancelBox).not.toBeNull();
    expect(saveBox).not.toBeNull();

    // Proporción aproximada 40% / 60% (permitiendo gap y márgenes)
    const totalWidth = cancelBox.width + saveBox.width;
    const cancelRatio = cancelBox.width / totalWidth;
    const saveRatio = saveBox.width / totalWidth;
    expect(cancelRatio).toBeGreaterThanOrEqual(0.35);
    expect(cancelRatio).toBeLessThanOrEqual(0.45);
    expect(saveRatio).toBeGreaterThanOrEqual(0.55);
    expect(saveRatio).toBeLessThanOrEqual(0.65);
  });

  test('360x640: /sesiones/:id - Anti-ghosting assert durante scroll continuo', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });

    await page.goto('/sesiones/nueva');
    await page.waitForSelector('.sesiones-page', { timeout: 10000 });

    // Capturas y verificaciones consecutivas de capas durante scroll
    const scrollPoints = [0, 150, 300, 500];

    for (const scrollTop of scrollPoints) {
      await page.evaluate((top) => {
        window.scrollTo(0, top);
        const main = document.querySelector('.main-wrapper') || document.documentElement;
        if (main) main.scrollTop = top;
      }, scrollTop);

      await page.waitForTimeout(200);

      const layerCheck = await page.evaluate(() => {
        // Assert: solo existe exactamente 1 barra de acciones inferior
        const bottomBars = document.querySelectorAll('.session-editor-bottom-bar');
        const headers = document.querySelectorAll('.edit-mode-header');
        
        // Assert: no hay scroll horizontal durante el movimiento
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;

        return {
          bottomBarsCount: bottomBars.length,
          headersCount: headers.length,
          noHorizontalOverflow: scrollWidth <= innerWidth + 1
        };
      });

      expect(layerCheck.bottomBarsCount).toBe(1);
      expect(layerCheck.headersCount).toBe(1);
      expect(layerCheck.noHorizontalOverflow).toBe(true);

      // Comprobar posición de la barra fija en el viewport
      const bottomBar = page.locator('.session-editor-bottom-bar');
      const box = await bottomBar.boundingBox();
      expect(box).not.toBeNull();
      // La barra debe permanecer anclada al fondo de la pantalla
      expect(box.y + box.height).toBeGreaterThanOrEqual(630);
      expect(box.y + box.height).toBeLessThanOrEqual(650);
    }
  });

  test('downloadLineupPNG: simulación con descarga verificada vs payload corrupto', async ({ page }) => {
    await page.goto('/sesiones/nueva');
    await page.waitForSelector('.sesiones-page', { timeout: 10000 });

    // 1. Descarga verificada en navegador (Blob y link válido)
    const resultSuccess = await page.evaluate(async () => {
      const { downloadLineupPNG } = await import('/src/utils/download.js');
      const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const res = await downloadLineupPNG(testDataUrl, {
        teamName: 'Equipo Test',
        matchDate: '2026-09-14'
      });

      return res;
    });

    expect(resultSuccess.success).toBe(true);
    expect(resultSuccess.filename).toContain('alineacion_');
    expect(resultSuccess.path).toContain('Descargas/');

    // 2. Descarga corrupta: base64 vacío -> debe fallar honestamente sin toast de éxito falso
    const resultCorrupted = await page.evaluate(async () => {
      const { downloadLineupPNG } = await import('/src/utils/download.js');
      const res = await downloadLineupPNG('', {
        teamName: 'Equipo Fallido',
        matchDate: '2026-09-14'
      });
      return res;
    });

    expect(resultCorrupted.success).toBe(false);
  });

});
