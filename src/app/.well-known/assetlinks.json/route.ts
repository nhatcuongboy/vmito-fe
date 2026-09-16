import { NextResponse } from 'next/server';
import { APP_LINKS_CONFIG } from '@/constants/app-links';

/**
 * Android's Digital Asset Links verifier fetches this to confirm App Links
 * ownership and caches aggressively — must always return valid JSON, even
 * before the mobile team supplies a real package name/SHA-256 fingerprint.
 */
export function GET() {
  const { packageName, sha256Fingerprints } = APP_LINKS_CONFIG.android;

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: sha256Fingerprints,
        },
      },
    ],
    { headers: { 'Content-Type': 'application/json' } }
  );
}
