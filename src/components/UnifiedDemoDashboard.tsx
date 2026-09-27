'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatformStore } from '@/lib/store';

export default function UnifiedDemoDashboard() {
  const {
    activeDonation,
    activeClaim,
    activeTask,
    activeProof,
    activeForecast,
    getImpactMetrics,
    createDonation,
    claimDonation,
    confirmPickup,
    completeDelivery,
    resetToDemoData,
  } = usePlatformStore();

  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const metrics = getImpactMetrics();
  const status = activeDonation?.status || 'available';

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => (current === msg ? null : current));
    }, 5000);
  };

  // 1. Publish Surplus Action
  const handlePublishSurplus = async () => {
    setIsProcessing(true);
    try {
      await createDonation({
        title: 'Freshly Prepared Matar Pulao & Paneer Curry',
        category: 'prepared',
        portions: 45,
        weight_kg: 18,
        dietary_tags: ['Vegetarian', 'Nut-Free', 'Halal Certified'],
        holding_temp: 'hot',
        holding_temp_label: 'Hot Holding (>60°C)',
        cutoff_date: new Date().toISOString().split('T')[0],
        cutoff_time: '22:15',
        pickup_notes: 'Enter via back alley loading dock. Ring buzzer #2 for Chef Rajesh Sharma.',
        status: 'available',
      });
      showNotification('Published Successfully');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Claim Food Action (NGO)
  const handleClaimFood = async () => {
    setIsProcessing(true);
    try {
      await claimDonation(activeDonation?.id || 'don-001', {
        ngo_name: 'Annapurna Seva Trust',
        facility_name: 'Annapurna Community Rasoi',
        facility_address: '420 MG Road (Central Zone)',
        claimed_portions: activeDonation?.portions || 45,
        is_full_claim: true,
        transport_mode: 'volunteer',
        compliance_certified: true,
      });
      showNotification('Food Claimed Successfully');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Simulate Courier Pickup & Transit Action
  const handleSimulateCourier = async () => {
    setIsProcessing(true);
    try {
      await confirmPickup(activeTask?.id || 'task-001', '8342');
      showNotification('Courier Dispatch Confirmed · In Transit');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Complete Delivery & Digital Proof Action
  const handleCompleteDelivery = async () => {
    setIsProcessing(true);
    try {
      const deliveredMeals = activeDonation?.portions || 45;
      const divertedKg = Number((deliveredMeals * 0.4).toFixed(1));
      const co2Kg = Number((divertedKg * 2.0).toFixed(1));

      await completeDelivery(activeTask?.id || 'task-001', {
        delivered_at: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        meals_delivered: deliveredMeals,
        food_waste_diverted_kg: divertedKg,
        co2_diverted_kg: co2Kg,
        receiver_name: 'Sunita Sharma',
        receiver_title: 'Annapurna Intake Manager',
        facility_name: 'Annapurna Community Rasoi',
        handoff_temp: 64.2,
        handoff_compliant: true,
      });
      showNotification('Delivery Completed Successfully');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Reset Demo Simulation
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

        {/* Complete Food-Waste-Reduction Lifecycle Simulation Cards */}
        <section aria-label="Ecosystem Lifecycle Simulation" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">sync_alt</span>
                <span>Ecosystem Lifecycle Simulation</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulate the entire food recovery journey directly on this unified dashboard without switching accounts.
              </p>
            </div>
          </div>

          {/* 4 Interactive Lifecycle Stages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stage 1: Kitchen Surplus Food */}
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                status === 'available'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                    storefront
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                    Kitchen Stage
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    Surplus Food
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {activeDonation ? `${activeDonation.portions} portions · ${activeDonation.title}` : '45 portions fresh prepared meals'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Temp:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">&gt;60°C Hot Holding</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Compliant</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePublishSurplus}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">publish</span>
                  <span>Publish Surplus</span>
                </button>
              </div>
            </div>

            {/* Stage 2: NGO Match & Claim */}
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                status === 'claimed'
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      status === 'claimed' || status === 'in_transit' || status === 'completed' || status === 'delivered'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    2
                  </div>
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">
                    volunteer_activism
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                    Recipient Stage
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    NGO Match &amp; Claim
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {activeClaim?.facility_name || 'Annapurna Community Rasoi'} · 94% Match Compatibility
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">38 Diners Awaiting</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {status === 'available' ? 'Ready to Claim' : 'Claimed & Matched'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing || status !== 'available'}
                  onClick={handleClaimFood}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  <span>{status === 'available' ? 'Claim Food' : 'Food Claimed'}</span>
                </button>
              </div>
            </div>

            {/* Stage 3: Courier Dispatch & Transit */}
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                status === 'in_transit'
                  ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      status === 'in_transit' || status === 'completed' || status === 'delivered'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    3
                  </div>
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">
                    local_shipping
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                    Logistics Stage
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    Courier Dispatch
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {activeTask?.volunteer_name || 'Aarav Sharma'} · Task #{activeTask?.task_code || 'NR-4821'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Route ETA:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">8 mins (0.9 mi)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {status === 'in_transit'
                        ? 'In Transit'
                        : status === 'completed' || status === 'delivered'
                        ? 'Completed'
                        : 'Assigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing || status !== 'claimed'}
                  onClick={handleSimulateCourier}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">two_wheeler</span>
                  <span>
                    {status === 'claimed'
                      ? 'Simulate Courier'
                      : status === 'in_transit'
                      ? 'In Transit'
                      : status === 'completed' || status === 'delivered'
                      ? 'Completed'
                      : 'Simulate Courier'}
                  </span>
                </button>
              </div>
            </div>

            {/* Stage 4: Delivery & Verified Proof */}
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                status === 'completed' || status === 'delivered'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      status === 'completed' || status === 'delivered'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    4
                  </div>
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                    verified
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                    Verification Stage
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    Delivery &amp; Proof
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {activeProof?.receiver_name || 'Sunita Sharma'} · Temperature &amp; Photo Verified
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Handoff Temp:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">64.2°C (Safe)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audit Log:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {status === 'completed' || status === 'delivered' ? 'Verified' : 'Pending Handoff'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing || status !== 'in_transit'}
                  onClick={handleCompleteDelivery}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">task_alt</span>
                  <span>
                    {status === 'in_transit'
                      ? 'Complete Delivery'
                      : status === 'completed' || status === 'delivered'
                      ? 'Delivered & Logged'
                      : 'Complete Delivery'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section Navigation Links */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">hub</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Explore Dedicated Capabilities:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/forecast"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Forecast Tab →
            </Link>
            <Link
              href="/restaurant/post"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Kitchen Post Tab →
            </Link>
            <Link
              href="/impact"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Impact Tab →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
