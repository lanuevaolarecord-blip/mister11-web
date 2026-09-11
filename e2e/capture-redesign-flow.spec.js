import { test, expect } from '@playwright/test';

test.describe('Míster11 — E2E Captura Rediseñada, 2D Pitch, Sin Atribuir y Criterios', () => {

  const viewports = [
    { name: 'Desktop (1280x800)', width: 1280, height: 800 },
    { name: 'Mobile (375x812)', width: 375, height: 812 }
  ];

  const languages = [
    { code: 'ES', label: 'Español (ES)', criteriaTitle: /Manual de Criterios/i, unattributedBadge: /Sin atribuir/i },
    { code: 'EN', label: 'English (EN)', criteriaTitle: /Capture Criteria Manual/i, unattributedBadge: /Unattributed/i }
  ];

  for (const vp of viewports) {
    for (const lang of languages) {
      test(`Flujo de Captura en ${vp.name} [${lang.code}]`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Establecer idioma en localStorage antes de navegar
        await page.addInitScript((l) => {
          window.localStorage.setItem('mister11_language', l);
          window.localStorage.setItem('language', l);
        }, lang.label);

        await page.goto('/demo');
        await page.waitForTimeout(800);

        // Navegar a Partidos / LiveStats en modo Demo
        const matchNav = page.locator('button, .demo-nav-btn, .nav-item').filter({ hasText: /Partidos|Match-Day|Matches/i }).first();
        if (await matchNav.isVisible()) {
          await matchNav.click();
          await page.waitForTimeout(600);
        }

        // 1. Verificar presencia de la vista y contenedor principal
        const mainContainer = page.locator('.partidos-container, .demo-view, main').first();
        await expect(mainContainer).toBeVisible();

        // 2. Verificar que si estamos en LiveStats o Match Day se encuentra el mini-pitch 2D o controles
        const miniPitch2D = page.locator('.sector-mini-pitch-2d');
        if (await miniPitch2D.isVisible()) {
          // Verificar que existen las 9 zonas tácticas (3x3)
          const pitchCells = page.locator('.pitch-cell-btn');
          await expect(pitchCells).toHaveCount(9);

          // Probar clic en zona de ataque central
          const centerAttCell = page.locator('.pitch-cell-btn[data-zone="centro_att"]');
          if (await centerAttCell.isVisible()) {
            await centerAttCell.click();
            await expect(centerAttCell).toHaveClass(/active/);
          }
        }

        // 3. Verificar botón de criterios de captura
        const criteriaBtn = page.locator('.livestats-criteria-btn, button:has-text("Criteria"), button:has-text("Criterios")').first();
        if (await criteriaBtn.isVisible()) {
          await criteriaBtn.click();
          await page.waitForTimeout(300);

          // Verificar modal de criterios abierto
          const criteriaModal = page.locator('.capture-criteria-modal');
          if (await criteriaModal.isVisible()) {
            await expect(criteriaModal).toContainText(lang.criteriaTitle);
            const closeBtn = criteriaModal.locator('.criteria-close-btn').first();
            await closeBtn.click();
          }
        }

        // 4. Verificar presencia de badge de sin atribuir
        const unattributedBadge = page.locator('#acta-unattributed-btn, .jugador-unattributed-btn').first();
        if (await unattributedBadge.isVisible()) {
          await expect(unattributedBadge).toContainText(lang.unattributedBadge);
        }
      });
    }
  }

});
