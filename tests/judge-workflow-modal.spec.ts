import { test, expect } from '@playwright/test';

test.describe('Sign In Page — View Judge Workflow Button & Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('1. Button appears directly below Note for Judges card and opens modal on the same page', async ({
    page,
  }) => {
    await page.goto('/login');

    // 1. Verify Note for Judges card is visible
    const noteCard = page.locator('aside[aria-label="Note for Judges"]');
    await expect(noteCard).toBeVisible();

    // 2. Verify button appears directly below Note for Judges card
    const viewWorkflowBtn = page.locator('#viewJudgeWorkflowBtn');
    await expect(viewWorkflowBtn).toBeVisible();
    await expect(viewWorkflowBtn).toHaveText(/View Judge Workflow/);

    // Verify it is positioned after the aside element in DOM order
    const parentContainer = noteCard.locator('..');
    const asideAndButton = parentContainer.locator('> *');
    const firstTag = await asideAndButton.nth(0).evaluate((el) => el.tagName.toLowerCase());
    const secondTag = await asideAndButton.nth(1).evaluate((el) => el.tagName.toLowerCase());
    expect(firstTag).toBe('aside');
    expect(secondTag).toBe('button');

    // 3. Click button and verify modal opens on the same page without navigating away
    await viewWorkflowBtn.click();
    expect(page.url()).toContain('/login');

    const modal = page.locator('div[role="dialog"][aria-labelledby="workflow-modal-title"]');
    await expect(modal).toBeVisible();

    // 4. Verify all workflow text matches exactly
    await expect(modal.locator('#workflow-modal-title')).toHaveText(
      /NourishRelief — Quick Workflow/
    );

    // Step 1
    await expect(modal.getByText('1. Forecast')).toBeVisible();
    await expect(modal.getByText('Kitchen → Check demand → Adjust production')).toBeVisible();

    // Step 2
    await expect(modal.getByText('2. Redistribute')).toBeVisible();
    await expect(modal.getByText('Post surplus → NGO match → Claim')).toBeVisible();

    // Step 3
    await expect(modal.getByText('3. Pickup')).toBeVisible();
    await expect(
      modal.getByText('Self-Pickup / Volunteer Dispatch → Verify PIN')
    ).toBeVisible();

    // Step 4
    await expect(modal.getByText('4. Deliver')).toBeVisible();
    await expect(
      modal.getByText('Temperature sign-off → Delivery confirmation')
    ).toBeVisible();

    // Step 5
    await expect(modal.getByText('5. Impact')).toBeVisible();
    await expect(
      modal.getByText('View food saved → Meals redistributed → Impact')
    ).toBeVisible();

    // Recommended Demo Path
    await expect(modal.getByText('Recommended Demo Path')).toBeVisible();
    await expect(
      modal.getByText('Forecast → Kitchen → NGO → Delivery → Proof → Impact')
    ).toBeVisible();

    // 5. Verify modal closes via close button (X)
    const closeBtn = modal.locator('button[aria-label="Close modal"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).toHaveCount(0);

    // 6. Verify modal closes via backdrop click
    await viewWorkflowBtn.click();
    await expect(modal).toBeVisible();
    // Click backdrop (outside the panel)
    await page.mouse.click(10, 10);
    await expect(modal).toHaveCount(0);

    // 7. Verify modal closes via Escape key
    await viewWorkflowBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('2. Root URL (/) also renders the button and modal properly', async ({ page }) => {
    await page.goto('/');

    const viewWorkflowBtn = page.locator('#viewJudgeWorkflowBtn');
    await expect(viewWorkflowBtn).toBeVisible();

    await viewWorkflowBtn.click();
    const modal = page.locator('div[role="dialog"][aria-labelledby="workflow-modal-title"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#workflow-modal-title')).toHaveText(
      /NourishRelief — Quick Workflow/
    );

    // Close modal
    await modal.locator('button[aria-label="Close modal"]').click();
    await expect(modal).toHaveCount(0);
  });

  test('3. Button appears ONLY on the Sign In page (not on operational / dashboard pages)', async ({
    page,
  }) => {
    // Check multiple operational routes in Demo Mode
    const routesToCheck = [
      '/overview',
      '/forecast',
      '/restaurant/post',
      '/ngo/claim',
      '/volunteer/pickup',
      '/impact',
      '/dashboard',
    ];

    for (const route of routesToCheck) {
      await page.goto(route);
      const btn = page.locator('#viewJudgeWorkflowBtn');
      await expect(btn).toHaveCount(0);
    }
  });
});
