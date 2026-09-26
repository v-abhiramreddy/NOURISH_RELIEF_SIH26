'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/store';
import { ROLE_CONFIGS, AppRole } from '@/lib/auth/types';

export default function DashboardIndexPage() {
  const router = useRouter();
  const { role, isRealMode, isDemoMode, switchDemoRole } = useAuth();
  const { setCurrentRole } = usePlatformStore();

  // In Real Mode, automatically redirect to the user's authenticated role dashboard
  useEffect(() => {
    if (isRealMode && role) {
      router.replace(`/dashboard/${role}`);
    }
  }, [isRealMode, role, router]);

  const handleSelectRole = (selectedRole: AppRole) => {
    switchDemoRole(selectedRole);
    if (selectedRole === 'kitchen') setCurrentRole('restaurant');
    else if (selectedRole === 'courier') setCurrentRole('volunteer');
    else if (selectedRole === 'ngo') setCurrentRole('ngo');
    else if (selectedRole === 'admin' || selectedRole === 'platform_manager') setCurrentRole('admin');

    if (selectedRole === 'platform_manager' || selectedRole === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push(`/dashboard/${selectedRole}`);
    }
  };

  const activeDashboardPath = role === 'platform_manager' ? '/dashboard/admin' : `/dashboard/${role || 'kitchen'}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <Link href="/overview" className="inline-flex items-center gap-2 mb-2 hover:opacity-90 transition-opacity">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Nourish<span className="text-emerald-500">Relief</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Role-Based Workspaces &amp; Dashboards
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Select a role workspace below to enter its specialized operational view, or continue to your currently assigned role dashboard.
          </p>

          <div className="flex justify-center pt-2">
            <Link
              href={activeDashboardPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Enter Active Role Workspace ({ROLE_CONFIGS[role || 'kitchen']?.shortLabel || 'Kitchen'}) →</span>
            </Link>
          </div>
        </div>

        {/* 4 Role Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Kitchen */}
          <div
            onClick={() => handleSelectRole('kitchen')}
            className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-md space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">soup_kitchen</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                Open Workspace →
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Kitchen Dashboard
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Institutional kitchen surplus registration, demand forecast review, production decision buffer, and active donation tracking.
            </p>
          </div>

          {/* 2. NGO */}
          <div
            onClick={() => handleSelectRole('ngo')}
            className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-md space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                Open Workspace →
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              NGO / Recipient Dashboard
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Available food surplus discovery, compatibility score matching, portion claiming, and incoming courier transit tracking.
            </p>
          </div>

          {/* 3. Courier */}
          <div
            onClick={() => handleSelectRole('courier')}
            className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-md space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">directions_bike</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                Open Workspace →
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Courier Transit Dashboard
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Assigned pickup management, thermal transport equipment checklist, optimized transit routing, and digital handoff proof.
            </p>
          </div>

          {/* 4. Admin */}
          <div
            onClick={() => handleSelectRole('admin')}
            className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-md space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">bar_chart</span>
              </span>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                Open Workspace →
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Admin &amp; ESG Dashboard
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              High-level platform oversight, food waste diversion accounting, cross-role auditability, and MoFPI ESG reporting.
            </p>
          </div>
        </div>

        {/* Platform Manager Elevated Governance */}
        <div
          onClick={() => handleSelectRole('platform_manager')}
          className="cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/70 dark:hover:border-purple-500/70 transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-purple-200 dark:border-purple-800/60">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Platform Manager Governance</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  Override Controls
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full ecosystem oversight, stuck workflow triage, and authorized operational override controls.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-1">
            <span>Enter Console</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>

        {/* Back to platform overview */}
        <div className="text-center pt-4">
          <Link
            href="/overview"
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline"
          >
            ← Return to Platform Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
