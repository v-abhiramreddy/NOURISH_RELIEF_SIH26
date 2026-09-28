import { test, expect } from '@playwright/test';

test.describe('Phase 3 — Role-Based Dashboards & Workspaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('1. Kitchen Dashboard: Renders demand ranges, production guidance, surplus status, and actions', async ({
    page,
  }) => {
    await page.goto('/dashboard/kitchen');

    // Page title and role identity
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Institutional Kitchen/i).first()).toBeVisible();

    // Demand Forecast ranges and metrics
    await expect(page.getByText(/Tomorrow Demand/i)).toBeVisible();
    await expect(page.getByText(/Range:/i)).toBeVisible();

    // Production buffer & recommendation
    await expect(page.getByText(/Suggested Production/i)).toBeVisible();
    await expect(page.getByText(/Buffer status:/i)).toBeVisible();

    // Primary workflow action links (Impact is not a primary role action for kitchen)
    await expect(page.getByRole('link', { name: /View Forecast/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Post Surplus Food/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View Impact/i })).toHaveCount(0);

    // Surplus & active donations section
    await expect(page.getByText(/Active Surplus Batch/i)).toBeVisible();
  });

  test('2. NGO Dashboard: Renders surplus discovery, matching score, intake monitoring, and claim action', async ({
    page,
  }) => {
    await page.goto('/dashboard/ngo');

    // Page title and role identity
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Verified Food Recipient/i).first()).toBeVisible();

    // Available surplus & matching engine
    await expect(page.getByText(/Available Perishable Surplus from Institutional Donors/i)).toBeVisible();

    // Primary action link to claim workflow (Impact is not a primary role action for NGO)
    await expect(page.getByRole('link', { name: /View & Claim Surplus/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View Impact/i })).toHaveCount(0);

    // Incoming delivery & intake status
    await expect(page.getByText(/Incoming Delivery Status/i)).toBeVisible();
  });

  test('3. Courier Dashboard: Renders assigned pickup, route waypoints, safety checklist, and transit actions', async ({
    page,
  }) => {
    await page.goto('/dashboard/courier');

    // Page title and role identity
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Certified Rapid Cold-Chain/i).first()).toBeVisible();

    // Active transit mission
    await expect(page.getByText(/Assigned Perishable Food Pickup Task/i)).toBeVisible();
    await expect(page.getByText(/Optimized Route/i)).toBeVisible();

    // Route Waypoints & Checkpoints
    await expect(page.getByText(/Route Waypoints & Checkpoints/i)).toBeVisible();

    // Safety and checklist
    await expect(page.getByText(/Equipment & Thermal Compliance/i)).toBeVisible();

    // Action links: Active Pickup Route is visible; standalone Delivery Proof is removed; View Impact is locked
    await expect(page.getByRole('link', { name: /Active Pickup Route/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Delivery Proof' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /View Impact/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Impact/i })).toBeDisabled();
  });

  test('4. Admin / ESG Dashboard: Renders high-level platform impact, live lifecycle, and audit controls', async ({
    page,
  }) => {
    await page.goto('/dashboard/admin');

    // Page title and role identity
    await expect(page.getByRole('heading', { name: /Admin & ESG Compliance Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Platform Governance/i).first()).toBeVisible();

    // Core ESG telemetry metrics
    await expect(page.getByText(/Food Waste Diverted/i)).toBeVisible();
    await expect(page.getByText(/Meals Redistributed/i)).toBeVisible();
    await expect(page.getByText(/CO₂ Emissions Avoided/i)).toBeVisible();

    // Live state machine overview
    await expect(page.getByText(/Live Cluster Workflow & State Machine/i)).toBeVisible();

    // Audit and navigation controls
    await expect(page.getByRole('link', { name: /Surplus Batch Registrations/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /NGO Matching & Claims/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Volunteer Transit Routing/i })).toBeVisible();
  });

  test('5. Unified Demo Dashboard (/dashboard): Renders unified demonstration dashboard and simulates complete lifecycle without role switching', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // /dashboard renders unified demonstration dashboard
    await expect(page.getByRole('heading', { name: /NourishRelief Demonstration Dashboard/i })).toBeVisible();

    // Verify Demo navigation: Dashboard, Forecast, Kitchen, NGO, Delivery, Proof, Impact
    const nav = page.getByRole('navigation', { name: /Lifecycle Workflow Navigation/i });
    await expect(nav.getByRole('link', { name: /^Dashboard$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Forecast$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^NGO$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Delivery$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Proof$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Impact$/i })).toBeVisible();

    // Verify Demo Role selector buttons are NOT shown in Demo Mode
    await expect(page.getByText(/Demo Role:/i)).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: /Role Workspace Switcher/i })).toHaveCount(0);

    // Verify Lifecycle badge and Reset Demo button are visible
    await expect(page.getByText(/Lifecycle:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset Demo/i }).first()).toBeVisible();

    // Step 1 -> Step 2: Publish surplus & Claim food simulation directly from dashboard
    await page.getByRole('button', { name: /Publish Surplus/i }).click();
    await expect(page.getByText(/Published Successfully/i)).toBeVisible();

    // Step 2: Claim Food
    const claimBtn = page.getByRole('button', { name: /Claim Food/i });
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();
    await expect(page.getByText(/Food Claimed Successfully/i)).toBeVisible();

    // Step 3: Simulate Courier
    const courierBtn = page.getByRole('button', { name: /Simulate Courier/i });
    await expect(courierBtn).toBeVisible();
    await courierBtn.click();
    await expect(page.getByText(/Courier Dispatch Confirmed/i)).toBeVisible();

    // Step 4: Complete Delivery
    const deliveryBtn = page.getByRole('button', { name: /Complete Delivery/i });
    await expect(deliveryBtn).toBeVisible();
    await deliveryBtn.click();
    await expect(page.getByText(/Delivery Completed Successfully/i)).toBeVisible();

    // Reset Demo resets lifecycle
    await page.getByRole('button', { name: /Reset Demo/i }).first().click();
    await expect(page.getByText(/Demo Reset Successfully/i)).toBeVisible();
  });

  test('6. Role Authorization Boundary: Real Mode NGO user cannot access Kitchen Dashboard', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-ngo-session',
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

    await page.goto('/dashboard/kitchen');

    // RoleGuard boundary triggered
    await expect(page.getByText(/Role Authorization Boundary/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Restricted Section: Kitchen Role Only/i })
    ).toBeVisible();

    // Action button leads to their designated workspace
    const workspaceLink = page.getByRole('link', { name: /Go to My Workspace/i });
    await expect(workspaceLink).toBeVisible();
    await workspaceLink.click();
    await expect(page).toHaveURL(/.*\/ngo\/claim/);
  });

  test('7. Role Authorization Boundary: Real Mode Kitchen user cannot access Courier Dashboard', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-kitchen-session',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'kitchen',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard/courier');

    // RoleGuard boundary triggered
    await expect(page.getByText(/Role Authorization Boundary/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Restricted Section: Volunteer \/ Courier Role Only/i })
    ).toBeVisible();

    const workspaceLink = page.getByRole('link', { name: /Go to My Workspace/i });
    await expect(workspaceLink).toBeVisible();
    await workspaceLink.click();
    await expect(page).toHaveURL(/.*\/restaurant\/post/);
  });

  test('8. Role Authorization: Admin can access all four dashboards without boundary block', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-admin-session',
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

    // Admin accessing Kitchen dashboard
    await page.goto('/dashboard/kitchen');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // Admin accessing NGO dashboard
    await page.goto('/dashboard/ngo');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();

    // Admin accessing Courier dashboard
    await page.goto('/dashboard/courier');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();

    // Admin accessing Admin dashboard
    await page.goto('/dashboard/admin');
    await expect(page.getByText(/Role Authorization Boundary/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Admin & ESG Compliance Dashboard/i })).toBeVisible();
  });

  test('9. Role Dashboard Direct Access: Dedicated role dashboard routes render their designated workspaces', async ({
    page,
  }) => {
    // Kitchen dashboard route
    await page.goto('/dashboard/kitchen');
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // NGO dashboard route
    await page.goto('/dashboard/ngo');
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();

    // Courier dashboard route
    await page.goto('/dashboard/courier');
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();

    // Admin dashboard route
    await page.goto('/dashboard/admin');
    await expect(page.getByRole('heading', { name: /Admin & ESG Compliance Dashboard/i })).toBeVisible();
  });

  test('10. Mobile Responsive Viewport: All 4 dashboards render with zero horizontal overflow', async ({
    page,
  }) => {
    // 375px mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const dashboardPaths = [
      '/dashboard/kitchen',
      '/dashboard/ngo',
      '/dashboard/courier',
      '/dashboard/admin',
    ];

    for (const path of dashboardPaths) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const isOverflowing = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth > el.clientWidth;
      });

      expect(isOverflowing, `Expected no horizontal overflow on mobile for ${path}`).toBeFalsy();
    }
  });

  test('11. Kitchen Publish Workflow: Publishing donation stays on Kitchen page, confirms success, and does not switch role to NGO', async ({
    page,
  }) => {
    await page.goto('/restaurant/post');
    await expect(page.getByRole('heading', { name: 'Post Surplus Food' })).toBeVisible();

    // Fill surplus donation details
    await page.locator('#itemTitle').fill('Dedicated Kitchen Workflow Test Feast');
    await page.locator('#holdingHotR').click();
    await page.locator('#tempProbeInputR').fill('66.0');

    // Click Publish Donation
    const publishBtn = page.locator('#publishBtn');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // 1. MUST NOT redirect to NGO page — user remains on Kitchen post page
    await expect(page).toHaveURL(/.*\/restaurant\/post/);

    // 2. Clear success confirmation is displayed
    await expect(page.getByText('Donation Published Successfully')).toBeVisible();
    await expect(
      page.getByText('Your surplus food is now available for redistribution.')
    ).toBeVisible();

    // 3. User remains on Kitchen page
    const nav = page.getByRole('navigation', { name: /Lifecycle Workflow Navigation/i });
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toBeVisible();

    // 4. NGO can subsequently discover and claim this newly published donation
    await page.goto('/ngo/claim');
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();
    await expect(page.getByText('Dedicated Kitchen Workflow Test Feast').first()).toBeVisible();
  });

  test('12. NGO Claim Workflow: Claiming food stays on NGO page, confirms success, and does not redirect to Courier', async ({
    page,
  }) => {
    await page.goto('/ngo/claim');
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();

    // Click Claim Food
    const claimBtn = page.locator('#claim-btn');
    await expect(claimBtn).toBeEnabled();
    await claimBtn.click();

    // 1. MUST NOT redirect to Courier page — user remains on NGO claim page
    await expect(page).toHaveURL(/.*\/ngo\/claim/);

    // 2. Clear success confirmation is displayed
    await expect(page.getByText('Food Claimed Successfully')).toBeVisible();
    await expect(
      page.getByText('The food donation has been successfully claimed.')
    ).toBeVisible();

    // 3. Courier can subsequently process the claimed donation
    await page.goto('/volunteer/pickup');
    await expect(page.getByRole('heading', { name: 'Pickup Task' })).toBeVisible();
  });
});

