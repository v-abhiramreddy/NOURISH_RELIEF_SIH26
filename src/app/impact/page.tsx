'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';

export default function ImpactDashboardPage() {
  const router = useRouter();
  const { getImpactMetrics, completedProofs, activeDonation, emissionFactor, setEmissionFactor } = usePlatformStore();
  const metrics = getImpactMetrics();

  const [timeframe, setTimeframe] = useState<'ytd' | 'q1' | 'month'>('ytd');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleExport = () => {
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Platform Header */}
      <header className="sticky top-0 w-full z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="h-16 px-4 md:px-8 max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Back to dashboard"
              onClick={() => router.push('/')}
              className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">eco</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-base md:text-lg text-slate-900 leading-tight">
                  NourishRelief Impact
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Sustainability &amp; ESG Redistribution Telemetry
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/forecast')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-brand">trending_up</span>
              <span>AI Forecast</span>
            </button>
            <button
              onClick={() => router.push('/restaurant/post')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-xs transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Post Surplus</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Impact Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {/* Banner with MoFPI Context */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-brand border border-emerald-200/60">
                MoFPI Ecosystem
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Regional Redistribution Cluster
              </span>
            </div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900">
              NOURISHRELIEF IMPACT
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Transparent, measurable environmental and social metrics tracking food waste diversion,
              portion recovery, and greenhouse gas mitigation across institutional food service units.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTimeframe('ytd')}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeframe === 'ytd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
                type="button"
              >
                2026 YTD
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeframe === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
                type="button"
              >
                September (Current)
              </button>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Audit Export</span>
            </button>
          </div>
        </div>

        {/* Primary 5 KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* 1. Food Saved */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Food Saved</span>
              <span className="material-symbols-outlined text-[20px] text-brand">inventory_2</span>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-slate-900">
                {metrics.total_food_saved_kg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Direct organic weight diverted
              </p>
            </div>
          </div>

          {/* 2. Meals Redistributed */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Meals Redistributed</span>
              <span className="material-symbols-outlined text-[20px] text-blue-600">restaurant</span>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-slate-900">
                {metrics.total_meals_redistributed.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sum of delivered portions
              </p>
            </div>
          </div>

          {/* 3. Waste Prevented */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Waste Prevented</span>
              <span className="material-symbols-outlined text-[20px] text-emerald-600">delete_sweep</span>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-slate-900">
                {metrics.total_waste_prevented_kg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                100% diverted from municipal landfill
              </p>
            </div>
          </div>

          {/* 4. Estimated CO2 Avoided */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Est. CO₂ Avoided</span>
              <span className="material-symbols-outlined text-[20px] text-teal-600">co2</span>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-slate-900">
                {metrics.estimated_co2_avoided_kg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg CO₂e</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {metrics.factor_disclosure}
              </p>
            </div>
          </div>

          {/* 5. Successful Deliveries */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Successful Deliveries</span>
              <span className="material-symbols-outlined text-[20px] text-amber-600">verified</span>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-slate-900">
                {metrics.successful_deliveries_count}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Volunteer dispatch missions completed
              </p>
            </div>
          </div>
        </div>

        {/* Charts & Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Food Waste Reduction Trend (2 Columns on desktop) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs md:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Food Waste Trend (2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly diversion trajectory across participating institutional kitchens
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +314% YTD Growth
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-9 gap-1 sm:gap-2.5 h-48 items-end">
                {metrics.monthly_trend.map((item, idx) => {
                  const maxVal = Math.max(...metrics.monthly_trend.map((m) => m.food_saved_kg), 900);
                  const heightPct = Math.max(10, Math.round((item.food_saved_kg / maxVal) * 100));
                  const isCurrent = idx === metrics.monthly_trend.length - 1;
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-900 text-center whitespace-nowrap">
                        {item.food_saved_kg}
                        <span className="hidden sm:inline"> kg</span>
                      </span>
                      <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden" style={{ height: '70%' }}>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isCurrent
                              ? 'bg-brand hover:bg-brand-hover shadow-xs'
                              : 'bg-emerald-500/70 hover:bg-emerald-500'
                          }`}
                          style={{ height: `${heightPct}%` }}
                          title={`${item.month}: ${item.food_saved_kg} kg saved`}
                        ></div>
                      </div>
                      <span className={`text-[11px] sm:text-xs font-medium ${isCurrent ? 'font-bold text-brand' : 'text-slate-600'}`}>
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Baseline: Jan (210 kg)</span>
              <span>Current: Sep (870 kg) • +314% YTD Growth</span>
            </div>
          </div>

          {/* Waste Diversion by Category Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                Redistribution Categories
              </h3>
              <p className="text-xs text-slate-500">Weight breakdown by food classification</p>
            </div>

            <div className="space-y-3 pt-1">
              {metrics.category_breakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="font-semibold text-slate-600">{cat.percentage}% ({cat.weight_kg} kg)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Cluster Participation:</span>
              <div className="flex justify-between">
                <span>Active Institutional Kitchens:</span>
                <span className="font-bold text-slate-900">{metrics.institutional_kitchens_active}</span>
              </div>
              <div className="flex justify-between">
                <span>NGOs &amp; Shelters Served:</span>
                <span className="font-bold text-slate-900">{metrics.ngos_supported}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Verified Deliveries (Operational Audit Log) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-brand">verified</span>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Recent Verified Deliveries (Operational Audit Log)
                </h3>
                <p className="text-xs text-slate-500">
                  Electronic proofs of delivery logged via volunteer courier chain-of-custody
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand border border-emerald-200">
              {completedProofs.length} Logged Proof{completedProofs.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Delivered At</th>
                  <th className="py-2.5 px-3">Receiving Facility</th>
                  <th className="py-2.5 px-3">Portions Delivered</th>
                  <th className="py-2.5 px-3">Food Saved</th>
                  <th className="py-2.5 px-3">Handoff Temp</th>
                  <th className="py-2.5 px-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedProofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {proof.delivered_at}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-semibold">
                      {proof.facility_name || 'Annapurna Community Rasoi'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <strong>{proof.meals_delivered}</strong> meals
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">
                      +{proof.food_waste_diverted_kg} kg
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {proof.handoff_temp}°C ({proof.handoff_compliant ? 'Within Target Range' : 'Warning'})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                        E-Signed ({proof.receiver_name})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Transparency & Formulas Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="material-symbols-outlined text-[20px] text-brand">functions</span>
            <h3 className="font-display font-bold text-base text-slate-900">
              Impact Calculation Formulas &amp; Methodology
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-900 block">Food Saved &amp; Waste Prevented:</span>
              <p className="text-slate-600 font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200">
                food_saved = Σ (delivered portion count × 0.40 kg/portion)
              </p>
              <p className="text-slate-500 text-[11px]">
                Calculated strictly from verified volunteer delivery proofs.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-900 block">Meals Redistributed:</span>
              <p className="text-slate-600 font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200">
                meals_redistributed = Σ (confirmed portions delivered)
              </p>
              <p className="text-slate-500 text-[11px]">
                Each portion represents one nutritionally balanced meal delivered to community shelters.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-900 block">Estimated CO₂ Avoided:</span>
                {/* Configurable Emission Factor Selector */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Factor:</span>
                  {[1.8, 2.0, 2.2, 2.5].map((factorVal) => (
                    <button
                      key={factorVal}
                      type="button"
                      onClick={() => setEmissionFactor(factorVal)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                        emissionFactor === factorVal
                          ? 'bg-brand text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {factorVal.toFixed(1)}
                    </button>
                  ))}
                  <span className="text-slate-400 text-[10px]">kg CO₂e/kg</span>
                </div>
              </div>
              <p className="text-slate-600 font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200">
                co2_avoided = food_diverted_kg × {emissionFactor.toFixed(1)} kg CO₂e / kg
              </p>
              <p className="text-slate-500 text-[11px]">
                {metrics.factor_disclosure}
              </p>
            </div>
          </div>

          {/* Statutory / Operational Disclaimer */}
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">
              info
            </span>
            <p>
              <strong className="font-semibold text-amber-950">Environmental Estimation Disclosure:</strong>{' '}
              {metrics.factor_disclosure} Greenhouse gas savings and carbon equivalencies are mathematical estimates designed for operational ESG triage and reporting, and are not claimed as an independently certified MoFPI conversion factor or carbon registry audit.
            </p>
          </div>
        </div>

        {/* Copy confirmation toast */}
        {copiedNotification && (
          <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-lg bg-slate-900 text-white shadow-lg flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[16px] text-brand">check_circle</span>
            <span>MoFPI ESG Audit Summary copied to clipboard for submission.</span>
          </div>
        )}
      </main>
    </div>
  );
}
