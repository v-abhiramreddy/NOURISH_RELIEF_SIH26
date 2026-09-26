import { test, expect } from '@playwright/test';

test.describe('Phase 2 — Authentication & Role-Based Access Control (RBAC)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any test cookies before each test
    await page.context().clearCookies();
  });

  test('1. Login Page: Renders with honest Demo Mode indicator and 4 exact application roles', async ({
    page,
  }) => {
    await page.goto('/login');

    // Title & Branding
    await expect(page.getByRole('heading', { name: /Sign in to Real Mode/i })).toBeVisible();
    await expect(page.getByText(/Smart India Hackathon 2026/i)).toBeVisible();

    // Mode Indicator: Accurate status indicating Supabase credentials are configured and Real Mode is ready
    await expect(
      page.getByText(/Real Mode Available · Supabase Auth Ready/i)
    ).toBeVisible();

    // Sign In inputs
    await expect(page.getByPlaceholder('chef@kitchen01.mofpi.gov.in')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In \(Real Mode\)/i })).toBeVisible();

    // Switch to Register Tab
    await page.getByRole('button', { name: /^Register$/i }).click();
    await expect(page.getByRole('heading', { name: /Register Organization/i })).toBeVisible();

    // Verify exactly the 4 supported application roles in dropdown
    const roleSelect = page.locator('select');
    await expect(roleSelect).toBeVisible();
    const options = await roleSelect.locator('option').allTextContents();

    expect(options.some((opt) => opt.includes('Kitchen'))).toBeTruthy();
    expect(options.some((opt) => opt.includes('NGO / Food Recipient'))).toBeTruthy();
    expect(options.some((opt) => opt.includes('Volunteer / Courier'))).toBeTruthy();
    expect(options.some((opt) => opt.includes('Admin / ESG'))).toBeTruthy();
    expect(options.length).toBe(4); // Exactly 4 roles, no extraneous roles

    // Demo Mode bypass button
    await expect(
      page.getByRole('button', { name: /Continue in Demo Mode \(Offline Fallback\)/i })
    ).toBeVisible();
  });

  test('2. Demo Mode Bypass: Evaluator can continue to Demo Mode without credentials', async ({
    page,
  }) => {
    await page.goto('/login');
    const demoBtn = page.getByRole('button', {
      name: /Continue in Demo Mode \(Offline Fallback\)/i,
    });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/.*\//);
    await expect(page.getByText(/Donation Lifecycle & State Machine/i)).toBeVisible();

    // DemoRoleSwitcher shows Demo Mode indicator
    await expect(page.getByText('Demo Mode')).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign In/i })).toBeVisible();
  });

  test('3. DemoRoleSwitcher: Clearly distinguishes Demo Mode and links to Real Mode Sign In', async ({
    page,
  }) => {
    await page.goto('/overview');

    // Demo Mode pill is visible in switcher
    const demoPill = page.locator('aside').getByText('Demo Mode');
    await expect(demoPill).toBeVisible();

    // Link to Sign In is visible
    const signInLink = page.getByRole('link', { name: /Sign In/i }).first();
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Sign in to Real Mode/i })).toBeVisible();
  });

  test('4. Safe Login Error Handling: Attempting real auth with unprovisioned credentials displays auth notice', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByPlaceholder('chef@kitchen01.mofpi.gov.in').fill('test@demo.com');
    await page.getByPlaceholder('••••••••••••').fill('password123');
    await page.getByRole('button', { name: /Sign In \(Real Mode\)/i }).click();

    // Shows helpful error from Supabase Auth rather than crashing
    await expect(
      page.getByText(/Invalid login credentials/i)
    ).toBeVisible();
  });

  test('5. Role Authorization Boundary: NGO role accessing Kitchen module triggers RoleGuard', async ({
    page,
  }) => {
    // Set cookies simulating an authenticated NGO user in Real Mode
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-ngo-user-uuid',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'ngo',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Attempt to navigate to kitchen-restricted route
    await page.goto('/restaurant/post');

    // RoleGuard boundary should be triggered
    await expect(page.getByText(/Role Authorization Boundary/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Restricted Section: Kitchen Role Only/i })
    ).toBeVisible();
    await expect(
      page.getByText(/This operational module is restricted to Kitchen accounts in Real Mode/i)
    ).toBeVisible();
    await expect(page.getByText(/Active \(Database RLS \+ App Boundary\)/i)).toBeVisible();

    // Action button to go to their own workspace (NGO)
    const myWorkspaceBtn = page.getByRole('link', { name: /Go to My Workspace \(NGO\)/i });
    await expect(myWorkspaceBtn).toBeVisible();
    await myWorkspaceBtn.click();

    // Navigates cleanly to NGO workspace
    await expect(page).toHaveURL(/.*\/ngo\/claim/);
  });

  test('6. Role Authorization Boundary: Courier role accessing Kitchen module triggers RoleGuard', async ({
    page,
  }) => {
    // Set cookies simulating an authenticated Courier user in Real Mode
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-courier-user-uuid',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'courier',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Attempt to navigate to kitchen-restricted route
    await page.goto('/restaurant/post');

    // RoleGuard boundary triggered
    await expect(page.getByText(/Role Authorization Boundary/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Restricted Section: Kitchen Role Only/i })
    ).toBeVisible();

    // Action button to go to Courier workspace
    const courierBtn = page.getByRole('link', { name: /Go to My Workspace \(Courier\)/i });
    await expect(courierBtn).toBeVisible();
    await courierBtn.click();

    await expect(page).toHaveURL(/.*\/volunteer\/pickup/);
  });

  test('7. Admin Role: Can access all operational routes for audit and administrative oversight', async ({
    page,
  }) => {
    // Set cookies simulating an Admin / ESG user in Real Mode
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-admin-user-uuid',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'admin',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Admin accessing Kitchen module — allowed
    await page.goto('/restaurant/post');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByText(/Post Surplus Food/i)).toBeVisible();

    // Admin accessing NGO module — allowed
    await page.goto('/ngo/claim');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();

    // Admin accessing Courier module — allowed
    await page.goto('/volunteer/pickup');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pickup Task' })).toBeVisible();

    // Admin accessing Impact module — allowed
    await page.goto('/impact');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByText(/Sustainability & ESG Redistribution Telemetry/i)).toBeVisible();
  });
});
