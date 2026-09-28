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
    recordForecastFeedback,
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

  // AI Explanation modal state
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);

  // Closed-loop feedback logging state
  const [actualConsumedInput, setActualConsumedInput] = useState<number>(activeForecast.most_likely_demand);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [feedbackSavedMsg, setFeedbackSavedMsg] = useState<string | null>(null);
  const [isLoggingFeedback, setIsLoggingFeedback] = useState<boolean>(false);

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

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualConsumedInput || actualConsumedInput <= 0) return;
    setIsLoggingFeedback(true);
    try {
      await recordForecastFeedback({
        forecastId: forecast.id,
        date: `${forecast.day_of_week}, ${forecast.meal_type.toUpperCase()} Shift`,
        mealType: forecast.meal_type,
        predictedDemand: forecast.most_likely_demand,
        predictedSurplus: forecast.predicted_surplus_meals,
        actualProduction: forecast.planned_production_meals,
        actualConsumption: actualConsumedInput,
        operationalNote: feedbackNote,
      });
      setFeedbackSavedMsg('Post-shift feedback recorded successfully. Deviation added to variance history.');
      setFeedbackNote('');
      setTimeout(() => setFeedbackSavedMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingFeedback(false);
    }
  };

  const maxChartVal = 600;

  // ─── AI Forecast Explanation Modal ────────────────────────────────────────
  const renderExplanationModal = () => {
    if (!isExplanationOpen) return null;
    const f = forecast;
    const ef = f.explanation_factors;
    const isSynthetic = !f.data_source_label || f.data_source_label.toLowerCase().includes('demo') || f.data_source_label.toLowerCase().includes('synthetic');

    // Weather label
    const weatherLabel =
      weather === 'rain' ? 'Rain / Storm (walk-in dampener active)'
      : weather === 'extreme_heat' ? 'Extreme Heat (walk-in dampener active)'
      : 'Clear skies (nominal conditions)';

    // Surplus action sentence
    const surplusAction =
      f.surplus_risk === 'HIGH'
        ? `Approximately ${f.predicted_surplus_meals} meals (~${f.predicted_surplus_kg} kg) may be available for redistribution. Pre-scheduling an NGO pickup is strongly advised.`
        : f.surplus_risk === 'MODERATE'
        ? `A moderate surplus of about ${f.predicted_surplus_meals} meals (~${f.predicted_surplus_kg} kg) is expected. Standard shelter dispatch is recommended.`
        : `Surplus is projected below 20 meals — kitchen production and demand are well-aligned. No urgent redistribution action required.`;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forecast-explanation-title"
        data-testid="forecast-explanation-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsExplanationOpen(false)}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <h2
              id="forecast-explanation-title"
              className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"
            >
              <span aria-hidden="true">✨</span>
              AI Forecast Explanation
            </h2>
            <button
              type="button"
              onClick={() => setIsExplanationOpen(false)}
              aria-label="Close explanation"
              data-testid="close-explanation-modal"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-5 text-sm">

            {/* Why this forecast? */}
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Why this forecast?</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                {ef?.primary_driver
                  ? `The forecast for ${dayOfWeek} ${mealType} is driven primarily by the expected attendance of ${attendance} guests. ${ef.primary_driver.replace(/\(.*?coefficient.*?\)/i, '').trim()}`
                  : `Based on ${attendance} expected guests on ${dayOfWeek} during the ${mealType} shift, the model estimates demand using historical institutional kitchen baselines.`
                }
              </p>
            </section>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Current Factors */}
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Current Factors</h3>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Expected attendance:</strong> {attendance} guests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Service shift:</strong> {dayOfWeek} {mealType}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span><strong>Weather:</strong> {weatherLabel}</span>
                </li>
                {specialEvent && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Festival / Special Event:</strong> Active — demand expected to surge by ~{DEMO_CONTEXT_ASSUMPTIONS.festival_modifier_pct}% <em className="text-slate-500">(prototype assumption)</em></span>
                  </li>
                )}
                {publicHoliday && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>Public Holiday:</strong> Active — attendance expected to drop by ~{Math.abs(DEMO_CONTEXT_ASSUMPTIONS.public_holiday_modifier_pct)}% <em className="text-slate-500">(prototype assumption)</em></span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span><strong>Recent demand trend:</strong> Positive — trailing 3-week participation is growing (+{DEMO_CONTEXT_ASSUMPTIONS.recent_trend_modifier_pct}%) <em className="text-slate-500">(demo parameter)</em></span>
                </li>
                {ef?.context_driver && (
                  <li className="flex items-start gap-2 text-slate-500 italic">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>{ef.context_driver}</span>
                  </li>
                )}
              </ul>
            </section>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Forecast Result */}
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Forecast Result</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Most Likely Demand</div>
                  <div className="font-display font-bold text-lg text-slate-900 dark:text-white" data-testid="explanation-most-likely">{f.most_likely_demand} meals</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Expected Range</div>
                  <div className="font-display font-bold text-lg text-slate-900 dark:text-white" data-testid="explanation-range">{f.expected_demand_min}–{f.expected_demand_max}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Recommended Production</div>
                  <div className="font-display font-bold text-lg text-slate-900 dark:text-white" data-testid="explanation-production">{f.planned_production_meals} meals</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Surplus / Risk</div>
                  <div
                    className={`font-display font-bold text-lg ${
                      f.surplus_risk === 'HIGH' ? 'text-rose-600' : f.surplus_risk === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                    data-testid="explanation-surplus"
                  >
                    {f.predicted_surplus_meals} meals
                  </div>
                  <div className={`text-[10px] font-bold ${
                    f.surplus_risk === 'HIGH' ? 'text-rose-500' : f.surplus_risk === 'MODERATE' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>{f.surplus_risk} RISK</div>
                </div>
              </div>
              {ef?.uncertainty_driver && (
                <p className="text-[11px] text-slate-500 mt-2 italic leading-relaxed">
                  Uncertainty: ±{f.uncertainty_margin_pct}% — {ef.uncertainty_driver.replace(/^Prediction uncertainty.*?\./i, '').trim() || `derived from 10-week historical baseline.`}
                </p>
              )}
            </section>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Recommended Action */}
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Recommended Action</h3>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {surplusAction}
              </div>
            </section>

            {/* Data Source Disclosure */}
            {isSynthetic && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-[11px] text-amber-900 dark:text-amber-300">
                <span className="material-symbols-outlined text-[15px] text-amber-600 shrink-0 mt-0.5">info</span>
                <span>
                  <strong>Data source:</strong> {f.data_source_label || 'Demo Synthetic Baseline'} — Forecast uses synthetic prototype data, not real measured operational records.
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex justify-end rounded-b-2xl">
            <button
              type="button"
              onClick={() => setIsExplanationOpen(false)}
              data-testid="close-explanation-footer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  // ───────────────────────────────────────────────────────────────────────────

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
                Demand &amp; Surplus Forecast
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>MoFPI Pilot Kitchen 01 · Regional Unit</span>
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
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  Pre-Service Waste Prevention
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>{forecast.data_source_label || 'Demo Synthetic Baseline'}</span>
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                Tomorrow&apos;s Demand &amp; Surplus Forecast
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <span className="text-xs text-slate-500">Forecast Confidence:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {forecast.confidence_tier || 'Moderate'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                Uncertainty: ±{forecast.uncertainty_margin_pct}%
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

        {/* ✨ AI Forecast — Explain Button */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">AI Forecast</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Understand why this forecast was generated from the current parameters.
            </p>
          </div>
          <button
            type="button"
            data-testid="explain-forecast-btn"
            onClick={() => setIsExplanationOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:from-violet-800 active:to-indigo-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span aria-hidden="true">✨</span>
            <span>Explain Forecast</span>
          </button>
        </div>

        {/* AI Explanation Modal */}
        {renderExplanationModal()}

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
                  <span>Continue to NGO Matching →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Factor Explainability Breakdown (Phase 4.5) */}
        {forecast.explanation_factors && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">psychology</span>
                  <span>Explainable Forecast Rationale</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-factor trace explaining how baseline attendance, operational signals, and variance produce the forecast.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Prediction Uncertainty: ±{forecast.uncertainty_margin_pct || 6.0}%
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {forecast.forecast_explanation}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Primary Baseline Driver
                </span>
                <span className="text-slate-600 leading-relaxed block">
                  {forecast.explanation_factors.primary_driver}
                </span>
              </div>
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Context Signals Applied
                </span>
                <span className="text-slate-600 leading-relaxed block">
                  {forecast.explanation_factors.context_driver}
                </span>
              </div>
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Uncertainty Driver
                </span>
                <span className="text-slate-600 leading-relaxed block">
                  {forecast.explanation_factors.uncertainty_driver}
                </span>
              </div>
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Surplus Risk &amp; Mitigation
                </span>
                <span className="text-slate-600 leading-relaxed block">
                  {forecast.explanation_factors.surplus_mitigation}
                </span>
              </div>
            </div>
          </div>
        )}

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
                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
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
                Tracks predicted vs. actual demand to support future model improvement.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Feedback Loop
            </span>
          </div>

          {/* Interactive Shift Feedback Quick-Entry */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Log Post-Shift Consumption (Closed-Loop Feedback)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Record actual diner consumption to calculate prediction error and establish historical training data.
                </p>
              </div>
              {feedbackSavedMsg && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                  ✓ {feedbackSavedMsg}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmitFeedback} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Actual Diners / Consumption (Meals)
                </label>
                <input
                  type="number"
                  min={50}
                  max={1200}
                  value={actualConsumedInput}
                  onChange={(e) => setActualConsumedInput(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Operational Note / Explanation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild rain reduced walk-ins by ~15"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLoggingFeedback}
                  className="w-full h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  <span>{isLoggingFeedback ? 'Recording...' : 'Record Shift Feedback'}</span>
                </button>
              </div>
            </form>
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
                  Synthetic 10-Week Historical Operational Data (70 Shifts)
                </h3>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Demo Dataset
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
