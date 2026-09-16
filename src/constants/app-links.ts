/**
 * Universal Links (iOS) / App Links (Android) config, consumed by the
 * `/.well-known` route handlers. `teamId`/`bundleId`/`sha256Fingerprints`
 * are read from server-only env vars (no `NEXT_PUBLIC_` prefix) — never
 * import them into a client component.
 */
export const APP_LINKS_CONFIG = {
  domain: 'vmito.com',
  apple: {
    teamId: process.env.APPLE_TEAM_ID?.trim() || '',
    bundleId: process.env.IOS_BUNDLE_ID?.trim() || '',
  },
  android: {
    packageName: process.env.NEXT_PUBLIC_ANDROID_PACKAGE_NAME?.trim() || '',
    sha256Fingerprints: (process.env.ANDROID_SHA256_FINGERPRINTS || '')
      .split(',')
      .map((fingerprint) => fingerprint.trim())
      .filter(Boolean),
  },
} as const;
