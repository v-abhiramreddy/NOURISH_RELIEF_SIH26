import {
  DemandForecast,
  SurplusRiskLevel,
  ContextAdjustmentAssumption,
  ContextAdjustmentDetail,
  ForecastFeedbackLog,
} from '@/types';

export interface ForecastParameters {
  date: string;
  meal_type: 'lunch' | 'dinner' | 'breakfast';
  day_of_week: string;
  expected_attendance: number;
  planned_production_buffer_pct: number; // e.g. 10% buffer
  weather_condition: 'clear' | 'rain' | 'extreme_heat';
  special_event: boolean;
  public_holiday?: boolean;
  pre_bookings_count?: number;
}

/**
 * Centralized Demo Context Assumptions
 * Configurable demo parameters for hackathon operational modeling.
 * (Not hardcoded constants or universally certified constants)
 */
export const DEMO_CONTEXT_ASSUMPTIONS: ContextAdjustmentAssumption = {
  festival_modifier_pct: 12, // +12% attendance surge during festivals/events
  public_holiday_modifier_pct: -15, // -15% attendance on scheduled public holidays
  inclement_weather_modifier_pct: -5, // -5% walk-in dip during heavy rain
  recent_trend_modifier_pct: 4, // +4% trailing 3-week participation growth
};

/**
 * Synthetic 10-Week Institutional Kitchen Historical Dataset (Demo Training Data)
 * Covers historical attendance, actual demand, production, and surplus trends
 * across 70 days for MoFPI Pilot Kitchen 01.
 */
export const SYNTHETIC_10_WEEK_HISTORICAL_LOGS = [
  { week: 'Week 1', avg_attendance: 410, avg_demand: 395, avg_production: 450, avg_surplus: 55 },
  { week: 'Week 2', avg_attendance: 425, avg_demand: 410, avg_production: 460, avg_surplus: 50 },
  { week: 'Week 3', avg_attendance: 440, avg_demand: 425, avg_production: 475, avg_surplus: 50 },
  { week: 'Week 4', avg_attendance: 435, avg_demand: 420, avg_production: 465, avg_surplus: 45 },
  { week: 'Week 5', avg_attendance: 450, avg_demand: 435, avg_production: 480, avg_surplus: 45 },
  { week: 'Week 6', avg_attendance: 465, avg_demand: 450, avg_production: 495, avg_surplus: 45 },
  { week: 'Week 7', avg_attendance: 460, avg_demand: 445, avg_production: 490, avg_surplus: 45 },
  { week: 'Week 8', avg_attendance: 480, avg_demand: 465, avg_production: 510, avg_surplus: 45 },
  { week: 'Week 9', avg_attendance: 475, avg_demand: 460, avg_production: 505, avg_surplus: 45 },
  { week: 'Week 10 (Recent)', avg_attendance: 490, avg_demand: 475, avg_production: 520, avg_surplus: 45 },
];

// 7-day recent representative operational logs for micro-trend visualization
export const HISTORICAL_KITCHEN_LOGS = [
  { day: 'Mon', date: '2026-09-08', attendance: 410, demand: 395, production: 450, surplus: 55 },
  { day: 'Tue', date: '2026-09-09', attendance: 430, demand: 420, production: 460, surplus: 40 },
  { day: 'Wed', date: '2026-09-10', attendance: 460, demand: 445, production: 480, surplus: 35 },
  { day: 'Thu', date: '2026-09-11', attendance: 480, demand: 460, production: 510, surplus: 50 },
  { day: 'Fri', date: '2026-09-12', attendance: 520, demand: 505, production: 560, surplus: 55 },
  { day: 'Sat', date: '2026-09-13', attendance: 380, demand: 360, production: 400, surplus: 40 },
  { day: 'Sun', date: '2026-09-14', attendance: 340, demand: 325, production: 360, surplus: 35 },
];

/**
 * Initial Operational Forecast Feedback Logs (Feedback Loop)
 * Tracks previous forecasts vs. actual consumption, calculating deviations and explaining errors.
 */
export const INITIAL_FORECAST_FEEDBACK_LOGS: ForecastFeedbackLog[] = [
  {
    id: 'fb-001',
    date: 'Yesterday, Dinner Shift',
    meal_type: 'dinner',
    predicted_demand: 625,
    predicted_surplus: 65,
    actual_production: 630,
    actual_consumption: 550,
    actual_demand: 550,
    actual_surplus: 80,
    forecast_deviation: 75,
    explanation:
      'Sudden localized thunderstorm at 6:45 PM reduced walk-in dining attendance by 75 meals below forecast. Surplus was triaged and transferred to Annapurna Seva Trust.',
  },
  {
    id: 'fb-002',
    date: '2 Days Ago, Lunch Shift',
    meal_type: 'lunch',
    predicted_demand: 480,
    predicted_surplus: 40,
    actual_production: 490,
    actual_consumption: 472,
    actual_demand: 472,
    actual_surplus: 18,
    forecast_deviation: 8,
    explanation:
      'Standard operational variance. Actual consumption tracked within ±2% of predicted range.',
  },
  {
    id: 'fb-003',
    date: '3 Days Ago, Dinner Shift',
    meal_type: 'dinner',
    predicted_demand: 450,
    predicted_surplus: 35,
    actual_production: 470,
    actual_consumption: 462,
    actual_demand: 462,
    actual_surplus: 8,
    forecast_deviation: 12,
    explanation:
      'High accuracy calibration. Mild increase (+12 meals) absorbed smoothly by kitchen safety buffer.',
  },
];

