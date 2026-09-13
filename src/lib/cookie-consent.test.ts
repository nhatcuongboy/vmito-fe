import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  parseCookieConsent,
  serializeCookieConsent,
} from './cookie-consent.ts';

test('serializes both supported consent choices', () => {
  assert.equal(serializeCookieConsent('necessary'), 'v1.necessary');
  assert.equal(serializeCookieConsent('all'), 'v1.all');
});

test('parses only the current version and known choices', () => {
  assert.equal(parseCookieConsent('v1.necessary'), 'necessary');
  assert.equal(parseCookieConsent('v1.all'), 'all');
  assert.equal(parseCookieConsent('v0.all'), null);
  assert.equal(parseCookieConsent('v1.analytics'), null);
  assert.equal(parseCookieConsent(undefined), null);
});

test('keeps consent for one year', () => {
  assert.equal(COOKIE_CONSENT_MAX_AGE_SECONDS, 31_536_000);
});
