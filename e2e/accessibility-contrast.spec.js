import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Míster 11 - Guardia de Accesibilidad axe-core (WCAG AA)', () => {

  test('1. Landing Page en modo claro cumple con reglas de contraste WCAG AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desactivar dark mode si estuviera activo
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('main, .hero-section, .plans-section, header')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(v => v.id === 'color-contrast');
    expect(contrastViolations, `Violaciones de contraste detectadas en Landing Claro: ${JSON.stringify(contrastViolations, null, 2)}`).toHaveLength(0);
  });

  test('2. Landing Page en modo oscuro cumple con reglas de contraste WCAG AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('main, .hero-section, .plans-section, header')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(v => v.id === 'color-contrast');
    expect(contrastViolations, `Violaciones de contraste detectadas en Landing Oscuro: ${JSON.stringify(contrastViolations, null, 2)}`).toHaveLength(0);
  });

  test('3. Componentes Tácticos y Contenedor en Demo Mode cumplen WCAG AA', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForTimeout(1500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('.tactical-pitch-card, .territory-map-container, .demo-view, main')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(v => v.id === 'color-contrast');
    expect(contrastViolations, `Violaciones de contraste detectadas en Demo Mode: ${JSON.stringify(contrastViolations, null, 2)}`).toHaveLength(0);
  });

});
