import type { PWAPlatform } from '@/lib/pwa/install';

/**
 * The Universal Link (iOS) / App Link (Android) target declared in
 * `/.well-known/apple-app-site-association` and matched by the Android
 * app's intent-filter. A tap on this URL opens the native app directly if
 * it's installed and the OS-level association is configured; otherwise it
 * falls through to `/get-app`'s own UA-based redirect to the store/APK —
 * see `src/app/get-app/route.ts`. Client-safe (no secrets), unlike
 * `APP_LINKS_CONFIG` in `src/constants/app-links.ts`.
 */
export const UNIVERSAL_LINK_URL = 'https://vmito.com/get-app';

export type InstallChannel = 'app-store' | 'play-store' | 'apk';

export interface InstallTarget {
  platform: 'ios' | 'android';
  channel: InstallChannel;
  url: string;
  targetKey: string;
}

export interface AppInstallConfig {
  ios: {
    appStoreUrl: string | null;
  };
  android: {
    playStoreUrl: string | null;
    apkUrl: string | null;
    version: string;
    fileSize: string;
    releaseNotes: string;
    isEnabled: boolean;
  };
}

type PublicInstallEnv = Partial<{
  NEXT_PUBLIC_IOS_APP_STORE_URL: string;
  NEXT_PUBLIC_ANDROID_PLAY_STORE_URL: string;
  NEXT_PUBLIC_ANDROID_APK_URL: string;
  NEXT_PUBLIC_ANDROID_APP_VERSION: string;
  NEXT_PUBLIC_ANDROID_APK_SIZE: string;
  NEXT_PUBLIC_ANDROID_RELEASE_NOTES: string;
  NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED: string;
}>;

const parseHttpsUrl = (
  value: string | undefined,
  expectedHostname?: string
): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    if (expectedHostname && url.hostname !== expectedHostname) return null;
    return url.toString();
  } catch {
    return null;
  }
};

/**
 * Builds public install configuration from build-time environment variables.
 * A missing or malformed URL deliberately disables that delivery channel.
 */
export const createAppInstallConfig = (
  env: PublicInstallEnv
): AppInstallConfig => ({
  ios: {
    appStoreUrl: parseHttpsUrl(
      env.NEXT_PUBLIC_IOS_APP_STORE_URL,
      'apps.apple.com'
    ),
  },
  android: {
    playStoreUrl: parseHttpsUrl(
      env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL,
      'play.google.com'
    ),
    apkUrl: parseHttpsUrl(env.NEXT_PUBLIC_ANDROID_APK_URL),
    version: env.NEXT_PUBLIC_ANDROID_APP_VERSION?.trim() || 'latest',
    fileSize: env.NEXT_PUBLIC_ANDROID_APK_SIZE?.trim() || '',
    releaseNotes: env.NEXT_PUBLIC_ANDROID_RELEASE_NOTES?.trim() || '',
    isEnabled: env.NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED !== 'false',
  },
});

export const APP_INSTALL_CONFIG = createAppInstallConfig({
  NEXT_PUBLIC_IOS_APP_STORE_URL: process.env.NEXT_PUBLIC_IOS_APP_STORE_URL,
  NEXT_PUBLIC_ANDROID_PLAY_STORE_URL:
    process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL,
  NEXT_PUBLIC_ANDROID_APK_URL: process.env.NEXT_PUBLIC_ANDROID_APK_URL,
  NEXT_PUBLIC_ANDROID_APP_VERSION: process.env.NEXT_PUBLIC_ANDROID_APP_VERSION,
  NEXT_PUBLIC_ANDROID_APK_SIZE: process.env.NEXT_PUBLIC_ANDROID_APK_SIZE,
  NEXT_PUBLIC_ANDROID_RELEASE_NOTES:
    process.env.NEXT_PUBLIC_ANDROID_RELEASE_NOTES,
  NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED:
    process.env.NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED,
});

/**
 * Resolves the one official download destination for the current device.
 * Android always uses Google Play first and only falls back to an APK.
 */
export const resolveInstallTarget = (
  platform: PWAPlatform,
  config: AppInstallConfig = APP_INSTALL_CONFIG
): InstallTarget | null => {
  if (platform === 'ios' && config.ios.appStoreUrl) {
    return {
      platform: 'ios',
      channel: 'app-store',
      url: config.ios.appStoreUrl,
      targetKey: `ios:app-store:${config.ios.appStoreUrl}`,
    };
  }

  if (platform !== 'android' || !config.android.isEnabled) return null;

  if (config.android.playStoreUrl) {
    return {
      platform: 'android',
      channel: 'play-store',
      url: config.android.playStoreUrl,
      targetKey: `android:play-store:${config.android.playStoreUrl}`,
    };
  }

  if (config.android.apkUrl) {
    return {
      platform: 'android',
      channel: 'apk',
      url: config.android.apkUrl,
      targetKey: `android:apk:${config.android.version}:${config.android.apkUrl}`,
    };
  }

  return null;
};

// Retained for any existing callers while the shared install configuration is
// adopted. It intentionally has no fallback APK URL.
export const ANDROID_APP_CONFIG = {
  downloadUrl: APP_INSTALL_CONFIG.android.apkUrl,
  version: APP_INSTALL_CONFIG.android.version,
  fileSize: APP_INSTALL_CONFIG.android.fileSize,
  releaseNotes: APP_INSTALL_CONFIG.android.releaseNotes,
  isEnabled: APP_INSTALL_CONFIG.android.isEnabled,
} as const;

export type AndroidAppConfig = typeof ANDROID_APP_CONFIG;
