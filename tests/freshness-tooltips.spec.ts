import { test, expect } from '@playwright/test';

const EXPECTED_TOOLTIPS = {
  holdingTemp: {
    label: 'Holding Temperature',
    text: 'How the food is currently being stored, such as hot holding, chilled, or room temperature.',
  },
  probeTemp: {
    label: 'Recorded Probe Temp (°C)',
    text: 'The current temperature recorded from the food.',
  },
  elapsedTime: {
    label: 'Elapsed Time',
    text: 'How much time has passed since the food was prepared.',
  },
  redistWindow: {
    label: 'Calculated Redistribution Window',
    text: 'The estimated time remaining in which the food can be considered for redistribution based on the assessment.',
  },
  ruleEngine: {
    label: 'Rule-Based Engine',
    text: 'Uses predefined rules based on preparation time, temperature, and holding condition to assess redistribution risk.',
    disclaimer: 'This is an AI-assisted redistribution risk assessment and does not replace statutory food-safety procedures.',
  },
};

test.describe('Freshness & Expiry Risk Tooltip UX Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies for fresh state
    await page.context().clearCookies();
  });

  test('Desktop (Demo Mode): All 5 info icons display exact tooltips on hover and hide on mouse leave', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/restaurant/post');

    // 1. Holding Temperature
    const holdingTempBtn = page
      .locator('button[aria-label="Information for Holding Temperature"]')
      .filter({ visible: true });
    await expect(holdingTempBtn).toBeVisible();
    await holdingTempBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text)).toBeVisible();
    // Move mouse away to hide
    await page.mouse.move(0, 0);
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text)).not.toBeVisible();

    // 2. Recorded Probe Temp (°C)
    const probeTempBtn = page
      .locator('button[aria-label="Information for Recorded Probe Temp (°C)"]')
      .filter({ visible: true });
    await expect(probeTempBtn).toBeVisible();
    await probeTempBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.probeTemp.text)).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByText(EXPECTED_TOOLTIPS.probeTemp.text)).not.toBeVisible();

    // 3. Elapsed Time
    const elapsedTimeBtn = page
      .locator('button[aria-label="Information for Elapsed Time"]')
      .filter({ visible: true });
    await expect(elapsedTimeBtn).toBeVisible();
    await elapsedTimeBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.elapsedTime.text)).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByText(EXPECTED_TOOLTIPS.elapsedTime.text)).not.toBeVisible();

    // 4. Calculated Redistribution Window
    const redistWindowBtn = page
      .locator('button[aria-label="Information for Calculated Redistribution Window"]')
      .filter({ visible: true });
    await expect(redistWindowBtn).toBeVisible();
    await redistWindowBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.redistWindow.text)).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByText(EXPECTED_TOOLTIPS.redistWindow.text)).not.toBeVisible();

    // 5. Rule-Based Engine
    const ruleEngineBtn = page
      .locator('button[aria-label="Information for Rule-Based Engine"]')
      .filter({ visible: true });
    await expect(ruleEngineBtn).toBeVisible();
    await ruleEngineBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.ruleEngine.text)).toBeVisible();
    await expect(page.getByText(EXPECTED_TOOLTIPS.ruleEngine.disclaimer).first()).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByText(EXPECTED_TOOLTIPS.ruleEngine.text)).not.toBeVisible();

    // 6. Verify statutory notice remains visible on page
    await expect(
      page.getByText('AI-assisted redistribution risk assessment. This does not replace statutory food-safety procedures.').filter({ visible: true })
    ).toBeVisible();
  });

  test('Mobile: Info icons show tooltip on tap, dismiss on tap outside or icon tap', async ({
    page,
  }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/restaurant/post');

    const holdingTempBtn = page
      .locator('button[aria-label="Information for Holding Temperature"]')
      .first();
    await expect(holdingTempBtn).toBeVisible();

    // Tap to show
    await holdingTempBtn.click();
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text).first()).toBeVisible();

    // Tap outside to dismiss
    await page.mouse.click(10, 10);
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text)).not.toBeVisible();

    // Tap to show again
    await holdingTempBtn.click();
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text).first()).toBeVisible();

    // Tap icon again to dismiss
    await holdingTempBtn.click();
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text)).not.toBeVisible();

    // Test Rule-Based Engine on mobile
    const ruleEngineBtn = page
      .locator('button[aria-label="Information for Rule-Based Engine"]')
      .first();
    await expect(ruleEngineBtn).toBeVisible();
    await ruleEngineBtn.click();
    await expect(page.getByText(EXPECTED_TOOLTIPS.ruleEngine.text).first()).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(page.getByText(EXPECTED_TOOLTIPS.ruleEngine.text)).not.toBeVisible();

    // Confirm no horizontal scrollbar / overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Sign-In Mode (Real Mode Kitchen): All tooltips work identically', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Sign in cookies
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-user', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/restaurant/post');

    // Rule-Based Engine tooltip in signed in mode
    const ruleEngineBtn = page
      .locator('button[aria-label="Information for Rule-Based Engine"]')
      .filter({ visible: true });
    await expect(ruleEngineBtn).toBeVisible();
    await ruleEngineBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.ruleEngine.text)).toBeVisible();

    // Holding Temperature tooltip in signed in mode
    const holdingTempBtn = page
      .locator('button[aria-label="Information for Holding Temperature"]')
      .filter({ visible: true });
    await expect(holdingTempBtn).toBeVisible();
    await holdingTempBtn.hover();
    await expect(page.getByText(EXPECTED_TOOLTIPS.holdingTemp.text)).toBeVisible();
  });
});
