import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Brand Colors Verification', () => {
  test('Smart India Hackathon 2026 Brand Colors match the Indian Flag Tricolor', async ({ page }) => {
    await page.goto('/restaurant/post');

    // Header branding elements
    const smartSpan = page.locator('span:text-is("Smart")').first();
    const indiaSpan = page.locator('span:text-is("India")').first();
    const hackathonSpan = page.locator('span:text-is("Hackathon")').first();
    const yearSpan = page.locator('span:text-is("2026")').first();

    await expect(smartSpan).toBeVisible();
    await expect(indiaSpan).toBeVisible();
    await expect(hackathonSpan).toBeVisible();
    await expect(yearSpan).toBeVisible();

    // Verify CSS classes: Smart (saffron), India (white), Hackathon (flag green), 2026 (chakra blue)
    await expect(smartSpan).toHaveClass(/text-\[#FF9933\]/);
    await expect(indiaSpan).toHaveClass(/text-white/);
    await expect(hackathonSpan).toHaveClass(/text-\[#138808\]/);
    await expect(yearSpan).toHaveClass(/text-\[#38bdf8\]/);
  });

  test('Mobile viewport (375x812): No duplicated sections appear on Post Food page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/restaurant/post');

    // 1. Freshness & Expiry Risk Assessment should be visible exactly once
    const freshnessHeadings = page.getByRole('heading', { name: 'Freshness & Expiry Risk Assessment' });
    const visibleFreshness = await freshnessHeadings.evaluateAll((elements) =>
      elements.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      }).length
    );
    expect(visibleFreshness).toBe(1);

    // 2. Holding Temperature label should be visible exactly once
    const holdingTempLabels = page.getByText('Holding Temperature', { exact: true });
    const visibleHolding = await holdingTempLabels.evaluateAll((elements) =>
      elements.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      }).length
    );
    expect(visibleHolding).toBe(1);

    // 3. Pickup Cutoff Time label should be visible exactly once
    const pickupCutoffLabels = page.getByText('Pickup Cutoff Time', { exact: true });
    const visiblePickup = await pickupCutoffLabels.evaluateAll((elements) =>
      elements.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      }).length
    );
    expect(visiblePickup).toBe(1);

    // 4. Pickup Handover Notes should be visible exactly once
    const pickupNotesFields = page.locator('#pickupNotes');
    await expect(pickupNotesFields).toBeVisible();

    // The desktop-only right column field #pickupNotesR should NOT be visible on mobile
    const pickupNotesR = page.locator('#pickupNotesR');
    await expect(pickupNotesR).not.toBeVisible();

    // 5. Desktop-only right column radio buttons should NOT be visible on mobile
    await expect(page.locator('#holdingHotR')).not.toBeVisible();
    await expect(page.locator('#tempProbeInputR')).not.toBeVisible();

    // 6. Sticky bottom bar should have the publish button at bottom-0
    const publishBtn = page.locator('#publishBtn');
    await expect(publishBtn).toBeVisible();

    // Verify no horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Desktop viewport (1280x800): Only right column is visible, mobile sections are hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/restaurant/post');

    // On desktop, the right column fields should be visible
    await expect(page.locator('#holdingHotR')).toBeVisible();
    await expect(page.locator('#tempProbeInputR')).toBeVisible();
    await expect(page.locator('#pickupNotesR')).toBeVisible();

    // Mobile inputs should NOT be visible on desktop
    await expect(page.locator('#pickupNotes')).not.toBeVisible();
    await expect(page.locator('#tempProbeInput')).not.toBeVisible();

    // Exactly 1 visible Freshness Assessment heading on desktop as well
    const freshnessHeadings = page.getByRole('heading', { name: 'Freshness & Expiry Risk Assessment' });
    const visibleFreshness = await freshnessHeadings.evaluateAll((elements) =>
      elements.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      }).length
    );
    expect(visibleFreshness).toBe(1);
  });
});
