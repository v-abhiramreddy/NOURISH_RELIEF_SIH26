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

  // 2. Multi-tier temperature compliance & degradation evaluation
  let baseMaxShelfLifeHours = 5.0;
  let tempCompliance = true;
  let degradationFactor = 1.0;
  let maxSafeCap = 5.0;
  let isThermalMismatch = false;

  if (input.holding_condition === 'hot') {
    // Target: ≥ 60°C
    if (input.current_temp_c >= 60.0) {
      tempCompliance = true;
      baseMaxShelfLifeHours = 5.0;
      degradationFactor = 1.0;
      maxSafeCap = 5.0;
    } else if (input.current_temp_c >= 50.0) {
      // Mild drop below safe holding
      tempCompliance = false;
      baseMaxShelfLifeHours = 3.0;
      degradationFactor = 2.0;
      maxSafeCap = 2.0;
    } else if (input.current_temp_c >= 25.0) {
      // Danger zone (25°C to 50°C)
      tempCompliance = false;
      baseMaxShelfLifeHours = 1.5;
      degradationFactor = 2.5;
      maxSafeCap = 1.0;
    } else {
      // Severe mismatch: cold/room-temp food claimed as hot-held
      tempCompliance = false;
      isThermalMismatch = true;
      baseMaxShelfLifeHours = 0.0;
      degradationFactor = 4.0;
      maxSafeCap = 0.0;
    }
  } else if (input.holding_condition === 'chilled') {
    // Target: 0°C to 4°C
    if (input.current_temp_c >= -1.0 && input.current_temp_c <= 4.0) {
      tempCompliance = true;
      baseMaxShelfLifeHours = 24.0;
      degradationFactor = 1.0;
      maxSafeCap = 24.0;
    } else if (input.current_temp_c > 4.0 && input.current_temp_c <= 8.0) {
      // Minor refrigeration breach
      tempCompliance = false;
      baseMaxShelfLifeHours = 6.0;
      degradationFactor = 2.0;
      maxSafeCap = 4.0;
    } else if (input.current_temp_c > 8.0 && input.current_temp_c <= 15.0) {
      // Significant cold-chain abuse (danger zone transition)
      tempCompliance = false;
      baseMaxShelfLifeHours = 2.5;
      degradationFactor = 2.5;
      maxSafeCap = 1.5;
    } else {
      // Severe mismatch: warm or hot food (e.g. 64°C) claimed as chilled
      tempCompliance = false;
      isThermalMismatch = true;
      baseMaxShelfLifeHours = 0.0;
      degradationFactor = 4.0;
      maxSafeCap = 0.0;
    }
  } else {
    // Ambient / Room Temp (Target: ≤ 25°C)
    if (input.current_temp_c >= 5.0 && input.current_temp_c <= 25.0) {
      tempCompliance = true;
      baseMaxShelfLifeHours = 4.0;
      degradationFactor = 1.0;
      maxSafeCap = 4.0;
    } else if (input.current_temp_c > 25.0 && input.current_temp_c <= 35.0) {
      // Warm ambient exposure
      tempCompliance = false;
      baseMaxShelfLifeHours = 2.5;
      degradationFactor = 2.0;
      maxSafeCap = 2.0;
    } else if (input.current_temp_c > 35.0 && input.current_temp_c <= 45.0) {
      // Severe ambient heat
      tempCompliance = false;
      baseMaxShelfLifeHours = 1.5;
      degradationFactor = 3.0;
      maxSafeCap = 1.0;
    } else {
      // Severe mismatch: hot food (e.g. 64°C) or freezing temp claimed as ambient
      tempCompliance = false;
      isThermalMismatch = true;
      baseMaxShelfLifeHours = 0.0;
      degradationFactor = 4.0;
      maxSafeCap = 0.0;
    }
  }

  // 3. Compute remaining estimated shelf life with safety caps
  let remainingHours = 0.0;
  if (isThermalMismatch) {
    remainingHours = 0.0;
  } else {
    const consumedLife = elapsedHours * degradationFactor;
    const rawRemaining = +(baseMaxShelfLifeHours - consumedLife).toFixed(1);
    remainingHours = Math.max(0, Math.min(rawRemaining, maxSafeCap));
  }

  const remWholeHours = Math.floor(remainingHours);
  const remMinutes = Math.round((remainingHours - remWholeHours) * 60);
  const remainingFormatted =
    remainingHours <= 0
      ? isThermalMismatch
        ? '0h 0m (Thermal breach - Window collapsed)'
        : '0h 0m (Redistribution window expired)'
      : remWholeHours > 0
      ? `${remWholeHours}h ${remMinutes}m`
      : `${remMinutes}m`;

  // 4. Determine Risk Tier (LOW / MODERATE / HIGH) and Priority (NORMAL / PRIORITY / URGENT)
  let riskLevel: FreshnessRiskLevel = 'LOW';
  let priority: FreshnessAssessment['redistribution_priority'] = 'NORMAL';
  let recommendation = '';

  if (isThermalMismatch) {
    riskLevel = 'HIGH';
    priority = 'URGENT';
    const conditionDesc =
      input.holding_condition === 'hot'
        ? 'Hot Holding (≥60°C)'
        : input.holding_condition === 'chilled'
        ? 'Chilled (0–4°C)'
        : 'Ambient (≤25°C)';
    recommendation = `Critical thermal mismatch: Recorded probe temperature (${input.current_temp_c}°C) is incompatible with ${conditionDesc}. Redistribution window collapsed; immediate inspection recommended before redistribution.`;
  } else if (remainingHours <= 0) {
    riskLevel = 'HIGH';
    priority = 'URGENT';
    recommendation = 'Redistribution window has expired. Immediate review is recommended before redistribution.';
  } else if (remainingHours <= 1.0 || !tempCompliance) {
    riskLevel = 'HIGH';
    priority = 'URGENT';
    recommendation = tempCompliance
      ? `Urgent redistribution recommended: only ${remainingFormatted} remaining. Prioritize nearest available shelter.`
      : `Sub-optimal temperature recorded (${input.current_temp_c}°C). Redistribution window constrained; urgent courier matching required.`;
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
    is_thermal_mismatch: isThermalMismatch,
    statutory_disclaimer: STATUTORY_FRESHNESS_DISCLAIMER,
  };
}