/**
 * AI Demand & Surplus Forecast Engine (Range-Based with Context Adjustments)
 * Calculates multi-stage predictions:
 * 1. Historical Baseline
 * 2. Deterministic Context Signals (Festival, Holiday, Weather, Attendance)
 * 3. Range with Uncertainty Bounds (Expected Demand Min–Max, Most Likely)
 * 4. Suggested Production Range with Kitchen Manager Override Support
 */
export function calculateDemandForecast(params: ForecastParameters): DemandForecast {
  // 1. Day of week historical coefficient
  const dayFactors: Record<string, number> = {
    Monday: 0.94,
    Tuesday: 0.97,
    Wednesday: 1.0,
    Thursday: 1.02,
    Friday: 1.08,
    Saturday: 0.88,
    Sunday: 0.82,
  };
  const dayFactor = dayFactors[params.day_of_week] || 1.0;

  // 2. Meal type weight
  const mealFactors: Record<string, number> = {
    breakfast: 0.72,
    lunch: 1.05,
    dinner: 0.98,
  };
  const mealFactor = mealFactors[params.meal_type] || 1.0;

  // 3. Compute baseline demand from expected attendance
  const baselineRate = 0.96;
  const rawBaseline = Math.round(params.expected_attendance * baselineRate * dayFactor * mealFactor);

  // 4. Deterministic Context Adjustment Engine (Tracking individual factors transparently)
  const contextAdjustments: ContextAdjustmentDetail[] = [];
  const detectedSignals: string[] = [];
  let cumulativeMultiplier = 1.0;

  // A. Special Event / Festival
  if (params.special_event) {
    const festivalMod = DEMO_CONTEXT_ASSUMPTIONS.festival_modifier_pct / 100;
    const impactMeals = Math.round(rawBaseline * festivalMod);
    cumulativeMultiplier += festivalMod;
    contextAdjustments.push({
      factor_name: 'Festival / Special Event',
      impact_type: 'increase',
      impact_meals: impactMeals,
      percentage_note: `+${DEMO_CONTEXT_ASSUMPTIONS.festival_modifier_pct}%`,
      assumption_note: `+${DEMO_CONTEXT_ASSUMPTIONS.festival_modifier_pct}% (demo parameter)`,
    });
    detectedSignals.push(`Festival / Event surge (+${DEMO_CONTEXT_ASSUMPTIONS.festival_modifier_pct}%)`);
  }

  // B. Public Holiday
  if (params.public_holiday) {
    const holidayMod = DEMO_CONTEXT_ASSUMPTIONS.public_holiday_modifier_pct / 100;
    const impactMeals = Math.round(rawBaseline * holidayMod);
    cumulativeMultiplier += holidayMod;
    contextAdjustments.push({
      factor_name: 'Public Holiday',
      impact_type: 'decrease',
      impact_meals: impactMeals,
      percentage_note: `${DEMO_CONTEXT_ASSUMPTIONS.public_holiday_modifier_pct}%`,
      assumption_note: `${DEMO_CONTEXT_ASSUMPTIONS.public_holiday_modifier_pct}% (demo parameter)`,
    });
    detectedSignals.push(`Public holiday adjustment (${DEMO_CONTEXT_ASSUMPTIONS.public_holiday_modifier_pct}%)`);
  }

  // C. Inclement Weather
  if (params.weather_condition === 'rain') {
    const rainMod = DEMO_CONTEXT_ASSUMPTIONS.inclement_weather_modifier_pct / 100;
    const impactMeals = Math.round(rawBaseline * rainMod);
    cumulativeMultiplier += rainMod;
    contextAdjustments.push({
      factor_name: 'Inclement Weather (Rain)',
      impact_type: 'decrease',
      impact_meals: impactMeals,
      percentage_note: `${DEMO_CONTEXT_ASSUMPTIONS.inclement_weather_modifier_pct}%`,
      assumption_note: `${DEMO_CONTEXT_ASSUMPTIONS.inclement_weather_modifier_pct}% (demo parameter)`,
    });
    detectedSignals.push(`Rain forecast dampener (${DEMO_CONTEXT_ASSUMPTIONS.inclement_weather_modifier_pct}%)`);
  } else if (params.weather_condition === 'clear') {
    detectedSignals.push('Clear weather conditions (nominal baseline)');
  }

  // D. Recent Trend Momentum
  const trendMod = DEMO_CONTEXT_ASSUMPTIONS.recent_trend_modifier_pct / 100;
  const trendImpact = Math.round(rawBaseline * trendMod);
  cumulativeMultiplier += trendMod;
  contextAdjustments.push({
    factor_name: 'Recent 3-Week Participation Trend',
    impact_type: 'increase',
    impact_meals: trendImpact,
    percentage_note: `+${DEMO_CONTEXT_ASSUMPTIONS.recent_trend_modifier_pct}%`,
    assumption_note: `+${DEMO_CONTEXT_ASSUMPTIONS.recent_trend_modifier_pct}% (demo parameter)`,
  });
  detectedSignals.push(`Positive demand momentum (+${DEMO_CONTEXT_ASSUMPTIONS.recent_trend_modifier_pct}%)`);

  // E. Pre-bookings signal
  if (params.pre_bookings_count && params.pre_bookings_count > 0) {
    detectedSignals.push(`Pre-bookings logged: ${params.pre_bookings_count} reserved meals`);
  }

  // 5. Compute Most Likely Demand & Uncertainty Range
  const mostLikelyDemand = Math.round(rawBaseline * cumulativeMultiplier);
  const uncertaintyMargin = 0.06; // ±6% uncertainty bound
  const expectedDemandMin = Math.round(mostLikelyDemand * (1 - uncertaintyMargin));
  const expectedDemandMax = Math.round(mostLikelyDemand * (1 + uncertaintyMargin));

  // 6. Compute Suggested Production Range (incorporates kitchen buffer)
  const bufferPct = params.planned_production_buffer_pct || 10;
  const suggestedProductionMin = Math.round(mostLikelyDemand * (1 + (bufferPct - 4) / 100));
  const suggestedProductionMax = Math.round(mostLikelyDemand * (1 + (bufferPct + 4) / 100));
  const plannedProductionMeals = Math.round(mostLikelyDemand * (1 + bufferPct / 100));

  // 7. Compute Predicted Surplus
  const predictedSurplusMeals = Math.max(0, plannedProductionMeals - mostLikelyDemand);
  const predictedSurplusKg = +(predictedSurplusMeals * 0.4).toFixed(1);

  // 8. Triage Surplus Risk Level
  let surplusRisk: SurplusRiskLevel = 'LOW';
  if (predictedSurplusMeals >= 45) {
    surplusRisk = 'HIGH';
  } else if (predictedSurplusMeals >= 20) {
    surplusRisk = 'MODERATE';
  }

  // 9. Confidence Score
  const confidencePct = Math.round(
    Math.min(92, Math.max(76, 85 - (params.special_event ? 4 : 0) - (params.weather_condition === 'rain' ? 3 : 0)))
  );
  const confidenceScore = +(confidencePct / 100).toFixed(2);

  // 10. Actionable Recommendation (Non-authoritative, supporting kitchen management)
  let recommendation = '';
  if (surplusRisk === 'HIGH') {
    recommendation = `High surplus alert: Expected surplus of approx. ${predictedSurplusMeals} meals (${predictedSurplusKg} kg). Recommended: Target production between ${suggestedProductionMin}–${suggestedProductionMax} meals or pre-schedule evening NGO redistribution with Annapurna Seva Trust.`;
  } else if (surplusRisk === 'MODERATE') {
    recommendation = `Moderate surplus window: Predicted surplus of ${predictedSurplusMeals} meals (${predictedSurplusKg} kg). Suitable for standard redistribution dispatch to nearby shelters.`;
  } else {
    recommendation = `Low surplus risk: Demand and kitchen production well-aligned (surplus < 20 meals). Minimal surplus intervention required.`;
  }

  return {
    id: `fc-${Date.now().toString(36)}`,
    date: params.date,
    meal_type: params.meal_type,
    day_of_week: params.day_of_week,
    expected_attendance: params.expected_attendance,
    expected_demand_min: expectedDemandMin,
    expected_demand_max: expectedDemandMax,
    most_likely_demand: mostLikelyDemand,
    suggested_production_min: suggestedProductionMin,
    suggested_production_max: suggestedProductionMax,
    planned_production_meals: plannedProductionMeals,
    predicted_surplus_meals: predictedSurplusMeals,
    predicted_surplus_kg: predictedSurplusKg,
    surplus_risk: surplusRisk,
    confidence_pct: confidencePct,
    confidence_score: confidenceScore,
    historical_baseline_demand: rawBaseline,
    detected_context_signals: detectedSignals,
    context_adjustments_applied: contextAdjustments,
    override_status: 'recommended',
    ai_recommendation: recommendation,
    historical_comparison: {
      avg_demand_same_day: Math.round(mostLikelyDemand * 0.98),
      avg_surplus_same_day: 42,
      trend: surplusRisk === 'HIGH' ? 'increasing' : 'stable',
    },
  };
}
