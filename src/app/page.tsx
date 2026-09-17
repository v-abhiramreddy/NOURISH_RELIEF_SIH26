'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { activeDonation, setCurrentRole, getImpactMetrics } = usePlatformStore();
  const metrics = getImpactMetrics();

  const status = activeDonation?.status || 'available';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Platform Hero Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-brand text-xs font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
              Smart Food Waste Reduction &amp; Redistribution Ecosystem
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 leading-tight">
              NourishRelief
            </h1>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              An AI-powered smart food waste reduction and sustainable redistribution platform designed for
              institutional kitchens and food processing units. Predicting surplus before it occurs, monitoring
              freshness risks, and orchestrating intelligent shelter redistribution with optimized logistics.
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Food Saved</span>
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">Demo Baseline</span>
              </div>
              <span className="text-xl font-bold text-slate-900 font-display">{metrics.total_food_saved_kg.toLocaleString()} kg</span>
              <span className="text-[11px] text-emerald-600 block mt-0.5">Diverted from waste</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Meals Delivered</span>
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">Demo Baseline</span>
              </div>
              <span className="text-xl font-bold text-slate-900 font-display">{metrics.total_meals_redistributed.toLocaleString()}</span>
              <span className="text-[11px] text-blue-600 block mt-0.5">To local shelters</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Est. CO₂ Offset</span>
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">Demo Baseline</span>
              </div>
              <span className="text-xl font-bold text-slate-900 font-display">{metrics.estimated_co2_avoided_kg.toLocaleString()} kg</span>
              <span className="text-[11px] text-teal-600 block mt-0.5">Greenhouse gases avoided</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Demo Status</span>
              <span className="text-xl font-bold text-emerald-700 font-display flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
                </span>
                Operational
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">NourishRelief Prototype</span>
            </div>
          </div>
        </div>

        {/* AI Ecosystem Modules Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-900">
              AI &amp; Smart Redistribution Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: AI Demand Forecast */}
            <div
              onClick={() => router.push('/forecast')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-brand hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-brand flex items-center justify-center border border-emerald-200/60">
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-brand transition-colors">
                  Demand &amp; Surplus Forecast
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Predicts tomorrow&apos;s meal demand and surplus before cooking begins, allowing institutional
                  kitchens to reduce production or pre-schedule redistribution.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-brand">
                <span>View Prediction Engine</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>

            {/* Card 2: Food Freshness & Expiry Risk */}
            <div
              onClick={() => router.push('/restaurant/post')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-brand hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                  <span className="material-symbols-outlined text-[20px]">thermostat</span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-brand transition-colors">
                  Freshness &amp; Expiry Risk Engine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitors holding temperatures, elapsed preparation times, and computes freshness redistribution windows
                  to prioritize high-risk perishable donations.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-amber-700">
                <span>Post &amp; Assess Food</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>

            {/* Card 3: Intelligent Matching & ESG Impact */}
            <div
              onClick={() => router.push('/impact')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-brand hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-brand transition-colors">
                  Intelligent Matching &amp; Impact
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Multi-factor NGO compatibility scoring paired with transparent impact calculations and food-waste diversion tracking.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>View Impact Analytics</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational Lifecycle & State Machine */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                Operational Redistribution Layer
              </span>
              <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                Donation Lifecycle &amp; State Machine
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Current Status:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-brand border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                {status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div
              onClick={() => {
                setCurrentRole('restaurant');
                router.push('/restaurant/post');
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-emerald-50/20 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-brand transition-colors">
                    storefront
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Kitchen: Post Food
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Log surplus portions, recorded probe temperatures, allergens, and redistribution window.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand mt-4 flex items-center gap-1">
                <span>Post Surplus</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => {
                setCurrentRole('ngo');
                router.push('/ngo/claim');
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-emerald-50/20 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-brand transition-colors">
                    volunteer_activism
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  NGO: Smart Claim
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  View calculated match score (94%), review food category compatibility, and claim donation.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand mt-4 flex items-center gap-1">
                <span>Claim Batch</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => {
                setCurrentRole('volunteer');
                router.push('/volunteer/pickup');
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-emerald-50/20 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-brand transition-colors">
                    local_shipping
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Volunteer: Optimized Pickup
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review optimized route (5.8 km, 19 min), complete equipment checklist, enter PIN.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand mt-4 flex items-center gap-1">
                <span>Dispatch Pickup</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => {
                setCurrentRole('volunteer');
                router.push('/volunteer/summary');
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-emerald-50/20 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-brand transition-colors">
                    verified
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Delivery &amp; Impact Summary
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect electronic proof of delivery, handoff temp, and updated environmental metrics.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand mt-4 flex items-center gap-1">
                <span>View Summary</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Donation Snapshot */}
        {activeDonation && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                Active Batch Snapshot
              </h3>
              <span className="text-xs text-slate-500 font-mono">ID: {activeDonation.id}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-slate-500">Item Title</span>
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {activeDonation.title}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Portions &amp; Weight</span>
                <div className="text-sm font-semibold text-slate-900">
                  {activeDonation.portions} meals · {activeDonation.weight_kg} kg
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Condition</span>
                <div className="text-sm font-semibold text-slate-900">
                  {activeDonation.holding_temp_label}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Donor</span>
                <div className="text-sm font-semibold text-slate-900">
                  {activeDonation.donor_name && !activeDonation.donor_name.includes('Green Leaf') && !activeDonation.donor_name.includes('Bistro')
                    ? activeDonation.donor_name
                    : 'MoFPI Pilot Kitchen 01'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
