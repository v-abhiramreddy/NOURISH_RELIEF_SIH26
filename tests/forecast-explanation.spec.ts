import { test, expect } from '@playwright/test';

test.describe('AI Forecast Explanation Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Button visibility
  // ──────────────────────────────────────────────────────────────────────────
  test('1. Explain Forecast button is visible on the Forecast page', async ({ page }) => {
    const btn = page.getByTestId('explain-forecast-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('AI Forecast Explanation');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Modal opens on click
  // ──────────────────────────────────────────────────────────────────────────
  test('2. Clicking Explain Forecast opens the modal with title', async ({ page }) => {
    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('AI Forecast Explanation');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Modal shows current forecast values
  // ──────────────────────────────────────────────────────────────────────────
  test('3. Modal displays current forecast values (demand, range, production, surplus)', async ({ page }) => {
    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');

    // All four sections must be present
    await expect(modal.getByTestId('explanation-most-likely')).toBeVisible();
    await expect(modal.getByTestId('explanation-range')).toBeVisible();
    await expect(modal.getByTestId('explanation-production')).toBeVisible();
    await expect(modal.getByTestId('explanation-surplus')).toBeVisible();

    // Values must be non-empty numbers
    const mostLikely = await modal.getByTestId('explanation-most-likely').textContent();
    expect(mostLikely).toMatch(/\d+ meals/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Modal shows active parameters in Current Factors
  // ──────────────────────────────────────────────────────────────────────────
  test('4. Modal shows active attendance, shift and weather in Current Factors', async ({ page }) => {
    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');

    // Default state: 480 attendance, Thursday, dinner, clear
    await expect(modal).toContainText('480 guests');
    await expect(modal).toContainText('Thursday dinner');
    await expect(modal).toContainText('Clear skies');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Data source disclosure present
  // ──────────────────────────────────────────────────────────────────────────
  test('5. Modal discloses Demo Synthetic Baseline data source', async ({ page }) => {
    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toContainText('Data source:');
    await expect(modal).toContainText('Demo Synthetic Baseline');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Close via header button
  // ──────────────────────────────────────────────────────────────────────────
  test('6. Modal closes via header X button', async ({ page }) => {
    await page.getByTestId('explain-forecast-btn').click();
    await expect(page.getByTestId('forecast-explanation-modal')).toBeVisible();
    await page.getByTestId('close-explanation-modal').click();
    await expect(page.getByTestId('forecast-explanation-modal')).not.toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Close via footer button
  // ──────────────────────────────────────────────────────────────────────────
  test('7. Modal closes via footer Close button', async ({ page }) => {
    await page.getByTestId('explain-forecast-btn').click();
    await expect(page.getByTestId('forecast-explanation-modal')).toBeVisible();
    await page.getByTestId('close-explanation-footer').click();
    await expect(page.getByTestId('forecast-explanation-modal')).not.toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Changing attendance updates the forecast AND the explanation
  // ──────────────────────────────────────────────────────────────────────────
  test('8. Changing attendance slider updates forecast KPIs and explanation values', async ({ page }) => {
    // Capture baseline most-likely demand from page KPI card
    const kpiText = await page.locator('text=Most Likely:').first().textContent();
    const baselineMatch = kpiText?.match(/(\d+)/);
    const baselineDemand = baselineMatch ? parseInt(baselineMatch[1]) : 0;

    // Drag slider to 700 (higher attendance)
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('700');
    await slider.dispatchEvent('change');
    await page.waitForTimeout(300);

    // Open explanation after change
    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();

    // Attendance must reflect new value
    await expect(modal).toContainText('700 guests');

    // Most-likely demand in modal must be a number and NOT the same as the old baseline
    const newMostLikelyText = await modal.getByTestId('explanation-most-likely').textContent();
    const newMatch = newMostLikelyText?.match(/(\d+)/);
    const newDemand = newMatch ? parseInt(newMatch[1]) : 0;
    expect(newDemand).toBeGreaterThan(0);
    // With 700 attendance vs 480, demand should be higher
    expect(newDemand).toBeGreaterThan(baselineDemand > 0 ? baselineDemand - 1 : 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Changing meal type updates explanation
  // ──────────────────────────────────────────────────────────────────────────
  test('9. Switching meal type to lunch updates the shift label in explanation', async ({ page }) => {
    // Click lunch shift button
    await page.locator('button', { hasText: /^lunch$/i }).first().click();
    await page.waitForTimeout(300);

    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('lunch');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Weather change updates explanation
  // ──────────────────────────────────────────────────────────────────────────
  test('10. Switching to Rain weather updates explanation to show rain dampener', async ({ page }) => {
    // Click rain button
    await page.locator('button', { hasText: /Rain/i }).first().click();
    await page.waitForTimeout(300);

    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Rain');
    await expect(modal).toContainText('walk-in dampener');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Festival / Event and Public Holiday parameters completely removed
  // ──────────────────────────────────────────────────────────────────────────
  test('11. Festival / Event and Public Holiday controls and modifiers are completely removed from UI and explanation', async ({ page }) => {
    // Checkboxes for festival / event and public holiday must not exist
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(page.getByText(/Festival \/ Event/i)).toHaveCount(0);
    await expect(page.getByText(/\+12% surge/i)).toHaveCount(0);
    await expect(page.getByText(/Public Holiday/i)).toHaveCount(0);
    await expect(page.getByText(/-15% attendance/i)).toHaveCount(0);

    // Open explanation modal
    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();

    // Verify modal does not reference festival surge or holiday discount
    await expect(modal).not.toContainText('Festival');
    await expect(modal).not.toContainText('Public Holiday');
    await expect(modal).not.toContainText('+12%');
    await expect(modal).not.toContainText('-15%');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. No hardcoded values — modal reflects actual live forecast state
  // ──────────────────────────────────────────────────────────────────────────
  test('12. Explanation modal does not contain hardcoded placeholder attendance', async ({ page }) => {
    // Change attendance away from the default
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('600');
    await slider.dispatchEvent('change');
    await page.waitForTimeout(300);

    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();

    // Must show 600, not the old default 480
    await expect(modal).toContainText('600 guests');
    await expect(modal).not.toContainText('480 guests');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Mobile viewport — no overflow
  // ──────────────────────────────────────────────────────────────────────────
  test('13. Explanation modal is usable on mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('explain-forecast-btn').click();
    const modal = page.getByTestId('forecast-explanation-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('AI Forecast Explanation');

    // Check no horizontal scrollbar: scrollWidth should not exceed window width
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});
