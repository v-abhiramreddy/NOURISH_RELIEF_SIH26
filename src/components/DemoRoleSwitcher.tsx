'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlatformStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { getRoleLabel } from '@/types';

export default function DemoRoleSwitcher() {
  const pathname = usePathname();
  const { setCurrentRole } = usePlatformStore();
  const { user, role, isRealMode, signOut, switchDemoRole } = useAuth();

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
      className="w-full bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 z-50 select-none shadow-md overflow-x-auto"
    >
      {/* 1. Left: Brand Logo */}
      <div className="flex items-center gap-2 shrink-0 lg:flex-1 justify-start">
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
      </div>

      {/* 2. Center: Navigation Bar (1st image) */}
      <div className="flex items-center justify-center shrink-0 max-w-full overflow-x-auto order-last lg:order-none w-full lg:w-auto">
        <nav
          aria-label="Lifecycle Workflow Navigation"
          className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 overflow-x-auto shadow-inner"
        >
          <Link
            href="/overview"
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
              pathname === '/overview'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/forecast"
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
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
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
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
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
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
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
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
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
              pathname.includes('/volunteer/summary')
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Proof
          </Link>
          <Link
            href="/impact"
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
              pathname.includes('/impact')
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Impact
          </Link>
        </nav>
      </div>

      {/* 3. Right Corner: Sign In Details & Light/Dark Mode */}
      <div className="flex items-center justify-end gap-2.5 shrink-0 lg:flex-1">
        {isRealMode ? (
          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-xs shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-300 font-medium">Real: {user?.email?.split('@')[0]}</span>
            <span className="text-emerald-400/80 text-[10px]">({getRoleLabel(role)})</span>
            <button
              type="button"
              onClick={signOut}
              title="Sign Out of Real Mode"
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
    </aside>
  );
}
