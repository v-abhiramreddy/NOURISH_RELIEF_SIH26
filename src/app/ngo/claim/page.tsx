'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import NourishLogo from '@/components/NourishLogo';
import { calculateNgoMatches } from '@/lib/ngo-matcher';
import { Donation } from '@/types';

export default function NgoClaimDonationPage() {
  const router = useRouter();
  const { activeDonation, claimDonation, setCurrentRole } = usePlatformStore();

  const [selectedNgoId, setSelectedNgoId] = useState<string>('ngo-001');
  const [isFullBatch, setIsFullBatch] = useState(true);
  const [customPortions, setCustomPortions] = useState(30);
  const [complianceChecked, setComplianceChecked] = useState(true);
  const [transportMode, setTransportMode] = useState<'volunteer' | 'self'>('volunteer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const fallbackDonation: Donation = {
    id: 'don-001',
    donor_name: 'Green Leaf Bistro',
    branch_name: 'Downtown Branch',
    donor_rating: 4.9,
    donor_rescues: 142,
    donor_address: '142 Market St, Dock 2',
    portions: 45,
    weight_kg: 18,
    dietary_tags: ['Vegetarian', 'Nut-Free', 'Halal Certified'],
    holding_temp: 'hot',
    holding_temp_label: 'Hot-Holding (>60°C)',
    cutoff_date: '2026-09-17',
    cutoff_time: '22:15',
    pickup_notes: 'Enter via back alley loading dock.',
    photo_url: '',
    status: 'available',
    created_at: new Date().toISOString(),
    title: 'Freshly Prepared Mediterranean Rice & Roasted Veggies',
    category: 'prepared',
    freshness_assessment: {
      food_item: 'Freshly Prepared Mediterranean Rice & Roasted Veggies',
      prepared_time: '15:15',
      elapsed_hours: 2.5,
      current_temp_c: 64.0,
      holding_condition: 'hot',
      max_safe_shelf_life_hours: 7.5,
      remaining_shelf_life_hours: 5.0,
      remaining_shelf_life_formatted: '5.0 hrs remaining',
      risk_level: 'LOW',
      redistribution_priority: 'PRIORITY',
      actionable_recommendation:
        'Distribute immediately upon intake or transfer to commercial warming cabinets at or above 60°C.',
      temp_compliance: true,
      statutory_disclaimer:
        'AI-assisted redistribution risk assessment. This does not replace statutory food-safety procedures.',
    },
  };

  const donation: Donation = activeDonation || fallbackDonation;

  const matches = calculateNgoMatches(
    donation.portions,
    (donation.holding_temp as any) || 'hot',
    donation.dietary_tags || []
  );
  const selectedNgo = matches.find((m) => m.ngo_id === selectedNgoId) || matches[0];

  const portionsToClaim = isFullBatch ? donation.portions : customPortions;
  const estimatedCo2 = ((portionsToClaim / 45) * 36.4).toFixed(1);

  const handleClaim = async () => {
    if (!complianceChecked) {
      alert('Please confirm hot-holding verification before finalizing batch intake.');
      return;
    }

    setIsSubmitting(true);
    try {
      await claimDonation(donation.id, {
        ngo_name: selectedNgo.ngo_name,
        facility_name: selectedNgo.facility_name,
        facility_address: selectedNgo.facility_address,
        claimed_portions: portionsToClaim,
        is_full_claim: isFullBatch,
        transport_mode: transportMode,
        compliance_certified: complianceChecked,
      });

      setIsClaimed(true);
      setTimeout(() => {
        setCurrentRole('volunteer');
        router.push('/volunteer/pickup');
      }, 900);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go back"
              onClick={() => router.push('/restaurant/post')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 className="font-display font-semibold text-base text-slate-900 leading-tight">
                Claim Donation
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Hope Harbor Community Kitchen</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <NourishLogo className="h-6 w-auto opacity-95" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto sm:px-4 sm:pt-4 pb-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
          {/* Left Column: Donor + Freshness + NGO Match */}
          <div className="space-y-4 px-4 sm:px-0 pt-4 sm:pt-0">
        {/* Donor Profile Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-display font-bold text-base shrink-0">
                GL
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-slate-900 truncate">
                    {donation.donor_name}
                  </span>
                  <span
                    className="material-symbols-outlined text-[18px] text-emerald-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <span className="text-xs text-slate-500 truncate">
                  Downtown · 1.8 miles away
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <div className="flex items-center gap-1 text-amber-600">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="text-xs font-bold">{donation.donor_rating}</span>
              </div>
              <span className="text-[11px] text-slate-500">{donation.donor_rescues} rescues</span>
            </div>
          </div>
        </div>

        {/* 2x2 Key Operational Spec Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                dinner_dining
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Batch Yield</span>
            </div>
            <div className="font-display font-bold text-base text-slate-900">
              {donation.portions} Meals
            </div>
            <div className="text-xs text-slate-500">Approx. {donation.weight_kg} kg net</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="material-symbols-outlined text-[18px]">nutrition</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Dietary Specs</span>
            </div>
            <div className="font-display font-bold text-base text-slate-900 truncate">
              {donation.dietary_tags?.[0] || 'Vegetarian'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {donation.dietary_tags?.slice(1).join(' · ') || 'Nut-Free · Halal'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-amber-700">
              <span className="material-symbols-outlined text-[18px]">thermostat</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Temperature</span>
            </div>
            <div className="font-display font-bold text-base text-slate-900">
              {donation.holding_temp_label?.split(' ')[0] || 'Hot-Holding'}
            </div>
            <div className="text-xs text-slate-500 truncate">Insulated trays (&gt;60°C)</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pickup Window</span>
            </div>
            <div className="font-display font-bold text-base text-slate-900">Ready Now</div>
            <div className="text-xs text-slate-500">Until {donation.cutoff_time || '10:15 PM'}</div>
          </div>
        </div>

        {/* Verified Freshness & Expiry Risk Triage from Kitchen */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-600">biotech</span>
              <h3 className="font-display font-semibold text-sm text-slate-900">
                Kitchen Freshness &amp; Expiry Risk Triage
              </h3>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                donation.freshness_assessment?.risk_level === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : donation.freshness_assessment?.risk_level === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {donation.freshness_assessment?.risk_level || 'LOW'} RISK
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/70">
            <div>
              <span className="text-[11px] text-slate-500 block">Safe Consumption Window</span>
              <strong className="text-slate-900 font-semibold">
                {donation.freshness_assessment?.remaining_shelf_life_formatted || '5.0 hrs remaining'}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Probe Temperature</span>
              <strong className="text-slate-900 font-semibold">
                {donation.freshness_assessment?.current_temp_c ? `${donation.freshness_assessment.current_temp_c}°C` : '64.0°C'}
                <span className="text-emerald-700 text-[10px] ml-1 font-normal">
                  ({donation.freshness_assessment?.temp_compliance !== false ? 'Within Target Range' : 'Warning'})
                </span>
              </strong>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 block">Dispatch Priority</span>
              <strong className="text-brand font-semibold">
                {donation.freshness_assessment?.redistribution_priority || 'PRIORITY'} DISPATCH
              </strong>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="font-semibold text-slate-800">Shelter Action Recommendation: </strong>
            {donation.freshness_assessment?.actionable_recommendation ||
              'Distribute immediately upon intake or transfer to commercial warming cabinets at or above 60°C.'}
          </p>
        </div>

        {/* Recipient Distribution Plan Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              <h3 className="font-display font-semibold text-sm text-slate-900">Distribution Plan</h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Intake Priority: High
            </span>
          </div>

          {/* AI Recommended Recipient Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-brand">psychology</span>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  AI Recommended Recipient
                </span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {selectedNgo.match_score}% Match Score
              </span>
            </div>

            <div className="bg-white border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedNgo.ngo_name}</h4>
                  <p className="text-xs text-slate-500">{selectedNgo.facility_address}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700">{selectedNgo.distance_km} km away</span>
                  <div className="text-[11px] text-slate-400">Urgency: {selectedNgo.urgency}</div>
                </div>
              </div>

              {/* 4 Factor Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2.5 mt-2.5 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Distance</span>
                  <strong className="text-slate-800 font-semibold">{selectedNgo.distance_km} km</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Capacity</span>
                  <strong className="text-slate-800 font-semibold">{selectedNgo.capacity_meals}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Need</span>
                  <strong className="text-slate-800 font-semibold">{selectedNgo.current_need_meals}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Compat.</span>
                  <strong className="text-emerald-700 font-semibold">{selectedNgo.food_compatibility}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2 rounded text-left border border-slate-100">
                <strong className="font-semibold text-slate-800">Match Rationale: </strong>
                {selectedNgo.recommendation_rationale}
              </p>
            </div>

            {/* Candidate Selector Switcher */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Ranked Regional Candidates ({matches.length} Evaluated)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {matches.map((m) => (
                  <button
                    key={m.ngo_id}
                    onClick={() => setSelectedNgoId(m.ngo_id)}
                    className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      selectedNgoId === m.ngo_id
                        ? 'border-brand bg-white shadow-xs ring-1 ring-brand'
                        : 'border-slate-200 bg-white hover:bg-slate-50 opacity-80'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {m.ngo_name.replace(' Community Kitchen', '')}
                      </span>
                      <span className="text-[10px] font-bold text-brand">{m.match_score}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {m.distance_km} km · Need {m.current_need_meals}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>{/* end NGO Recommendation */}
          </div>{/* end Distribution Plan card */}
          </div>{/* end left column */}

          {/* Right Column: Facility + Quantity + Transport + Impact */}
          <div className="space-y-4 px-4 sm:px-0 pt-4 sm:pt-0">

          {/* Target Facility Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Designated Receiving Facility</span>
              <span className="text-emerald-700 text-[11px] normal-case font-medium">{matches.length} sites ranked</span>
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="material-symbols-outlined text-emerald-700 text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warehouse
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {selectedNgo.facility_name}
                  </span>
                  <span className="text-xs text-slate-500 truncate">
                    {selectedNgo.facility_address} · {selectedNgo.current_need_meals} clients awaiting meal
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Claim Portion Toggle / Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Intake Quantity
              </label>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isFullBatch
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
                id="portion-badge"
              >
                {isFullBatch ? 'Full Batch (100%)' : `Custom (${customPortions} Meals)`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setIsFullBatch(true)}
                className={`py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isFullBatch
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="btn-full"
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>All {donation.portions} Meals</span>
              </button>
              <button
                onClick={() => setIsFullBatch(false)}
                className={`py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  !isFullBatch
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="btn-partial"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Partial Claim</span>
              </button>
            </div>

            {!isFullBatch && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Select customized amount:</span>
                  <span className="font-display font-bold text-sm text-emerald-700">
                    {customPortions} Meals
                  </span>
                </div>
                {(() => {
                  const customPortionsPct = Math.min(
                    100,
                    Math.max(0, Math.round(((customPortions - 10) / Math.max(1, donation.portions - 10)) * 100))
                  );
                  return (
                    <input
                      className="w-full accent-emerald-600 h-2 rounded-lg cursor-pointer"
                      max={donation.portions}
                      min={10}
                      step={5}
                      type="range"
                      value={customPortions}
                      onChange={(e) => setCustomPortions(Number(e.target.value))}
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${customPortionsPct}%, var(--slider-track-bg, #e2e8f0) ${customPortionsPct}%, var(--slider-track-bg, #e2e8f0) 100%)`,
                      }}
                    />
                  );
                })()}
              </div>
            )}
          </div>

          {/* Facility Compliance Check */}
          <label className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg cursor-pointer hover:bg-slate-100/50 transition-colors">
            <input
              checked={complianceChecked}
              onChange={(e) => setComplianceChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-brand focus:ring-brand border-slate-300 accent-emerald-600 cursor-pointer"
              id="compliance-check"
              type="checkbox"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                Hot Holding Verification
              </span>
              <span className="text-xs text-slate-500 leading-relaxed mt-0.5">
                I confirm Hope Harbor maintains commercial warming cabinets capable of holding at or
                above 60°C (140°F) upon delivery.
              </span>
            </div>
          </label>

        {/* Logistics & Transport Option */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              <h3 className="font-display font-semibold text-sm text-slate-900">Dispatch &amp; Transport</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Dispatch Ready
            </span>
          </div>

          <div className="space-y-2">
            {/* Option A: Volunteer Courier */}
            <div
              onClick={() => setTransportMode('volunteer')}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                transportMode === 'volunteer'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-[20px] text-emerald-700 mt-0.5"
                  style={{ fontVariationSettings: transportMode === 'volunteer' ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {transportMode === 'volunteer' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Dispatch Volunteer Courier
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Broadcast instant mission alert to verified network. Automated route assignment
                    with thermo-insulated carriers.
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-700 text-xs font-medium">
                    <span className="material-symbols-outlined text-[15px]">electric_moped</span>
                    <span>3 verified couriers within 1.2 miles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Option B: NGO Van Driver */}
            <div
              onClick={() => setTransportMode('self')}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                transportMode === 'self'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5"
                  style={{ fontVariationSettings: transportMode === 'self' ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {transportMode === 'self' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-900">NGO Self-Pickup</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hope Harbor Van #2 is currently routed downtown. Driver will pick up directly by
                    8:45 PM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Banner */}
        <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Zero Waste Verified</div>
              <div className="text-[11px] text-slate-500">
                Diverts approx. {estimatedCo2} kg CO₂ equivalent
              </div>
            </div>
          </div>
          <div className="flex -space-x-1.5">
            <span className="inline-block w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs shadow-xs">
              🍱
            </span>
            <span className="inline-block w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs shadow-xs">
              🌱
            </span>
          </div>
          </div>{/* end Impact Banner */}

          </div>{/* end right column */}
        </div>{/* end desktop grid */}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            aria-label="Contact Kitchen Dock"
            onClick={() =>
              alert('Connecting to Green Leaf Bistro Kitchen Expeditor: +1 (555) 019-2834')
            }
            className="w-12 h-11 rounded-lg border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
          </button>
          <button
            onClick={handleClaim}
            disabled={isSubmitting || isClaimed}
            className={`flex-1 h-11 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              isClaimed
                ? 'bg-slate-900'
                : isSubmitting
                ? 'bg-emerald-700 opacity-90'
                : 'bg-brand hover:bg-brand-hover active:bg-green-900'
            }`}
            id="claim-btn"
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Securing Batch...</span>
              </>
            ) : isClaimed ? (
              <>
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>Batch Claimed! Courier Matched</span>
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  volunteer_activism
                </span>
                <span>
                  {transportMode === 'volunteer'
                    ? 'Claim Food & Match Volunteer'
                    : 'Confirm NGO Self-Pickup'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
