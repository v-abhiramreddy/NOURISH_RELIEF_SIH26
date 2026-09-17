import { FreshnessAssessment, FreshnessRiskLevel, HoldingTemperature } from '@/types';

export interface FreshnessInput {
  food_item: string;
  prepared_time: string; // e.g. "15:15" or "3:15 PM"
  current_temp_c: number;
  holding_condition: HoldingTemperature;
  prepared_date?: string; // defaults to today
}

export const STATUTORY_FRESHNESS_DISCLAIMER =
  'AI-assisted redistribution risk assessment. This does not replace statutory food-safety procedures.';

/**
 * Simplified Rule-Based Food Freshness / Redistribution Risk Engine
 * Uses strictly:
 * - preparation time
 * - elapsed time
 * - recorded temperature
 * - expected shelf life
 *
 * Outputs:
 * - Freshness/Redistribution Risk: LOW / MODERATE / HIGH
 * - Remaining estimated shelf life: X hours / X mins
 * - Redistribution priority: NORMAL / PRIORITY / URGENT
 */
export function assessFoodFreshness(input: FreshnessInput): FreshnessAssessment {
  // 1. Calculate elapsed time from preparation timestamp
  let elapsedHours = 2.0; // Sensible fallback
  try {
    const cleaned = input.prepared_time.replace(/[^0-9:]/g, '');
    const [hoursStr, minsStr] = cleaned.split(':');
    if (hoursStr) {
      const now = new Date();
      const prepDate = new Date();
      prepDate.setHours(parseInt(hoursStr, 10), parseInt(minsStr || '0', 10), 0, 0);

      const diffMs = now.getTime() - prepDate.getTime();
      if (diffMs > 0 && diffMs < 24 * 3600 * 1000) {
        elapsedHours = +(diffMs / (1000 * 60 * 60)).toFixed(1);
      }
    }
  } catch {
    elapsedHours = 2.0;
  }

  // 2. Expected baseline shelf life and temperature compliance
  let baseMaxShelfLifeHours = 5.0; // Standard cooked meal hot-holding baseline
  let tempCompliance = true;
  let degradationFactor = 1.0;

  if (input.holding_condition === 'hot') {
    baseMaxShelfLifeHours = 5.0;
    if (input.current_temp_c >= 60.0) {
      tempCompliance = true;
      degradationFactor = 1.0;
    } else if (input.current_temp_c >= 50.0) {
      tempCompliance = false;
      degradationFactor = 1.6;
    } else {
      tempCompliance = false;
      degradationFactor = 2.5;
    }
  } else if (input.holding_condition === 'chilled') {
    baseMaxShelfLifeHours = 24.0;
    if (input.current_temp_c <= 4.0) {
      tempCompliance = true;
      degradationFactor = 1.0;
    } else {
      tempCompliance = false;
      degradationFactor = 2.0;
    }
  } else {
    // Ambient
    baseMaxShelfLifeHours = 4.0;
    degradationFactor = 1.2;
    tempCompliance = input.current_temp_c <= 25.0;
  }

  // 3. Compute remaining estimated shelf life
  const consumedLife = elapsedHours * degradationFactor;
  const remainingHours = Math.max(0, +(baseMaxShelfLifeHours - consumedLife).toFixed(1));

  const remWholeHours = Math.floor(remainingHours);
  const remMinutes = Math.round((remainingHours - remWholeHours) * 60);
  const remainingFormatted =
    remainingHours <= 0
      ? '0h 0m (Safe window expired)'
      : remWholeHours > 0
      ? `${remWholeHours}h ${remMinutes}m`
      : `${remMinutes}m`;

  // 4. Determine simplified Risk Tier (LOW / MODERATE / HIGH) and Priority (NORMAL / PRIORITY / URGENT)
  let riskLevel: FreshnessRiskLevel = 'LOW';
  let priority: FreshnessAssessment['redistribution_priority'] = 'NORMAL';
  let recommendation = '';

  if (remainingHours <= 1.0 || !tempCompliance) {
    riskLevel = 'HIGH';
    priority = 'URGENT';
    recommendation = tempCompliance
      ? `Urgent redistribution recommended: only ${remainingFormatted} remaining. Prioritize nearest available shelter.`
      : `Sub-optimal temperature recorded (${input.current_temp_c}°C). Urgent courier matching required for immediate consumption.`;
  } else if (remainingHours <= 2.5) {
    riskLevel = 'MODERATE';
    priority = 'PRIORITY';
    recommendation = `Priority dispatch: ${remainingFormatted} remaining. Suitable for expedited local shelter transfer.`;
  } else {
    riskLevel = 'LOW';
    priority = 'NORMAL';
    recommendation = `Optimal condition: ${remainingFormatted} remaining within target holding temperature (${input.current_temp_c}°C). Suitable for standard redistribution.`;
  }

  return {
    food_item: input.food_item,
    prepared_time: input.prepared_time,
    elapsed_hours: elapsedHours,
    current_temp_c: input.current_temp_c,
    holding_condition: input.holding_condition,
    max_safe_shelf_life_hours: baseMaxShelfLifeHours,
    remaining_shelf_life_hours: remainingHours,
    remaining_shelf_life_formatted: remainingFormatted,
    risk_level: riskLevel,
    redistribution_priority: priority,
    actionable_recommendation: recommendation,
    temp_compliance: tempCompliance,
    statutory_disclaimer: STATUTORY_FRESHNESS_DISCLAIMER,
  };
}
