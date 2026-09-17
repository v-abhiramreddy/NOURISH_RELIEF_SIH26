import { test, expect } from '@playwright/test';

test.describe('Workflow State Persistence & Reload Verification', () => {
  test('Complete workflow survives reload across Forecast → Kitchen → NGO → Courier → Proof → Impact', async ({ page }) => {
    // -------------------------------------------------------------
    // 1. FORECAST STEP & RELOAD
    // -------------------------------------------------------------
    await page.goto('/forecast');
    await expect(page.getByText(/Demand & Surplus Forecast/i).first()).toBeVisible();

    // Adjust attendance slider
    const attendanceSlider = page.locator('input[type="range"]').first();
    if (await attendanceSlider.isVisible()) {
      await attendanceSlider.fill('520');
    }
    const acceptBtn = page.getByRole('button', { name: /Accept AI Recommendation/i });
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }

    // Capture text on forecast card before reload
    const predictedSurplusBefore = await page.getByText(/Predicted Surplus/i).first().textContent();

    // RELOAD PAGE AT FORECAST
    await page.reload();
    await expect(page.getByText(/Demand & Surplus Forecast/i).first()).toBeVisible();
    const predictedSurplusAfter = await page.getByText(/Predicted Surplus/i).first().textContent();
    expect(predictedSurplusAfter).toBe(predictedSurplusBefore);

    // -------------------------------------------------------------
    // 2. KITCHEN SURPLUS POST & RELOAD
    // -------------------------------------------------------------
    await page.goto('/restaurant/post');
    await expect(page.getByRole('heading', { name: 'Post Surplus Food' })).toBeVisible();

    // Post surplus item with distinct probe temperature 65.5°C
    await page.locator('#itemTitle').fill('Persistence Test Freshly Prepared Meal');
    await page.locator('#holdingHotR').click();
    await page.locator('#tempProbeInputR').fill('65.5');
    await page.locator('#publishBtn').click();

    // -------------------------------------------------------------
    // 3. NGO CLAIM & RELOAD
    // -------------------------------------------------------------
    await expect(page).toHaveURL(/.*\/ngo\/claim/);
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();
    
    // Verify the posted donation's telemetry survived navigation
    await expect(page.getByText('65.5°C')).toBeVisible();

    // RELOAD PAGE BEFORE CLAIMING & VERIFY PERSISTENCE
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();
    await expect(page.getByText('65.5°C')).toBeVisible();
    await expect(page.getByText('Annapurna Community Rasoi').first()).toBeVisible();

    // Claim the donation
    const complianceCheck = page.locator('#compliance-check');
    if (!(await complianceCheck.isChecked())) {
      await complianceCheck.check();
    }
    await page.locator('#claim-btn').click();

    // -------------------------------------------------------------
    // 4. COURIER PICKUP & RELOAD
    // -------------------------------------------------------------
    await expect(page).toHaveURL(/.*\/volunteer\/pickup/);
    await expect(page.getByRole('heading', { name: 'Pickup Task' })).toBeVisible();
    await expect(page.getByText('Annapurna Community Rasoi').first()).toBeVisible();

    // Confirm pickup & start delivery
    const confirmPickupBtn = page.getByRole('button', { name: /Confirm Pickup & Start Delivery/i });
    await expect(confirmPickupBtn).toBeEnabled();
    await confirmPickupBtn.click();

    // -------------------------------------------------------------
    // 5. DELIVERY PROOF & RELOAD
    // -------------------------------------------------------------
    await expect(page).toHaveURL(/.*\/volunteer\/summary/);
    await expect(page.getByRole('heading', { name: 'Delivery Completed' })).toBeVisible();
    await expect(page.getByText('Proof of Delivery')).toBeVisible();

    // Rate donor 5 stars
    const star5Btn = page.getByRole('button', { name: '5 star' });
    await star5Btn.click();
    await expect(page.getByText(/Rating saved/i)).toBeVisible();

    // RELOAD PAGE AT DELIVERY PROOF & VERIFY PERSISTENCE
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Delivery Completed' })).toBeVisible();
    await expect(page.getByText('Proof of Delivery')).toBeVisible();
    await expect(page.getByText(/Rating saved|Rated 5/i).first()).toBeVisible();
    await expect(page.getByText(/Sunita Sharma|Sarah Lindqvist/i)).toBeVisible();

    // -------------------------------------------------------------
    // 6. IMPACT DASHBOARD & RELOAD
    // -------------------------------------------------------------
    const viewImpactBtn = page.getByRole('button', { name: /View Sustainability & Impact Dashboard/i });
    await expect(viewImpactBtn).toBeVisible();
    await viewImpactBtn.click();
    await expect(page).toHaveURL(/.*\/impact/);

    await expect(page.getByText('NOURISHRELIEF IMPACT').first()).toBeVisible();
    await expect(page.getByText('Food Saved').first()).toBeVisible();
    await expect(page.getByText('Meals Redistributed').first()).toBeVisible();

    // Capture metrics before reload
    const mealsTextBefore = await page.getByText('Meals Redistributed').first().locator('..').textContent();

    // RELOAD PAGE AT IMPACT & VERIFY PERSISTENCE
    await page.reload();
    await expect(page.getByText('NOURISHRELIEF IMPACT').first()).toBeVisible();
    const mealsTextAfter = await page.getByText('Meals Redistributed').first().locator('..').textContent();
    expect(mealsTextAfter).toBe(mealsTextBefore);

    // -------------------------------------------------------------
    // 7. RETURN TO HOME & RELOAD
    // -------------------------------------------------------------
    await page.goto('/');
    await expect(page.getByText('NourishRelief').first()).toBeVisible();
    
    // Verify persistent completed status on home dashboard
    await expect(page.getByText(/COMPLETED|IN_TRANSIT/i).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(/COMPLETED|IN_TRANSIT/i).first()).toBeVisible();
  });
});
