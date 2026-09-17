'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import { DeliveryProof } from '@/types';

export default function VolunteerDeliverySummaryPage() {
  const router = useRouter();
  const { activeProof, activeTask, activeDonation, rateDonor, completeDelivery, setCurrentRole } = usePlatformStore();

  const [rating, setRating] = useState<number>(5);
  const [ratingSaved, setRatingSaved] = useState(false);

  // Automatically finalize delivery state upon arriving at summary
  useEffect(() => {
    if (activeTask && activeTask.status === 'picked_up') {
      const deliveredMeals = activeDonation?.portions || 45;
      const divertedKg = Number((deliveredMeals * 0.4).toFixed(1));
      const co2Kg = Number((divertedKg * 2.0).toFixed(1));
      completeDelivery(activeTask.id, {
        delivered_at: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        meals_delivered: deliveredMeals,
        food_waste_diverted_kg: divertedKg,
        co2_diverted_kg: co2Kg,
        receiver_name: 'Sunita Sharma',
        receiver_title: 'Annapurna Intake Manager',
        facility_name: activeDonation?.facility_name || 'Annapurna Community Rasoi',
      });
    }
  }, [activeTask, activeDonation, completeDelivery]);

  const fallbackProof: DeliveryProof = {
    id: 'proof-001',
    task_id: 'task-001',
    donation_id: 'don-001',
    delivered_at: 'Today, 8:42 PM',
    handoff_temp: 64.2,
    handoff_compliant: true,
    receiver_name: 'Sunita Sharma',
    receiver_title: 'Rasoi & Intake Manager',
    facility_name: 'Annapurna Community Rasoi',
    signature_svg: '',
    meals_delivered: 45,
    food_waste_diverted_kg: 18.2,
    co2_diverted_kg: 52.4,
    created_at: new Date().toISOString(),
    photo_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDltkypeuN2EVIW2jA9F2ZdnThN9d7sGMI8pBg4sYu0BtDatqxFKZTpfE4pNt7oxKnmoOvrEi7P0Wexm-uchRt2DWwOvNJjKJ6OQOGAUu2rnyncDLYgaN7HOcCYJeOj9vQHB6-bY8-OwI14xGIZyWDxbo-05ezXSyHPzTHK8RWbcGiyS-U_nJCveffJw1t0FIve8Vl5jlWHyetv8QsSy8GqRv1mtAPQnaJj4Ss8cg9ljckIiajNqCeR',
  };

  const proof: DeliveryProof = activeProof || fallbackProof;

  const taskCode = activeTask?.task_code || 'NR-4821';
  const donorName =
    !activeDonation?.donor_name || activeDonation.donor_name.includes('Green Leaf') || activeDonation.donor_name.includes('Bistro')
      ? 'MoFPI Pilot Kitchen 01'
      : activeDonation.donor_name;

  const handleRate = (star: number) => {
    setRating(star);
    setRatingSaved(true);
    rateDonor(proof.id, star);
    setTimeout(() => {
      setRatingSaved(false);
    }, 2500);
  };

  const handleDownloadReceipt = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Top Navigation Header */}
      <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="h-14 px-4 max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => router.push('/volunteer/pickup')}
              className="flex items-center justify-center -ml-1 h-9 w-9 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <h1 className="font-display text-[17px] text-slate-900 font-semibold tracking-tight">
              Delivery Summary
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px] uppercase tracking-wider border border-slate-200">
              Task #{taskCode}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full pt-3 pb-10 px-4 max-w-2xl mx-auto space-y-4">
        {/* Clean Dignified Summary Header */}
        <div className="flex flex-col items-center text-center py-2 px-1 border-b border-slate-200 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-brand mb-2">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold">
            Order Fulfilled
          </span>
          <h2 className="font-display font-bold text-xl text-slate-900 mt-0.5">
            Delivery Completed
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-[340px]">
            <strong className="font-semibold text-slate-900">{proof.meals_delivered} meals</strong>{' '}
            successfully delivered to{' '}
            <strong className="font-semibold text-slate-900">
              {proof.facility_name || 'Annapurna Community Rasoi'}
            </strong>
            .
          </p>
        </div>

        {/* Proof of Delivery Card */}
        <div className="flex flex-col rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-brand">
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <h3 className="font-semibold text-sm text-slate-900">Proof of Delivery</h3>
            </div>
            <span className="rounded bg-emerald-50 text-brand px-2 py-0.5 text-xs font-semibold border border-emerald-200/60">
              Verified • Complete
            </span>
          </div>

          {/* Operational Specs Table */}
          <div className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 text-xs font-medium">Delivered at</span>
              <span className="text-slate-900 text-xs font-semibold">{proof.delivered_at}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 text-xs font-medium">Handoff temperature</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <span>{proof.handoff_temp}°C</span>
                <span className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                  Logged in target range
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 text-xs font-medium">Received by</span>
              <div className="text-right">
                <div className="text-slate-900 text-xs font-semibold">{proof.receiver_name}</div>
                <div className="text-slate-500 text-[11px]">{proof.receiver_title}</div>
              </div>
            </div>
          </div>

          {/* Visual Evidence: Signature + Load Photo */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider block mb-2">
              Verification Attachments
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Recipient Signature */}
              <div className="flex flex-col rounded-lg border border-slate-200 p-2 bg-slate-50">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] text-slate-600 font-medium">Signature</span>
                  <span className="material-symbols-outlined text-slate-400 text-[14px]">draw</span>
                </div>
                <div className="relative flex h-20 w-full items-center justify-center rounded bg-white overflow-hidden border border-slate-200">
                  <svg
                    className="h-12 w-28 text-emerald-800 opacity-80"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    viewBox="0 0 160 80"
                  >
                    <path d="M15,48 C30,30 45,62 60,35 C70,18 78,55 95,40 C110,25 125,50 145,28" />
                    <path d="M50,55 C70,52 95,57 125,54" />
                  </svg>
                  <span className="absolute bottom-1 right-1.5 text-[9px] text-slate-400 font-medium">
                    E-Signed
                  </span>
                </div>
              </div>

              {/* Load Photo Proof */}
              <div className="flex flex-col rounded-lg border border-slate-200 p-2 bg-slate-50">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] text-slate-600 font-medium">Delivery Photo</span>
                  <span className="material-symbols-outlined text-slate-400 text-[14px]">
                    photo_camera
                  </span>
                </div>
                <div className="relative h-20 w-full overflow-hidden rounded bg-slate-200 border border-slate-200">
                  <img
                    alt="Proof of delivery containers"
                    className="h-full w-full object-cover"
                    src={proof.photo_url}
                  />
                  <span className="absolute bottom-1 left-1.5 text-white bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">inventory_2</span> 4 Bins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realistic Operational Impact Summary */}
        <div className="flex flex-col rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
            <span className="material-symbols-outlined text-emerald-700 text-[20px]">insights</span>
            <h3 className="font-semibold text-sm text-slate-900">Impact Summary</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="font-semibold text-slate-900">
              {proof.meals_delivered} fresh meals
            </strong>{' '}
            provided to local residents, diverting an estimated{' '}
            <span className="font-semibold text-slate-900">{proof.food_waste_diverted_kg} kg</span> of
            food waste and offsetting{' '}
            <span className="font-semibold text-slate-900">{proof.co2_diverted_kg} kg CO₂e</span>.
          </p>
        </div>

        {/* Donor Partner Feedback */}
        <div className="flex flex-col rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-1.5 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rate Donor Partner
          </span>
          <h4 className="font-display font-bold text-sm text-slate-900">{donorName}</h4>
          <p className="text-xs text-slate-500">How was the pickup and packaging condition?</p>
          <div className="flex items-center justify-center gap-2 pt-1" id="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                aria-label={`${star} star`}
                onClick={() => handleRate(star)}
                className={`p-1.5 rounded transition-colors ${
                  star <= rating ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <div
            className={`text-center text-xs font-semibold text-emerald-600 transition-opacity duration-200 h-4 ${
              ratingSaved ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Rating saved ({rating} / 5 stars)
          </div>
        </div>

        {/* Primary & Secondary MVP Actions */}
        <div className="flex flex-col space-y-2.5 pt-1">
          <button
            onClick={() => router.push('/impact')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-sm text-white shadow-sm hover:bg-brand-hover active:scale-[0.99] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span>View Sustainability &amp; Impact Dashboard</span>
          </button>
          <button
            onClick={() => {
              setCurrentRole('restaurant');
              router.push('/restaurant/post');
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            type="button"
          >
            <span>Done • Ready for Next Task</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <button
            onClick={handleDownloadReceipt}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
            <span>Download Receipt / Log</span>
          </button>
        </div>
      </main>
    </div>
  );
}
