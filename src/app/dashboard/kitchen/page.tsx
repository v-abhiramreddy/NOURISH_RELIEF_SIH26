'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatformStore, isFakeOrSeedDonation } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import RoleDashboardNav from '@/components/RoleDashboardNav';
import SharedDonationLifecycle from '@/components/SharedDonationLifecycle';

export default function KitchenDashboardPage() {
  const router = useRouter();
  const { profile, isRealMode } = useAuth();
  const {
    activeForecast,
    activeDonation,
    donations,
  } = usePlatformStore();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const donation = isRealMode && isFakeOrSeedDonation(activeDonation) ? null : activeDonation;
  const status = donation?.status || 'available';

  const getStatusBadge = () => {
    if (!donation) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          No Active Batch Posted
        </span>
      );
    }
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
      {mounted && isRealMode && <RoleDashboardNav currentRole="kitchen" orgName="MoFPI Pilot Kitchen 01 · Regional Unit" />}

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

            {/* Navigation to Dedicated Tabs */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <Link
                href="/forecast"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">trending_up</span>
                <span>View Forecast</span>
              </Link>

              <Link
                href="/restaurant/post"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                title="Open dedicated Kitchen tab to post and manage surplus food batches"
              >
                <span className="material-symbols-outlined text-[15px]">restaurant</span>
                <span>Post Surplus Food</span>
              </Link>
            </div>
          </div>

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

            {/* If batch delivery completed, show completion notice */}
            {(status === 'completed' || status === 'delivered') && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-3 shadow-xs">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl shrink-0">check_circle</span>
                <div>
                  <span className="text-emerald-900 dark:text-emerald-200 font-semibold block text-sm">
                    Surplus Redistribution Cycle Completed
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                    This batch has been delivered to the NGO rasoi and safely archived into Surplus Batch History below.
                  </span>
                </div>
              </div>
            )}

            {/* Active Surplus Batch & Food Safety Card */}
            {donation ? (
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {donation.photo_url && (
                        <img
                          src={donation.photo_url}
                          alt={donation.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {donation.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {donation.portions} portions · {donation.weight_kg} kg · {donation.category.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto shrink-0">
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
            ) : (
              <section
                aria-label="Active Surplus Batch"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">restaurant</span>
                    <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      Active Surplus Batch Registration
                    </h2>
                  </div>
                  {getStatusBadge()}
                </div>

                <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      No Active Surplus Batch Posted
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Log surplus meals from institutional preparation or dinner services to alert certified food relief agencies for rapid dispatch.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/restaurant/post"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">add_circle</span>
                      <span>Post Surplus Food Now</span>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Surplus Batch History (History of Items) */}
            <section
              aria-label="Surplus Batch History"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">history</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Surplus Batch History
                  </h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {donations.length} recorded {donations.length === 1 ? 'batch' : 'batches'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {donations.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                    No surplus batch history recorded yet.
                  </p>
                ) : (
                  donations.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          item.status === 'completed' || item.status === 'delivered'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : item.status === 'claimed' || item.status === 'in_transit'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap justify-between gap-1">
                        <span>{item.portions} portions · {item.weight_kg} kg · {item.category.toUpperCase()} · Temp: {item.holding_temp_label}</span>
                        {item.claimed_by_ngo && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            Claimed by: {item.claimed_by_ngo}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column (1 span): Live Shared Donation Lifecycle */}
          <div className="space-y-6">
            <SharedDonationLifecycle role="kitchen" />
          </div>
        </div>
      </main>
    </div>
  );
}
