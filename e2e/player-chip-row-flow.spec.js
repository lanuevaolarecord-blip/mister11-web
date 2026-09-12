import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '..', 'scratch-screenshots');

test.describe('Míster11 — E2E PlayerChipRow (Sin Solapes, Scroll Estilizado, Touch Target ≥48dp)', () => {

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  const viewports = [
    { name: 'Mobile (360x640)', width: 360, height: 640 },
    { name: 'Desktop (1280x800)', width: 1280, height: 800 }
  ];

  for (const vp of viewports) {
    test(`Validación de Bounding Boxes y Scroll en ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/demo');
      await page.waitForTimeout(600);

      // Navegar a la sección Match-Day / Partidos en Demo
      const partidosNavBtn = page.locator('button, .demo-nav-btn, .nav-item').filter({ hasText: /Partidos|Match-Day|Matches/i }).first();
      await expect(partidosNavBtn).toBeVisible();
      await partidosNavBtn.click();
      await page.waitForTimeout(500);

      // Abrir ShotModal mediante el botón de prueba
      const openModalBtn = page.locator('.demo-open-shotmodal-btn');
      await expect(openModalBtn).toBeVisible();
      await openModalBtn.click();
      await page.waitForTimeout(500);

      // Verificar que el modal de remate y la fila de chips están visibles
      const modalOverlay = page.locator('.shot-modal-overlay');
      await expect(modalOverlay).toBeVisible();

      const chipRow = page.locator('#shot-shooter-chips');
      await expect(chipRow).toBeVisible();

      // Obtener todos los chips (1 chip 'Sin atribuir' + 18 jugadores = 19 chips)
      const chips = chipRow.locator('.player-chip-item');
      const count = await chips.count();
      expect(count).toBeGreaterThanOrEqual(15);

      // 1. Scroll horizontal funcional
      const scrollInfo = await chipRow.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollLeft: el.scrollLeft
      }));
      expect(scrollInfo.scrollWidth).toBeGreaterThan(scrollInfo.clientWidth);

      // 2. Verificar Bounding Boxes sin intersección ni solapes
      // En un contenedor flex horizontal, el borde derecho de chip[i] debe ser <= borde izquierdo de chip[i+1]
      // cuando no hay scroll aplicado.
      await chipRow.evaluate((el) => { el.scrollLeft = 0; });
      await page.waitForTimeout(100);

      const boundingBoxes = [];
      for (let i = 0; i < count; i++) {
        const chip = chips.nth(i);
        const box = await chip.boundingBox();
        if (box) {
          // Assert de Touch Target Android First: min-height >= 48dp
          expect(box.height).toBeGreaterThanOrEqual(47.5);
          boundingBoxes.push({ index: i, ...box });
        }
      }

      // Verificar no intersección entre los chips visibles en pantalla
      for (let i = 0; i < boundingBoxes.length - 1; i++) {
        const cur = boundingBoxes[i];
        const next = boundingBoxes[i + 1];
        // Comprobar que el chip actual termina antes de que empiece el siguiente
        expect(cur.x + cur.width).toBeLessThanOrEqual(next.x + 0.1);
      }

      // 3. Verificar scroll horizontal funcional desplazando hacia la derecha
      await chipRow.evaluate((el) => { el.scrollLeft = 180; });
      await page.waitForTimeout(150);
      const scrolledLeft = await chipRow.evaluate((el) => el.scrollLeft);
      expect(scrolledLeft).toBeGreaterThan(0);

      // 4. Verificar cero saltos de layout al seleccionar
      const targetChip = chips.nth(1); // Primer jugador tras 'Sin atribuir'
      const initialBox = await targetChip.boundingBox();
      await targetChip.click();
      await page.waitForTimeout(150);
      await expect(targetChip).toHaveClass(/is-selected/);
      const afterBox = await targetChip.boundingBox();
      if (initialBox && afterBox) {
        expect(Math.abs(afterBox.width - initialBox.width)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(afterBox.height - initialBox.height)).toBeLessThanOrEqual(0.5);
      }

      // 5. Capturar screenshots (Dark Mode)
      const safeVp = vp.name.replace(/[^a-zA-Z0-9]/g, '_');
      const shotDarkPath = path.join(screenshotsDir, `shotmodal_chips_${safeVp}_dark.png`);
      await page.screenshot({ path: shotDarkPath });

      // 6. Activar Light Mode y capturar screenshot
      await page.evaluate(() => {
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
      });
      await page.waitForTimeout(150);
      const shotLightPath = path.join(screenshotsDir, `shotmodal_chips_${safeVp}_light.png`);
      await page.screenshot({ path: shotLightPath });
    });
  }

});
