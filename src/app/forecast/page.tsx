'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import NourishLogo from '@/components/NourishLogo';
import {
  HISTORICAL_KITCHEN_LOGS,
  SYNTHETIC_10_WEEK_HISTORICAL_LOGS,
  DEMO_CONTEXT_ASSUMPTIONS,
  ForecastParameters,
} from '@/lib/ml-forecast';

export default function ForecastPage() {
  const router = useRouter();
  const {
    activeForecast,
    updateForecast,
    acceptForecastRecommendation,
    overrideForecastProduction,
    forecastFeedbackLogs,
    setCurrentRole,
  } = usePlatformStore();

  const [date, setDate] = useState('2026-09-17');
  const [dayOfWeek, setDayOfWeek] = useState('Thursday');
  const [mealType, setMealType] = useState<'lunch' | 'dinner' | 'breakfast'>('dinner');
  const [attendance, setAttendance] = useState<number>(480);
  const [bufferPct, setBufferPct] = useState<number>(10);
  const [weather, setWeather] = useState<'clear' | 'rain' | 'extreme_heat'>('clear');
  const [specialEvent, setSpecialEvent] = useState<boolean>(false);
  const [publicHoliday, setPublicHoliday] = useState<boolean>(false);

  // Manual override state
  const [isEditingOverride, setIsEditingOverride] = useState<boolean>(false);
  const [customBatch, setCustomBatch] = useState<number>(activeForecast.planned_production_meals);

  React.useEffect(() => {
    if (activeForecast) {
      if (activeForecast.expected_attendance) setAttendance(activeForecast.expected_attendance);
      if (activeForecast.day_of_week) setDayOfWeek(activeForecast.day_of_week);
      if (activeForecast.meal_type) setMealType(activeForecast.meal_type);
      if (activeForecast.planned_production_meals) setCustomBatch(activeForecast.planned_production_meals);
      const hasFestival = activeForecast.context_adjustments_applied?.some((a) =>
        a.factor_name.includes('Festival')
      );
      const hasHoliday = activeForecast.context_adjustments_applied?.some((a) =>
        a.factor_name.includes('Holiday')
      );
      const hasRain = activeForecast.context_adjustments_applied?.some((a) =>
        a.factor_name.includes('Weather')
      );
      setSpecialEvent(!!hasFestival);
      setPublicHoliday(!!hasHoliday);
      if (hasRain) setWeather('rain');
    }
  }, [activeForecast?.id, activeForecast?.override_status, activeForecast?.planned_production_meals]);

  const forecast = activeForecast;

  const handleRecalculate = (
    newAttendance = attendance,
    newMeal = mealType,
    newDay = dayOfWeek,
    newWeather = weather,
    newEvent = specialEvent,
    newHoliday = publicHoliday,
    newBuffer = bufferPct
  ) => {
    const params: ForecastParameters = {
      date,
      meal_type: newMeal,
      day_of_week: newDay,
      expected_attendance: newAttendance,
      planned_production_buffer_pct: newBuffer,
      weather_condition: newWeather,
      special_event: newEvent,
      public_holiday: newHoliday,
    };
    const updated = updateForecast(params);
    setCustomBatch(updated.planned_production_meals);
    setIsEditingOverride(false);
  };

  const handleApplyOverride = () => {
    if (customBatch && customBatch > 0) {
      overrideForecastProduction(customBatch);
      setIsEditingOverride(false);
    }
  };

  const handleAcceptRecommendation = () => {
    acceptForecastRecommendation();
    setIsEditingOverride(false);
  };

  const maxChartVal = 600;

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go to Home"
              onClick={() => router.push('/')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 className="font-display font-semibold text-base text-slate-900 leading-tight">
                AI Demand &amp; Surplus Forecast
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Green Leaf Bistro · Institutional Kitchen Unit</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand border border-emerald-200">
              <span className="material-symbols-outlined text-[14px]">insights</span>
              <span>Range Forecasting &amp; Context</span>
            </span>
            <NourishLogo className="h-6 w-auto opacity-95" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Banner / SIH Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                Pre-Service Waste Prevention
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                Tomorrow&apos;s Demand &amp; Surplus Forecast
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Confidence:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {forecast.confidence_pct}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multi-stage predictive model incorporating 10-week historical kitchen baselines, day-of-week demand distributions, and configurable operational context signals. Outputs expected demand ranges and suggested production buffers while preserving kitchen management override authority.
          </p>
          <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">verified_user</span>
            <span>
              <strong>Operational Principle:</strong> Model assists operational decisions; final batch sizes remain under kitchen management authority.
            </span>
          </div>

          {/* Conceptual Operational Flow */}
          <div className="pt-2 border-t border-slate-100 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 whitespace-nowrap">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">Historical Data</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">Baseline</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">Context Signals</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-brand font-bold">Demand Range</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">Suggested Production</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">Human Decision</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">Outcome &amp; Feedback</span>
            </div>
          </div>
        </div>

        {/* 4 Core Forecast KPI Cards (Range-Based) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Expected Demand Range & Most Likely */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Expected Demand</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">group</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900">
                {forecast.expected_demand_min}–{forecast.expected_demand_max}
              </div>
              <span className="text-xs text-slate-500">meals range</span>
              <div className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block">
                Most Likely: <strong>{forecast.most_likely_demand} meals</strong>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 mt-3">
              Baseline: {forecast.historical_baseline_demand} meals
            </div>
          </div>

          {/* 2. Suggested Production Range & Actual Batch */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Suggested Production</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">skillet</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900">
                {forecast.suggested_production_min}–{forecast.suggested_production_max}
              </div>
              <span className="text-xs text-slate-500">meals suggested range</span>
              <div className="mt-2 text-xs text-slate-700">
                Planned Batch: <strong className="text-slate-900">{forecast.planned_production_meals} meals</strong>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 mt-3">
              Buffer: +{bufferPct}% safety margin
            </div>
          </div>

          {/* 3. Predicted Surplus */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Predicted Surplus</span>
                <span className="material-symbols-outlined text-[18px] text-amber-600">inventory_2</span>
              </div>
              <div className="font-display font-bold text-2xl text-amber-700">
                {forecast.predicted_surplus_meals}
              </div>
              <span className="text-xs text-slate-500">meals (~{forecast.predicted_surplus_kg} kg)</span>
              <div className="mt-2 text-xs text-slate-600">
                Excess buffer beyond most likely demand
              </div>
            </div>
            <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-slate-100 mt-3">
              Calculated for triage
            </div>
          </div>

          {/* 4. Surplus Risk Tier */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Surplus Risk</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">warning</span>
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    forecast.surplus_risk === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : forecast.surplus_risk === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      forecast.surplus_risk === 'HIGH'
                        ? 'bg-rose-600 animate-pulse'
                        : forecast.surplus_risk === 'MODERATE'
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                  ></span>
                  Surplus Risk: {forecast.surplus_risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {forecast.surplus_risk === 'HIGH'
                  ? 'Redistribution match advised'
                  : 'Manageable operational buffer'}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 mt-3">
              Rule-based threshold
            </div>
          </div>
        </div>

        {/* Human-in-the-Loop Override & Action Recommendation Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Kitchen Manager Authority &amp; Batch Approval
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    forecast.override_status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : forecast.override_status === 'manually_adjusted'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {forecast.override_status === 'accepted'
                    ? 'Recommendation Accepted'
                    : forecast.override_status === 'manually_adjusted'
                    ? `Manually Adjusted (${forecast.planned_production_meals} meals)`
                    : 'Awaiting Kitchen Manager Review'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review suggested batch size or enter a manual operational override.
              </p>
            </div>

            {/* Accept / Adjust Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptRecommendation}
                className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Accept Recommendation</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingOverride(!isEditingOverride)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Adjust Manually</span>
              </button>
            </div>
          </div>

          {/* Inline Manual Override Drawer */}
          {isEditingOverride && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Manual Batch Override (Kitchen Authority)
                  </span>
                  <p className="text-xs text-slate-500">
                    Enter the exact batch quantity to cook based on on-site kitchen judgment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    max={1200}
                    value={customBatch}
                    onChange={(e) => setCustomBatch(Number(e.target.value))}
                    className="w-32 h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-xs text-slate-600 font-medium">meals</span>
                  <button
                    type="button"
                    onClick={handleApplyOverride}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Save Override
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingOverride(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Protocol & Redistribution dispatch */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Actionable Recommendation
                </h4>
                <span className="text-[11px] font-semibold text-brand">Decision Support</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mt-1">
                {forecast.ai_recommendation}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href="/restaurant/post"
                  onClick={() => setCurrentRole('restaurant')}
                  className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Pre-Schedule Surplus Redistribution</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
                <Link
                  href="/ngo/claim"
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Preview Regional NGO Matches</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Context Adjustments Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                Transparent Context Adjustments
              </h3>
              <p className="text-xs text-slate-500">
                Auditable calculation trace showing historical baseline and configurable demo modifiers.
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Deterministic Engine</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200 font-medium">
              <span className="text-slate-600">Historical Attendance Baseline:</span>
              <span className="font-bold text-slate-900">{forecast.historical_baseline_demand} meals</span>
            </div>
            {forecast.context_adjustments_applied.map((adj, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      adj.impact_type === 'increase'
                        ? 'bg-emerald-500'
                        : adj.impact_type === 'decrease'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  <span className="text-slate-700 font-medium">{adj.factor_name}:</span>
                  <span className="text-slate-500 text-[11px]">({adj.assumption_note})</span>
                </div>
                <span
                  className={`font-semibold ${
                    adj.impact_type === 'increase'
                      ? 'text-emerald-700'
                      : adj.impact_type === 'decrease'
                      ? 'text-rose-700'
                      : 'text-slate-700'
                  }`}
                >
                  {adj.impact_type === 'increase' ? '+' : adj.impact_type === 'decrease' ? '-' : ''}
                  {Math.abs(adj.impact_meals)} meals ({adj.percentage_note})
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-1.5 font-bold text-slate-900 text-xs">
              <span>Adjusted Forecast (Most Likely):</span>
              <span className="text-brand">
                {forecast.most_likely_demand} meals (Range: {forecast.expected_demand_min}–{forecast.expected_demand_max})
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Prototype model — context adjustments are configurable demo assumptions and are not universal validated coefficients.
          </p>
        </div>

        {/* Interactive Parameter Adjustment Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                Institutional Kitchen Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Test predictive responsiveness across varying kitchen shifts, attendance targets, and external conditions.
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Simulation Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Meal Shift Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Service Shift
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                  <button
                    key={meal}
                    onClick={() => {
                      setMealType(meal);
                      handleRecalculate(attendance, meal, dayOfWeek, weather, specialEvent, publicHoliday, bufferPct);
                    }}
                    className={`py-1.5 rounded-md capitalize transition-all ${
                      mealType === meal
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    type="button"
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Service Day
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => {
                  setDayOfWeek(e.target.value);
                  handleRecalculate(attendance, mealType, e.target.value, weather, specialEvent, publicHoliday, bufferPct);
                }}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Expected Attendance Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Guest Headcount
                </label>
                <span className="font-display font-bold text-xs text-brand">
                  {attendance} guests
                </span>
              </div>
              {(() => {
                const attendancePct = Math.min(100, Math.max(0, Math.round(((attendance - 200) / (800 - 200)) * 100)));
                return (
                  <input
                    type="range"
                    min={200}
                    max={800}
                    step={20}
                    value={attendance}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAttendance(val);
                      handleRecalculate(val, mealType, dayOfWeek, weather, specialEvent, publicHoliday, bufferPct);
                    }}
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${attendancePct}%, var(--slider-track-bg, #e2e8f0) ${attendancePct}%, var(--slider-track-bg, #e2e8f0) 100%)`,
                    }}
                    className="w-full accent-emerald-600 h-2 rounded-lg cursor-pointer"
                  />
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Weather condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Weather Forecast
              </label>
              <div className="flex gap-2 text-xs">
                {[
                  { id: 'clear', label: 'Clear Skies', icon: 'wb_sunny' },
                  { id: 'rain', label: 'Rain / Storm', icon: 'rainy' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWeather(w.id as any);
                      handleRecalculate(attendance, mealType, dayOfWeek, w.id as any, specialEvent, publicHoliday, bufferPct);
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      weather === w.id
                        ? 'border-brand bg-emerald-50 text-brand font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">{w.icon}</span>
                    <span>{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Special event toggle */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">
                  Festival / Event
                </span>
                <span className="text-[11px] text-slate-400">+{DEMO_CONTEXT_ASSUMPTIONS.festival_modifier_pct}% surge</span>
              </div>
              <input
                type="checkbox"
                checked={specialEvent}
                onChange={(e) => {
                  setSpecialEvent(e.target.checked);
                  handleRecalculate(attendance, mealType, dayOfWeek, weather, e.target.checked, publicHoliday, bufferPct);
                }}
                className="w-5 h-5 rounded text-brand focus:ring-0 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Public Holiday toggle */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">
                  Public Holiday
                </span>
                <span className="text-[11px] text-slate-400">{DEMO_CONTEXT_ASSUMPTIONS.public_holiday_modifier_pct}% attendance</span>
              </div>
              <input
                type="checkbox"
                checked={publicHoliday}
                onChange={(e) => {
                  setPublicHoliday(e.target.checked);
                  handleRecalculate(attendance, mealType, dayOfWeek, weather, specialEvent, e.target.checked, bufferPct);
                }}
                className="w-5 h-5 rounded text-brand focus:ring-0 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* P1: Forecast Feedback Loop & Operational Learning Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                Forecast Feedback Loop &amp; Error Explanation (P1)
              </h3>
              <p className="text-xs text-slate-500">
                Tracks historical predictions vs. actual consumption to calibrate continuous operational learning.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Feedback Loop
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Predicted</th>
                  <th className="py-2.5 px-3">Actual Consumed</th>
                  <th className="py-2.5 px-3">Surplus</th>
                  <th className="py-2.5 px-3">Deviation</th>
                  <th className="py-2.5 px-3">Operational Learning Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastFeedbackLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {log.predicted_demand} meals
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {log.actual_consumption} meals
                    </td>
                    <td className="py-2.5 px-3 text-amber-700 font-semibold">
                      +{log.actual_surplus} meals
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.forecast_deviation > 25
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.forecast_deviation > 0 ? `±${log.forecast_deviation}` : '0'} meals
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs leading-relaxed">
                      {log.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 10-Week Synthetic Historical Dataset (Demo Training Data) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Synthetic 10-Week Historical Training Data (70 Shifts)
                </h3>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Demo Training Data
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Representative 10-week institutional kitchen baseline (MoFPI Pilot Unit 01).
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              * Note: Synthetic dataset covering ~10 weeks for demo modeling.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {SYNTHETIC_10_WEEK_HISTORICAL_LOGS.map((week) => (
              <div key={week.week} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-800">{week.week}</div>
                <div className="text-slate-500 text-[11px]">Avg Demand: <strong className="text-slate-900">{week.avg_demand}</strong></div>
                <div className="text-slate-500 text-[11px]">Avg Prep: <strong className="text-slate-900">{week.avg_production}</strong></div>
                <div className="text-amber-700 font-semibold text-[11px]">Surplus: +{week.avg_surplus} meals</div>
              </div>
            ))}
          </div>

          {/* 7-Day Micro Trend Visualization */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Recent 7-Day Day-of-Week Variation</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> Actual Demand</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-300"></span> Kitchen Prepared</span>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {HISTORICAL_KITCHEN_LOGS.map((log) => {
                const demandPct = Math.round((log.demand / maxChartVal) * 100);
                const prodPct = Math.round((log.production / maxChartVal) * 100);

                return (
                  <div key={log.day} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span className="w-12 font-semibold text-slate-800">{log.day}</span>
                      <span className="text-slate-500">
                        Demand: <strong className="text-slate-900">{log.demand}</strong> | Prep:{' '}
                        <strong className="text-slate-900">{log.production}</strong> (
                        <span className="text-amber-700 font-semibold">+{log.surplus} surplus</span>)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                      <div className="h-full bg-slate-300 rounded-full" style={{ width: `${prodPct}%` }}></div>
                      <div className="h-full bg-brand rounded-full absolute left-0 top-0" style={{ width: `${demandPct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
