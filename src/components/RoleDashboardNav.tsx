'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { AppRole, ROLE_CONFIGS } from '@/lib/auth/types';

interface RoleDashboardNavProps {
  currentRole: AppRole;
  orgName: string;
}

export default function RoleDashboardNav({ currentRole, orgName }: RoleDashboardNavProps) {
  const { isRealMode, profile } = useAuth();
  const roleConfig = ROLE_CONFIGS[currentRole];

  const orgDisplayName =
    isRealMode && profile?.organization_name
      ? `${profile.organization_name}${profile.address ? ` · ${profile.address}` : ''}`
      : orgName;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Role Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={roleConfig.dashboardRoute || `/dashboard/${currentRole}`}
              className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
              title={`Go to ${roleConfig.label} Dashboard`}
            >
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </span>
              <span className="font-display font-bold text-base text-slate-900 dark:text-white hidden sm:inline">
                Nourish<span className="text-emerald-500">Relief</span>
              </span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>

            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {roleConfig.label} Workspace
            </span>
          </div>

          {/* Center / Right: Organization Chip, Demo Role Switcher Tabs & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dedicated Organization Pill */}
            {orgDisplayName && (
              <div
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-xs shadow-2xs"
                title={`Organization: ${orgDisplayName}`}
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">
                  domain
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[220px] lg:max-w-[280px] truncate">
                  {orgDisplayName}
                </span>
              </div>
            )}

            {/* Dedicated Corner Overview Button */}
            <Link
              href="/overview"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
              title="View Ecosystem Architecture & Overview"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">grid_view</span>
              <span>Overview</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
