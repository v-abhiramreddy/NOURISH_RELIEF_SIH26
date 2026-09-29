'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatformStore } from '@/lib/store';

export default function UnifiedDemoDashboard() {
  const {
    activeDonation,
    activeForecast,
    getImpactMetrics,
    resetToDemoData,
  } = usePlatformStore();

  const [notification, setNotification] = useState<string | null>(null);

  const metrics = getImpactMetrics();
  const status = activeDonation?.status || 'available';

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => (current === msg ? null : current));
    }, 5000);
  };

  // Reset Demo Simulation
  const handleResetDemo = () => {
    resetToDemoData();
    showNotification('Demo Reset Successfully · Initial State Restored');
  };

  React.useEffect(() => {
    const handleResetEvent = () => {
      showNotification('Demo Reset Successfully · Initial State Restored');
    };
    window.addEventListener('nourishrelief:demo-reset', handleResetEvent);
    return () => window.removeEventListener('nourishrelief:demo-reset', handleResetEvent);
  }, []);

  const getLifecycleStage = () => {
    switch (status) {
      case 'available':
        return { step: 1, label: 'Stage 1: Surplus Published', color: 'emerald' };
      case 'claimed':
        return { step: 2, label: 'Stage 2: NGO Matched / Claimed', color: 'amber' };
      case 'in_transit':
        return { step: 3, label: 'Stage 3: Courier In Transit', color: 'blue' };
      case 'completed':
      case 'delivered':
        return { step: 4, label: 'Stage 4: Delivered & Logged', color: 'emerald' };
      default:
        return { step: 1, label: 'Stage 1: Surplus Ready', color: 'emerald' };
    }
  };

  const currentStage = getLifecycleStage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Unified Demo Mode Notification Banner */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs transition-all animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-emerald-600 dark:text-emerald-400">
                check_circle
              </span>
              <span className="font-semibold text-sm">{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Platform Hero Banner - Single Unified Presentation View */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Smart India Hackathon 2026 · AI Food Waste Redistribution Platform
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Interactive Ecosystem Simulation
                </span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                NourishRelief Demonstration Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Experience the unified food waste mitigation lifecycle in one place: proactive AI demand forecasting,
                safe surplus batch registration, intelligent NGO matching, cold-chain transport, and transparent ESG impact logging.
              </p>
            </div>

            {/* Simulation Reset & Direct Links */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                data-testid="unified-reset-demo-btn"
                onClick={handleResetDemo}
                title="Reset simulation back to initial baseline"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-rose-500">restart_alt</span>
                <span>Reset Demo</span>
              </button>

              <Link
                href="/forecast"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">trending_up</span>
                <span>Forecast Engine</span>
              </Link>
            </div>
          </div>

          {/* Core Platform Ticker Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Food Saved
              </span>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white mt-0.5">
                {metrics.total_food_saved_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                Diverted from waste
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Meals Delivered
              </span>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white mt-0.5">
                {metrics.total_meals_redistributed.toLocaleString()} <span className="text-xs font-normal text-slate-500">meals</span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 block mt-1 font-medium">
                Distributed to local shelters
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Est. CO₂ Offset
              </span>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white mt-0.5">
                {metrics.estimated_co2_avoided_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg CO₂e</span>
              </div>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 block mt-1 font-medium">
                Greenhouse emissions avoided
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Simulation Lifecycle
              </span>
              <div className="font-display font-bold text-base sm:text-lg text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{currentStage.label}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Active Step {currentStage.step} of 4
              </span>
            </div>
          </div>
        </div>

        {/* Phase 4 AI Demand & Surplus Forecasting Summary Card */}
        <section
          aria-label="Demand Forecast Overview"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">trending_up</span>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Proactive AI Demand &amp; Surplus Forecast
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {activeForecast.data_source_label || 'Demo Synthetic Baseline'}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Confidence: {activeForecast.confidence_tier || 'Moderate'} (±{activeForecast.uncertainty_margin_pct || 6.0}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Expected Attendance</span>
              <span className="font-bold text-lg text-slate-900 dark:text-white">{activeForecast.expected_attendance} Diners</span>
              <span className="text-[10px] text-slate-500 block">Tomorrow {activeForecast.meal_type.toUpperCase()} shift</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Expected Demand Range</span>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {activeForecast.expected_demand_min}–{activeForecast.expected_demand_max} meals
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Most likely: {activeForecast.most_likely_demand}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Calibrated Production</span>
              <span className="font-bold text-lg text-slate-900 dark:text-white">{activeForecast.planned_production_meals} meals</span>
              <span className="text-[10px] text-slate-500 block capitalize">Buffer: {activeForecast.override_status.replace(/_/g, ' ')}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Predicted Surplus</span>
              <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                {activeForecast.predicted_surplus_meals} meals
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-medium">
                Risk: {activeForecast.surplus_risk}
              </span>
            </div>
          </div>

          {/* Explainability Factors */}
          {activeForecast.explanation_factors && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-xl">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Primary Baseline Driver:</span>
                <span className="text-slate-600 dark:text-slate-400">{activeForecast.explanation_factors.primary_driver}</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-xl">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Surplus Mitigation:</span>
                <span className="text-slate-600 dark:text-slate-400">{activeForecast.explanation_factors.surplus_mitigation}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              AI recommendations guide kitchen batch sizes to prevent food waste before it occurs.
            </span>
            <Link
              href="/forecast"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Explore Interactive Forecast Simulator →</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
