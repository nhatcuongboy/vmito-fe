import { NextRequest, NextResponse } from 'next/server';
import { resolveInstallTarget } from '@/constants/android-app';
import { detectPWAPlatform } from '@/lib/pwa/install';

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'vi';

/**
 * Short, locale-independent link meant for QR codes / social bios: detects
 * the visiting device from its User-Agent and redirects straight to the
 * matching store (or the direct APK). Desktop/unknown UAs fall back to the
 * in-site overview page, which lists every platform.
 */
export function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const platform = detectPWAPlatform(userAgent);
  const target = resolveInstallTarget(platform);

  const destination = target
    ? target.url
    : new URL(`/${DEFAULT_LOCALE}/download`, request.url).toString();

  return NextResponse.redirect(destination, 302);
}
