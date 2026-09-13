import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendVenuePage,
  venueQueryKey,
  VenueRequestCoordinator,
  type VenueBrowseQuery,
} from './venue-browse.ts';
import type { SearchVenueResponse } from './api/types.ts';

const query: VenueBrowseQuery = {
  closureStatus: 'OPERATING',
  sortBy: 'distance',
  sortOrder: 'asc',
  limit: 12,
  lat: 10,
  lng: 106,
};
test('query identity includes every result-changing field', () => {
  for (const change of [
    { keyword: 'x' },
    { city: 'HCM' },
    { district: 'D1' },
    { favoriteOnly: true },
    { lat: 11 },
    { lng: 107 },
    { limit: 500 },
    { sortBy: 'name' },
    { sortOrder: 'desc' },
    { sportType: ['BADMINTON'] },
  ]) {
    assert.notEqual(
      venueQueryKey(query),
      venueQueryKey({ ...query, ...change } as VenueBrowseQuery)
    );
  }
  assert.equal(
    venueQueryKey({ ...query, city: 'HN,HCM' }),
    venueQueryKey({ ...query, city: 'HCM,HN' })
  );
});
test('initial and next-page requests share a lock; superseded work cannot commit', () => {
  const lane = new VenueRequestCoordinator();
  lane.reset('a');
  const first = lane.begin('a', 1)!;
  assert.equal(lane.begin('a', 2), null);
  lane.reset('b');
  assert.equal(first.controller.signal.aborted, true);
  const next = lane.begin('b', 1)!;
  assert.equal(lane.finish(first), false);
  assert.equal(lane.isCurrent(next), true);
  assert.equal(lane.finish(next), true);
  assert.ok(lane.begin('b', 2));
});
test('failed request can retry the same page and duplicate venues are excluded', () => {
  const lane = new VenueRequestCoordinator();
  lane.reset('a');
  lane.finish(lane.begin('a', 2)!);
  assert.ok(lane.begin('a', 2));
  const page = (ids: string[], number: number) =>
    ({
      data: ids.map((id) => ({ id })),
      pagination: { page: number, limit: 12, total: 3, totalPages: 2 },
    }) as SearchVenueResponse;
  const merged = appendVenuePage(page(['a'], 1), page(['a', 'b', 'b', 'c'], 2));
  assert.deepEqual(
    merged.data.map((v) => v.id),
    ['a', 'b', 'c']
  );
  assert.equal(merged.pagination.page, 2);
});
