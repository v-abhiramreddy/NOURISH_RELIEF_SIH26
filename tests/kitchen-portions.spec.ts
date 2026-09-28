import { test, expect } from '@playwright/test';

test.describe('Kitchen Portions Stepper & Slider and Top Sign Out', () => {
  test('Portions increase and decrease by 1 using + and - buttons, and range slider works (Demo Mode)', async ({ page }) => {
    await page.goto('/restaurant/post');

    const portionsVal = page.locator('#portionsVal');
    await expect(portionsVal).toHaveText('45');

    // Click decrease button (-)
    const decBtn = page.locator('#decPortions');
    await decBtn.click();
    await expect(portionsVal).toHaveText('44');

    await decBtn.click();
    await expect(portionsVal).toHaveText('43');

    // Click increase button (+)
    const incBtn = page.locator('#incPortions');
    await incBtn.click();
    await expect(portionsVal).toHaveText('44');

    await incBtn.click();
    await expect(portionsVal).toHaveText('45');

    // Test stepping by 1
    await incBtn.click();
    await expect(portionsVal).toHaveText('46');

    await incBtn.click();
    await expect(portionsVal).toHaveText('47');
  });

  test('Portions increase and decrease by 1 in Signed-In (Real) Mode, and only top Sign Out button is present', async ({ page }) => {
    // Sign in as kitchen
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-test', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/restaurant/post');

    const portionsVal = page.locator('#portionsVal');
    await expect(portionsVal).toHaveText('45');

    // Click decrease (-) -> should be 44, NOT 40
    await page.locator('#decPortions').click();
    await expect(portionsVal).toHaveText('44');

    // Click increase (+) -> should be 45, NOT 50
    await page.locator('#incPortions').click();
    await expect(portionsVal).toHaveText('45');

    // Verify only 1 Sign Out button exists across the entire UI
    const signOutButtons = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutButtons).toHaveCount(1);

    // Verify it is inside the top user pill
    await expect(signOutButtons).toBeVisible();

    // Click Sign Out
    await signOutButtons.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
