import assert from 'node:assert/strict';
import test from 'node:test';
import { isNewsfeedPathname } from './isNewsfeedPathname.ts';

test('recognizes feed and post-detail routes', () => {
  assert.equal(isNewsfeedPathname('/newsfeed'), true);
  assert.equal(isNewsfeedPathname('/newsfeed/post-1'), true);
  assert.equal(isNewsfeedPathname('/vi/newsfeed'), true);
  assert.equal(isNewsfeedPathname('/en/newsfeed/post-1'), true);
});

test('does not match unrelated routes', () => {
  assert.equal(isNewsfeedPathname('/'), false);
  assert.equal(isNewsfeedPathname('/newsfeed-settings'), false);
  assert.equal(isNewsfeedPathname('/user/newsfeed'), false);
});
