import { NextRequest, NextResponse } from 'next/server';

const locales = ['vi', 'en'];
const defaultLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as 'vi' | 'en') || 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware called for:', pathname);

  // Extract the first segment
  const firstSegment = pathname.split('/')[1];
  console.log('First segment:', firstSegment);

  // If the first segment is a valid locale, let it pass
  if (locales.includes(firstSegment)) {
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
