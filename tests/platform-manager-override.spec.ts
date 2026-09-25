import { test, expect } from '@playwright/test';

test.describe('Phase 3 Patch — Admin Governance & Platform Manager Override', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('1. Admin Dashboard is Read-Only: Admin cannot perform Platform Manager mutations', async ({
    page,
  }) => {
    // Authenticate as Admin in Real Mode
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

    await page.goto('/dashboard/admin');

    // Page title and auditor role tag
    await expect(page.getByRole('heading', { name: /Admin & ESG Compliance Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Read-Only Auditor Mode/i)).toBeVisible();
    await expect(page.getByText(/read-only auditor view/i)).toBeVisible();

    // Verify Override Mode controls are NOT present for Admin
    await expect(page.getByRole('button', { name: /Enable Override Mode/i })).not.toBeVisible();
    await expect(page.getByText(/Controlled Operational Override Panel/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Apply State Override/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Reassign Courier Task/i })).not.toBeVisible();
  });

  test('2. Platform Manager Governance Access & Safe Override Mode Toggle', async ({
    page,
  }) => {
    // Authenticate as Platform Manager in Real Mode
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-manager-session',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'platform_manager',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard/admin');

    // Verify Platform Manager identity badge
    await expect(page.getByText(/Platform Manager Operational Oversight Workspace/i)).toBeVisible();
    await expect(page.getByText(/Elevated Operations Role/i)).toBeVisible();

    // Default state: Override Mode is Inactive (read-only safety lock)
    const enableBtn = page.getByRole('button', { name: /Enable Override Mode/i });
    await expect(enableBtn).toBeVisible();
    await expect(page.getByText(/Override Mode Inactive \(Read-Only Safety Lock\)/i)).toBeVisible();
    await expect(page.getByText(/Controlled Operational Override Panel/i)).not.toBeVisible();

    // Enable Override Mode
    await enableBtn.click();

    // Verify Override Mode Active banner and disable button
    await expect(
      page.getByText(/Override Mode Active · Authorized Operational Override Engaged/i)
    ).toBeVisible();
    const disableBtn = page.getByRole('button', { name: /Disable Override Mode/i });
    await expect(disableBtn).toBeVisible();
    await expect(page.getByText(/Controlled Operational Override Panel/i)).toBeVisible();

    // Disable Override Mode
    await disableBtn.click();
    await expect(
      page.getByText(/Override Mode Active · Authorized Operational Override Engaged/i)
    ).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Enable Override Mode/i })).toBeVisible();
  });

  test('3. Platform Manager Lifecycle State Override: Requires confirmation and logs audit trail', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-manager-session',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'platform_manager',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard/admin');

    // Enable Override Mode
    await page.getByRole('button', { name: /Enable Override Mode/i }).click();
    await expect(page.getByText(/Controlled Operational Override Panel/i)).toBeVisible();

    // Select target state and enter reason
    const stateSelect = page.locator('select').first();
    await stateSelect.selectOption('in_transit');

    const reasonInput = page.getByPlaceholder(/Courier device offline, verbal confirmation/i);
    await reasonInput.fill('Emergency triage: verified verbally from NGO intake rasoi manager');

    // Click Apply State Override
    await page.getByRole('button', { name: /Apply State Override/i }).click();

    // Confirmation Modal appears
    await expect(
      page.getByRole('heading', { name: /Confirm Operational State Override/i })
    ).toBeVisible();
    await expect(
      page.getByText(/Transition donation status from "available" to "in_transit"/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Emergency triage: verified verbally from NGO intake rasoi manager/i)
    ).toBeVisible();

    // Confirm the override
    await page.getByRole('button', { name: /Confirm & Apply Override/i }).click();

    // Modal closes and success notification is displayed
    await expect(
      page.getByText(/Successfully executed state override to "in_transit"/i)
    ).toBeVisible();

    // Verify State Machine badge updated to IN_TRANSIT
    const stateMachineSection = page.locator('section[aria-label="Ecosystem State Machine"]');
    await expect(stateMachineSection.getByText('IN_TRANSIT')).toBeVisible();

    // Verify Audit Trail records the event
    const auditSection = page.locator(
      'section[aria-label="Authorized Operational Override Audit Trail"]'
    );
    await expect(auditSection.getByText(/Lifecycle State Override/i).first()).toBeVisible();
    await expect(auditSection.getByText(/available → in_transit/i).first()).toBeVisible();
    await expect(
      auditSection.getByText(/Emergency triage: verified verbally from NGO intake rasoi manager/i)
    ).toBeVisible();
  });

  test('4. Platform Manager Courier Reassignment: Requires confirmation and updates assigned courier', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'nr_auth_session',
        value: 'test-manager-session',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'nr_user_role',
        value: 'platform_manager',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard/admin');

    // Enable Override Mode
    await page.getByRole('button', { name: /Enable Override Mode/i }).click();

    // Fill in reassignment reason
    const reassignmentReasonInput = page.getByPlaceholder(
      /Primary courier vehicle puncture, standby dispatched/i
    );
    await reassignmentReasonInput.fill('Primary courier vehicle puncture, standby courier deployed');

    // Click Reassign Courier Task
    await page.getByRole('button', { name: /Reassign Courier Task/i }).click();

    // Confirmation Modal appears
    await expect(
      page.getByRole('heading', { name: /Confirm Courier Task Reassignment/i })
    ).toBeVisible();
    await expect(
      page.getByText(/Primary courier vehicle puncture, standby courier deployed/i)
    ).toBeVisible();

    // Confirm
    await page.getByRole('button', { name: /Confirm & Apply Override/i }).click();

    // Verify success notice
    await expect(
      page.getByText(/Successfully reassigned courier task to "Priya Verma/i)
    ).toBeVisible();

    // Verify state machine display updated to Priya Verma
    const stateMachineSection = page.locator('section[aria-label="Ecosystem State Machine"]');
    await expect(stateMachineSection.getByText(/Priya Verma/i)).toBeVisible();

    // Verify audit trail contains the reassignment entry
    const auditSection = page.locator(
      'section[aria-label="Authorized Operational Override Audit Trail"]'
    );
    await expect(auditSection.getByText(/Courier Task Reassignment/i).first()).toBeVisible();
    await expect(
      auditSection.getByText(/Primary courier vehicle puncture, standby courier deployed/i)
    ).toBeVisible();
  });

  test('5. Demo Mode: Switcher tab includes Manager and allows interactive demo override', async ({
    page,
  }) => {
    await page.goto('/dashboard/kitchen');

    // Demo role switcher contains Manager tab
    const roleNav = page.getByRole('navigation', { name: /Role Workspace Switcher/i });
    await expect(roleNav).toBeVisible();

    const managerBtn = roleNav.getByRole('button', { name: /^Manager$/i });
    await expect(managerBtn).toBeVisible();

    // Click Manager tab
    await managerBtn.click();
    await expect(page).toHaveURL(/.*\/dashboard\/admin/);

    // Platform Manager controls become available in Demo Mode
    await expect(page.getByText(/Platform Manager Operational Oversight Workspace/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enable Override Mode/i })).toBeVisible();
  });
});
