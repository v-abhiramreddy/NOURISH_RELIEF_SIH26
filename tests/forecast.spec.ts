import { test, expect } from '@playwright/test';
import {
  calculateDemandForecast,
  computeForecastFeedback,
  ForecastHistoricalDataProvider,
  ForecastParameters,
} from '../src/lib/ml-forecast';

test.describe('Phase 4 — AI / Intelligence Demand Forecasting & Surplus Risk Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ==========================================================================
  // 1. Mathematical & Statistical Engine Integrity
  // ==========================================================================
  test('1. Forecast Engine: Min <= Most Likely <= Max invariant and dynamic uncertainty bounds', async () => {
    const baseParams: ForecastParameters = {
      date: '2026-09-17',
      meal_type: 'dinner',
      day_of_week: 'Thursday',
      expected_attendance: 480,
      planned_production_buffer_pct: 10,
      weather_condition: 'clear',
      special_event: false,
    };

    const clearForecast = calculateDemandForecast(baseParams);

    // Bounded invariant: Min <= Most Likely <= Max
    expect(clearForecast.expected_demand_min).toBeLessThanOrEqual(clearForecast.most_likely_demand);
    expect(clearForecast.most_likely_demand).toBeLessThanOrEqual(clearForecast.expected_demand_max);

    // Weather impact: rain should widen the uncertainty interval
    const rainForecast = calculateDemandForecast({
      ...baseParams,
      weather_condition: 'rain',
    });

    expect(rainForecast.uncertainty_margin_pct).toBeGreaterThan(clearForecast.uncertainty_margin_pct || 0);
    expect(rainForecast.expected_demand_min).toBeLessThanOrEqual(rainForecast.most_likely_demand);
    expect(rainForecast.most_likely_demand).toBeLessThanOrEqual(rainForecast.expected_demand_max);

    // Weather impact: extreme heat decreases demand (-3%) and widens uncertainty (+1.5%)
    const heatForecast = calculateDemandForecast({
      ...baseParams,
      weather_condition: 'extreme_heat',
    });
    expect(heatForecast.most_likely_demand).toBeLessThan(clearForecast.most_likely_demand);
    expect(heatForecast.uncertainty_margin_pct).toBeGreaterThan(clearForecast.uncertainty_margin_pct || 0);
    expect(heatForecast.expected_demand_min).toBeLessThanOrEqual(heatForecast.most_likely_demand);
    expect(heatForecast.most_likely_demand).toBeLessThanOrEqual(heatForecast.expected_demand_max);

    // Festival / Event and Public Holiday parameters removed: must not alter demand or uncertainty
    const eventForecast = calculateDemandForecast({
      ...baseParams,
      special_event: true,
      public_holiday: true,
    });
    expect(eventForecast.most_likely_demand).toBe(clearForecast.most_likely_demand);
    expect(eventForecast.uncertainty_margin_pct).toBe(clearForecast.uncertainty_margin_pct);

    // Pre-bookings reduce uncertainty
    const prebookedForecast = calculateDemandForecast({
      ...baseParams,
      pre_bookings_count: 150,
    });
    expect(prebookedForecast.uncertainty_margin_pct).toBeLessThanOrEqual(clearForecast.uncertainty_margin_pct || 0);
  });

  test('2. Transparency & Honest Metrics: Labels Demo Synthetic Baseline without fabricated claims', async () => {
    const forecast = calculateDemandForecast({
      date: '2026-09-17',
      meal_type: 'dinner',
      day_of_week: 'Thursday',
      expected_attendance: 480,
      planned_production_buffer_pct: 10,
      weather_condition: 'clear',
      special_event: false,
    });

    // Explicit data source disclosure
    expect(forecast.data_source_label).toBe('Demo Synthetic Baseline');

    // Qualitative confidence tier without artificial percentage claims
    expect(['High', 'Moderate', 'Cautious']).toContain(forecast.confidence_tier);
    expect(forecast.confidence_pct).toBe(0); // Artificial 76-92% percentage strictly removed

    // Explainability factors
    expect(forecast.explanation_factors).toBeDefined();
    expect(forecast.explanation_factors?.primary_driver).toContain('Thursday');
    expect(forecast.explanation_factors?.uncertainty_driver).toBeDefined();
    expect(forecast.explanation_factors?.surplus_mitigation).toBeDefined();
    expect(forecast.forecast_explanation).toContain('Demo Synthetic Baseline');
  });

  test('3. Surplus Risk Assessment: Evaluates point surplus and lower-bound potential excess', async () => {
    // Normal buffer (10%)
    const normalForecast = calculateDemandForecast({
      date: '2026-09-17',
      meal_type: 'dinner',
      day_of_week: 'Thursday',
      expected_attendance: 480,
      planned_production_buffer_pct: 10,
      weather_condition: 'clear',
      special_event: false,
    });
    expect(['LOW', 'MODERATE', 'HIGH']).toContain(normalForecast.surplus_risk);

    // Extreme buffer (30%) creates HIGH surplus risk
    const highBufferForecast = calculateDemandForecast({
      date: '2026-09-17',
      meal_type: 'dinner',
      day_of_week: 'Thursday',
      expected_attendance: 480,
      planned_production_buffer_pct: 30,
      weather_condition: 'clear',
      special_event: false,
    });
    expect(highBufferForecast.surplus_risk).toBe('HIGH');
    expect(highBufferForecast.surplus_risk_rationale).toContain('High surplus risk');
  });

  test('4. Pluggable Data Provider Abstraction: Supports custom/future institutional data provider', async () => {
    const mockInstitutionalProvider: ForecastHistoricalDataProvider = {
      providerId: 'hospital-canteen-mock',
      dataSourceLabel: 'Institutional Historical Dataset (Hospital Alpha)',
      isSynthetic: false,
      getDailyLogs: () => [
        { day: 'Thu', date: '2026-09-10', attendance: 500, demand: 475, production: 520, surplus: 45 },
      ],
      getWeeklyLogs: () => [
        { week: 'Week 1', avg_attendance: 500, avg_demand: 475, avg_production: 520, avg_surplus: 45 },
      ],
      getMeanAttendanceToDemandRatio: () => 0.95,
      getDayOfWeekStatistics: () => ({
        coefficient: 1.05,
        sampleCount: 20,
        historicalMeanDemand: 475,
        variancePct: 3.8,
      }),
      getTrailingTrendPct: () => 2.5,
    };

    const customForecast = calculateDemandForecast(
      {
        date: '2026-09-17',
        meal_type: 'lunch',
        day_of_week: 'Thursday',
        expected_attendance: 500,
        planned_production_buffer_pct: 10,
        weather_condition: 'clear',
        special_event: false,
      },
      mockInstitutionalProvider
    );

    expect(customForecast.data_source_label).toBe('Institutional Historical Dataset (Hospital Alpha)');
    expect(customForecast.confidence_tier).toBe('High'); // variance 3.8% is <= 6.0%
    expect(customForecast.expected_demand_min).toBeLessThanOrEqual(customForecast.most_likely_demand);
  });

  test('5. Closed-Loop Forecast Feedback: Calculates deviation and variance accurately', async () => {
    const feedback = computeForecastFeedback({
      forecastId: 'fc-test-01',
      date: 'Thursday, DINNER Shift',
      mealType: 'dinner',
      predictedDemand: 480,
      predictedSurplus: 48,
      actualProduction: 528,
      actualConsumption: 460,
      operationalNote: 'Late rain reduced final seating by 20 diners.',
    });

    expect(feedback.forecast_id).toBe('fc-test-01');
    expect(feedback.predicted_demand).toBe(480);
    expect(feedback.actual_consumption).toBe(460);
    expect(feedback.forecast_deviation).toBe(-20); // 460 - 480
    expect(feedback.actual_surplus).toBe(68); // 528 - 460
    expect(feedback.variance_pct).toBe(4.2); // (20 / 480) * 100
    expect(feedback.explanation).toContain('Late rain reduced final seating');
  });

  // ==========================================================================
  // 6. Kitchen Dashboard UI Integration
  // ==========================================================================
  test('6. Kitchen Dashboard: Verified clean layout with Demand & Surplus removed and shared Donation Lifecycle', async ({
    page,
  }) => {
    await page.goto('/dashboard/kitchen');

    // Verify page heading
    await expect(page.getByRole('heading', { name: /Kitchen Operations Dashboard/i })).toBeVisible();

    // Verify Demand & Surplus card is completely removed as requested
    await expect(page.getByRole('heading', { name: 'Demand & Surplus', exact: true })).toHaveCount(0);
    await expect(page.getByText(/meals may be available for redistribution/i)).toHaveCount(0);

    // Verify top KPI metrics are visible
    await expect(page.getByText('Tomorrow Demand')).toBeVisible();
    await expect(page.getByText('Suggested Production')).toBeVisible();

    // Verify live shared Donation Lifecycle
    await expect(page.getByRole('heading', { name: /Donation Lifecycle/i })).toBeVisible();
    await expect(page.getByText(/Published/i).first()).toBeVisible();
    await expect(page.getByText(/NGO Claimed/i).first()).toBeVisible();

    // Verify Closed-Loop Variance History is removed from sign-in dashboard
    await expect(page.getByText(/Closed-Loop Variance History/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Log Actuals/i })).toHaveCount(0);
  });

  // ==========================================================================
  // 7. Forecast Simulator UI: Authority, Override, and Feedback Loop
  // ==========================================================================
  test('7. Forecast Simulator: Displays explainable rationale, handles manager override, and logs feedback', async ({
    page,
  }) => {
    await page.goto('/forecast');

    // Title and disclosure badge
    await expect(page.getByRole('heading', { name: 'Demand & Surplus Forecast', exact: true })).toBeVisible();
    await expect(page.getByText(/Demo Synthetic Baseline/i).first()).toBeVisible();
    await expect(page.getByText(/Forecast Confidence:/i)).toBeVisible();

    // Range-based KPI cards
    await expect(page.getByText(/Expected Demand/i).first()).toBeVisible();
    await expect(page.getByText(/Suggested Production/i).first()).toBeVisible();
    await expect(page.getByText(/Predicted Surplus/i).first()).toBeVisible();
    await expect(page.getByText(/Surplus Risk/i).first()).toBeVisible();

    // Operational Principle
    await expect(
      page.getByText(/Model assists operational decisions; final batch sizes remain under kitchen management authority/i)
    ).toBeVisible();

    // Transparent Context Adjustments & AI Explanation Modal
    await expect(page.getByRole('heading', { name: /Transparent Context Adjustments/i })).toBeVisible();
    const explainBtn = page.getByTestId('explain-forecast-btn');
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();
    await expect(page.getByTestId('forecast-explanation-modal')).toBeVisible();
    await page.getByTestId('close-explanation-modal').click();

    // Kitchen Manager Override authority
    const adjustBtn = page.getByRole('button', { name: /Adjust Manually/i });
    await expect(adjustBtn).toBeVisible();
    await adjustBtn.click();

    const customBatchInput = page.locator('input[type="number"][min="100"]');
    await expect(customBatchInput).toBeVisible();
    await customBatchInput.fill('580');
    await page.getByRole('button', { name: /Save Override/i }).click();

    await expect(page.getByText(/Manually Adjusted \(580 meals\)/i)).toBeVisible();

    // Accept Recommendation returns to accepted
    await page.getByRole('button', { name: /Accept Recommendation/i }).click();
    await expect(page.getByText(/Recommendation Accepted/i)).toBeVisible();

    // Post-Shift Closed-Loop Feedback Entry
    await expect(page.getByText(/Forecast Feedback Loop & Error Explanation/i)).toBeVisible();
    await expect(page.getByText(/Log Post-Shift Consumption \(Closed-Loop Feedback\)/i)).toBeVisible();

    // Fill and submit shift actuals
    const actualMealsInput = page.locator('input[type="number"][min="50"]').first();
    await actualMealsInput.fill('465');
    await page.locator('input[placeholder*="Mild rain"]').first().fill('Measured shift attendance for calibration');
    await page.getByRole('button', { name: /Record Shift Feedback/i }).click();

    await expect(page.getByText(/Post-shift feedback recorded successfully/i)).toBeVisible();
    await expect(page.getByText(/465 meals/i).first()).toBeVisible();
  });
});
