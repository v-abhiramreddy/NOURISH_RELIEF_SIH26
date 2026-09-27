'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import UnifiedDemoDashboard from '@/components/UnifiedDemoDashboard';
import KitchenDashboardPage from './kitchen/page';
import NgoDashboardPage from './ngo/page';
import CourierDashboardPage from './courier/page';
import AdminDashboardPage from './admin/page';

export default function DashboardIndexPage() {
  const { role, isRealMode, isLoading } = useAuth();

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

  // In Demo Mode: Unified demonstration dashboard
  if (!isRealMode) {
    return <UnifiedDemoDashboard />;
  }

  // In authenticated Real Mode: Render role-specific dashboard based on authenticated role
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
