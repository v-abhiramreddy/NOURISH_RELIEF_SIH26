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
  const { currentRole, setCurrentRole, activeDonation, resetToDemoData, isSupabaseActive } = usePlatformStore();
  const { user, role, isRealMode, isDemoMode, signOut, switchDemoRole } = useAuth();

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

  const getStatusBadge = () => {
    const status = activeDonation?.status || 'available';
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            1. Surplus Available
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950/70 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            2. NGO Matched
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-950/70 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            3. Courier In Transit
          </span>
        );
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950/70 text-emerald-300 border border-emerald-500/60 px-2 py-0.5 rounded text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[12px] text-emerald-400">check_circle</span>
            4. Delivered &amp; Logged
          </span>
        );
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">Draft</span>;
    }
  };

  // Next logical step in SIH end-to-end flow
  const getNextStep = () => {
    if (pathname === '/' || pathname === '/overview' || pathname.includes('/forecast')) {
      return {
        label: 'Next: Kitchen Surplus →',
        action: () => {
          setCurrentRole('restaurant');
          switchDemoRole('kitchen');
          router.push('/restaurant/post');
        },
      };
    }
    if (pathname.includes('/restaurant')) {
      return {
        label: 'Next: NGO Claim →',
        action: () => {
          setCurrentRole('ngo');
          switchDemoRole('ngo');
          router.push('/ngo/claim');
        },
      };
    }
    if (pathname.includes('/ngo')) {
      return {
        label: 'Next: Courier Route →',
        action: () => {
          setCurrentRole('volunteer');
          switchDemoRole('courier');
          router.push('/volunteer/pickup');
        },
      };
    }
    if (pathname.includes('/volunteer/pickup')) {
      return {
        label: 'Next: Delivery Summary →',
        action: () => {
          setCurrentRole('volunteer');
          switchDemoRole('courier');
          router.push('/volunteer/summary');
        },
      };
    }
    if (pathname.includes('/volunteer/summary')) {
      return {
        label: 'Next: Impact ESG →',
        action: () => {
          router.push('/impact');
        },
      };
    }
    if (pathname.includes('/impact')) {
      return {
        label: 'Restart Flow ↺',
        action: () => {
          resetToDemoData();
          router.push('/forecast');
        },
      };
    }
    return null;
  };

  const nextStep = getNextStep();
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

  return (
    <aside
      aria-label="Hackathon Demo Switcher"
      className="w-full bg-slate-900 text-slate-200 text-xs py-2 px-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-50 select-none shadow-md overflow-x-auto"
    >
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/overview"
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
        <span className="text-slate-700 hidden xl:inline">|</span>
        <div className="hidden xl:flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Lifecycle:</span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Primary Lifecycle Step Navigation */}
      <nav
        aria-label="Lifecycle Workflow Navigation"
        className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 overflow-x-auto"
      >
        <Link
          href="/overview"
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname === '/overview'
              ? 'bg-slate-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/forecast"
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname.includes('/forecast')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Forecast
        </Link>
        <Link
          href="/restaurant/post"
          onClick={() => {
            setCurrentRole('restaurant');
            switchDemoRole('kitchen');
          }}
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname.includes('/restaurant')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Kitchen
        </Link>
        <Link
          href="/ngo/claim"
          onClick={() => {
            setCurrentRole('ngo');
            switchDemoRole('ngo');
          }}
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname.includes('/ngo')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          NGO
        </Link>
        <Link
          href="/volunteer/pickup"
          onClick={() => {
            setCurrentRole('volunteer');
            switchDemoRole('courier');
          }}
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname.includes('/volunteer/pickup')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Courier
        </Link>
        <Link
          href="/volunteer/summary"
          onClick={() => {
            setCurrentRole('volunteer');
            switchDemoRole('courier');
          }}
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname.includes('/volunteer/summary')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Proof
        </Link>
        <Link
          href="/impact"
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            pathname.includes('/impact')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Impact
        </Link>
      </nav>

      {/* Demo Controls & Next Step Guide */}
      <div className="flex items-center gap-2 shrink-0">
        {nextStep && (
          <button
            onClick={nextStep.action}
            className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-1 rounded border border-emerald-500/40 transition-colors"
          >
            <span>{nextStep.label}</span>
          </button>
        )}

        {/* Real Mode vs Demo Mode Distinction */}
        {isRealMode ? (
          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-300 font-medium">Real: {user?.email?.split('@')[0]}</span>
            <span className="text-emerald-400/80 text-[10px]">({getRoleLabel(role)})</span>
            <button
              type="button"
              onClick={signOut}
              title="Sign Out of Real Mode"
              className="text-slate-400 hover:text-rose-300 ml-1 text-[10px] underline"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-amber-300/90 font-medium text-[10px]">Demo Mode</span>
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold hover:underline ml-0.5"
            >
              Sign In
            </Link>
          </div>
        )}

        {isSupabaseActive && (
          <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Supabase
          </span>
        )}
        {/* Reset Demo Button */}
        <button
          type="button"
          onClick={() => {
            resetToDemoData();
            router.push('/overview');
          }}
          title="Reset Demo State"
          aria-label="Reset Demo"
          className="text-[11px] text-slate-300 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0 border border-slate-700/80 bg-slate-800/60"
        >
          <span className="material-symbols-outlined text-[14px] text-rose-400">restart_alt</span>
          <span className="font-medium">Reset Demo</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="text-[11px] text-slate-300 hover:text-amber-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0 border border-slate-700/80 bg-slate-800/60"
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
