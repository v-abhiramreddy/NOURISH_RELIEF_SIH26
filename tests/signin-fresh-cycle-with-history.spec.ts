import { test, expect } from '@playwright/test';

test.describe('Sign-In Mode Fresh Operational Cycle & Preserved History', () => {
  test('Completing delivery and signing out/in resets active operational state to new while keeping history', async ({
    page,
  }) => {
    await page.context().clearCookies();

    // 1. Sign in as Kitchen in Real Mode
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-test', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    // Visit Kitchen Dashboard
    await page.goto('/dashboard/kitchen');
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // Post a unique surplus batch
    await page.goto('/restaurant/post');
    await page.locator('#itemTitle').fill('SIH Historic Dal Tadka & Jeera Rice');
    await page.locator('#holdingHotR').click();
    await page.locator('#tempProbeInputR').fill('65.0');
    await page.locator('#publishBtn').click();
    await expect(page.getByText('Donation Published Successfully')).toBeVisible();

    // 2. NGO claims the donation
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-ngo-test', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'ngo', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/ngo/claim');
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();
    await expect(page.getByText('SIH Historic Dal Tadka & Jeera Rice').first()).toBeVisible();

    // Claim the food
    const claimBtn = page.locator('#claim-btn');
    await expect(claimBtn).toBeEnabled();
    await claimBtn.click();
    await expect(page.getByText('Food Claimed Successfully')).toBeVisible();

    // 3. Courier completes pickup and delivery
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-courier-test', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'courier', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/volunteer/pickup');
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) await cb.check();
    }
    const confirmBtn = page.getByRole('button', { name: /Confirm Pickup & Start Delivery/i });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Finalize delivery on summary
    await page.goto('/volunteer/summary');
    await expect(page.getByRole('heading', { name: /Delivery Completed/i })).toBeVisible();

    // 4. Verify Courier Dashboard reflects completed state and shows in history
    await page.goto('/dashboard/courier');
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View Impact/i })).toBeVisible();
    await expect(page.getByText(/Completed Delivery Proofs/i)).toBeVisible();

    // 5. User signs out via Sign Out button in navbar
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // 6. User signs back in as Kitchen
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-new', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/dashboard/kitchen');
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // The active batch is now NEW / Available for redistribution, NOT stuck on completed
    await expect(page.getByText(/Published · Available for Claim/i).first()).toBeVisible();

    // BUT the history of items is preserved in Surplus Batch History!
    await expect(page.getByText(/Surplus Batch History/i)).toBeVisible();
    await expect(page.getByText('SIH Historic Dal Tadka & Jeera Rice').first()).toBeVisible();

    // 7. User signs back in as NGO
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-ngo-new', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'ngo', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/dashboard/ngo');
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();

    // Active status is fresh and ready for claims
    await expect(page.getByRole('link', { name: /View & Claim Surplus/i })).toBeVisible();

    // BUT history of claimed items and verified intakes is preserved!
    await expect(page.getByText(/Verified Intake History/i)).toBeVisible();
    await expect(page.getByText(/Claimed Allocations History/i)).toBeVisible();
    await expect(page.getByText('SIH Historic Dal Tadka & Jeera Rice').first()).toBeVisible();

    // 8. User signs back in as Courier
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-courier-new', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'courier', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/dashboard/courier');
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();

    // Active cycle is fresh (Impact is locked again until next delivery is completed)
    await expect(page.getByRole('button', { name: /View Impact \(Locked\)/i })).toBeVisible();

    // BUT history of completed deliveries is preserved!
    await expect(page.getByText(/Completed Delivery Proofs/i)).toBeVisible();

    // 9. User signs back in as Admin
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-admin-new', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'admin', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/dashboard/admin');
    await expect(page.getByRole('heading', { name: /Admin & ESG Compliance Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Verified Audit Trail/i)).toBeVisible();
  });
});
