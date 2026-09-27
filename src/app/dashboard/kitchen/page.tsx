'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import RoleDashboardNav from '@/components/RoleDashboardNav';

export default function KitchenDashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const {
    activeForecast,
    activeDonation,
    activeClaim,
    activeTask,
    forecastFeedbackLogs,
    recordForecastFeedback,
    createDonation,
  } = usePlatformStore();

  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [actualInput, setActualInput] = React.useState<number>(activeForecast.most_likely_demand);
  const [noteInput, setNoteInput] = React.useState<string>('');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = React.useState<string | null>(null);
  const [publishSuccessMsg, setPublishSuccessMsg] = React.useState<string | null>(null);

  const handlePublishSurplusFood = async () => {
    const portions = activeForecast.predicted_surplus_meals || 45;
    const weight = activeForecast.predicted_surplus_kg || 18;
    await createDonation({
      title: 'Freshly Prepared Matar Pulao & Paneer Curry',
      category: 'prepared',
      portions,
      weight_kg: weight,
      dietary_tags: ['Vegetarian', 'Nut-Free', 'Halal Certified'],
      holding_temp: 'hot',
      holding_temp_label: 'Hot Holding (>60°C)',
      cutoff_date: new Date().toISOString().split('T')[0],
      cutoff_time: '22:15',
      pickup_notes: 'Enter via back alley loading dock. Ring buzzer #2 for Chef Rajesh Sharma. Insulated transport bags provided on-site.',
    });
    setPublishSuccessMsg(`Donation Published Successfully: ${portions} portions (${weight} kg) registered and available for NGO claim.`);
    setTimeout(() => setPublishSuccessMsg(null), 6000);
  };

  const handleKitchenFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualInput || actualInput <= 0) return;
    await recordForecastFeedback({
      forecastId: activeForecast.id,
      date: `${activeForecast.day_of_week}, ${activeForecast.meal_type.toUpperCase()} Shift`,
      mealType: activeForecast.meal_type,
      predictedDemand: activeForecast.most_likely_demand,
      predictedSurplus: activeForecast.predicted_surplus_meals,
      actualProduction: activeForecast.planned_production_meals,
      actualConsumption: actualInput,
      operationalNote: noteInput,
    });
    setFeedbackSuccessMsg('Shift consumption recorded successfully!');
    setNoteInput('');
    setShowFeedbackModal(false);
    setTimeout(() => setFeedbackSuccessMsg(null), 4000);
  };

  const donation = activeDonation;
  const status = donation?.status || 'available';

  const getStatusBadge = () => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Published · Available for Claim
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Claimed by NGO
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Courier In Transit
          </span>
        );
      case 'delivered':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
            Delivered &amp; Logged
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <RoleDashboardNav currentRole="kitchen" orgName="MoFPI Pilot Kitchen 01 · Regional Unit" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role Identity & Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Institutional Kitchen &amp; Food Processing Unit Workspace</span>
                </div>
                {(profile?.organization_name || 'MoFPI Pilot Kitchen 01 · Regional Unit') && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600 dark:text-emerald-400">domain</span>
                    <span>{profile?.organization_name || 'MoFPI Pilot Kitchen 01 · Regional Unit'}</span>
                  </div>
                )}
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                Kitchen Operations Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Mitigate overproduction risks with proactive AI demand forecasts, calibrate safe production batch buffers, register surplus food, and track temperature-compliant redistribution handoffs.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <Link
                href="/forecast"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">trending_up</span>
                <span>View Forecast</span>
              </Link>

              <button
                type="button"
                onClick={handlePublishSurplusFood}
                id="publishSurplusBtn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Publish Surplus Food</span>
              </button>

              <Link
                href="/restaurant/post"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-xs"
                title="Open detailed custom surplus batch form"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-500">edit_note</span>
                <span>Post Surplus Food Form</span>
              </Link>
            </div>
          </div>

          {/* Success Confirmation Banner for Locally Published Surplus Food */}
          {publishSuccessMsg && (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 shadow-sm flex items-start gap-3.5"
            >
              <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold text-base text-emerald-950 dark:text-emerald-200">
                    Donation Published Successfully
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Published · Available for NGO Claim
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300/90 mt-1 leading-relaxed">
                  {publishSuccessMsg}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
                  To simulate claiming this batch, switch to <strong>Demo Role: NGO</strong> in the top bar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPublishSuccessMsg(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Tomorrow Demand</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">groups</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {activeForecast.most_likely_demand} <span className="text-xs font-normal text-slate-500">meals</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Range: {activeForecast.expected_demand_min} – {activeForecast.expected_demand_max} meals
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block mt-0.5">
                Uncertainty: ±{activeForecast.uncertainty_margin_pct || 6.0}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Suggested Production</span>
                <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">soup_kitchen</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {activeForecast.planned_production_meals} <span className="text-xs font-normal text-slate-500">meals</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium capitalize">
                Buffer status: {activeForecast.override_status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Predicted Surplus</span>
                <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">warning</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {activeForecast.predicted_surplus_meals} <span className="text-xs font-normal text-slate-500">meals ({activeForecast.predicted_surplus_kg} kg)</span>
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1 font-medium">
                Surplus Risk: {activeForecast.surplus_risk}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Active Donation</span>
                <span className="material-symbols-outlined text-[16px] text-purple-600 dark:text-purple-400">inventory_2</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {donation?.portions || 0} <span className="text-xs font-normal text-slate-500">portions</span>
              </div>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
          </div>
        </div>

        {/* Desktop 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 spans): Primary Kitchen Actions & Forecast Detail */}
          <div className="lg:col-span-2 space-y-6">
            {/* Forecast Overview Card */}
            <section
              aria-label="Demand Forecast Overview"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">trending_up</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Operational Demand &amp; Surplus Recommendation
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {activeForecast.data_source_label || 'Demo Synthetic Baseline'}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-850">
                    Confidence: {activeForecast.confidence_tier || 'Moderate'} (±{activeForecast.uncertainty_margin_pct || 6.0}%)
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeForecast.forecast_explanation || activeForecast.ai_recommendation}
              </p>

              {/* Multi-Factor Explainability Breakdown (Phase 4.5) */}
              {activeForecast.explanation_factors && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Primary Baseline Driver:</span>
                    <span className="text-slate-600 dark:text-slate-400">{activeForecast.explanation_factors.primary_driver}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Context Signals Applied:</span>
                    <span className="text-slate-600 dark:text-slate-400">{activeForecast.explanation_factors.context_driver}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Uncertainty Driver:</span>
                    <span className="text-slate-600 dark:text-slate-400">{activeForecast.explanation_factors.uncertainty_driver}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Surplus Mitigation:</span>
                    <span className="text-slate-600 dark:text-slate-400">{activeForecast.explanation_factors.surplus_mitigation}</span>
                  </div>
                </div>
              )}

              {/* Attendance & Baseline Context */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Baseline Attendance:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {activeForecast.expected_attendance} Diners
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Historical Avg Demand:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {activeForecast.historical_comparison.avg_demand_same_day} Meals
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Active Signal Detected:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                    {activeForecast.detected_context_signals[0] || 'Standard Shift'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Kitchen managers retain final operational authority over batch sizes.
                </span>
                <Link
                  href="/forecast"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1"
                >
                  <span>Open Forecast Simulator →</span>
                </Link>
              </div>
            </section>

            {/* Active Surplus Batch & Food Safety Card */}
            {donation && (
              <section
                aria-label="Active Surplus Batch"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">restaurant</span>
                    <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      Active Surplus Batch Registration
                    </h2>
                  </div>
                  {getStatusBadge()}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {donation.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {donation.portions} portions · {donation.weight_kg} kg · {donation.category.toUpperCase()}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
                      {donation.holding_temp_label}
                    </span>
                  </div>

                  {donation.freshness_assessment && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Logged Probe Temp</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {donation.freshness_assessment.current_temp_c}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Elapsed Time</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {donation.freshness_assessment.elapsed_hours}h
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Safe Window</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {donation.freshness_assessment.remaining_shelf_life_formatted}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Risk Level</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {donation.freshness_assessment.risk_level}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                    Pickup note: &ldquo;{donation.pickup_notes}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Batch ID: <span className="font-mono">{donation.id}</span>
                  </span>
                  <Link
                    href="/restaurant/post"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    <span>Manage / Post New Batch →</span>
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* Right Column (1 span): Redistribution Tracker & Feedback Logs */}
          <div className="space-y-6">
            {/* Active Redistribution Tracking */}
            <section
              aria-label="Redistribution Lifecycle Tracker"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">sync_alt</span>
                <span>Donation Lifecycle &amp; State Machine</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Surplus Posted</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {donation?.portions || 45} meals ready at loading bay
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold ${
                      activeClaim
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Shelter Match</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {activeClaim ? `${activeClaim.ngo_name} (Matched)` : 'Awaiting NGO claim match'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold ${
                      activeTask
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Courier Transit</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {activeTask
                        ? `${activeTask.volunteer_name} (ETA: ${activeTask.eta_mins} mins)`
                        : 'Courier dispatch pending'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold ${
                      status === 'delivered' || status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    4
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Delivery Proof</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {status === 'delivered' || status === 'completed'
                        ? 'Verified digital handoff completed'
                        : 'Pending delivery completion'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Closed-Loop Post-Shift Variance Feedback */}
            <section
              aria-label="Closed-Loop Feedback Logs"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">history</span>
                  <span>Closed-Loop Variance History</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(!showFeedbackModal)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  <span>Log Actuals</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Post-shift actual consumption vs. prediction variance logs.
              </p>

              {feedbackSuccessMsg && (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  ✓ {feedbackSuccessMsg}
                </div>
              )}

              {showFeedbackModal && (
                <form
                  onSubmit={handleKitchenFeedbackSubmit}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                    Log Post-Shift Consumption
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Actual Consumed (Meals)</label>
                    <input
                      type="number"
                      min={50}
                      max={1200}
                      value={actualInput}
                      onChange={(e) => setActualInput(Number(e.target.value))}
                      className="w-full h-7 px-2 rounded border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Operational Explanation</label>
                    <input
                      type="text"
                      placeholder="e.g. Mild rain reduced walk-ins by ~15"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="w-full h-7 px-2 rounded border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
                    >
                      Record Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {forecastFeedbackLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-slate-800 dark:text-slate-200">
                        {log.date} ({log.meal_type})
                      </span>
                      <span
                        className={`font-semibold ${
                          log.forecast_deviation <= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {log.forecast_deviation > 0 ? `+${log.forecast_deviation}` : log.forecast_deviation} meals
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {log.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
