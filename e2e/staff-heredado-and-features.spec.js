import { test, expect } from '@playwright/test';
import { validatePhysicalStats, calculateBMI } from '../src/utils/playerProfile.js';
import { calculatePlayerAverageRating } from '../src/utils/sessionRatings.js';
import { calculatePlayerPerformanceScores } from '../src/utils/testScoreEngine.js';
import { calculateGracePeriod } from '../src/utils/downgradeGracePeriod.js';
import { canTransferOwnership } from '../src/utils/transferOwnership.js';

test.describe('Míster 11 — Staff Heredado y 3 Features Atómicas', () => {

  test('Feature 0: Validación de Caso Límite 1 - Período de Gracia (5 días)', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const graceInfo = calculateGracePeriod(twoDaysAgo);
    expect(graceInfo.isInGracePeriod).toBe(true);
    expect(graceInfo.isBlocked).toBe(false);
    expect(graceInfo.daysRemaining).toBe(3);

    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const oldGraceInfo = calculateGracePeriod(sixDaysAgo);
    expect(oldGraceInfo.isInGracePeriod).toBe(false);
    expect(oldGraceInfo.isBlocked).toBe(true);
    expect(oldGraceInfo.daysRemaining).toBe(0);
  });

  test('Feature 0: Validación de Caso Límite 2 - Traspaso de Propiedad y límites Free', () => {
    // Usuario Free con 0 equipos -> Puede recibir propiedad
    const targetUserFree = { uid: 'user-free-1', plan: 'free' };
    const check1 = canTransferOwnership(targetUserFree, 0);
    expect(check1.allowed).toBe(true);

    // Usuario Free con 1 equipo -> No puede exceder límite de 1 equipo
    const check2 = canTransferOwnership(targetUserFree, 1);
    expect(check2.allowed).toBe(false);
    expect(check2.reason).toBe('target_limit_exceeded');

    // Usuario Pro -> Puede recibir equipos adicionales
    const targetUserPro = { uid: 'user-pro-1', plan: 'pro' };
    const check3 = canTransferOwnership(targetUserPro, 5);
    expect(check3.allowed).toBe(true);
  });

  test('Feature 1: Validación estricta de Altura (100-230 cm) y Peso (30-150 kg)', () => {
    // Valores válidos
    const valid = validatePhysicalStats({ height: 178, weight: 72.5 });
    expect(valid.valid).toBe(true);
    expect(Object.keys(valid.errors)).toHaveLength(0);

    // Altura fuera de rango
    const invalidHeight = validatePhysicalStats({ height: 95, weight: 70 });
    expect(invalidHeight.valid).toBe(false);
    expect(invalidHeight.errors.height).toBeDefined();

    // Peso fuera de rango
    const invalidWeight = validatePhysicalStats({ height: 180, weight: 160 });
    expect(invalidWeight.valid).toBe(false);
    expect(invalidWeight.errors.weight).toBeDefined();
  });

  test('Feature 1: Cálculo reactivo de IMC (BMI)', () => {
    const bmi = calculateBMI(180, 75);
    expect(bmi).not.toBeNull();
    expect(bmi.value).toBe(23.1);
    expect(bmi.statusKey).toBe('normal');

    const bmiUnder = calculateBMI(175, 50);
    expect(bmiUnder.statusKey).toBe('underweight');

    const bmiOver = calculateBMI(170, 85);
    expect(bmiOver.statusKey).toBe('overweight');
  });

  test('Feature 2: Cálculo de media acumulada de calificaciones de sesión (0-10)', () => {
    const ratings = [
      { rating: 8.5 },
      { rating: 7.0 },
      { rating: 9.5 }
    ];
    const avg = calculatePlayerAverageRating(ratings);
    expect(avg).toBe(8.3);

    expect(calculatePlayerAverageRating([])).toBe(0);
  });

  test('Feature 2: Motor de puntuaciones con 6to eje de radar (ENTRENAMIENTO)', () => {
    const scores = calculatePlayerPerformanceScores([], { name: 'Player Test' }, {
      attendancePct: 90,
      matchRating: 7.5,
      trainingRating: 8.2
    });

    expect(scores.entrenamiento).toBe(82);
    expect(scores.radarData6).toHaveLength(6);
    expect(scores.radarData6.some(axis => axis.subject === 'ENTRENAMIENTO' && axis.value === 82)).toBe(true);
    expect(scores.radarData).toHaveLength(6);
  });

  test('Navegación UI en Demo: Carga limpia sin regresiones', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForTimeout(1000);

    const title = page.locator('h1, h2, .page-header, .demo-view').first();
    await expect(title).toBeVisible();
  });

});
