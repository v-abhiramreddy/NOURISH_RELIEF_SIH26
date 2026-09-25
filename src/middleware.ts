import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route access policies by role
 */
const ROLE_ROUTE_PERMISSIONS: Record<string, string[]> = {
  kitchen: ['/', '/login', '/forecast', '/restaurant', '/impact', '/dashboard/kitchen', '/dashboard'],
  ngo: ['/', '/login', '/ngo', '/impact', '/dashboard/ngo', '/dashboard'],
  courier: ['/', '/login', '/volunteer', '/impact', '/dashboard/courier', '/dashboard'],
  admin: ['/', '/login', '/forecast', '/restaurant', '/ngo', '/volunteer', '/impact', '/dashboard'],
  platform_manager: ['/', '/login', '/forecast', '/restaurant', '/ngo', '/volunteer', '/impact', '/dashboard'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, favicon, icon files, and internal next paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Read session & role cookies set by AuthService in Real Mode
  const sessionCookie = request.cookies.get('nr_auth_session');
  const roleCookie = request.cookies.get('nr_user_role');
  const userRole = roleCookie?.value || '';

  const response = NextResponse.next();

  // 3. Mark request mode header
  if (sessionCookie?.value) {
    response.headers.set('x-nourish-auth-mode', 'real');
    response.headers.set('x-nourish-user-role', userRole);

    // If logged in and visiting /login, redirect to their role default or home
    if (pathname === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Role-aware route check in Real Mode
    const allowedPrefixes = ROLE_ROUTE_PERMISSIONS[userRole] || ['/', '/login'];
    const isAllowed =
      userRole === 'admin' ||
      userRole === 'platform_manager' ||
      allowedPrefixes.some((prefix) => {
        if (prefix === '/') return pathname === '/';
        if (prefix === '/dashboard') return pathname === '/dashboard';
        return pathname === prefix || pathname.startsWith(prefix + '/');
      });

    if (!isAllowed) {
      // Set header indicating restricted boundary (consumed by RoleGuard component)
      response.headers.set('x-nourish-access-restricted', 'true');
    }
  } else {
    // Demo Mode / Unauthenticated
    response.headers.set('x-nourish-auth-mode', 'demo');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images & static files
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
