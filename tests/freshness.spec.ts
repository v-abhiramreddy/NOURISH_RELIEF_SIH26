import { test, expect } from '@playwright/test';
import { assessFoodFreshness, STATUTORY_FRESHNESS_DISCLAIMER } from '../src/lib/freshness-engine';

// Helper to format hours:mins string relative to now
function getRecentTime(offsetMinutesAgo: number = 30): string {
  const d = new Date(Date.now() - offsetMinutesAgo * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

test.describe('Food Freshness & Expiry Risk Engine - Logic Audit', () => {
  test('Audit Case 1: Chilled (0–4°C) with 64°C probe temp (thermal mismatch fix)', () => {
    const result = assessFoodFreshness({
      food_item: 'Fresh Salad & Paneer',
      prepared_time: getRecentTime(60),
      current_temp_c: 64.0,
      holding_condition: 'chilled',
    });

    // An obviously incompatible temperature MUST NOT produce a 16h window!
    expect(result.temp_compliance).toBe(false);
    expect(result.is_thermal_mismatch).toBe(true);
    expect(result.risk_level).toBe('HIGH');
    expect(result.redistribution_priority).toBe('URGENT');
    expect(result.remaining_shelf_life_hours).toBe(0);
    expect(result.remaining_shelf_life_formatted).toMatch(/0h 0m/);
    expect(result.remaining_shelf_life_formatted).toContain('Thermal breach - Window collapsed');
    expect(result.actionable_recommendation).toContain('Critical thermal mismatch');
    expect(result.actionable_recommendation).toContain('Chilled (0–4°C)');
    expect(result.statutory_disclaimer).toBe(STATUTORY_FRESHNESS_DISCLAIMER);
  });

  test('Audit Case 2: Chilled (0–4°C) with compliant 3.5°C', () => {
    const result = assessFoodFreshness({
      food_item: 'Greek Yogurt Parfait',
      prepared_time: getRecentTime(60),
      current_temp_c: 3.5,
      holding_condition: 'chilled',
    });

    expect(result.temp_compliance).toBe(true);
    expect(result.is_thermal_mismatch).toBe(false);
    expect(result.risk_level).toBe('LOW');
    expect(result.redistribution_priority).toBe('NORMAL');
    expect(result.remaining_shelf_life_hours).toBeGreaterThan(15);
    expect(result.actionable_recommendation).toContain('Optimal condition');
  });

  test('Audit Case 3: Chilled (0–4°C) with minor refrigeration drift (6.5°C)', () => {
    const result = assessFoodFreshness({
      food_item: 'Cold Cuts & Dip',
      prepared_time: getRecentTime(60),
      current_temp_c: 6.5,
      holding_condition: 'chilled',
    });

    expect(result.temp_compliance).toBe(false);
    expect(result.is_thermal_mismatch).toBe(false);
    expect(result.risk_level).toBe('HIGH');
    expect(result.redistribution_priority).toBe('URGENT');
    // Non-compliant chilled cannot produce a 24h baseline; must be capped under 4.0h
    expect(result.remaining_shelf_life_hours).toBeLessThanOrEqual(4.0);
  });

  test('Audit Case 4: Hot Holding (>60°C) with compliant 65°C', () => {
    const result = assessFoodFreshness({
      food_item: 'Steaming Matar Pulao',
      prepared_time: getRecentTime(45),
      current_temp_c: 65.0,
      holding_condition: 'hot',
    });

    expect(result.temp_compliance).toBe(true);
    expect(result.is_thermal_mismatch).toBe(false);
    expect(result.risk_level).toBe('LOW');
    expect(result.redistribution_priority).toBe('NORMAL');
    expect(result.remaining_shelf_life_hours).toBeGreaterThan(2.5);
    expect(result.actionable_recommendation).toContain('Optimal condition');
  });

  test('Audit Case 5: Hot Holding (>60°C) with cold probe temp 15°C (thermal mismatch)', () => {
    const result = assessFoodFreshness({
      food_item: 'Steaming Matar Pulao',
      prepared_time: getRecentTime(30),
      current_temp_c: 15.0,
      holding_condition: 'hot',
    });

    expect(result.temp_compliance).toBe(false);
    expect(result.is_thermal_mismatch).toBe(true);
    expect(result.risk_level).toBe('HIGH');
    expect(result.redistribution_priority).toBe('URGENT');
    expect(result.remaining_shelf_life_hours).toBe(0);
    expect(result.remaining_shelf_life_formatted).toMatch(/0h 0m/);
    expect(result.actionable_recommendation).toContain('Critical thermal mismatch');
  });

  test('Audit Case 6: Ambient (≤25°C) with compliant 22°C', () => {
    const result = assessFoodFreshness({
      food_item: 'Bakery Rolls',
      prepared_time: getRecentTime(45),
      current_temp_c: 22.0,
      holding_condition: 'ambient',
    });

    expect(result.temp_compliance).toBe(true);
    expect(result.is_thermal_mismatch).toBe(false);
    expect(result.risk_level).toBe('LOW');
    expect(result.redistribution_priority).toBe('NORMAL');
    expect(result.remaining_shelf_life_hours).toBeGreaterThan(2.5);
  });

  test('Audit Case 7: Ambient (≤25°C) with hot probe temp 64°C (thermal mismatch)', () => {
    const result = assessFoodFreshness({
      food_item: 'Bakery Rolls',
      prepared_time: getRecentTime(30),
      current_temp_c: 64.0,
      holding_condition: 'ambient',
    });

    expect(result.temp_compliance).toBe(false);
    expect(result.is_thermal_mismatch).toBe(true);
    expect(result.risk_level).toBe('HIGH');
    expect(result.redistribution_priority).toBe('URGENT');
    expect(result.remaining_shelf_life_hours).toBe(0);
    expect(result.remaining_shelf_life_formatted).toMatch(/0h 0m/);
    expect(result.actionable_recommendation).toContain('Critical thermal mismatch');
  });
});

test.describe('Food Freshness & Expiry Risk - UI Consistency & Verification', () => {
  test('Post Surplus Food UI demonstrates consistent terminology and thermal mismatch handling', async ({ page }) => {
    await page.goto('/restaurant/post');

    // 1. Check terminology: 'Freshness & Expiry Risk Assessment' and 'Rule-Based Engine'
    await expect(page.getByText('Freshness & Expiry Risk Assessment').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Rule-Based Engine').filter({ visible: true })).toBeVisible();

    // 2. Check statutory disclaimer is preserved verbatim
    await expect(
      page.getByText('AI-assisted redistribution risk assessment. This does not replace statutory food-safety procedures.').filter({ visible: true })
    ).toBeVisible();

    // Set preparation time to 45 mins ago so compliant cases show LOW RISK
    const prepTimeInput = page.locator('#prepTimeInputR');
    await prepTimeInput.fill(getRecentTime(45));

    // 3. Test Chilled (0–4°C) with 64°C (The user's reported bug):
    // Select Chilled condition on desktop
    await page.locator('#holdingChilledR').click();

    // Enter probe temperature: 64°C
    const probeInput = page.locator('#tempProbeInputR');
    await probeInput.fill('64');

    // Verify UI immediately shows:
    // - Severe Thermal Mismatch
    // - HIGH RISK
    // - URGENT
    // - 0h 0m (Thermal breach - Window collapsed)
    // - Actionable recommendation with Critical thermal mismatch
    await expect(page.getByText('Severe Thermal Mismatch').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('HIGH RISK').filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/0h 0m \(Thermal breach - Window collapsed\)/i).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Redistribution Priority \(URGENT\):/i).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Critical thermal mismatch: Recorded probe temperature \(64°C\) is incompatible with Chilled/i).filter({ visible: true })).toBeVisible();

    // Ensure no misleading long window (such as 16h) is displayed anywhere
    await expect(page.getByText(/16h\s*0m/i)).not.toBeVisible();

    // 4. Test Hot Holding (>60°C) with 65°C:
    await page.locator('#holdingHotR').click();
    await probeInput.fill('65');
    await expect(page.getByText('Within Target Range').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('LOW RISK').filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Redistribution Priority \(NORMAL\):/i).filter({ visible: true })).toBeVisible();

    // 5. Test Ambient / Room Temp with 22°C:
    await page.locator('#holdingAmbientR').click();
    await probeInput.fill('22');
    await expect(page.getByText('Within Target Range').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('LOW RISK').filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Redistribution Priority \(NORMAL\):/i).filter({ visible: true })).toBeVisible();
  });
});
