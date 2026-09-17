'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import { getOptimizedVolunteerRoute } from '@/lib/route-optimizer';

export default function VolunteerPickupPage() {
  const router = useRouter();
  const { activeTask, activeDonation, updateTaskChecklist, confirmPickup, setCurrentRole } = usePlatformStore();

  const [handoverTab, setHandoverTab] = useState<'pin' | 'qr'>('pin');
  const [pinDigits, setPinDigits] = useState(['8', '3', '4', '2']);
  const [showSupportDrawer, setShowSupportDrawer] = useState(false);
  const [showDelayToast, setShowDelayToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const task = activeTask || {
    id: 'task-001',
    task_code: 'NR-4821',
    eta_mins: 8,
    distance_miles: 0.9,
    pickup_pin: '8342',
    checklist_items: [
      { id: 'thermal_bags', label: 'Thermal delivery bags ready', completed: true },
      { id: 'crates', label: 'Sanitized transport crates equipped', completed: true },
      { id: 'temp_probe', label: 'Temperature probe ready (>60°C check)', completed: true },
    ],
  };

  const donation = activeDonation || {
    donor_name: 'Green Leaf Bistro',
    donor_address: '142 Market St • Dock 2',
    portions: 45,
    holding_temp: 'hot',
  };

  const destinationName = activeDonation?.facility_name || activeTask?.facility_name || 'Hope Harbor Shelter';
  const destinationAddress = activeDonation?.facility_address || activeTask?.facility_address || '420 5th Ave • Hope Harbor Intake Bay';

  const routePlan = getOptimizedVolunteerRoute(
    donation.donor_address,
    destinationAddress
  );

  const completedChecklistCount = task.checklist_items.filter((i) => i.completed).length;

  const handlePinChange = (index: number, val: string) => {
    const updated = [...pinDigits];
    updated[index] = val.slice(-1);
    setPinDigits(updated);
  };

  const handleConfirmPickup = async () => {
    // If temp probe wasn't checked, complete it automatically
    const tempItem = task.checklist_items.find((i) => i.id === 'temp_probe');
    if (tempItem && !tempItem.completed) {
      updateTaskChecklist(task.id, 'temp_probe', true);
    }

    setIsSubmitting(true);
    try {
      await confirmPickup(task.id, pinDigits.join(''));
      setTimeout(() => {
        setCurrentRole('volunteer');
        router.push('/volunteer/summary');
      }, 700);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Header: Courier MVP Standard */}
      <header className="sticky top-0 w-full z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="h-14 px-4 max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go back"
              onClick={() => router.push('/ngo/claim')}
              className="p-1 -ml-1 text-slate-700 hover:text-slate-900 active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="font-display font-semibold text-base text-slate-900 leading-tight">
                Pickup Task
              </h1>
              <p className="text-xs text-slate-500 font-medium">Mission #{task.task_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-brand text-xs font-semibold border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
              Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Courier Content */}
      <main className="flex-1 flex flex-col pt-4 pb-20 px-4 max-w-2xl mx-auto w-full space-y-3.5">
        {/* Mission Summary Bar: Driver-grade ETA & Linear Progress */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Step 2 of 4
              </span>
              <h2 className="font-display font-bold text-base text-slate-900 leading-tight">
                En Route to Pickup
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand bg-emerald-50 px-2 py-1 rounded border border-emerald-200/50">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                ETA {task.eta_mins} mins
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">{task.distance_miles} mi away</p>
            </div>
          </div>

          {/* Minimal clean step line */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <div className="h-1 rounded bg-brand"></div>
            <div className="h-1 rounded bg-brand relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-400/40 animate-pulse"></div>
            </div>
            <div className="h-1 rounded bg-slate-100"></div>
            <div className="h-1 rounded bg-slate-100"></div>
          </div>
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-1.5 px-0.5">
            <span className="text-slate-600">Claimed</span>
            <span className="text-brand font-semibold">Pickup</span>
            <span>Transit</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* AI Optimized Route Guidance */}
        <section className="bg-white border border-emerald-200/80 rounded-lg p-4 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-brand">alt_route</span>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                  AI Optimized Route
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-brand">
                    {routePlan.route_status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Intelligent dispatch to minimize delivery time &amp; exposure</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Demo route calculation
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-md border border-slate-100">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Distance</span>
              <span className="text-sm font-bold text-slate-900">{routePlan.total_distance_km} km</span>
              <span className="text-[10px] text-slate-400 block">({routePlan.total_distance_miles} mi)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Estimated Time</span>
              <span className="text-sm font-bold text-brand flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                {routePlan.estimated_transit_mins} min
              </span>
              <span className="text-[10px] text-slate-400 block">Transit ETA</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Pickup Deadline</span>
              <span className="text-sm font-bold text-rose-600">{routePlan.pickup_deadline}</span>
              <span className="text-[10px] text-slate-400 block">Max shelf life</span>
            </div>
          </div>

          {/* Corridor Flow */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 pt-1 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Kitchen</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Pickup</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>NGO</span>
            </div>
          </div>

          {/* Prioritization Reason & Exact Notice */}
          <div className="p-2.5 bg-emerald-50 rounded-md border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-brand">
              <span className="material-symbols-outlined text-[16px]">navigation</span>
              <span>{routePlan.routing_notice}</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-5">
              <strong>Prioritization Reason:</strong> {routePlan.prioritization_reason}
            </p>
          </div>

          {/* AI Optimization Factors */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Routing Optimizations:</span>
            {routePlan.optimization_factors.map((factor, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Route Plan & Minimal Map Preview */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-500">route</span>
              <h3 className="font-semibold text-sm text-slate-900">Route &amp; Stop Details</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">2 stops • {routePlan.total_distance_km} km ({routePlan.total_distance_miles} mi)</span>
          </div>

          {/* Route Timeline */}
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* Stop 1: Pickup */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                1
              </span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                      Pickup
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-600">
                      {donation.portions} Portions ({donation.holding_temp === 'hot' ? 'Hot' : 'Chilled'})
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                    {donation.donor_name}
                  </h4>
                  <p className="text-xs text-slate-500">{donation.donor_address}</p>
                </div>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        donation.donor_name + ' ' + donation.donor_address
                      )}`,
                      '_blank'
                    )
                  }
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-black text-white text-xs font-semibold active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">navigation</span>
                  <span>Open in Maps</span>
                </button>
              </div>

              {/* Staff instruction callout */}
              <div className="mt-2.5 p-2 rounded bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">
                  info
                </span>
                <span>
                  <strong className="font-semibold text-amber-950">Staff note:</strong> Rear kitchen
                  door, buzzer #2. Chef Marcus on duty.
                </span>
              </div>
            </div>

            {/* Stop 2: Dropoff */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Dropoff
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">Intake Bay</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-0.5">
                  {destinationName}
                </h4>
                <p className="text-xs text-slate-500">
                  {destinationAddress} • Coord: Sarah L.
                </p>
              </div>
            </div>
          </div>

          {/* Functional Route Mini-Map Preview */}
          <div className="w-full h-24 rounded border border-slate-200 overflow-hidden relative bg-slate-100 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full opacity-30 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern height="24" id="grid" patternUnits="userSpaceOnUse" width="24">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect fill="url(#grid)" height="100%" width="100%" />
              <path
                d="M 40 70 Q 150 15 320 40"
                fill="none"
                stroke="#00652c"
                strokeDasharray="4,3"
                strokeWidth="2.5"
              />
            </svg>
            <div className="relative z-10 flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded shadow-xs border border-slate-200">
              <span className="material-symbols-outlined text-brand text-[18px]">
                turn_sharp_right
              </span>
              <span className="text-xs font-semibold text-slate-800">
                Route guidance preview (2.3 mi)
              </span>
            </div>
          </div>
        </section>

        {/* Safety & Prep Checklist */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-600">checklist</span>
              <h3 className="font-semibold text-sm text-slate-900">Safety &amp; Prep Checklist</h3>
            </div>
            <span
              className={`text-xs ${
                completedChecklistCount === task.checklist_items.length
                  ? 'font-semibold text-brand'
                  : 'font-medium text-slate-500'
              }`}
              id="checklist-progress"
            >
              {completedChecklistCount} of {task.checklist_items.length} complete
            </span>
          </div>
          <div className="space-y-2">
            {task.checklist_items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors select-none"
              >
                <input
                  checked={item.completed}
                  onChange={(e) => updateTaskChecklist(task.id, item.id, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-0 focus:ring-offset-0 accent-emerald-600"
                  type="checkbox"
                />
                <span className="text-xs font-medium text-slate-800">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Verification & Handover */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-brand">verified</span>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Kitchen Handover</h3>
                <p className="text-xs text-slate-500">Verify handover with Chef Marcus</p>
              </div>
            </div>
          </div>

          {/* Minimal Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded text-xs font-semibold">
            <button
              onClick={() => setHandoverTab('pin')}
              className={`py-1.5 rounded transition-all ${
                handoverTab === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tabPinBtn"
              type="button"
            >
              Enter 4-Digit PIN
            </button>
            <button
              onClick={() => setHandoverTab('qr')}
              className={`py-1.5 rounded transition-all ${
                handoverTab === 'qr'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tabQrBtn"
              type="button"
            >
              Scan QR Code
            </button>
          </div>

          {/* PIN Input Mode */}
          {handoverTab === 'pin' && (
            <div className="flex flex-col items-center py-2 space-y-2" id="pinSection">
              <span className="text-xs text-slate-500 font-medium">
                Ask staff for 4-digit pickup code
              </span>
              <div className="flex gap-2.5 justify-center">
                {pinDigits.map((digit, i) => (
                  <input
                    key={i}
                    className="w-11 h-12 text-center text-lg font-bold font-display rounded border border-slate-300 bg-white text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    maxLength={1}
                    type="text"
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* QR Scanner Mode */}
          {handoverTab === 'qr' && (
            <div
              className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded border border-dashed border-slate-300 space-y-2"
              id="qrSection"
            >
              <div className="w-24 h-24 bg-white rounded border border-slate-200 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[48px] text-slate-400">
                  qr_code_scanner
                </span>
              </div>
              <p className="text-xs text-slate-500 text-center font-medium">
                Point camera at the kitchen dispatch tablet
              </p>
            </div>
          )}

          {/* Primary Action CTA */}
          <button
            onClick={handleConfirmPickup}
            disabled={isSubmitting}
            className="w-full h-12 rounded bg-brand hover:bg-brand-hover text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm transition-all"
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Verifying Handover...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                <span>Confirm Pickup &amp; Start Delivery</span>
              </>
            )}
          </button>

          {/* Secondary Links */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <button
              onClick={() => setShowSupportDrawer(true)}
              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 py-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Contact Kitchen</span>
            </button>
            <button
              onClick={() => setShowDelayToast(true)}
              className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 py-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">report_problem</span>
              <span>Report Issue</span>
            </button>
          </div>
        </section>

        {/* Support Modal Drawer */}
        {showSupportDrawer && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center">
            <div className="w-full max-w-md bg-white rounded-t-xl p-5 space-y-4 shadow-xl border-t border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-display font-semibold text-base text-slate-900">
                  Task Contacts
                </h3>
                <button
                  onClick={() => setShowSupportDrawer(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="space-y-2">
                <a
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  href="tel:5550192"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-slate-600">
                      restaurant
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Chef Marcus (Kitchen Pickup)
                      </p>
                      <p className="text-[11px] text-slate-500">Green Leaf Bistro • Direct line</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-brand">call</span>
                </a>
                <a
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  href="tel:5550188"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-slate-600">home</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Sarah L. (Shelter Intake)
                      </p>
                      <p className="text-[11px] text-slate-500">Hope Harbor Receiving Bay</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-brand">call</span>
                </a>
                <a
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  href="tel:5550100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-slate-600">
                      headset_mic
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Courier Dispatch</p>
                      <p className="text-[11px] text-slate-500">NourishRelief Operations Hub</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-brand">call</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Delay Toast Notification */}
        {showDelayToast && (
          <div className="fixed bottom-5 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded bg-slate-900 text-white shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px] text-amber-400">warning</span>
              <span>Issue logged. Dispatch informed of traffic delay.</span>
            </div>
            <button
              onClick={() => setShowDelayToast(false)}
              className="text-xs font-semibold text-slate-300 hover:text-white uppercase"
              type="button"
            >
              OK
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
