import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AppRole, UserProfile, AuthUser, AuthResult } from './types';
import { normalizeRole } from '@/types';

const SESSION_COOKIE_NAME = 'nr_auth_session';
const ROLE_COOKIE_NAME = 'nr_user_role';

function setAuthCookies(userId: string, role: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `${ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function clearAuthCookies() {
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export class AuthService {
  /**
   * Check whether live Supabase backend is configured
   */
  static isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  /**
   * Real Mode: Authenticate user with Supabase email & password
   */
  static async signIn(
    email: string,
    password: string
  ): Promise<AuthResult<{ user: AuthUser; profile: UserProfile }>> {
    if (!this.isConfigured() || !supabase) {
      return {
        success: false,
        error:
          'Supabase backend credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured. Please use Demo Mode for offline evaluation.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Authentication failed. Please verify your credentials.',
        };
      }

      // Retrieve user profile from the database
      const profile = await this.getOrCreateProfile(data.user.id, {
        email: data.user.email || email,
        role: (data.user.user_metadata?.role as AppRole) || 'kitchen',
        organization_name: data.user.user_metadata?.organization_name || '',
      });

      const role = profile?.role || normalizeRole(data.user.user_metadata?.role || 'kitchen');
      setAuthCookies(data.user.id, role);

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        role,
        profile,
      };

      return {
        success: true,
        data: {
          user: authUser,
          profile: profile!,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in network error';
      return { success: false, error: message };
    }
  }

  /**
   * Real Mode: Register a new user and create an organization profile record
   */
  static async signUp(
    email: string,
    password: string,
    details: {
      role: AppRole;
      organization_name: string;
      address?: string;
      phone?: string;
    }
  ): Promise<AuthResult<{ user: AuthUser; profile: UserProfile }>> {
    if (!this.isConfigured() || !supabase) {
      return {
        success: false,
        error:
          'Supabase backend is not configured in this environment. Use Demo Mode for offline testing.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: details.role,
            organization_name: details.organization_name,
            address: details.address || '',
            phone: details.phone || '',
          },
        },
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Registration failed.',
        };
      }

      // Provision profile record
      const profile = await this.getOrCreateProfile(data.user.id, {
        email: data.user.email || email,
        role: details.role,
        organization_name: details.organization_name,
        address: details.address || '',
        phone: details.phone || '',
      });

      const role = profile?.role || details.role;
      setAuthCookies(data.user.id, role);

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        role,
        profile,
      };

      return {
        success: true,
        data: {
          user: authUser,
          profile: profile!,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration network error';
      return { success: false, error: message };
    }
  }

  /**
   * Real Mode: Sign out user and clear session cookies
   */
  static async signOut(): Promise<AuthResult> {
    clearAuthCookies();
    if (!this.isConfigured() || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out error';
      return { success: false, error: message };
    }
  }

  /**
   * Real Mode: Fetch current active session from Supabase
   */
  static async getSession() {
    if (!this.isConfigured() || !supabase) {
      return null;
    }
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  }

  /**
   * Real Mode: Retrieve profile from database `profiles` table
   */
  static async getProfileByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    if (!this.isConfigured() || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        auth_user_id: data.auth_user_id,
        role: normalizeRole(data.role),
        organization_name: data.organization_name || '',
        address: data.address || '',
        phone: data.phone || '',
        verified: Boolean(data.verified),
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get existing profile or insert new row if not present
   */
  private static async getOrCreateProfile(
    authUserId: string,
    metadata: {
      email?: string;
      role: AppRole;
      organization_name: string;
      address?: string;
      phone?: string;
    }
  ): Promise<UserProfile | null> {
    if (!this.isConfigured() || !supabase) {
      return null;
    }

    const existing = await this.getProfileByAuthUserId(authUserId);
    if (existing) {
      return existing;
    }

    try {
      const newProfile = {
        auth_user_id: authUserId,
        role: metadata.role,
        organization_name: metadata.organization_name || 'Registered Organization',
        address: metadata.address || '',
        phone: metadata.phone || '',
        verified: false,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select('*')
        .single();

      if (error || !data) {
        // Return synthetic profile matching the metadata
        return {
          id: authUserId,
          auth_user_id: authUserId,
          role: metadata.role,
          organization_name: metadata.organization_name || '',
          address: metadata.address || '',
          phone: metadata.phone || '',
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: metadata.email,
        };
      }

      return {
        id: data.id,
        auth_user_id: data.auth_user_id,
        role: normalizeRole(data.role),
        organization_name: data.organization_name || '',
        address: data.address || '',
        phone: data.phone || '',
        verified: Boolean(data.verified),
        created_at: data.created_at,
        updated_at: data.updated_at,
        email: metadata.email,
      };
    } catch {
      return null;
    }
  }
}
