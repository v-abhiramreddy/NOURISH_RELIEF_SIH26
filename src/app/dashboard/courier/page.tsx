'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformStore } from '@/lib/store';
import RoleDashboardNav from '@/components/RoleDashboardNav';
import { getOptimizedVolunteerRoute } from '@/lib/route-optimizer';
import { OptimizedRouteWaypoint } from '@/types';

export default function CourierDashboardPage() {
  const {
    activeTask,
    activeDonation,
    completedProofs,
  } = usePlatformStore();

  const task = activeTask || {
    id: 'task-demo-4821',
    task_code: 'NR-4821',
    status: 'assigned',
    current_step: 2,
    pickup_pin: '7492',
    facility_name: 'Annapurna Community Rasoi',
    facility_address: '420 MG Road (Central Zone)',
    checklist_items: [
      { id: 'c1', label: 'Insulated thermal transport bags inspected & sanitized', completed: true },
      { id: 'c2', label: 'Digital infrared food probe calibrated (±0.5°C)', completed: true },
      { id: 'c3', label: 'MoFPI tamper-evident transit security seals attached', completed: false },
    ],
  };
  const donation = activeDonation;

  const route = getOptimizedVolunteerRoute(
    donation?.donor_address || 'Sector 4 Industrial Area • Dock 2',
    task.facility_address || '420 MG Road • Annapurna Intake Bay'
  );

  const checklistItems = task.checklist_items || [];
  const completedChecklistCount = checklistItems.filter((i: { completed: boolean }) => i.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <RoleDashboardNav currentRole="courier" orgName="Aarav Sharma · Certified Cold-Chain Courier" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role Identity & Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Certified Rapid Cold-Chain &amp; Volunteer Logistics Workspace</span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                Courier Transit Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Execute assigned perishable food rescue tasks, verify statutory food-safety transport equipment, navigate dynamic congestion-bypassing routes, and submit tamper-proof delivery handoffs.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <Link
                href="/volunteer/pickup"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">navigation</span>
                <span>Active Pickup Route</span>
              </Link>

              <Link
                href="/volunteer/summary"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">assignment_turned_in</span>
                <span>Delivery Proof</span>
              </Link>
            </div>
          </div>

          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Task Code</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">qr_code</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {task?.task_code || 'NR-4821'}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium capitalize">
                Status: {task?.status.replace(/_/g, ' ') || 'Assigned'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Optimized Route</span>
                <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">directions_bike</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {route.total_distance_km} km
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Est. transit: {route.estimated_transit_mins} mins
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Safety Checklist</span>
                <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">checklist</span>
              </div>
              <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {completedChecklistCount} / {checklistItems.length || 3}
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1 font-medium">
                Thermal transport ready
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span>Thermal Integrity</span>
                <span className="material-symbols-outlined text-[16px] text-teal-600 dark:text-teal-400">thermostat</span>
              </div>
              <div className="font-display font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                {route.thermal_integrity_status}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Holding: {donation?.holding_temp_label || 'Hot-Holding (>60°C)'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 spans): Active Task & Route Logistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Task Details */}
            <section
              aria-label="Active Pickup Assignment"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">pin_drop</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Assigned Perishable Food Pickup Task
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Step {task?.current_step || 2} of 4
                </span>
              </div>

              {task ? (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                  {/* Origin & Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                        Pickup Origin (Kitchen)
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {donation?.donor_name || 'MoFPI Pilot Kitchen 01'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {donation?.donor_address || 'Sector 4 Industrial Area, Dock 2'}
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 italic pt-1">
                        PIN Verification required: {task.pickup_pin}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                        Dropoff Destination (Shelter)
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {task.facility_name || 'Annapurna Community Rasoi'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {task.facility_address || '420 MG Road (Central Zone)'}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 pt-1 font-medium">
                        Intake Manager on-site: Sunita Sharma
                      </p>
                    </div>
                  </div>

                  {/* Waypoint Steps */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Route Waypoints &amp; Checkpoints:
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {route.waypoints.map((wp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{wp.name}</span>
                          </div>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {wp.eta_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Batch: {donation?.portions || 45} meals · {donation?.weight_kg || 18} kg
                    </span>
                    <Link
                      href="/volunteer/pickup"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      <span>Open Live Transit Map</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No active courier pickup assigned.
                </div>
              )}
            </section>
          </div>

          {/* Right Column (1 span): Equipment Checklist & Proof Summary */}
          <div className="space-y-6">
            {/* Equipment Safety Checklist */}
            <section
              aria-label="Transport Equipment Safety Checklist"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">checklist</span>
                <span>Equipment &amp; Thermal Compliance</span>
              </h2>

              <div className="space-y-2 text-xs">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        item.completed ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    >
                      {item.completed ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span
                      className={
                        item.completed
                          ? 'text-slate-800 dark:text-slate-200 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Completed Verified Handoffs */}
            <section
              aria-label="Completed Handoff Proofs"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3"
            >
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">history_edu</span>
                <span>Completed Delivery Proofs</span>
              </h2>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {completedProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-semibold text-slate-900 dark:text-white">
                      <span>{proof.meals_delivered} Meals Handed Off</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {proof.handoff_temp}°C
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Signed by {proof.receiver_name}</span>
                      <span>Verified Handoff</span>
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
