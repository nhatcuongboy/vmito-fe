import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getVietnamDateKey,
  isTournamentExpired,
  isTournamentOverdue,
} from './date.ts';

test('uses the Vietnam calendar day at the UTC boundary', () => {
  assert.equal(
    getVietnamDateKey(new Date('2026-09-06T17:00:00.000Z')),
    '2026-09-07'
  );
});

test('keeps a tournament current through its final Vietnam day', () => {
  const endDate = '2026-09-07T00:00:00.000Z';

  assert.equal(
    isTournamentExpired(endDate, new Date('2026-09-07T16:59:59.999Z')),
    false
  );
  assert.equal(
    isTournamentExpired(endDate, new Date('2026-09-07T17:00:00.000Z')),
    true
  );
});

test('only marks expired in-progress tournaments as overdue', () => {
  const now = new Date('2026-09-07T17:00:00.000Z');
  const endDate = new Date('2026-09-07T00:00:00.000Z');

  assert.equal(
    isTournamentOverdue({ status: 'IN_PROGRESS', endDate }, now),
    true
  );
  assert.equal(
    isTournamentOverdue({ status: 'PREPARING', endDate }, now),
    false
  );
});
