import { NextResponse } from 'next/server';
import { APP_LINKS_CONFIG } from '@/constants/app-links';

/**
 * Apple fetches this at build/install time to verify Universal Links and
 * caches aggressively — it must always return valid JSON, even before the
 * mobile team supplies a real Team ID/Bundle ID (placeholders here just
 * mean no app will match `appID`, not a broken fetch).
 */
export function GET() {
  const { teamId, bundleId } = APP_LINKS_CONFIG.apple;

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${teamId}.${bundleId}`,
            paths: ['/get-app*'],
          },
        ],
      },
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
}
