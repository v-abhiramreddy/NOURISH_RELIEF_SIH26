import { AppRole, UserProfile } from '@/types';

export type { AppRole, UserProfile };

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  profile: UserProfile | null;
}

export interface RoleConfig {
  role: AppRole;
  label: string;
  shortLabel: string;
  description: string;
  allowedPrefixes: string[];
  defaultRoute: string;
}

/**
 * Exact application roles supported:
 * 1. Kitchen (Institutional Kitchens & Food Processing Units)
 * 2. NGO / Food Recipient (Community relief agencies & distribution rasois)
 * 3. Volunteer / Courier (Certified cold-chain & transport volunteers)
 * 4. Admin / ESG (Platform auditor & ESG analytics administrator)
 */
export const ROLE_CONFIGS: Record<AppRole, RoleConfig> = {
  kitchen: {
    role: 'kitchen',
    label: 'Kitchen',
    shortLabel: 'Kitchen',
    description: 'Institutional kitchen surplus posting, production buffer, and thermal logging',
    allowedPrefixes: ['/', '/forecast', '/restaurant', '/impact'],
    defaultRoute: '/restaurant/post',
  },
  ngo: {
    role: 'ngo',
    label: 'NGO / Food Recipient',
    shortLabel: 'NGO',
    description: 'Verified food relief agency claiming surplus portions and intake confirmation',
    allowedPrefixes: ['/', '/ngo', '/impact'],
    defaultRoute: '/ngo/claim',
  },
  courier: {
    role: 'courier',
    label: 'Volunteer / Courier',
    shortLabel: 'Courier',
    description: 'Rapid cold-chain delivery transit, checklist completion, and digital proof handoff',
    allowedPrefixes: ['/', '/volunteer', '/impact'],
    defaultRoute: '/volunteer/pickup',
  },
  admin: {
    role: 'admin',
    label: 'Admin / ESG',
    shortLabel: 'Admin',
    description: 'Platform administration, cross-role auditability, and MoFPI ESG reporting',
    allowedPrefixes: ['/', '/forecast', '/restaurant', '/ngo', '/volunteer', '/impact'],
    defaultRoute: '/impact',
  },
};

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: AppRole;
  sessionToken: string | null;
  isRealMode: boolean; // true if authenticated via live Supabase
  isDemoMode: boolean; // true if running via Demo Mode / localStorage fallback
  isLoading: boolean;
  error: string | null;
}

export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
