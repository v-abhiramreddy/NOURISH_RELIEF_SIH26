'use client';

import React, { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 text-xs text-slate-500">
          Loading NourishRelief Authentication...
        </div>
      }
    >
      <AuthForm initialMode="signin" />
    </Suspense>
  );
}
