import assert from 'node:assert/strict';
import test from 'node:test';
import { SESSION_RESULTS_LAYOUT } from './find-session-results-layout.ts';

const visibleSkeletonCount = (
  viewMode: 'list' | 'grid',
  breakpoint: 'base' | 'md' | 'lg'
) =>
  SESSION_RESULTS_LAYOUT[viewMode].loadMoreSkeletonDisplays.filter(
    (display) => display[breakpoint] === 'flex'
  ).length;

test('load-more skeleton counts match list columns at every breakpoint', () => {
  assert.equal(visibleSkeletonCount('list', 'base'), 1);
  assert.equal(visibleSkeletonCount('list', 'md'), 3);
  assert.equal(visibleSkeletonCount('list', 'lg'), 4);
});

test('load-more skeleton counts match grid columns at every breakpoint', () => {
  assert.equal(visibleSkeletonCount('grid', 'base'), 1);
  assert.equal(visibleSkeletonCount('grid', 'md'), 2);
  assert.equal(visibleSkeletonCount('grid', 'lg'), 3);
});
