'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/store';
import { AppRole, ROLE_CONFIGS } from '@/lib/auth/types';
import { getRoleLabel } from '@/types';

interface RoleDashboardNavProps {
  currentRole: AppRole;
  orgName: string;
}

export default function RoleDashboardNav({ currentRole, orgName }: RoleDashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isRealMode, isDemoMode, user, switchDemoRole } = useAuth();
  const { setCurrentRole } = usePlatformStore();

  const roleConfig = ROLE_CONFIGS[currentRole];

  const handleRoleSwitch = (newRole: AppRole) => {
    switchDemoRole(newRole);
    if (newRole === 'kitchen') setCurrentRole('restaurant');
    else if (newRole === 'courier') setCurrentRole('volunteer');
    else if (newRole === 'ngo') setCurrentRole('ngo');
    else if (newRole === 'admin' || newRole === 'platform_manager') setCurrentRole('admin');

    if (newRole === 'platform_manager' || newRole === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push(`/dashboard/${newRole}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Role Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
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

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {roleConfig.label} Workspace
                </span>
                {isRealMode ? (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Real Mode
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Demo Mode
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {orgName}
              </span>
            </div>
          </div>

          {/* Center / Right: Role Switcher Tabs (Demo Mode) & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isDemoMode && (
              <nav
                aria-label="Role Workspace Switcher"
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                {(['kitchen', 'ngo', 'courier', 'admin', 'platform_manager'] as AppRole[]).map((r) => {
                  const cfg = ROLE_CONFIGS[r];
                  const isActive = currentRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cfg.shortLabel}
                    </button>
                  );
                })}
              </nav>
            )}

            <Link
              href="/"
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span className="hidden sm:inline">Overview</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
