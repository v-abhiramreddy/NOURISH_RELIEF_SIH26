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

    // The active batch is now clean fresh empty state (activeDonation = null), NOT stuck on completed and NOT fake Matar Pulao
    await expect(page.getByText('No Active Batch Posted').first()).toBeVisible();
    await expect(page.getByText('No Active Surplus Batch Posted')).toBeVisible();
    await expect(page.getByText('Awaiting Publication').first()).toBeVisible();

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

    // Active status is fresh clean awaiting donations
    await expect(page.getByText('No active donations currently available.')).toBeVisible();

    // BUT history of verified intakes is preserved!
    await expect(page.getByText(/Verified Intake History/i)).toBeVisible();

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

  test('Kitchen posts surplus food in Sign-In mode, signs out, NGO signs in and sees the exact posted food', async ({
    page,
  }) => {
    await page.context().clearCookies();

    // 1. Sign in as Kitchen
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-user', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/restaurant/post');
    await expect(page.locator('#itemTitle')).toBeVisible();

    // Post custom food item
    const customFoodTitle = 'Special Awadhi Biryani & Mirchi Salan';
    await page.locator('#itemTitle').fill(customFoodTitle);
    await page.locator('#incPortions').click(); // 46
    await page.locator('#incPortions').click(); // 47
    await page.locator('#publishBtn').click();
    await expect(page.getByText('Donation Published Successfully')).toBeVisible();

    // 2. Kitchen signs out using the top Sign Out button
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await expect(page).toHaveURL(/\/login/);

    // 3. NGO signs in
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-ngo-user', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'ngo', domain: 'localhost', path: '/' },
    ]);

    // Check NGO dashboard
    await page.goto('/dashboard/ngo');
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();
    await expect(page.getByText(customFoodTitle)).toBeVisible();
    await expect(page.getByText('47 meals').first()).toBeVisible();

    // Check NGO claim page
    await page.goto('/ngo/claim');
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();
    await expect(page.getByText(customFoodTitle).first()).toBeVisible();
    await expect(page.getByText('47 Meals').first()).toBeVisible();
  });

  test('Fresh Sign-In Mode starts with activeDonation = null, shows clean empty prompt states and baseline forecast', async ({
    page,
  }) => {
    await page.context().clearCookies();

    // 1. Sign in as fresh kitchen user
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-fresh', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/dashboard/kitchen');
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // Verify Option A: Baseline forecast cards are visible
    await expect(page.getByText('Tomorrow Demand')).toBeVisible();
    await expect(page.getByText('Suggested Production')).toBeVisible();
    await expect(page.getByText('Predicted Surplus')).toBeVisible();

    // Verify Active Donation card shows 0 portions and clean No Active Batch badge
    await expect(page.getByText('0 portions')).toBeVisible();
    await expect(page.getByText('No Active Batch Posted').first()).toBeVisible();

    // Verify Active Surplus Batch Registration card shows clean empty prompt state
    await expect(page.getByText('No Active Surplus Batch Posted')).toBeVisible();
    await expect(page.getByRole('link', { name: /Post Surplus Food Now/i })).toBeVisible();

    // Verify Donation Lifecycle shows Awaiting Publication
    await expect(page.getByText('Awaiting Publication').first()).toBeVisible();
    await expect(page.locator('section[aria-label="Donation Lifecycle"]').getByText('No active batch posted')).toBeVisible();

    // Verify fake "Matar Pulao" does NOT appear anywhere in the active batch or lifecycle
    await expect(page.locator('section[aria-label="Active Surplus Batch"]').getByText('Matar Pulao')).not.toBeVisible();

    // 2. Post food
    await page.getByRole('link', { name: /Post Surplus Food Now/i }).click();
    await expect(page).toHaveURL(/\/restaurant\/post/);

    const postTitle = 'Fresh Organic Dal Makhani & Jeera Rice';
    await page.locator('#itemTitle').fill(postTitle);
    await page.locator('#publishBtn').click();
    await expect(page.getByText('Donation Published Successfully')).toBeVisible();

    // 3. Return to Kitchen Dashboard and verify the batch is now active
    await page.goto('/dashboard/kitchen');
    await expect(page.getByText(postTitle).first()).toBeVisible();
    await expect(page.getByText('Published · Available for Claim').first()).toBeVisible();
    await expect(page.getByText('Stage 1: Published')).toBeVisible();
  });
});
