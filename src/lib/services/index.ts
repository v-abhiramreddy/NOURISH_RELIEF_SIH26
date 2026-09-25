/**
 * NourishRelief — Service Layer Entry Point
 *
 * Provides getPersistenceProvider() which returns the appropriate provider:
 *
 *   REAL MODE:  Supabase configured + client available → Supabase provider
 *   DEMO MODE:  Supabase unavailable / unconfigured    → localStorage provider
 *
 * The application NEVER crashes because Supabase is unavailable.
 * If credentials are missing, it silently falls back to localStorage.
 *
 * Usage:
 *   import { getPersistenceProvider } from '@/lib/services';
 *   const provider = getPersistenceProvider();
 *   const result = await provider.donations.create(donation);
 */

import { PersistenceProvider } from './types';
import { createSupabaseProvider } from './supabase-provider';
import { createLocalStorageProvider } from './local-provider';
import { supabase, isSupabaseConfigured } from '../supabase';

// Singleton providers — created once, reused
let _supabaseProvider: PersistenceProvider | null = null;
let _localProvider: PersistenceProvider | null = null;

/**
 * Returns the active persistence provider.
 *
 * Decision logic:
 * 1. If NEXT_PUBLIC_DEMO_MODE=true → always localStorage
 * 2. If Supabase is configured and client exists → Supabase provider
 * 3. Otherwise → localStorage provider (safe fallback)
 */
export function getPersistenceProvider(): PersistenceProvider {
  // Force demo mode via env var
  const forceDemoMode = typeof process !== 'undefined'
    && process.env?.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (forceDemoMode || !isSupabaseConfigured || !supabase) {
    if (!_localProvider) {
      _localProvider = createLocalStorageProvider();
    }
    return _localProvider;
  }

  if (!_supabaseProvider) {
    _supabaseProvider = createSupabaseProvider(supabase);
  }
  return _supabaseProvider;
}

/**
 * Returns true if the current provider is using Supabase.
 */
export function isUsingSupabase(): boolean {
  return getPersistenceProvider().mode === 'supabase';
}

// Re-export types for convenience
export type {
  PersistenceProvider,
  ServiceResult,
  DonationService,
  ClaimService,
  VolunteerTaskService,
  DeliveryProofService,
  ForecastService,
  FreshnessAssessmentService,
} from './types';
