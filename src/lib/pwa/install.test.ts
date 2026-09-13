import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APP_INSTALL_DISMISS_COOLDOWN_MS,
  detectPWAPlatform,
  isAppInstallPromptDue,
  isPWAStandalone,
} from './install.ts';
import {
  createAppInstallConfig,
  resolveInstallTarget,
} from '../../constants/android-app.ts';

test('detects iOS phones and iPadOS', () => {
  assert.equal(
    detectPWAPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'),
    'ios'
  );
  assert.equal(
    detectPWAPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5),
    'ios'
  );
});

test('detects Android and unsupported platforms', () => {
  assert.equal(
    detectPWAPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)'),
    'android'
  );
  assert.equal(
    detectPWAPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    'other'
  );
});

test('recognizes both standard and iOS standalone modes', () => {
  assert.equal(isPWAStandalone(true, {}), true);
  assert.equal(isPWAStandalone(false, { standalone: true }), true);
  assert.equal(isPWAStandalone(false, {}), false);
});

test('uses the official stores and prefers Google Play to an APK', () => {
  const config = createAppInstallConfig({
    NEXT_PUBLIC_IOS_APP_STORE_URL:
      'https://apps.apple.com/vn/app/vmito/id1234567890',
    NEXT_PUBLIC_ANDROID_PLAY_STORE_URL:
      'https://play.google.com/store/apps/details?id=vn.vmito.app',
    NEXT_PUBLIC_ANDROID_APK_URL: 'https://cdn.vmito.vn/vmito.apk',
    NEXT_PUBLIC_ANDROID_APP_VERSION: '1.2.0',
  });

  assert.deepEqual(resolveInstallTarget('ios', config), {
    platform: 'ios',
    channel: 'app-store',
    url: 'https://apps.apple.com/vn/app/vmito/id1234567890',
    targetKey: 'ios:app-store:https://apps.apple.com/vn/app/vmito/id1234567890',
  });

  const androidTarget = resolveInstallTarget('android', config);
  assert.equal(androidTarget?.channel, 'play-store');
  assert.equal(
    androidTarget?.url,
    'https://play.google.com/store/apps/details?id=vn.vmito.app'
  );
});

test('falls back to an APK only when the Google Play URL is unavailable', () => {
  const config = createAppInstallConfig({
    NEXT_PUBLIC_ANDROID_PLAY_STORE_URL: 'https://example.com/not-google-play',
    NEXT_PUBLIC_ANDROID_APK_URL: 'https://cdn.vmito.vn/vmito.apk',
    NEXT_PUBLIC_ANDROID_APP_VERSION: '2.0.0',
  });

  const androidTarget = resolveInstallTarget('android', config);
  assert.equal(androidTarget?.channel, 'apk');
  assert.equal(
    androidTarget?.targetKey,
    'android:apk:2.0.0:https://cdn.vmito.vn/vmito.apk'
  );
});

test('does not resolve a target from missing or invalid download links', () => {
  const config = createAppInstallConfig({
    NEXT_PUBLIC_IOS_APP_STORE_URL: 'http://apps.apple.com/vn/app/vmito/id1',
    NEXT_PUBLIC_ANDROID_PLAY_STORE_URL: 'https://example.com/vmito',
    NEXT_PUBLIC_ANDROID_APK_URL: 'not a url',
  });

  assert.equal(resolveInstallTarget('ios', config), null);
  assert.equal(resolveInstallTarget('android', config), null);
});

test('respects a seven-day dismissal cooldown but resurfaces changed targets', () => {
  const now = 1_800_000_000_000;
  const targetKey =
    'android:play-store:https://play.google.com/store/apps/details?id=vn.vmito.app';

  assert.equal(
    isAppInstallPromptDue({
      hasHydrated: true,
      isStandalone: false,
      targetKey,
      dismissedTargetKey: targetKey,
      dismissedAt: now - APP_INSTALL_DISMISS_COOLDOWN_MS + 1,
      now,
    }),
    false
  );
  assert.equal(
    isAppInstallPromptDue({
      hasHydrated: true,
      isStandalone: false,
      targetKey,
      dismissedTargetKey: 'android:apk:1.0.0:https://cdn.vmito.vn/vmito.apk',
      dismissedAt: now,
      now,
    }),
    true
  );
});
