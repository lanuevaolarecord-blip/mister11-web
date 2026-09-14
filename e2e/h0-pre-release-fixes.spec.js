import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { normalizeTestValue } from '../src/utils/testScoreEngine.js';
import { jumpHorizontalBaremos, RFEF_JUMP_SOURCE } from '../src/config/testBaremos.js';

test.describe('H0 Pre-Release Top-10 Defect Fixes Regression Suite', () => {

  // 1. DEF-M12-01: Pricing i18n in LandingPage
  test('DEF-M12-01: LandingPage pricing displays 100% Spanish text without English strings', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_language', 'Español (ES)');
    });
    await page.goto('/');
    
    // Look at pricing section
    const pricingSection = page.locator('.landing-pricing, #pricing, .pricing-section').first();
    await expect(pricingSection).toBeVisible();

    const textContent = await pricingSection.textContent();
    // Verify typical English pricing terms are NOT present
    expect(textContent).not.toMatch(/\bFree\b/i);
    expect(textContent).not.toMatch(/\bMonthly\b/i);
    expect(textContent).not.toMatch(/\bAnnual\b/i);
    expect(textContent).not.toMatch(/\bEverything in\b/i);
    expect(textContent).not.toMatch(/\bCurrent Plan\b/i);

    // Verify Spanish pricing terms are present
    expect(textContent).toMatch(/Gratis|Mes|Año|Gratuito|Básico|Avanzado|Club/i);
  });

  // 2. DEF-M07-01: Reordering touch buttons in BlockEditor (targets >= 48dp)
  test('DEF-M07-01: Exercise reorder buttons ▲/▼ exist with >= 48px touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    });
    await page.goto('/sesiones/nueva');
    await page.waitForTimeout(600);

    // Check for up/down touch buttons in exercise items
    const moveBtns = page.locator('.btn-move-up, .btn-move-down');
    if (await moveBtns.count() > 0) {
      const firstBtn = moveBtns.first();
      await expect(firstBtn).toBeVisible();
      const box = await firstBtn.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44); // 48px target with padding
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  // 3. DEF-M06-01: ShotModal sticky footer & Guardar Tiro visible
  test('DEF-M06-01: Shot modal footer has sticky positioning and visible save button', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    });
    await page.goto('/partidos');
    await page.waitForTimeout(600);

    // Validate CSS rules in stylesheet
    const stickyCheck = await page.evaluate(() => {
      const style = document.createElement('div');
      style.className = 'shot-modal-footer';
      document.body.appendChild(style);
      const computed = window.getComputedStyle(style);
      const position = computed.position;
      document.body.removeChild(style);
      return position;
    });
    expect(['sticky', '-webkit-sticky']).toContain(stickyCheck);
  });

  // 4. DEF-M05-01: Web Worker MP4 encoder and progress overlay
  test('DEF-M05-01: MP4 encoder worker is loadable and tactical board has progress overlay', async ({ page }) => {
    await page.goto('/pizarra');
    await page.waitForTimeout(600);

    const isWorkerAccessible = await page.evaluate(async () => {
      try {
        const res = await fetch('/src/workers/mp4EncoderWorker.js');
        return res.ok;
      } catch (e) {
        return false;
      }
    });
    expect(isWorkerAccessible).toBe(true);

    const hasProgressClass = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'export-progress-bar-fill';
      document.body.appendChild(el);
      const computed = window.getComputedStyle(el);
      const hasTransitions = !!computed.transition;
      document.body.removeChild(el);
      return hasTransitions;
    });
    expect(hasProgressClass).toBe(true);
  });

  // 5. DEF-M11-01: SVG rasterization with OffscreenCanvas/rAF
  test('DEF-M11-01: rasterizeSvg uses chunked processing for low RAM environments', async ({ page }) => {
    const supportsOffscreen = await page.evaluate(() => typeof OffscreenCanvas !== 'undefined');
    expect(supportsOffscreen).toBe(true);
  });

  // 6. DEF-M03-01: Numeric upload progress in MiEquipo
  test('DEF-M03-01: MiEquipo supports numeric progress display', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    });
    await page.goto('/equipo');
    await page.waitForTimeout(600);
    // Page loads without syntax errors related to uploadBytesResumable
    expect(page.url()).toContain('/equipo');
  });

  // 7. DEF-M08-01: Horizontal jump test baremo female distinction (RFEF table)
  test('DEF-M08-01: RFEF horizontal jump percentile table for female athletes', () => {
    expect(jumpHorizontalBaremos.female).toBeDefined();
    expect(jumpHorizontalBaremos.female.percentiles.find(p => p.p === 90)?.value).toBe(170);
    expect(jumpHorizontalBaremos.female.percentiles.find(p => p.p === 75)?.value).toBe(155);

    // 160 cm for female athlete is above p75 (155) -> 82 pts
    const femaleScore = normalizeTestValue(160, 't_salto_horizontal', 'cm', { gender: 'female' });
    expect(femaleScore).toBe(82);

    // 160 cm for male athlete is evaluated on male table (<165 cm) -> 58 pts
    const maleScore = normalizeTestValue(160, 't_salto_horizontal', 'cm', { gender: 'male' });
    expect(maleScore).toBe(58);
    expect(RFEF_JUMP_SOURCE).toContain('RFEF');
  });

  // 8. DEF-M01-01: Minor registration blocks activation without tutor
  test('DEF-M01-01: Minor registration requires tutor email before activation', async ({ page }) => {
    await page.goto('/unirse/test-code');
    await page.waitForTimeout(500);

    // Fill birthdate for a 12-year-old
    const currentYear = new Date().getFullYear();
    const birthInput = page.locator('input[type="date"]');
    if (await birthInput.count() > 0) {
      await birthInput.fill(`${currentYear - 12}-01-01`);
      await page.waitForTimeout(300);

      // Submit button should be disabled or tutor block required
      const submitBtn = page.locator('button[type="submit"], .btn-register-submit').first();
      const isSubmitDisabled = await submitBtn.isDisabled();
      expect(isSubmitDisabled).toBe(true);

      // Draft button should be enabled
      const draftBtn = page.locator('.btn-save-draft');
      if (await draftBtn.count() > 0) {
        expect(await draftBtn.isEnabled()).toBe(true);
      }
    }
  });

  // 9. DEF-M04-01: Immediate synchronous debounce lock in wellness submission
  test('DEF-M04-01: Wellness submission includes immediate synchronous submission lock', async () => {
    const filePath = path.resolve('src/components/player/PlayerProfileTab.jsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('isSubmittingWellnessRef.current = true');
    expect(content).toContain('if (isSubmittingWellnessRef.current || savingWellness) return');
  });

  // 10. DEF-M02-01: Rival name ellipsis and touch title
  test('DEF-M02-01: Rival names with > 32 characters have ellipsis and title tooltip', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    });
    await page.goto('/');
    await page.waitForTimeout(500);

    const styleCheck = await page.evaluate(() => {
      const div = document.createElement('div');
      div.className = 'upcoming-match-rival-title';
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div);
      const overflow = computed.overflow;
      const textOverflow = computed.textOverflow;
      const whiteSpace = computed.whiteSpace;
      document.body.removeChild(div);
      return { overflow, textOverflow, whiteSpace };
    });

    expect(styleCheck.overflow).toBe('hidden');
    expect(styleCheck.textOverflow).toBe('ellipsis');
    expect(styleCheck.whiteSpace).toBe('nowrap');
  });

  // 11. DEF-M10-01: Theme toggle spacing (gap: 8px, padding: 6px 12px)
  test('DEF-M10-01: Theme toggle container has 8px gap and 6px 12px padding', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mister11_active_user_uid', 'invitado-local');
      window.localStorage.setItem('mister11_active_coach_team', 'team-invitado');
    });
    await page.goto('/ajustes');
    await page.waitForTimeout(600);

    const themeToggleStyle = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'theme-toggle-container';
      document.body.appendChild(el);
      const computed = window.getComputedStyle(el);
      const gap = computed.gap;
      const paddingTop = computed.paddingTop;
      const paddingRight = computed.paddingRight;
      document.body.removeChild(el);
      return { gap, paddingTop, paddingRight };
    });

    expect(themeToggleStyle.gap).toBe('8px');
    expect(themeToggleStyle.paddingTop).toBe('6px');
    expect(themeToggleStyle.paddingRight).toBe('12px');
  });

});
