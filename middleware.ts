import { NextRequest, NextResponse } from 'next/server';
import { ROUTE_REDIRECTS } from '@/constants';

const locales = ['vi', 'en', 'cn'];
const defaultLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as 'vi' | 'en') || 'vi';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware called for:', pathname);

  // Extract the first segment
  const firstSegment = pathname.split('/')[1];
  console.log('First segment:', firstSegment);

  // If the first segment is a valid locale, let it pass
  if (locales.includes(firstSegment)) {
    // Check for redirects
    const pathWithoutLocale = pathname.replace(`/${firstSegment}`, '') || '/';

    // 1. Exact redirects (using ROUTE_REDIRECTS from constants)
    const newPath =
      ROUTE_REDIRECTS[pathWithoutLocale as keyof typeof ROUTE_REDIRECTS];
    if (newPath) {
      console.log(`Redirecting ${pathWithoutLocale} to ${newPath}`);
      return NextResponse.redirect(
        new URL(`/${firstSegment}${newPath}`, request.url)
      );
    }

    // 2. Dynamic redirects
    // /my-session/[id] -> /player/sessions/[id]
    if (pathWithoutLocale.match(/^\/my-session\/[^/]+$/)) {
      const newPath = pathWithoutLocale.replace(
        '/my-session',
        '/player/sessions'
      );
      console.log(`Redirecting ${pathWithoutLocale} to ${newPath}`);
      return NextResponse.redirect(
        new URL(`/${firstSegment}${newPath}`, request.url)
      );
    }

    // /host/pending-join-requests -> /host/sessions/pending
    if (pathWithoutLocale === '/host/pending-join-requests') {
      return NextResponse.redirect(
        new URL(`/${firstSegment}/host/sessions/pending`, request.url)
      );
    }

    // /player/sessions (list only, not detail pages) -> /host/sessions/joined
    if (pathWithoutLocale === '/player/sessions') {
      return NextResponse.redirect(
        new URL(`/${firstSegment}/host/sessions/joined`, request.url)
      );
    }

    // /tournaments/[id] -> /browse/tournaments/[id]
    const tournamentDetailMatch = pathWithoutLocale.match(
      /^\/tournaments\/([^/]+)$/
    );
    if (tournamentDetailMatch) {
      const id = tournamentDetailMatch[1];
      const newPath = `/browse/tournaments/${id}`;
      console.log(`Redirecting ${pathWithoutLocale} to ${newPath}`);
      return NextResponse.redirect(
        new URL(`/${firstSegment}${newPath}`, request.url)
      );
    }

    // /tournaments/[id]/manage -> /host/tournaments/[id]
    const tournamentManageMatch = pathWithoutLocale.match(
      /^\/tournaments\/([^/]+)\/manage(.*)$/
    );
    if (tournamentManageMatch) {
      const id = tournamentManageMatch[1];
      const rest = tournamentManageMatch[2] || '';
      const newPath = `/host/tournaments/${id}${rest}`;
      console.log(`Redirecting ${pathWithoutLocale} to ${newPath}`);
      return NextResponse.redirect(
        new URL(`/${firstSegment}${newPath}`, request.url)
      );
    }

    console.log('Valid locale, passing through');
    return NextResponse.next();
  }

  // If no first segment (root), redirect to default locale
  if (pathname === '/') {
    console.log('Root path, redirecting to /' + defaultLocale);
    const newUrl = new URL(`/${defaultLocale}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // For all other paths (including invalid locales), redirect to default locale + path
  console.log(
    'Invalid locale or no locale, redirecting to /' + defaultLocale + pathname
  );
  const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico|.*\\..*).*)',
  ],
};
