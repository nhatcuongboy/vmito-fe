import assert from 'node:assert/strict';
import test from 'node:test';
import { detectPWAPlatform, isPWAStandalone } from './install.ts';
import {
  createAppInstallConfig,
  resolveInstallTarget,
} from '../../constants/android-app.ts';

test('Android device identification for APK installation', () => {
  const androidUAs = [
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; U; Android 13; vi-vn; Redmi Note 12 Build/TKQ1.221013.002) AppleWebKit/537.36',
    'Mozilla/5.0 (Linux; Android 12; Pixel 6 Pro)',
  ];

  for (const ua of androidUAs) {
    assert.equal(detectPWAPlatform(ua), 'android');
  }

  const nonAndroidUAs = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  ];

  for (const ua of nonAndroidUAs) {
    assert.notEqual(detectPWAPlatform(ua), 'android');
  }
});

test('Standalone detection prevents prompting already-installed users', () => {
  assert.equal(isPWAStandalone(true, {}), true);
  assert.equal(isPWAStandalone(false, { standalone: true }), true);
  assert.equal(isPWAStandalone(false, {}), false);
});

test('Android installation is disabled without a Google Play or APK URL', () => {
  const config = createAppInstallConfig({
    NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED: 'true',
  });
  assert.equal(resolveInstallTarget('android', config), null);
});

test('Android installation can be explicitly disabled', () => {
  const config = createAppInstallConfig({
    NEXT_PUBLIC_ANDROID_PLAY_STORE_URL:
      'https://play.google.com/store/apps/details?id=vn.vmito.app',
    NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED: 'false',
  });
  assert.equal(resolveInstallTarget('android', config), null);
});
