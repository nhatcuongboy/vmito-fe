import assert from 'node:assert/strict';
import test from 'node:test';
import { getFullRowSkeletonDisplay } from './infinite-loading-layout.ts';

test('shows card skeletons only when the current row is complete', () => {
  assert.deepEqual(getFullRowSkeletonDisplay(12, { base: 1, md: 3, lg: 4 }), {
    base: 'grid',
    md: 'grid',
    lg: 'grid',
  });
  assert.deepEqual(getFullRowSkeletonDisplay(9, { base: 1, md: 3, lg: 4 }), {
    base: 'grid',
    md: 'grid',
    lg: 'none',
  });
  assert.deepEqual(getFullRowSkeletonDisplay(7, { base: 1, md: 2, lg: 3 }), {
    base: 'grid',
    md: 'none',
    lg: 'none',
  });
});
