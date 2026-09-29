'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import NourishLogo from '@/components/NourishLogo';
import InfoTooltip from '@/components/InfoTooltip';
import { DonationCategory, HoldingTemperature } from '@/types';
import { assessFoodFreshness } from '@/lib/freshness-engine';

const CATEGORIES: { id: DonationCategory; label: string }[] = [
  { id: 'prepared', label: 'Prepared Meals' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'produce', label: 'Produce' },
  { id: 'dairy', label: 'Dairy & Chilled' },
  { id: 'pantry', label: 'Pantry' },
];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Non-Vegetarian',
  'Contains Dairy',
];

export default function RestaurantPostFoodPage() {
  const router = useRouter();
  const { isRealMode, profile } = useAuth();
  const { createDonation, activeForecast } = usePlatformStore();

  const [title, setTitle] = useState('Freshly Prepared Matar Pulao & Paneer Curry');
  const [category, setCategory] = useState<DonationCategory>('prepared');
  const [portions, setPortions] = useState<number>(45);
  const [weight, setWeight] = useState<number>(18);
  const [dietaryTags, setDietaryTags] = useState<string[]>(['Vegetarian', 'Contains Dairy']);
  const [holdingTemp, setHoldingTemp] = useState<HoldingTemperature>('hot');
  const [preparedTime, setPreparedTime] = useState<string>('15:15');
  const [currentTemp, setCurrentTemp] = useState<number>(64.0);
  const [cutoffDate, setCutoffDate] = useState<string>('2026-09-27');
  const [cutoffTime, setCutoffTime] = useState<string>('22:15');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    setCutoffDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [pickupNotes, setPickupNotes] = useState<string>(
    'Enter via back alley loading dock. Ring buzzer #2 for Chef Rajesh Sharma. Insulated transport bags provided on-site.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const toggleDietary = (tag: string) => {
    if (tag === 'Vegetarian') {
      if (dietaryTags.includes('Vegetarian')) {
        setDietaryTags(dietaryTags.filter((t) => t !== 'Vegetarian'));
      } else {
        setDietaryTags([...dietaryTags.filter((t) => t !== 'Non-Vegetarian'), 'Vegetarian']);
      }
    } else if (tag === 'Non-Vegetarian') {
      if (dietaryTags.includes('Non-Vegetarian')) {
        setDietaryTags(dietaryTags.filter((t) => t !== 'Non-Vegetarian'));
      } else {
        setDietaryTags([...dietaryTags.filter((t) => t !== 'Vegetarian'), 'Non-Vegetarian']);
      }
    } else {
      if (dietaryTags.includes(tag)) {
        setDietaryTags(dietaryTags.filter((t) => t !== tag));
      } else {
        setDietaryTags([...dietaryTags, tag]);
      }
    }
  };

  const handleHoldingTempSelect = (mode: HoldingTemperature) => {
    setHoldingTemp(mode);
    if (mode === 'hot' && currentTemp < 50) setCurrentTemp(64.0);
    else if (mode === 'chilled' && currentTemp > 10) setCurrentTemp(3.5);
    else if (mode === 'ambient') setCurrentTemp(22.0);
  };

  const freshness = assessFoodFreshness({
    food_item: title,
    prepared_time: preparedTime,
    current_temp_c: currentTemp,
    holding_condition: holdingTemp,
    reference_now: mounted ? undefined : new Date(2026, 8, 27, 17, 15, 0),
  });

  const handleResetForm = () => {
    setTitle('Freshly Prepared Matar Pulao & Paneer Curry');
    setCategory('prepared');
    setPortions(45);
    setWeight(18);
    setDietaryTags(['Vegetarian', 'Contains Dairy']);
    setHoldingTemp('hot');
    setPreparedTime('15:15');
    setCurrentTemp(64.0);
    setCutoffDate(new Date().toISOString().split('T')[0]);
    setCutoffTime('22:15');
    setPickupNotes(
      'Enter via back alley loading dock. Ring buzzer #2 for Chef Rajesh Sharma. Insulated transport bags provided on-site.'
    );
    setIsPublished(false);
    setPublishSuccess(false);
    setPublishError(null);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setPublishError(null);
    try {
      await createDonation({
        title,
        category,
        donor_name: isRealMode && profile?.organization_name ? profile.organization_name : 'MoFPI Pilot Kitchen 01',
        donor_address: isRealMode && profile?.address ? profile.address : 'Sector 4 Industrial Area, Dock 2',
        portions,
        weight_kg: weight,
        dietary_tags: dietaryTags,
        holding_temp: holdingTemp,
        holding_temp_label:
          holdingTemp === 'hot'
            ? 'Hot Holding (>60°C)'
            : holdingTemp === 'chilled'
            ? 'Chilled (0 – 4°C)'
            : 'Ambient / Room Temp',
        cutoff_date: cutoffDate,
        cutoff_time: cutoffTime,
        pickup_notes: pickupNotes,
        freshness_assessment: freshness,
      });

      setIsSubmitting(false);
      setIsPublished(true);
      setPublishSuccess(true);
      // Stay on Kitchen workflow — DO NOT redirect to NGO, DO NOT switch role
    } catch (err: any) {
      console.error('Donation publishing failed:', err);
      setIsSubmitting(false);
      setIsPublished(false);
      setPublishSuccess(false);
      setPublishError(
        err?.message || 'Failed to publish surplus donation. Please verify details and try again.'
      );
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
              onClick={() => router.push('/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 className="font-display font-semibold text-base text-slate-900 leading-tight">
                Post Surplus Food
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>MoFPI Pilot Kitchen 01 · Regional Unit</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <NourishLogo className="h-6 w-auto opacity-95" />
          </div>
        </div>
      </header>

      {/* Main Content Form Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto pb-24 sm:px-4 sm:pt-4">
        {/* Linked Forecast Context - above the two-column grid */}
        {activeForecast && (
          <section className="p-4 sm:p-5 bg-emerald-50/50 border border-emerald-200/70 sm:rounded-xl mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-brand">trending_up</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Linked to Kitchen Demand Forecast
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-brand border border-emerald-300">
                {activeForecast.override_status === 'accepted' ? 'Kitchen Approved' : 'AI Decision Support'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tomorrow&apos;s shift ({activeForecast.meal_type}, {activeForecast.expected_attendance} guests): Expected demand{' '}
              <strong>{activeForecast.expected_demand_min}–{activeForecast.expected_demand_max} meals</strong>.
              Predicted surplus: <strong className="text-brand font-bold">{activeForecast.predicted_surplus_meals} meals (~{activeForecast.predicted_surplus_kg} kg)</strong>.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPortions(activeForecast.predicted_surplus_meals);
                  setWeight(activeForecast.predicted_surplus_kg);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-white border border-emerald-300 text-brand hover:bg-emerald-50 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Set Portions to Forecast ({activeForecast.predicted_surplus_meals} meals)</span>
              </button>
            </div>
          </section>
        )}

        {/* Success Confirmation Banner */}
        {publishSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-3"
          >
            <div className="flex items-start gap-3.5">
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
                    Available for Redistribution
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300/90 mt-1 leading-relaxed">
                  Your surplus food is now available for redistribution. Partner NGOs and community rasois in your cluster can now discover and claim this batch.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">dashboard</span>
                    <span>Go to Dashboard</span>
                  </button>
                  {!isRealMode && (
                    <button
                      type="button"
                      onClick={() => router.push('/ngo/claim')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Simulate Next Step: NGO Claim Food</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Post Another Donation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {publishError && (
          <div
            role="alert"
            className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-xs"
          >
            <span className="material-symbols-outlined text-[22px] text-rose-600 dark:text-rose-400 shrink-0">error</span>
            <div className="flex-1 text-xs">
              <span className="font-semibold block text-sm">Failed to publish donation</span>
              <p className="mt-0.5 leading-relaxed">{publishError}</p>
            </div>
            <button
              type="button"
              onClick={() => setPublishError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Desktop Two-Column Layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
          {/* Left Column: Photo + Item Details + Dietary */}
          <div className="bg-white border-b border-slate-200 sm:border sm:rounded-xl sm:shadow-sm overflow-hidden">
        <form
          className="divide-y divide-slate-200"
          onSubmit={(e) => {
            e.preventDefault();
            handlePublish();
          }}
        >


          {/* Section: Photo Preview */}
          <section className="p-4 sm:p-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Food Photo
            </label>
            <div className="relative w-full h-44 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
              <img
                alt="Catering tray of freshly prepared matar pulao and mixed vegetable paneer curry"
                className="w-full h-full max-w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu0R0--LYqb5M1AkSePOATdrQ3AnfSSfdn83lV2uXar7dyFWe6ToY0RB2gDs8lD18GiEaqvkd_ESi_9B_EVesU4NNT9M4xGzVXhuUnd2W4vv4TItp0V2TwWszOywadHMArIWrQeyHLJdsGbey-nJytTDo747Oab249Akd8_pRjGEHNBuTSwmZYcK6CmsdRx8-H2ReJvIYhNQlzq7UGNotTUUfK3m6vDL3O_jtwBddvGhCeQR3Pr8-1"
              />
              <div className="absolute bottom-2.5 right-2.5">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white/95 hover:bg-white rounded-md shadow-sm border border-slate-200/80 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px] text-slate-600">photo_camera</span>
                  <span>Replace</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section: Item Details */}
          <section className="p-4 sm:p-5 space-y-4">
            {/* Title Input */}
            <div>
              <label
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
                htmlFor="itemTitle"
              >
                Donation Title
              </label>
              <input
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                id="itemTitle"
                placeholder="e.g. Matar Pulao & Paneer Curry"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2" id="categoryGroup">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      category === cat.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Weight Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Portions */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Portions (meals)
                </label>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPortions((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    id="decPortions"
                    type="button"
                    title="Decrease portion by 1"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="font-display font-semibold text-lg text-slate-900" id="portionsVal">
                    {portions}
                  </span>
                  <button
                    onClick={() => setPortions((prev) => prev + 1)}
                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    id="incPortions"
                    type="button"
                    title="Increase portion by 1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              {/* Weight */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Weight (kg approx.)
                </label>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWeight((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    id="decWeight"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="font-display font-semibold text-lg text-slate-900" id="weightVal">
                    {weight}
                  </span>
                  <button
                    onClick={() => setWeight((prev) => prev + 1)}
                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    id="incWeight"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Dietary & Safety */}
          <section className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dietary &amp; Allergens
              </label>
              <span className="text-xs text-slate-400">Select all that apply</span>
            </div>
            <div className="flex flex-wrap gap-2" id="dietaryGroup">
              {DIETARY_OPTIONS.map((tag) => {
                const isActive = dietaryTags.includes(tag);
                const isVeg = tag === 'Vegetarian';
                const isNonVeg = tag === 'Non-Vegetarian';

                let buttonClass = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                let iconClass = 'text-slate-400';

                if (isVeg) {
                  if (isActive) {
                    buttonClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-xs';
                    iconClass = 'text-emerald-600';
                  } else {
                    buttonClass = 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30';
                    iconClass = 'text-slate-400';
                  }
                } else if (isNonVeg) {
                  if (isActive) {
                    buttonClass = 'border-rose-500 bg-rose-50 text-rose-800 font-semibold shadow-xs';
                    iconClass = 'text-rose-600';
                  } else {
                    buttonClass = 'border-rose-200 bg-white text-rose-700 hover:border-rose-400 hover:bg-rose-50/40';
                    iconClass = 'text-rose-400';
                  }
                } else {
                  if (isActive) {
                    buttonClass = 'border-blue-400 bg-blue-50 text-blue-800 font-medium shadow-xs';
                    iconClass = 'text-blue-600';
                  } else {
                    buttonClass = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                    iconClass = 'text-slate-400';
                  }
                }

                return (
                  <button
                    key={tag}
                    onClick={() => toggleDietary(tag)}
                    className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors border ${buttonClass}`}
                    type="button"
                  >
                    {isVeg && (
                      <span className="w-3.5 h-3.5 border border-emerald-600 rounded-xs flex items-center justify-center p-0.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      </span>
                    )}
                    {isNonVeg && (
                      <span className="w-3.5 h-3.5 border border-rose-600 rounded-xs flex items-center justify-center p-0.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                      </span>
                    )}
                    <span className={`material-symbols-outlined text-[15px] ${iconClass}`}>
                      {isActive ? 'check' : 'add'}
                    </span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section: Storage & Temperature — hidden on desktop (shown in right column) */}
          <section className="p-4 sm:p-5 lg:hidden">
            <div className="flex items-center gap-1.5 mb-2.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Holding Temperature
              </label>
              <InfoTooltip
                label="Holding Temperature"
                content="How the food is currently being stored, such as hot holding, chilled, or room temperature."
                align="left"
                position="bottom"
              />
            </div>
            <div className="space-y-2">
              <label
                onClick={() => setHoldingTemp('hot')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  holdingTemp === 'hot'
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={holdingTemp === 'hot'}
                    onChange={() => setHoldingTemp('hot')}
                    className="w-4 h-4 text-brand focus:ring-brand border-slate-300"
                    name="tempHolding"
                    type="radio"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Hot Holding (&gt;60°C)</div>
                    <div className="text-xs text-slate-500">Under active warmer / heat lamp</div>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setHoldingTemp('chilled')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  holdingTemp === 'chilled'
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={holdingTemp === 'chilled'}
                    onChange={() => setHoldingTemp('chilled')}
                    className="w-4 h-4 text-brand focus:ring-brand border-slate-300"
                    name="tempHolding"
                    type="radio"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Chilled (0 – 4°C)</div>
                    <div className="text-xs text-slate-500">Walk-in cooler or refrigeration</div>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setHoldingTemp('ambient')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  holdingTemp === 'ambient'
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={holdingTemp === 'ambient'}
                    onChange={() => setHoldingTemp('ambient')}
                    className="w-4 h-4 text-brand focus:ring-brand border-slate-300"
                    name="tempHolding"
                    type="radio"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Ambient / Room Temp</div>
                    <div className="text-xs text-slate-500">Dry bakery goods, sealed pantry items</div>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Section: AI-Assisted Freshness & Expiry Risk Assessment — hidden on desktop (shown in right column) */}
          <section className="p-4 sm:p-5 bg-slate-50/60 space-y-3.5 border-t border-slate-200 lg:hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  Quality &amp; Expiry Risk
                </span>
                <h3 className="font-display font-bold text-sm text-slate-900 mt-0.5">
                  Freshness &amp; Expiry Risk Assessment
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                <span className="material-symbols-outlined text-[13px]">biotech</span>
                <span>Rule-Based Engine</span>
                <InfoTooltip
                  label="Rule-Based Engine"
                  content={`Uses predefined rules based on preparation time, temperature, and holding condition to assess redistribution risk.\n\nThis is an AI-assisted redistribution risk assessment and does not replace statutory food-safety procedures.`}
                  align="right"
                  position="bottom"
                />
              </span>
            </div>

            {/* Inputs: Prepared Time & Probe Temperature */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="prepTimeInput">
                  Prepared Time (Today)
                </label>
                <input
                  id="prepTimeInput"
                  type="time"
                  value={preparedTime}
                  onChange={(e) => setPreparedTime(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-semibold text-slate-600 cursor-pointer" htmlFor="tempProbeInput">
                      Recorded Probe Temp (°C)
                    </label>
                    <InfoTooltip
                      label="Recorded Probe Temp (°C)"
                      content="The current temperature recorded from the food."
                      align="right"
                      position="bottom"
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${freshness.is_thermal_mismatch ? 'text-rose-700 font-extrabold' : freshness.temp_compliance ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {freshness.is_thermal_mismatch ? 'Severe Thermal Mismatch' : freshness.temp_compliance ? 'Within Target Range' : 'Warning: Sub-optimal'}
                  </span>
                </div>
                <input
                  id="tempProbeInput"
                  type="number"
                  step="0.5"
                  value={currentTemp}
                  onChange={(e) => setCurrentTemp(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Assessment Telemetry Grid */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[11px] text-slate-500 font-medium">Elapsed Time</span>
                    <InfoTooltip
                      label="Elapsed Time"
                      content="How much time has passed since the food was prepared."
                      align="left"
                      position="bottom"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>
                    {freshness.elapsed_hours} hours ago
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[11px] text-slate-500 font-medium">Calculated Redistribution Window</span>
                    <InfoTooltip
                      label="Calculated Redistribution Window"
                      content="The estimated time remaining in which the food can be considered for redistribution based on the assessment."
                      align="right"
                      position="bottom"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>
                    {freshness.remaining_shelf_life_formatted}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 font-medium block">Expiry Risk Tier</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      freshness.risk_level === 'LOW'
                        ? 'bg-emerald-100 text-emerald-800'
                        : freshness.risk_level === 'MODERATE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {freshness.risk_level} RISK
                  </span>
                </div>
              </div>

              {/* Actionable Recommendation */}
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[17px] text-brand mt-0.5">verified_user</span>
                <div className="text-xs text-slate-700 leading-relaxed" suppressHydrationWarning>
                  <strong className="font-semibold text-slate-900">Redistribution Priority ({freshness.redistribution_priority}): </strong>
                  {freshness.actionable_recommendation}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <strong>Statutory Notice:</strong> {freshness.statutory_disclaimer}
            </p>
          </section>

          {/* Section: Pickup Window & Instructions — hidden on desktop (shown in right column) */}
          <section className="p-4 sm:p-5 space-y-4 lg:hidden">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Pickup Cutoff Time
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative">
                  <input
                    className="w-full h-11 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    type="date"
                    value={cutoffDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <input
                    className="w-full h-11 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    type="time"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Kitchen closes at 10:30 PM. Couriers will be assigned within this window.
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
                htmlFor="pickupNotes"
              >
                Pickup &amp; Handover Instructions
              </label>
              <textarea
                className="w-full p-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all resize-none"
                id="pickupNotes"
                placeholder="e.g. Enter through back alley loading dock, ring buzzer #2 for kitchen manager."
                rows={3}
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
              />
            </div>
          </section>
        </form>
          </div>{/* end left column */}

          {/* Right Column: Temperature + Freshness + Pickup Window */}
          <div className="hidden lg:block bg-white border-b border-slate-200 sm:border sm:rounded-xl sm:shadow-sm divide-y divide-slate-200">
            {/* Temperature Section */}
            <section className="p-4 sm:p-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Holding Temperature
                </label>
                <InfoTooltip
                  label="Holding Temperature"
                  content="How the food is currently being stored, such as hot holding, chilled, or room temperature."
                  align="left"
                  position="bottom"
                />
              </div>
              <div className="space-y-2">
                <label
                  onClick={() => setHoldingTemp('hot')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    holdingTemp === 'hot'
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      id="holdingHotR"
                      value="hot"
                      checked={holdingTemp === 'hot'}
                      onChange={() => setHoldingTemp('hot')}
                      className="w-4 h-4 text-brand focus:ring-brand border-slate-300"
                      name="tempHoldingR"
                      type="radio"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">Hot Holding (&gt;60°C)</div>
                      <div className="text-xs text-slate-500">Under active warmer / heat lamp</div>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setHoldingTemp('chilled')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    holdingTemp === 'chilled'
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      id="holdingChilledR"
                      value="chilled"
                      checked={holdingTemp === 'chilled'}
                      onChange={() => setHoldingTemp('chilled')}
                      className="w-4 h-4 text-brand focus:ring-brand border-slate-300"
                      name="tempHoldingR"
                      type="radio"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">Chilled (0 – 4°C)</div>
                      <div className="text-xs text-slate-500">Walk-in cooler or refrigeration</div>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setHoldingTemp('ambient')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    holdingTemp === 'ambient'
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      id="holdingAmbientR"
                      value="ambient"
                      checked={holdingTemp === 'ambient'}
                      onChange={() => setHoldingTemp('ambient')}
                      className="w-4 h-4 text-brand focus:ring-brand border-slate-300"
                      name="tempHoldingR"
                      type="radio"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">Ambient / Room Temp</div>
                      <div className="text-xs text-slate-500">Dry bakery goods, sealed pantry items</div>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            {/* AI Freshness Section (duplicated in right col on desktop) */}
            <section className="p-4 sm:p-5 bg-slate-50/60 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">
                    Quality &amp; Expiry Risk
                  </span>
                  <h3 className="font-display font-bold text-sm text-slate-900 mt-0.5">
                    Freshness &amp; Expiry Risk Assessment
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                  <span className="material-symbols-outlined text-[13px]">biotech</span>
                  <span>Rule-Based Engine</span>
                  <InfoTooltip
                    label="Rule-Based Engine"
                    content={`Uses predefined rules based on preparation time, temperature, and holding condition to assess redistribution risk.\n\nThis is an AI-assisted redistribution risk assessment and does not replace statutory food-safety procedures.`}
                    align="right"
                    position="bottom"
                  />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="prepTimeInputR">
                    Prepared Time (Today)
                  </label>
                  <input
                    id="prepTimeInputR"
                    type="time"
                    value={preparedTime}
                    onChange={(e) => setPreparedTime(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-semibold text-slate-600 cursor-pointer" htmlFor="tempProbeInputR">
                        Recorded Probe Temp (°C)
                      </label>
                      <InfoTooltip
                        label="Recorded Probe Temp (°C)"
                        content="The current temperature recorded from the food."
                        align="right"
                        position="bottom"
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${freshness.is_thermal_mismatch ? 'text-rose-700 font-extrabold' : freshness.temp_compliance ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {freshness.is_thermal_mismatch ? 'Severe Thermal Mismatch' : freshness.temp_compliance ? 'Within Target Range' : 'Warning: Sub-optimal'}
                    </span>
                  </div>
                  <input
                    id="tempProbeInputR"
                    type="number"
                    step="0.5"
                    value={currentTemp}
                    onChange={(e) => setCurrentTemp(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[11px] text-slate-500 font-medium">Elapsed Time</span>
                      <InfoTooltip
                        label="Elapsed Time"
                        content="How much time has passed since the food was prepared."
                        align="left"
                        position="bottom"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>
                      {freshness.elapsed_hours} hours ago
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[11px] text-slate-500 font-medium">Calculated Redistribution Window</span>
                      <InfoTooltip
                        label="Calculated Redistribution Window"
                        content="The estimated time remaining in which the food can be considered for redistribution based on the assessment."
                        align="right"
                        position="bottom"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>
                      {freshness.remaining_shelf_life_formatted}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 font-medium block">Expiry Risk Tier</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        freshness.risk_level === 'LOW'
                          ? 'bg-emerald-100 text-emerald-800'
                          : freshness.risk_level === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {freshness.risk_level} RISK
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[17px] text-brand mt-0.5">verified_user</span>
                  <div className="text-xs text-slate-700 leading-relaxed" suppressHydrationWarning>
                    <strong className="font-semibold text-slate-900">Redistribution Priority ({freshness.redistribution_priority}): </strong>
                    {freshness.actionable_recommendation}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
                <strong>Statutory Notice:</strong> {freshness.statutory_disclaimer}
              </p>
            </section>

            {/* Pickup Window & Instructions */}
            <section className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Pickup Cutoff Time
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <input
                      className="w-full h-11 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                      type="date"
                      value={cutoffDate}
                      onChange={(e) => setCutoffDate(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <input
                      className="w-full h-11 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                      type="time"
                      value={cutoffTime}
                      onChange={(e) => setCutoffTime(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Kitchen closes at 10:30 PM. Couriers will be assigned within this window.
                </p>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
                  htmlFor="pickupNotesR"
                >
                  Pickup &amp; Handover Instructions
                </label>
                <textarea
                  className="w-full p-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all resize-none"
                  id="pickupNotesR"
                  placeholder="e.g. Enter through back alley loading dock, ring buzzer #2 for kitchen manager."
                  rows={3}
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                />
              </div>
            </section>
          </div>{/* end right column */}
        </div>{/* end desktop grid */}
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block text-xs text-slate-500">
            {publishSuccess ? (
              <span className="font-medium text-emerald-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                Surplus batch live and ready for redistribution
              </span>
            ) : (
              <>
                <span className="font-medium text-slate-700">3 partner shelters</span> ready for dispatch
              </>
            )}
          </div>
          <button
            onClick={publishSuccess ? () => router.push('/dashboard') : handlePublish}
            disabled={isSubmitting}
            className={`w-full sm:w-auto sm:min-w-[200px] h-11 px-6 rounded-lg text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
              publishSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : isSubmitting
                ? 'bg-emerald-700 opacity-90'
                : 'bg-brand hover:bg-brand-hover active:bg-green-900'
            }`}
            id="publishBtn"
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Publishing...</span>
              </>
            ) : publishSuccess ? (
              <>
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Donation Published · Go to Dashboard</span>
              </>
            ) : (
              <>
                <span>Publish Donation</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
