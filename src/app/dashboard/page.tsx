'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import KitchenDashboardPage from './kitchen/page';
import NgoDashboardPage from './ngo/page';
import CourierDashboardPage from './courier/page';
import AdminDashboardPage from './admin/page';

export default function DashboardIndexPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading workspace dashboard...</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard based on authenticated or demo role
  switch (role) {
    case 'kitchen':
      return <KitchenDashboardPage />;
    case 'ngo':
      return <NgoDashboardPage />;
    case 'courier':
      return <CourierDashboardPage />;
    case 'admin':
    case 'platform_manager':
      return <AdminDashboardPage />;
    default:
      return <KitchenDashboardPage />;
  }
}
