'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ROLE_CONFIGS, AppRole } from '@/lib/auth/types';

interface RoleGuardProps {
  children: React.ReactNode;
}

export default function RoleGuard({ children }: RoleGuardProps) {
  const pathname = usePathname();
  const { user, role, isRealMode, canAccessRoute, getRoleConfig } = useAuth();

  // Public routes always accessible
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/favicon')
  ) {
    return <>{children}</>;
  }

  // Check if current role has permission for this route
  const isAuthorized = canAccessRoute(pathname);

  // In Real Mode: strictly enforce authorization boundaries
  if (isRealMode && !isAuthorized) {
    const userRoleConfig = getRoleConfig(role);

    // Identify which role this page is meant for
    let targetRoleLabel = 'Designated';
    for (const [rKey, rCfg] of Object.entries(ROLE_CONFIGS)) {
      if (
        rCfg.allowedPrefixes.some(
          (p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/'))
        )
      ) {
        targetRoleLabel = rCfg.label;
        break;
      }
    }

    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-900/60 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-3xl">shield_lock</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Role Authorization Boundary
          </span>

          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
            Restricted Section: {targetRoleLabel} Role Only
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            This operational module is restricted to <strong>{targetRoleLabel}</strong> accounts in Real Mode.
            You are currently authenticated as <strong>{userRoleConfig.label}</strong> ({user?.email || 'Authenticated User'}).
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700/60 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Your Database Role:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{userRoleConfig.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Target Module:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{pathname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Security Enforcement:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active (Database RLS + App Boundary)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={userRoleConfig.defaultRoute}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              <span>Go to My Workspace ({userRoleConfig.shortLabel})</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span>Platform Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Demo Mode or Authorized in Real Mode: Render content
  return <>{children}</>;
}
