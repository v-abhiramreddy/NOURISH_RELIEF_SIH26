'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/store';
import { DonationStatus } from '@/types';
import RoleDashboardNav from '@/components/RoleDashboardNav';

export default function AdminDashboardPage() {
  const { role } = useAuth();
  const isPlatformManager = role === 'platform_manager';

  const {
    getImpactMetrics,
    activeDonation,
    activeClaim,
    activeTask,
    completedProofs,
    emissionFactor,
    managerAuditLogs,
    overrideWorkflowState,
    reassignCourierTask,
  } = usePlatformStore();

  const metrics = getImpactMetrics();
  const donation = activeDonation;

  // Platform Manager Override State
  const [overrideModeActive, setOverrideModeActive] = useState(false);
  const [targetStatus, setTargetStatus] = useState<DonationStatus>('in_transit');
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('Priya Verma (Fleet Bravo · Insulated Van)');
  const [courierReason, setCourierReason] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'state' | 'courier';
    title: string;
    details: string;
    reason: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApplyStateOverrideClick = () => {
    if (!overrideReason.trim()) {
      setNotification({
        type: 'error',
        message: 'A mandatory operational reason is required before applying a state override.',
      });
      return;
    }

    setConfirmModal({
      open: true,
      type: 'state',
      title: 'Confirm Operational State Override',
      details: `Transition donation status from "${donation?.status || 'unknown'}" to "${targetStatus}".`,
      reason: overrideReason,
      onConfirm: async () => {
        await overrideWorkflowState(targetStatus, overrideReason);
        setConfirmModal(null);
        setOverrideReason('');
        setNotification({
          type: 'success',
          message: `Successfully executed state override to "${targetStatus}". Audit entry logged.`,
        });
      },
    });
  };

  const handleApplyCourierReassignmentClick = () => {
    if (!courierReason.trim()) {
      setNotification({
        type: 'error',
        message: 'A mandatory operational reason is required before reassigning courier dispatch.',
      });
      return;
    }

    const currentCourier = activeTask?.volunteer_name || 'Aarav Sharma';
    setConfirmModal({
      open: true,
      type: 'courier',
      title: 'Confirm Courier Task Reassignment',
      details: `Reassign Task ${activeTask?.task_code || 'NR-4821'} from "${currentCourier}" to "${selectedCourier}".`,
      reason: courierReason,
      onConfirm: async () => {
        await reassignCourierTask(activeTask?.id || 'task-001', selectedCourier, courierReason);
        setConfirmModal(null);
        setCourierReason('');
        setNotification({
          type: 'success',
          message: `Successfully reassigned courier task to "${selectedCourier}". Audit entry logged.`,
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <RoleDashboardNav
        currentRole={isPlatformManager ? 'platform_manager' : 'admin'}
        orgName={
          isPlatformManager
            ? 'Ecosystem Manager Console · MoFPI Cluster'
            : 'Central Platform Oversight · MoFPI Cluster'
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role Identity & Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    {isPlatformManager
                      ? 'Platform Manager Operational Oversight Workspace'
                      : 'Platform Governance & ESG Sustainability Telemetry Workspace'}
                  </span>
                </span>

                {isPlatformManager ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    Elevated Operations Role
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Read-Only Auditor Mode
                  </span>
                )}
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                Admin &amp; ESG Compliance Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {isPlatformManager
                  ? 'Platform Manager operational console for ecosystem oversight, stuck workflow triage, and authorized emergency overrides across the redistribution pipeline.'
                  : 'Centralized operational oversight of cross-role food waste redistribution, transparent environmental impact accounting, and statutory MoFPI compliance auditing across institutional kitchen clusters.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isPlatformManager ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideModeActive(!overrideModeActive);
                      setNotification(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors border ${
                      overrideModeActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                        : 'bg-purple-600 hover:bg-purple-700 text-white border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {overrideModeActive ? 'lock' : 'tune'}
                    </span>
                    <span>{overrideModeActive ? 'Disable Override Mode' : 'Enable Override Mode'}</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {overrideModeActive ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Active
                      </span>
                    ) : (
                      'Override Mode Inactive (Read-Only Safety Lock)'
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Read-only auditor view
                  </span>
                  <Link
                    href="/impact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                    <span>View Full ESG Analytics</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Override Mode Active Alert Banner */}
          {isPlatformManager && overrideModeActive && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5">
                warning
              </span>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[11px]">
                  Override Mode Active · Authorized Operational Override Engaged
                </span>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  Operational override controls are active. Mutations applied here directly update the platform state machine and will be permanently recorded in the immutable audit trail.
                </p>
              </div>
            </div>
          )}

          {/* Feedback notification toast banner */}
          {notification && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  {notification.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Food Waste Diverted</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">eco</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {metrics.total_food_saved_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                {metrics.total_waste_prevented_kg.toLocaleString()} kg landfill avoided
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Meals Redistributed</span>
                <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">volunteer_activism</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {metrics.total_meals_redistributed.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Across {metrics.ngos_supported} verified recipient NGOs
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>CO₂ Emissions Avoided</span>
                <span className="material-symbols-outlined text-[16px] text-teal-600 dark:text-teal-400">co2</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {metrics.estimated_co2_avoided_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 block mt-1 font-mono text-[10px]">
                Factor: {emissionFactor} kg CO₂e / kg
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Verified Deliveries</span>
                <span className="material-symbols-outlined text-[16px] text-purple-600 dark:text-purple-400">verified</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {metrics.successful_deliveries_count}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                100% Thermal Handoff Compliance
              </span>
            </div>
          </div>
        </div>

        {/* Platform Manager Override Mutation Controls (visible only when Override Mode is Active) */}
        {isPlatformManager && overrideModeActive && (
          <section
            aria-label="Platform Manager Override Controls"
            className="bg-white dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-600 rounded-2xl p-6 sm:p-8 shadow-md space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </span>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Controlled Operational Override Panel
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perform surgical exception handling to correct stuck states or reassign stranded courier tasks.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                Override Mode Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Correction 1: Lifecycle State Machine Triage */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">sync_alt</span>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Workflow Lifecycle State Triage
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold uppercase">
                    Current: {donation?.status || 'available'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Advance or reset an erroneously stuck state machine phase when upstream or downstream systems encounter offline conditions.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Target Operational State:
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as DonationStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="available">1. Surplus Available (Kitchen Loading Bay)</option>
                      <option value="claimed">2. NGO Matched (Portions Reserved by Shelter)</option>
                      <option value="in_transit">3. Courier In Transit (Cold-Chain Route Active)</option>
                      <option value="delivered">4. Verified Delivered (Completed at Rasoi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mandatory Operational Reason:
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Courier device offline, verbal confirmation received from receiver"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyStateOverrideClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Apply State Override</span>
                  </button>
                </div>
              </div>

              {/* Correction 2: Courier Task Reassignment */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">directions_bike</span>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Courier Task Reassignment
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                    Task: {activeTask?.task_code || 'NR-4821'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Reassign an active rescue transit task to an available certified standby courier in case of vehicle trouble or delay.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Courier: <span className="font-bold">{activeTask?.volunteer_name || 'Aarav Sharma'}</span>
                    </label>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 mt-2">
                      Reassign to Standby Certified Courier:
                    </label>
                    <select
                      value={selectedCourier}
                      onChange={(e) => setSelectedCourier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="Priya Verma (Fleet Bravo · Insulated Van)">
                        Priya Verma (Fleet Bravo · Insulated Van)
                      </option>
                      <option value="Vikram Singh (Cold-Chain Rapid Bike)">
                        Vikram Singh (Cold-Chain Rapid Bike)
                      </option>
                      <option value="Kavita Patel (Emergency Relief Dispatch)">
                        Kavita Patel (Emergency Relief Dispatch)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mandatory Reassignment Reason:
                    </label>
                    <input
                      type="text"
                      value={courierReason}
                      onChange={(e) => setCourierReason(e.target.value)}
                      placeholder="e.g. Primary courier vehicle puncture, standby dispatched"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCourierReassignmentClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    <span>Reassign Courier Task</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 spans): Workflow Status & ESG Telemetry */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live State Machine Status Card */}
            <section
              aria-label="Ecosystem State Machine"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">account_tree</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Live Cluster Workflow &amp; State Machine
                  </h2>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                  {donation?.status.toUpperCase() || 'IDLE'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Registered Donor Kitchen:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {donation?.donor_name || 'MoFPI Pilot Kitchen 01'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px] mt-0.5">
                    Rating: {donation?.donor_rating || 4.9} ★ · {donation?.donor_rescues || 142} rescues
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Matched Recipient Shelter:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {activeClaim?.ngo_name || 'Annapurna Seva Trust'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px] mt-0.5">
                    Clients awaiting: {activeClaim?.clients_awaiting || 38}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Assigned Volunteer Courier:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {activeTask?.volunteer_name || 'Aarav Sharma'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px] mt-0.5">
                    Task Code: {activeTask?.task_code || 'NR-4821'} · ETA {activeTask?.eta_mins || 8}m
                  </span>
                </div>
              </div>
            </section>

            {/* Category Breakdown & Telemetry */}
            <section
              aria-label="Environmental Diversion Breakdown"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">pie_chart</span>
                <span>Perishable Food Category Distribution</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {metrics.category_breakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs truncate">
                      {cat.category}
                    </span>
                    <span className="font-display font-bold text-lg text-emerald-600 dark:text-emerald-400 block my-0.5">
                      {cat.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-400">{cat.weight_kg} kg</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                {metrics.factor_disclosure}
              </p>
            </section>

            {/* Authorized Operational Override Audit Trail */}
            <section
              aria-label="Authorized Operational Override Audit Trail"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">history_edu</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Authorized Operational Override Audit Trail
                  </h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {managerAuditLogs.length} events logged
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Immutable operational log of Platform Manager state transitions, emergency triage overrides, and courier task reassignments.
              </p>

              <div className="space-y-3">
                {managerAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Target: {log.target_id}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">Transition:</span>{' '}
                      <span className="font-mono text-amber-700 dark:text-amber-300">{log.previous_state}</span>{' '}
                      → <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{log.new_state}</span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Operational Reason:</span> {log.reason}
                    </div>

                    <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                      Acting Role: Platform Manager (Authorized Override)
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (1 span): Cross-Role Module Links & Verified Proofs */}
          <div className="space-y-6">
            {/* Cross-Role Navigation Portal */}
            <section
              aria-label="Cross-Role Administrative Oversight"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">admin_panel_settings</span>
                <span>Cross-Role Module Inspection</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditor access across all operational modules in the NourishRelief cluster.
              </p>

              <div className="space-y-2 text-xs">
                <Link
                  href="/forecast"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">Demand Forecasting Model</span>
                  <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                </Link>

                <Link
                  href="/restaurant/post"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">Surplus Batch Registrations</span>
                  <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                </Link>

                <Link
                  href="/ngo/claim"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">NGO Matching &amp; Claims</span>
                  <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                </Link>

                <Link
                  href="/volunteer/pickup"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">Volunteer Transit Routing</span>
                  <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                </Link>

                <Link
                  href="/impact"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  <span>Detailed Impact &amp; ESG Telemetry</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
              </div>
            </section>

            {/* Verified Audit Log */}
            <section
              aria-label="Tamper-Evident Delivery Audit Trail"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">verified</span>
                <span>Verified Audit Trail</span>
              </h2>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {completedProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-slate-900 dark:text-white font-semibold">
                        Proof #{proof.id.slice(-6)} · {proof.meals_delivered} Meals
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        {proof.handoff_temp}°C
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Receiver: {proof.receiver_name} ({proof.receiver_title})</span>
                      <span>Rating: {proof.donor_rating || 5}★</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </span>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authorized Platform Manager Override Confirmation
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {confirmModal.details}
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Recorded Reason:</span>{' '}
                {confirmModal.reason}
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Warning: This action will be permanently logged in the audit trail under your Platform Manager role.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Confirm &amp; Apply Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
