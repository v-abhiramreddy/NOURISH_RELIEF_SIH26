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

    // Primary workflow action links
    await expect(page.getByRole('link', { name: /View Forecast/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Post Surplus Food/i })).toBeVisible();

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

    // Primary action link to claim workflow
    await expect(page.getByRole('link', { name: /View & Claim Surplus/i })).toBeVisible();

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

    // Action links
    await expect(page.getByRole('link', { name: /Active Pickup Route/i })).toBeVisible();
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

  test('5. Dynamic Role Dashboard (/dashboard): Dynamically renders role-appropriate dashboard and navigation in Demo Mode', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Default demo role is Kitchen: /dashboard renders Kitchen Operations Dashboard
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // Verify Kitchen role navigation: Dashboard, Forecast, Kitchen, Impact (NGO, Courier, Proof are hidden)
    const nav = page.getByRole('navigation', { name: /Lifecycle Workflow Navigation/i });
    await expect(nav.getByRole('link', { name: /^Dashboard$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Forecast$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Impact$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^NGO$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Courier$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Proof$/i })).toHaveCount(0);

    // Switch demo role to NGO:
    await page.getByRole('button', { name: /^NGO$/i }).first().click();
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();
    // NGO navigation: Dashboard, NGO, Impact (Forecast, Kitchen, Courier, Proof are hidden)
    await expect(nav.getByRole('link', { name: /^Dashboard$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^NGO$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Impact$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Forecast$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Courier$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Proof$/i })).toHaveCount(0);

    // Switch demo role to Courier:
    await page.getByRole('button', { name: /^Courier$/i }).first().click();
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();
    // Courier navigation: Dashboard, Courier, Proof, Impact (Forecast, Kitchen, NGO are hidden)
    await expect(nav.getByRole('link', { name: /^Dashboard$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Courier$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Proof$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Impact$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Forecast$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^NGO$/i })).toHaveCount(0);

    // Switch demo role to Admin:
    await page.getByRole('button', { name: /^Admin$/i }).first().click();
    await expect(page.getByRole('heading', { name: /Admin & ESG Compliance Dashboard/i })).toBeVisible();
    // Admin navigation: All links visible
    await expect(nav.getByRole('link', { name: /^Dashboard$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Forecast$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^NGO$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Courier$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Proof$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Impact$/i })).toBeVisible();
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

  test('9. Demo Mode Role Switching: Switcher tabs navigate between dashboards seamlessly', async ({
    page,
  }) => {
    await page.goto('/dashboard/kitchen');

    // Demo role switcher is present
    const roleNav = page.getByRole('navigation', { name: /Role Workspace Switcher/i });
    await expect(roleNav).toBeVisible();

    // Switch to NGO tab
    await roleNav.getByRole('button', { name: /^NGO$/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/ngo/);
    await expect(page.getByRole('heading', { name: /NGO Recipient Dashboard/i })).toBeVisible();

    // Switch to Courier tab
    await roleNav.getByRole('button', { name: /^Courier$/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/courier/);
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();

    // Switch to Admin tab
    await roleNav.getByRole('button', { name: /^Admin$/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin/);
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

    // 3. User remains in Kitchen role (navbar still shows Forecast, Kitchen, Impact, but NOT NGO/Courier)
    const nav = page.getByRole('navigation', { name: /Lifecycle Workflow Navigation/i });
    await expect(nav.getByRole('link', { name: /^Kitchen$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^NGO$/i })).toHaveCount(0);

    // 4. NGO can subsequently discover and claim this newly published donation
    await page.goto('/ngo/claim');
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();
    await expect(page.getByText('Dedicated Kitchen Workflow Test Feast').first()).toBeVisible();
  });
});

