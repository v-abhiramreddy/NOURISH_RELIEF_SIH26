import { test, expect } from '@playwright/test';

test.describe('NGO Scored Transparency Modal on /ngo/claim', () => {
  test('Popup opens, displays dynamic weights (35%, 25%, 25%, 15%), adapts to selected NGO, and closes cleanly', async ({
    page,
  }) => {
    // 1. Visit NGO claim page
    await page.goto('/ngo/claim');
    await expect(page.getByRole('heading', { name: 'Claim Donation' })).toBeVisible();

    // Verify existing UI elements remain untouched
    await expect(page.getByText(/\d+%\s*Match Score/i).first()).toBeVisible();
    await expect(page.getByText(/Match Rationale:/i)).toBeVisible();
    await expect(page.getByText('Ranked Regional Candidates (3 Evaluated)')).toBeVisible();

    // 2. Verify "How is this match scored?" trigger button is visible
    const howScoredBtn = page.getByRole('button', { name: /How is this match scored\?/i });
    await expect(howScoredBtn).toBeVisible();

    // 3. Click the trigger button and verify modal opens
    await howScoredBtn.click();
    const modal = page.locator('[data-testid="score-transparency-modal"]');
    await expect(modal).toBeVisible();

    // 4. Verify title and dynamic Match Score banner for default candidate (Annapurna)
    await expect(modal.getByText('Scored Match Transparency')).toBeVisible();
    await expect(modal.getByText(/MATCH SCORE — \d+%/i)).toBeVisible();
    await expect(modal.getByText('Annapurna Seva Trust')).toBeVisible();

    // 5. Verify the 4 weighted factors and exact percentages
    await expect(modal.getByText(/Distance — 35%/i)).toBeVisible();
    await expect(modal.getByText(/Capacity — 25%/i)).toBeVisible();
    await expect(modal.getByText(/Fit — 25%/i)).toBeVisible();
    await expect(modal.getByText(/Urgency — 15%/i)).toBeVisible();

    // Verify distance, fit, urgency sub-scores for Annapurna (distance 2.4km -> 70/100, fit -> 100/100, urgency -> 100/100)
    await expect(modal.getByText(/Distance — 35% — 70\/100/i)).toBeVisible();
    await expect(modal.getByText(/Fit — 25% — 100\/100/i)).toBeVisible();
    await expect(modal.getByText(/Urgency — 15% — 100\/100/i)).toBeVisible();

    // Verify bottom label
    await expect(modal.getByText('Deterministic weighted formula')).toBeVisible();

    // 6. Test closing via close button
    const closeBtn = page.locator('[data-testid="score-modal-close-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    // 7. Select a different ranked candidate (Yuva Shakti Seva Sansthan)
    const yuvaBtn = page.locator('button', { hasText: 'Yuva Shakti Seva' });
    await expect(yuvaBtn).toBeVisible();
    await yuvaBtn.click();

    // Reopen modal and verify scores have changed dynamically
    await howScoredBtn.click();
    await expect(modal).toBeVisible();

    // Yuva Shakti score adapts dynamically
    await expect(modal.getByText('Yuva Shakti Seva Sansthan')).toBeVisible();
    await expect(modal.getByText(/MATCH SCORE — 57%/i)).toBeVisible();
    await expect(modal.getByText(/Distance — 35% — 49\/100/i)).toBeVisible();
    await expect(modal.getByText(/Fit — 25% — 60\/100/i)).toBeVisible();
    await expect(modal.getByText(/Urgency — 15% — 80\/100/i)).toBeVisible();

    // 8. Test closing by clicking outside the modal panel (backdrop)
    await modal.click({ position: { x: 20, y: 200 } });
    await expect(modal).not.toBeVisible();

    // 9. Test closing via Escape key
    await howScoredBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
