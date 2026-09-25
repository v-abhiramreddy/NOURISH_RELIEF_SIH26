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

  test('5. Role Dispatch Portal (/dashboard): Renders role selector in Demo Mode', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /Role-Based Workspaces & Dashboards/i })).toBeVisible();
    await expect(page.getByText(/Select a role workspace below/i)).toBeVisible();

    // All 4 role cards are available
    await expect(page.getByRole('heading', { name: /Kitchen Dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /NGO \/ Recipient Dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Courier Transit Dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Admin & ESG Dashboard/i })).toBeVisible();
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
});
