import { test, expect, Page } from '@playwright/test';

/**
 * Setup console and page error listener that fails if unexpected errors occur
 */
function attachErrorTracker(page: Page, capturedErrors: string[]) {
  page.on('pageerror', (exception) => {
    capturedErrors.push(`[Uncaught PageError at ${page.url()}] ${exception.message}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out benign external static resource warnings (e.g. offline fonts, CDNs)
      if (
        !text.includes('favicon.ico') &&
        !text.includes('Failed to load resource') &&
        !text.includes('net::ERR_')
      ) {
        capturedErrors.push(`[Console Error] ${text}`);
      }
    }
  });
}

test.describe('NourishRelief Complete End-to-End Suite', () => {
  test('Complete SIH Flow: Range Forecast -> Post & Freshness Risk -> Match NGO -> Routing -> Delivery -> Impact', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    attachErrorTracker(page, pageErrors);

    // ==========================================
    // 1. HOME LOADS & BRANDING
    // ==========================================
    await page.goto('/');
    await expect(page.getByText('NourishRelief').first()).toBeVisible();
    await expect(page.getByText(/Smart Food Waste Reduction & Redistribution/i).first()).toBeVisible();

    // Verify primary lifecycle navigation links
    await expect(page.getByRole('link', { name: /^Dashboard$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Forecast$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Kitchen$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^NGO$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Courier$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Proof$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Impact/i }).first()).toBeVisible();

    // Verify Lifecycle Overview & Stepper
    await expect(page.getByText(/Donation Lifecycle & State Machine/i)).toBeVisible();
    await expect(page.getByText('Kitchen: Post Food')).toBeVisible();
    await expect(page.getByText('NGO: Smart Claim')).toBeVisible();
    await expect(page.getByText('Volunteer: Optimized Pickup')).toBeVisible();
    await expect(page.getByText('Delivery & Impact Summary')).toBeVisible();

    // ==========================================
    // 2. FORECAST LOADS & DISPLAYS PREDICTION (RANGE-BASED)
    // ==========================================
    const forecastLink = page.getByRole('link', { name: /^Forecast$/i }).first();
    await forecastLink.click();
    await expect(page).toHaveURL(/.*\/forecast/);

    // Verify Forecast Title & Cards
    await expect(page.getByRole('heading', { name: 'Demand & Surplus Forecast', exact: true })).toBeVisible();
    await expect(page.getByText(/Tomorrow's Demand & Surplus Forecast/i)).toBeVisible();
    await expect(page.getByText(/Expected Demand/i).first()).toBeVisible();
    await expect(page.getByText(/Suggested Production/i).first()).toBeVisible();
    await expect(page.getByText(/Predicted Surplus/i).first()).toBeVisible();
    await expect(page.getByText(/Surplus Risk/i).first()).toBeVisible();
    await expect(page.getByText(/Actionable Recommendation/i).first()).toBeVisible();

    // Verify Model assists operational decisions; kitchen management authority
    await expect(
      page.getByText(/Model assists operational decisions; final batch sizes remain under kitchen management authority/i)
    ).toBeVisible();

    // Verify Transparent Context Adjustments Breakdown
    await expect(page.getByText(/Transparent Context Adjustments/i)).toBeVisible();
    await expect(page.getByText(/Historical Attendance Baseline/i)).toBeVisible();
    await expect(page.getByText(/demo parameter/i).first()).toBeVisible();

    // Verify subtle model assumption disclosure
    await expect(
      page.getByText(
        /Prototype model — context adjustments are configurable demo assumptions and are not universal validated coefficients\./i
      )
    ).toBeVisible();

    // Verify Kitchen Manager Override controls & Recalculation
    await expect(page.getByRole('button', { name: /Accept Recommendation/i })).toBeVisible();
    const adjustBtn = page.getByRole('button', { name: /Adjust Manually/i });
    await expect(adjustBtn).toBeVisible();

    // Click "Adjust Manually" and enter custom batch (595 meals)
    await adjustBtn.click();
    const customBatchInput = page.locator('input[type="number"][min="100"]');
    await expect(customBatchInput).toBeVisible();
    await customBatchInput.fill('595');
    await page.getByRole('button', { name: /Save Override/i }).click();
    await expect(page.getByText(/Manually Adjusted \(595 meals\)/i)).toBeVisible();
    await expect(page.getByText('595 meals').first()).toBeVisible();

    // Test persistence across reload
    await page.reload();
    await expect(page.getByText(/Manually Adjusted \(595 meals\)/i)).toBeVisible();
    await expect(page.getByText('595 meals').first()).toBeVisible();

    // Verify "Accept Recommendation" returns status to accepted
    await page.getByRole('button', { name: /Accept Recommendation/i }).click();
    await expect(page.getByText(/Recommendation Accepted/i)).toBeVisible();

    // Verify Context Adjustments Genuinely Affect Calculations
    // 1. Toggle Festival checkbox
    const festivalCheckbox = page.locator('input[type="checkbox"]').first();
    await festivalCheckbox.check();
    await expect(page.getByText(/Festival \/ Special Event:/i)).toBeVisible();

    // Verify Forecast Feedback Loop (P1)
    await expect(page.getByText(/Forecast Feedback Loop & Error Explanation/i)).toBeVisible();
    await expect(page.getByText(/Sudden localized thunderstorm/i)).toBeVisible();

    // Verify 10-Week Synthetic Historical Operational Data
    await expect(page.getByText(/Synthetic 10-Week Historical Operational Data/i)).toBeVisible();
    await expect(page.getByText('Week 10 (Recent)')).toBeVisible();

    // Click bridge CTA: Pre-Schedule Surplus Redistribution
    const scheduleSurplusBtn = page.getByRole('link', { name: /Pre-Schedule Surplus Redistribution/i });
    await expect(scheduleSurplusBtn).toBeVisible();
    await scheduleSurplusBtn.click();
    await expect(page).toHaveURL(/.*\/restaurant\/post/);

    // ==========================================
    // 3. SURPLUS POSTING & QUALITY / EXPIRY RISK
    // ==========================================
    await expect(page.getByRole('heading', { name: 'Post Surplus Food' })).toBeVisible();
    await expect(page.getByText('MoFPI Pilot Kitchen 01 · Regional Unit')).toBeVisible();

    // Fill Surplus Form Details
    const titleInput = page.locator('#itemTitle');
    await titleInput.fill('Mediterranean Saffron Rice & Stew');

    // Select category: Prepared Meals
    const categoryBtn = page.getByRole('button', { name: 'Prepared Meals' });
    await categoryBtn.click();

    // Set portion and weight count
    const incPortionsBtn = page.locator('#incPortions');
    await incPortionsBtn.click();
    await incPortionsBtn.click();

    // Select Hot Holding Condition — use the desktop right-column radio (name="tempHoldingR", first = Hot Holding)
    // The mobile section is lg:hidden at desktop viewport so we target the right-column group
    const hotHoldingRadio = page.locator('input[name="tempHoldingR"]').first();
    if (await hotHoldingRadio.count() > 0) {
      await hotHoldingRadio.click();
    } else {
      await page.getByText('Hot Holding (>60°C)').filter({ visible: true }).click();
    }

    // 4. Quality & Expiry Assessment Engine Verification
    await expect(page.getByText(/(AI )?Freshness & Expiry Risk Assessment/i).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Calculated Redistribution Window/i).filter({ visible: true })).toBeVisible();
    
    // Check statutory disclaimer — filter for visible instance (desktop right column is always rendered)
    await expect(
      page.getByText(/AI-assisted redistribution risk assessment. This does not replace statutory food-safety procedures./i).filter({ visible: true })
    ).toBeVisible();

    // Enter probe temperature: 65°C — use right-column input (id=tempProbeInputR) if available
    const tempInputR = page.locator('#tempProbeInputR');
    const tempInputMobile = page.locator('#tempProbeInput');
    if (await tempInputR.isVisible()) {
      await tempInputR.fill('65');
    } else if (await tempInputMobile.isVisible()) {
      await tempInputMobile.fill('65');
    }

    // Fill pickup instructions — use right-column textarea (id=pickupNotesR) or mobile one
    const notesInputR = page.locator('#pickupNotesR');
    const notesInputMobile = page.locator('#pickupNotes');
    if (await notesInputR.isVisible()) {
      await notesInputR.fill('Rear delivery dock #2. Insulated thermal carriers on-site. Ask for Chef Marcus.');
    } else {
      await notesInputMobile.fill('Rear delivery dock #2. Insulated thermal carriers on-site. Ask for Chef Marcus.');
    }

    // Publish donation
    const publishBtn = page.locator('#publishBtn');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // ==========================================
    // 5 & 6. INTELLIGENT NGO MATCHING & CLAIM
    // ==========================================
    await expect(page).toHaveURL(/.*\/ngo\/claim/, { timeout: 12000 });
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();

    // Verify AI Recommended Recipient Card
    await expect(page.getByText('AI Recommended Recipient')).toBeVisible();
    await expect(page.getByText(/Annapurna Seva Trust|Hope Harbor/i).first()).toBeVisible();
    await expect(page.getByText(/\d+%\s*Match Score/i).first()).toBeVisible();
    await expect(page.getByText('Distance').first()).toBeVisible();
    await expect(page.getByText('Capacity').first()).toBeVisible();

    // 7. State changes Available -> Claimed
    const claimBtn = page.locator('#claim-btn');
    await expect(claimBtn).toBeEnabled();
    await claimBtn.click();

    // ==========================================
    // 8 & 9. VOLUNTEER TASK & ROUTE OPTIMIZATION
    // ==========================================
    await expect(page).toHaveURL(/.*\/volunteer\/pickup/, { timeout: 12000 });
    await expect(page.getByRole('heading', { name: 'Pickup Task' })).toBeVisible();

    // Verify AI Optimized Route Card
    await expect(page.getByText('AI Optimized Route')).toBeVisible();
    await expect(page.getByText('5.8 km').first()).toBeVisible();
    await expect(page.getByText('19 min').first()).toBeVisible();
    await expect(page.getByText('7:30 PM').first()).toBeVisible();
    await expect(page.getByText(/OPTIMIZED/i).first()).toBeVisible();

    // Verify exact required routing notice and prioritization reason
    await expect(
      page.getByText(/Route recommendations designed to reduce delivery time and unnecessary travel/i)
    ).toBeVisible();
    await expect(page.getByText(/Prioritization Reason:/i)).toBeVisible();
    await expect(
      page.getByText(/Lowest transit time \(19 mins\), reducing delivery time and temperature exposure\./i)
    ).toBeVisible();

    // 10. Pickup changes Claimed -> InTransit
    // Complete safety checklist
    const checkboxes = page.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < cbCount; i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.check();
      }
    }

    // Confirm Pickup with 4-digit PIN
    const confirmPickupBtn = page.getByRole('button', {
      name: /Confirm Pickup & Start Delivery/i,
    });
    await expect(confirmPickupBtn).toBeEnabled();
    await confirmPickupBtn.click();

    // ==========================================
    // 11 & 12. DELIVERY COMPLETION & PROOF
    // ==========================================
    await expect(page).toHaveURL(/.*\/volunteer\/summary/, { timeout: 12000 });
    await expect(page.getByRole('heading', { name: 'Delivery Completed' })).toBeVisible();
    await expect(page.getByText('Proof of Delivery')).toBeVisible();
    await expect(page.getByText(/Sunita Sharma|Sarah Lindqvist/i)).toBeVisible();
    await expect(page.getByText('Signature')).toBeVisible();
    await expect(page.getByText('Delivery Photo')).toBeVisible();

    // Rate donor 5 stars
    const star5Btn = page.getByRole('button', { name: '5 star' });
    await star5Btn.click();
    await expect(page.getByText(/Rating saved/i)).toBeVisible();

    // ==========================================
    // 13. IMPACT / SUSTAINABILITY DASHBOARD
    // ==========================================
    const viewImpactBtn = page.getByRole('button', { name: /View Sustainability & Impact Dashboard/i });
    await expect(viewImpactBtn).toBeVisible();
    await viewImpactBtn.click();
    await expect(page).toHaveURL(/.*\/impact/);

    // Verify NOURISHRELIEF IMPACT Page and KPIs
    await expect(page.getByText('NOURISHRELIEF IMPACT').first()).toBeVisible();
    await expect(page.getByText('Food Saved').first()).toBeVisible();
    await expect(page.getByText('Meals Redistributed').first()).toBeVisible();
    await expect(page.getByText('Est. CO₂ Avoided').first()).toBeVisible();
    await expect(page.getByText('Successful Deliveries').first()).toBeVisible();

    // Verify Configurable CO2 Emission Factor Disclosure
    await expect(
      page.getByText(/Illustrative estimate using a configurable emission factor of 2.0 kg CO2e per kg food saved/i).first()
    ).toBeVisible();

    // Verify Food Waste Trend (Jan through Sep)
    await expect(page.getByText(/Food Waste Trend \(2026\)/i)).toBeVisible();
    await expect(page.getByText('Jan').first()).toBeVisible();
    await expect(page.getByText('Sep').first()).toBeVisible();
    await expect(page.getByText('September (Current)').first()).toBeVisible();

    // ==========================================
    // 14. STATE PERSISTENCE AFTER RELOAD
    // ==========================================
    await page.reload();
    await expect(page.getByText('NOURISHRELIEF IMPACT').first()).toBeVisible();
    await expect(page.getByText('Food Saved').first()).toBeVisible();

    // Go back to home and verify persistent status
    await page.goto('/');
    await expect(page.getByText('NourishRelief').first()).toBeVisible();
    await expect(page.getByText(/IN_TRANSIT|COMPLETED/i)).toBeVisible();

    // Assert zero uncaught errors throughout the entire test
    expect(pageErrors).toEqual([]);
  });

  test('15. Mobile Responsive Viewport: All 7 routes render with zero horizontal overflow', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    attachErrorTracker(page, pageErrors);

    // Set compact mobile viewport (375x667 - standard iPhone/Android size)
    await page.setViewportSize({ width: 375, height: 667 });

    const routesToTest = [
      { path: '/', expectedText: 'NourishRelief' },
      { path: '/forecast', expectedText: 'Demand & Surplus Forecast' },
      { path: '/restaurant/post', expectedText: 'Post Surplus Food' },
      { path: '/ngo/claim', expectedText: 'Claim Donation' },
      { path: '/volunteer/pickup', expectedText: 'Pickup Task' },
      { path: '/volunteer/summary', expectedText: 'Delivery Completed' },
      { path: '/impact', expectedText: 'NOURISHRELIEF IMPACT' },
    ];

    for (const route of routesToTest) {
      await page.goto(route.path);
      await expect(page.getByText(route.expectedText).first()).toBeVisible();

      // Check for horizontal scroll overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(
        hasHorizontalOverflow,
        `Route ${route.path} has horizontal scroll overflow at 375px viewport`
      ).toBeFalsy();
    }

    expect(pageErrors).toEqual([]);
  });

  test('16. Dark Mode: Toggle switches theme, applies consistent styles, and persists across reloads', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    attachErrorTracker(page, pageErrors);

    await page.goto('/');
    const toggleBtn = page.getByRole('button', { name: /switch to dark mode|dark|light/i }).first();
    await expect(toggleBtn).toBeVisible();

    // Verify initial light mode
    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkInitially).toBeFalsy();

    // Toggle to Dark Mode
    await toggleBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const storedThemeDark = await page.evaluate(() => localStorage.getItem('nourishrelief_theme'));
    expect(storedThemeDark).toBe('dark');

    // Verify dark colors applied to body and cards
    const colorsDark = await page.evaluate(() => ({
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      cardBg: window.getComputedStyle(document.querySelector('.bg-white') || document.body).backgroundColor,
    }));
    expect(colorsDark.bodyBg).toBe('rgb(11, 17, 32)');
    expect(colorsDark.cardBg).toBe('rgb(19, 28, 46)');

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const storedThemeReload = await page.evaluate(() => localStorage.getItem('nourishrelief_theme'));
    expect(storedThemeReload).toBe('dark');

    // Navigate to /forecast and verify theme persists
    await page.goto('/forecast');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle back to Light Mode
    const toggleBackBtn = page.getByRole('button', { name: /switch to light mode|light/i }).first();
    await toggleBackBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const storedThemeLight = await page.evaluate(() => localStorage.getItem('nourishrelief_theme'));
    expect(storedThemeLight).toBe('light');

    expect(pageErrors).toEqual([]);
  });

  test('17. Global Mouse-Wheel Scrolling: Scrolling functions anywhere over desktop page content', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    attachErrorTracker(page, pageErrors);

    await page.setViewportSize({ width: 1280, height: 720 });

    for (const path of ['/', '/forecast', '/restaurant/post', '/ngo/claim', '/volunteer/pickup', '/impact']) {
      await page.goto(path);

      // Scroll from center over interactive cards
      await page.mouse.move(640, 360);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(200);

      const scrollCenter = await page.evaluate(() => window.scrollY);
      expect(scrollCenter, `Route ${path} did not scroll when mouse-wheel used at center`).toBeGreaterThan(0);

      // Scroll further from left margin over blank area
      await page.mouse.move(60, 360);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(200);

      const scrollLeft = await page.evaluate(() => window.scrollY);
      expect(scrollLeft, `Route ${path} did not scroll when mouse-wheel used at blank area`).toBeGreaterThan(scrollCenter);
    }

    expect(pageErrors).toEqual([]);
  });

  test('18. Reset Demo: Right-corner button resets platform state and returns to initial baseline', async ({ page }) => {
    await page.goto('/impact');
    const resetBtn = page.getByRole('button', { name: /Reset Demo/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.getByText('AVAILABLE').first()).toBeVisible();
  });
});
