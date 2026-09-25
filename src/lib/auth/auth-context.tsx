'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthService } from './auth-service';
import { AppRole, UserProfile, AuthUser, ROLE_CONFIGS, RoleConfig } from './types';
import { normalizeRole, UserRole } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: AppRole;
  isRealMode: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    details: {
      role: AppRole;
      organization_name: string;
      address?: string;
      phone?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  canAccessRoute: (pathname: string) => boolean;
  getRoleConfig: (role?: AppRole) => RoleConfig;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_ROLE_KEY = 'nourishrelief_demo_auth_role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [demoRole, setDemoRole] = useState<AppRole>('kitchen');
  const [isRealMode, setIsRealMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session and auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 0. Check if active session cookies exist
      if (typeof document !== 'undefined') {
        const matchSession = document.cookie.match(/nr_auth_session=([^;]+)/);
        const matchRole = document.cookie.match(/nr_user_role=([^;]+)/);
        if (matchSession && matchRole) {
          const roleVal = normalizeRole(decodeURIComponent(matchRole[1].trim()));
          const userId = decodeURIComponent(matchSession[1].trim());
          const activeProfile: UserProfile = {
            id: userId,
            auth_user_id: userId,
            role: roleVal,
            organization_name: `${roleVal.toUpperCase()} Registered Unit`,
            address: 'Sector 4 Industrial Area, Unit 2',
            phone: '+91 98765 43210',
            verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (isMounted) {
            setUser({
              id: userId,
              email: `${roleVal}@mofpi-network.gov.in`,
              role: roleVal,
              profile: activeProfile,
            });
            setProfile(activeProfile);
            setIsRealMode(true);
            setIsLoading(false);
          }
          return;
        }
      }

      // 1. Check if Supabase is configured
      if (!AuthService.isConfigured() || !supabase) {
        // Fallback directly to Demo Mode
        if (typeof window !== 'undefined') {
          const savedDemoRole = localStorage.getItem(DEMO_ROLE_KEY);
          if (savedDemoRole) {
            setDemoRole(normalizeRole(savedDemoRole));
          }
        }
        setIsRealMode(false);
        setIsLoading(false);
        return;
      }

      // 2. Real Mode: Check for existing Supabase session
      try {
        const session = await AuthService.getSession();
        if (session && session.user && isMounted) {
          const fetchedProfile = await AuthService.getProfileByAuthUserId(session.user.id);
          const activeRole = fetchedProfile?.role || normalizeRole(session.user.user_metadata?.role || 'kitchen');

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: activeRole,
            profile: fetchedProfile,
          });
          setProfile(fetchedProfile);
          setIsRealMode(true);
        } else {
          // No active Supabase session — keep Demo Mode ready
          if (typeof window !== 'undefined') {
            const savedDemoRole = localStorage.getItem(DEMO_ROLE_KEY);
            if (savedDemoRole) {
              setDemoRole(normalizeRole(savedDemoRole));
            }
          }
          setIsRealMode(false);
        }
      } catch (err) {
        console.warn('Supabase auth initialization fallback to demo mode:', err);
        setIsRealMode(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // 3. Subscribe to Supabase auth state changes if configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (AuthService.isConfigured() && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const fetchedProfile = await AuthService.getProfileByAuthUserId(session.user.id);
          const activeRole = fetchedProfile?.role || normalizeRole(session.user.user_metadata?.role || 'kitchen');

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: activeRole,
            profile: fetchedProfile,
          });
          setProfile(fetchedProfile);
          setIsRealMode(true);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsRealMode(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Effective role: Profile role in Real Mode, demoRole in Demo Mode
  const effectiveRole: AppRole = isRealMode && profile ? profile.role : demoRole;

  // Sign In (Real Mode)
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    const result = await AuthService.signIn(email, password);
    setIsLoading(false);

    if (result.success && result.data) {
      setUser(result.data.user);
      setProfile(result.data.profile);
      setIsRealMode(true);
      return { success: true };
    } else {
      const errMsg = result.error || 'Failed to sign in';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, []);

  // Sign Up (Real Mode)
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      details: {
        role: AppRole;
        organization_name: string;
        address?: string;
        phone?: string;
      }
    ) => {
      setIsLoading(true);
      setError(null);
      const result = await AuthService.signUp(email, password, details);
      setIsLoading(false);

      if (result.success && result.data) {
        setUser(result.data.user);
        setProfile(result.data.profile);
        setIsRealMode(true);
        return { success: true };
      } else {
        const errMsg = result.error || 'Registration failed';
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    },
    []
  );

  // Sign Out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    await AuthService.signOut();
    setUser(null);
    setProfile(null);
    setIsRealMode(false);
    setIsLoading(false);
  }, []);

  // Demo Mode: Role Switcher
  const switchDemoRole = useCallback((role: UserRole) => {
    const normalized = normalizeRole(role);
    setDemoRole(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_ROLE_KEY, normalized);
    }
  }, []);

  // Route access permission check
  const canAccessRoute = useCallback(
    (pathname: string): boolean => {
      // Root, login, and static assets are accessible to all
      if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/icon')
      ) {
        return true;
      }

      // Admin has universal audit & monitoring access
      if (effectiveRole === 'admin') {
        return true;
      }

      const config = ROLE_CONFIGS[effectiveRole];
      if (!config) return false;

      return config.allowedPrefixes.some((prefix) => {
        if (prefix === '/') return pathname === '/';
        return pathname === prefix || pathname.startsWith(prefix + '/');
      });
    },
    [effectiveRole]
  );

  const getRoleConfig = useCallback((role?: AppRole): RoleConfig => {
    const r = role || effectiveRole;
    return ROLE_CONFIGS[r] || ROLE_CONFIGS.kitchen;
  }, [effectiveRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: effectiveRole,
        isRealMode,
        isDemoMode: !isRealMode,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        switchDemoRole,
        canAccessRoute,
        getRoleConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
