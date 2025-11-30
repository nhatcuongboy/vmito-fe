import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/host', '/dashboard', '/sessions', '/admin', '/tournaments'];

// Routes that should redirect if already authenticated
const publicOnlyRoutes = ['/auth/signin', '/auth/signup'];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    const session = await auth();
    const isAuthenticated = !!session?.user;

    // Handle locale routing
    const locale = pathname.split('/')[1];
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    // Check if route requires authentication
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathWithoutLocale.startsWith(route)
    );

    // Check if route is public only (redirect if authenticated)
    const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
      pathWithoutLocale.startsWith(route)
    );

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !isAuthenticated) {
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users from public-only routes
    if (isPublicOnlyRoute && isAuthenticated) {
      const hostUrl = new URL(`/${locale}/host`, request.url);
      return NextResponse.redirect(hostUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.next();
  }
}
