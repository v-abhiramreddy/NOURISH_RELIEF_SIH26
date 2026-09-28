'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { getRoleLabel } from '@/types';

export default function DemoRoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { setCurrentRole, activeDonation, activeTask, activeProof, completedProofs, resetToDemoData } = usePlatformStore();
  const { user, role, isRealMode, signOut, switchDemoRole } = useAuth();

  const isDeliveryCompleted =
    activeDonation?.status === 'completed' ||
    activeDonation?.status === 'delivered' ||
    activeTask?.status === 'delivered' ||
    (Boolean(activeProof) && (!isRealMode || activeProof.id !== 'proof-001'));

  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const saved = localStorage.getItem('nourishrelief_theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('nourishrelief_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('nourishrelief_theme', 'light');
    }
  };

  const getLifecycleStages = () => {
    const status = activeDonation?.status || 'available';
    const isStep1Active = status === 'available';
    const isStep2Active = status === 'claimed';
    const isStep3Active = status === 'in_transit';
    const isStep4Active = status === 'completed' || status === 'delivered';

    const isStep1Done = !isStep1Active;
    const isStep2Done = isStep3Active || isStep4Active;
    const isStep3Done = isStep4Active;
    const isStep4Done = isStep4Active;

    return (
      <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
        <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Lifecycle:
        </span>

        {/* Step 1 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors ${
            isStep1Active
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 font-bold'
              : isStep1Done
              ? 'text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40'
              : 'text-slate-400 bg-slate-900/60 border border-slate-800'
          }`}
        >
          {isStep1Done ? '✓' : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          1. Surplus Posted
        </span>

        <span className="text-slate-600 text-xs">→</span>

        {/* Step 2 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors ${
            isStep2Active
              ? 'bg-amber-950/90 text-amber-300 border border-amber-600/70 font-bold animate-pulse'
              : isStep2Done
              ? 'text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40'
              : 'text-slate-400 bg-slate-900/60 border border-slate-800'
          }`}
        >
          {isStep2Done ? '✓' : isStep2Active ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> : null}
          2. NGO Matched
        </span>

        <span className="text-slate-600 text-xs">→</span>

        {/* Step 3 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors ${
            isStep3Active
              ? 'bg-blue-950/90 text-blue-300 border border-blue-600/70 font-bold animate-pulse'
              : isStep3Done
              ? 'text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40'
              : 'text-slate-400 bg-slate-900/60 border border-slate-800'
          }`}
        >
          {isStep3Done ? '✓' : isStep3Active ? <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> : null}
          3. Courier Transit
        </span>

        <span className="text-slate-600 text-xs">→</span>

        {/* Step 4 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors ${
            isStep4Active
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500 font-bold'
              : 'text-slate-400 bg-slate-900/60 border border-slate-800'
          }`}
        >
          {isStep4Done ? '✓' : null}
          4. Delivered &amp; Logged
        </span>
      </div>
    );
  };

  const getStatusBadge = () => {
    const status = activeDonation?.status || 'available';
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            1. Surplus Available
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            2. NGO Matched
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-950/80 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            3. Courier In Transit
          </span>
        );
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[13px] text-emerald-400">check_circle</span>
            4. Delivered &amp; Logged
          </span>
        );
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">Draft</span>;
    }
  };

  const isAuthPage = pathname === '/' || pathname === '/login';

  // Minimal clean header on Sign In / Register pages: brand logo on left, theme toggle in top right corner
  if (isAuthPage) {
    return (
      <aside
        aria-label="Hackathon Header"
        className="w-full bg-slate-900 text-slate-200 text-xs py-2.5 px-4 border-b border-slate-800 flex items-center justify-between gap-4 z-50 select-none shadow-md"
      >
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {/* Circular Emblem Logo */}
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </span>
            <span className="font-display font-bold tracking-tight text-white text-xs">
              Nourish<span className="text-emerald-400">Relief</span>
            </span>
            <span className="text-slate-500 font-normal text-xs">-</span>
            <span className="text-xs tracking-tight flex items-center gap-1">
              <span className="text-[#FF9933] font-bold">Smart India</span>
              <span className="text-white font-bold">Hackathon</span>
              <span className="text-[#10b981] font-bold">2026</span>
            </span>
          </Link>
        </div>

        {/* Right Corner: Light / Dark Mode Toggle */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="text-[11px] text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0 border border-slate-700/80 bg-slate-800/60 shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px] text-amber-400">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </aside>
    );
  }

  // Role-specific nav items mapping per requirement:
  // KITCHEN: Dashboard, Forecast, Kitchen, Impact (Hide: NGO, Courier, Proof)
  // NGO: Dashboard, NGO, Impact (Hide: Forecast, Kitchen, Courier, Proof)
  // COURIER: Dashboard, Courier, Proof, Impact (Hide: Forecast, Kitchen, NGO)
  // ADMIN / PLATFORM MANAGER: All operational & audit links
  // Demo Mode Navigation: Unified presentation dashboard and core tabs
  // REAL MODE Navigation: Role-based permissions per authenticated user
  // Demo Mode Navigation: EXACT required order: Dashboard | Forecast | Kitchen | NGO | Delivery | Proof | Impact
  const DEMO_NAV_ITEMS = ['dashboard', 'forecast', 'kitchen', 'ngo', 'delivery', 'proof', 'impact'];

  const ROLE_NAV_ITEMS: Record<string, string[]> = {
    kitchen: ['dashboard', 'forecast', 'kitchen'],
    ngo: ['dashboard', 'ngo'],
    courier: ['dashboard', 'delivery', 'proof', 'impact'],
    admin: ['dashboard', 'forecast', 'kitchen', 'ngo', 'delivery', 'proof', 'impact'],
    platform_manager: ['dashboard', 'forecast', 'kitchen', 'ngo', 'delivery', 'proof', 'impact'],
  };

  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: isRealMode && role ? `/dashboard/${role === 'platform_manager' ? 'admin' : role}` : '/dashboard',
      isActive: (p: string) => {
        // Demo mode: only highlight Dashboard tab when exactly on /dashboard
        if (!isRealMode) return p === '/dashboard';
        // Sign-in mode: original behavior — match /dashboard and any sub-route
        return p === '/dashboard' || p.startsWith('/dashboard');
      },
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'forecast',
      label: 'Forecast',
      href: '/forecast',
      isActive: (p: string) => (p === '/forecast' || p.startsWith('/forecast/')) && !p.startsWith('/dashboard'),
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      href: '/restaurant/post',
      isActive: (p: string) => (p === '/restaurant' || p.startsWith('/restaurant/')) && !p.startsWith('/dashboard'),
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'ngo',
      label: 'NGO',
      href: '/ngo/claim',
      isActive: (p: string) => (p === '/ngo' || p.startsWith('/ngo/')) && !p.startsWith('/dashboard'),
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'delivery',
      aliasId: 'courier',
      label: isRealMode ? 'Courier' : 'Delivery',
      href: '/volunteer/pickup',
      isActive: (p: string) => (p === '/volunteer/pickup' || p.startsWith('/volunteer/pickup/')) && !p.startsWith('/dashboard'),
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'proof',
      label: 'Proof',
      href: '/volunteer/summary',
      isActive: (p: string) => (p === '/volunteer/summary' || p.startsWith('/volunteer/summary/')) && !p.startsWith('/dashboard'),
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'impact',
      label: 'Impact',
      href: '/impact',
      isActive: (p: string) => (p === '/impact' || p.startsWith('/impact/')) && !p.startsWith('/dashboard'),
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
    {
      id: 'overview',
      label: 'Overview',
      href: '/overview',
      isActive: (p: string) => p === '/overview',
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-700/50',
    },
  ];

  const allowedNavIds = isRealMode
    ? (ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.kitchen)
    : DEMO_NAV_ITEMS;

  const visibleNavItems = allNavItems.filter((item) =>
    allowedNavIds.includes(item.id) || (item.aliasId && allowedNavIds.includes(item.aliasId))
  );

  const getSimulationNextStep = () => {
    const status = activeDonation?.status || 'available';
    switch (status) {
      case 'available':
        return (
          <Link
            href="/ngo/claim"
            className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 px-2.5 py-0.5 rounded-md font-semibold transition-colors shadow-2xs"
            title="Simulate NGO discovering and claiming this surplus batch"
          >
            <span>Simulate Next Step: NGO Claim Food</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        );
      case 'claimed':
        return (
          <Link
            href="/volunteer/pickup"
            className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-700/60 px-2.5 py-0.5 rounded-md font-semibold transition-colors shadow-2xs"
            title="Simulate courier pickup and transit dispatch"
          >
            <span>Simulate Next Step: Courier Route</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        );
      case 'in_transit':
        return (
          <Link
            href="/volunteer/summary"
            className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/60 px-2.5 py-0.5 rounded-md font-semibold transition-colors shadow-2xs"
            title="Simulate electronic proof of delivery"
          >
            <span>Simulate Next Step: Complete Delivery Proof</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        );
      case 'completed':
      case 'delivered':
        return (
          <Link
            href="/impact"
            className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 px-2.5 py-0.5 rounded-md font-semibold transition-colors shadow-2xs"
            title="View environmental & platform ESG impact metrics"
          >
            <span>Simulation Complete: View ESG Impact</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      aria-label="Hackathon Demo Switcher"
      className="w-full flex flex-col z-50 select-none shadow-md"
    >
      {/* 1. Main Navigation Bar: Brand Logo on Left, Navigation Bar in Center, Sign In / Profile & Theme on Right */}
      <div className="w-full bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 overflow-x-auto">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 shrink-0 lg:flex-1 justify-start">
          <Link
            href={isRealMode && role ? `/dashboard/${role === 'platform_manager' ? 'admin' : role}` : '/dashboard'}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            title={isRealMode ? 'Go to Role Dashboard' : 'Go to Demonstration Dashboard'}
          >
            {/* Circular Emblem Logo */}
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </span>
            <span className="font-display font-bold tracking-tight text-white text-xs">
              Nourish<span className="text-emerald-400">Relief</span>
            </span>
            <span className="text-slate-500 font-normal text-xs">-</span>
            <span className="text-xs tracking-tight flex items-center gap-1">
              <span className="text-[#FF9933] font-bold">Smart India</span>
              <span className="text-white font-bold">Hackathon</span>
              <span className="text-[#10b981] font-bold">2026</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation Bar - Dynamically shows only items relevant to authenticated/demo role */}
        <div className="flex items-center justify-center shrink-0 max-w-full overflow-x-auto order-last lg:order-none w-full lg:w-auto">
          <nav
            aria-label="Lifecycle Workflow Navigation"
            className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 overflow-x-auto shadow-inner"
          >
            {visibleNavItems.map((item) => {
              const isActive = item.isActive(pathname);
              const isLockedImpact =
                isRealMode &&
                item.id === 'impact' &&
                role !== 'admin' &&
                role !== 'platform_manager' &&
                !isDeliveryCompleted;

              if (isLockedImpact) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled
                    title="Impact will be available after delivery is confirmed."
                    className="px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap text-slate-500 cursor-not-allowed opacity-60 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
                    isActive ? item.activeClass : item.inactiveClass
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Corner: Sign In Details & Light/Dark Mode */}
        <div className="flex items-center justify-end gap-2.5 shrink-0 lg:flex-1">
          {isRealMode ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-xs shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-medium">{user?.email?.split('@')[0]}</span>
              <span className="text-emerald-400/80 text-[10px]">({getRoleLabel(role)})</span>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.push('/login');
                }}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-300 ml-1 text-[10px] underline font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-amber-300/90 font-medium text-[11px]">Demo Mode</span>
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold hover:underline ml-0.5 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="text-[11px] text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0 border border-slate-700/80 bg-slate-800/60 shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px] text-amber-400">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* 2. Demo Mode Controls Bar: Dedicated simulation strip ONLY shown in Demo Mode (hidden in Real Mode) */}
      {!isRealMode && (
        <div
          aria-label="Demo Workflow Controls"
          className="w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/70 text-slate-300 text-[11px] py-1.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs select-none"
        >
          {/* Left: Simulation Lifecycle State Indicator */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {getLifecycleStages()}
          </div>

          {/* Right: Reset Demo State Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetToDemoData();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('nourishrelief:demo-reset'));
                }
                router.push('/dashboard');
              }}
              title="Reset Demo State to Initial Baseline"
              aria-label="Reset Demo"
              className="text-[11px] text-slate-400 hover:text-rose-300 px-2.5 py-0.5 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700/60 bg-slate-900/60"
            >
              <span className="material-symbols-outlined text-[13px] text-rose-400">restart_alt</span>
              <span className="font-medium">Reset Demo</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
