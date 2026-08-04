import assert from 'node:assert/strict';
import test from 'node:test';
import { detectPWAPlatform, isPWAStandalone } from './install.ts';

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
