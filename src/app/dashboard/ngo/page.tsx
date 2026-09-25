'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformStore } from '@/lib/store';
import RoleDashboardNav from '@/components/RoleDashboardNav';
import { calculateNgoMatches } from '@/lib/ngo-matcher';

export default function NgoDashboardPage() {
  const {
    activeDonation,
    activeClaim,
    activeTask,
    completedProofs,
  } = usePlatformStore();

  const donation = activeDonation;
  const isAvailable = donation && donation.status === 'available';

  // Compute matches from existing matcher
  const matches = donation
    ? calculateNgoMatches(
        donation.portions,
        (donation.holding_temp as any) || 'hot',
        donation.dietary_tags || []
      )
    : [];

  const topMatch = matches[0] || {
    ngo_name: 'Annapurna Seva Trust',
    facility_name: 'Annapurna Community Rasoi',
    distance_km: 1.2,
    match_score: 96,
    recommendation_rationale: 'High proximity (1.2 km) and active dinner intake matching hot-holding food safety requirements.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <RoleDashboardNav currentRole="ngo" orgName="Annapurna Seva Trust · Community Rasoi" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role Identity & Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Verified Food Recipient &amp; Shelter Rasoi Workspace</span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                NGO Recipient Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Discover safe perishable surplus from certified institutional kitchens, review statutory thermal compliance assessments, claim portions for community intake, and track incoming volunteer delivery.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/ngo/claim"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">touch_app</span>
                <span>View &amp; Claim Surplus</span>
              </Link>
            </div>
          </div>

          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Available Surplus</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">inventory_2</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {isAvailable ? donation.portions : 0} <span className="text-xs font-normal text-slate-500">portions</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                {isAvailable ? '1 batch ready for claim' : 'All current batches allocated'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Shelter Intake Need</span>
                <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">family_restroom</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                38 <span className="text-xs font-normal text-slate-500">clients awaiting</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Intake capacity: 120 daily meals
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Active Claim</span>
                <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">assignment_turned_in</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {activeClaim ? `${activeClaim.claimed_portions} meals` : '0 meals'}
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1 font-medium capitalize">
                {activeClaim ? `Status: ${activeClaim.status}` : 'No pending claims'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Incoming Courier</span>
                <span className="material-symbols-outlined text-[16px] text-purple-600 dark:text-purple-400">two_wheeler</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {activeTask ? `${activeTask.eta_mins} mins` : 'N/A'}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                {activeTask ? `${activeTask.volunteer_name} (En route)` : 'Awaiting courier dispatch'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 spans): Available Surplus & AI Matching */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available Surplus Details */}
            <section
              aria-label="Available Surplus Batch"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">verified</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Available Perishable Surplus from Institutional Donors
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {topMatch.match_score}% Compatibility Match
                </span>
              </div>

              {donation ? (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">
                        Donor: {donation.donor_name} ({donation.donor_address})
                      </span>
                      <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                        {donation.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
                      {donation.holding_temp_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Portions</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{donation.portions} meals</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Gross Weight</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{donation.weight_kg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Remaining Safe Window</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {donation.freshness_assessment?.remaining_shelf_life_formatted || '5.0 hrs'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Safety Risk</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {donation.freshness_assessment?.risk_level || 'LOW'} Risk
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-0.5">Matching Rationale:</span>
                    {topMatch.recommendation_rationale}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Dietary: {(donation.dietary_tags || ['Vegetarian', 'Nut-Free']).join(', ')}
                    </span>
                    <Link
                      href="/ngo/claim"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                      <span>Claim This Batch</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No active donations currently available.
                </div>
              )}
            </section>
          </div>

          {/* Right Column (1 span): Active Delivery & Verified History */}
          <div className="space-y-6">
            {/* Active Delivery Status */}
            <section
              aria-label="Active Incoming Delivery"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">local_shipping</span>
                <span>Incoming Delivery Status</span>
              </h2>

              {activeTask ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Task #{activeTask.task_code}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Courier: {activeTask.volunteer_name}
                      </span>
                    </div>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      ETA {activeTask.eta_mins}m
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Transit Progress:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Step {activeTask.current_step} / 4
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${(activeTask.current_step / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No active courier delivery currently in transit.
                </p>
              )}
            </section>

            {/* Completed Verified Intake History */}
            <section
              aria-label="Verified Delivery Intake History"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">verified_user</span>
                <span>Verified Intake History</span>
              </h2>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {completedProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {proof.meals_delivered} Meals Received
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        {proof.handoff_temp}°C Verified
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Receiver: {proof.receiver_name}</span>
                      <span>{proof.co2_diverted_kg} kg CO₂</span>
                    </div>
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
