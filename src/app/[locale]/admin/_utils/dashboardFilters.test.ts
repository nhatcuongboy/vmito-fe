import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDashboardGranularity,
  resolveDashboardDateRange,
  toDashboardQueryParams,
} from './dashboardFilters.ts';

const NOW = new Date('2026-07-31T08:30:00.000Z');

test('resolves preset ranges inclusively through the current UTC day', () => {
  const sevenDays = resolveDashboardDateRange(
    { period: '7d', from: '', to: '' },
    NOW
  );
  const thirtyDays = resolveDashboardDateRange(
    { period: '30d', from: '', to: '' },
    NOW
  );
  const ninetyDays = resolveDashboardDateRange(
    { period: '90d', from: '', to: '' },
    NOW
  );

  assert.equal(sevenDays?.from.toISOString(), '2026-07-25T00:00:00.000Z');
  assert.equal(thirtyDays?.from.toISOString(), '2026-07-02T00:00:00.000Z');
  assert.equal(ninetyDays?.from.toISOString(), '2026-05-03T00:00:00.000Z');
  assert.equal(sevenDays?.to.toISOString(), '2026-07-31T23:59:59.999Z');
});

test('resolves a valid custom range and serializes its API query', () => {
  const range = resolveDashboardDateRange({
    period: 'custom',
    from: '2026-01-01',
    to: '2026-03-01',
  });

  assert.ok(range);
  assert.equal(range.days, 60);
  assert.deepEqual(toDashboardQueryParams(range), {
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-03-01T23:59:59.999Z',
    granularity: 'week',
  });
});

test('rejects incomplete, inverted, and overlong custom ranges', () => {
  assert.equal(
    resolveDashboardDateRange({ period: 'custom', from: '', to: '' }),
    null
  );
  assert.equal(
    resolveDashboardDateRange({
      period: 'custom',
      from: '2026-02-02',
      to: '2026-02-01',
    }),
    null
  );
  assert.equal(
    resolveDashboardDateRange({
      period: 'custom',
      from: '2025-01-01',
      to: '2026-01-01',
    }),
    null
  );
});

test('selects granularity at the dashboard thresholds', () => {
  assert.equal(getDashboardGranularity(31), 'day');
  assert.equal(getDashboardGranularity(32), 'week');
  assert.equal(getDashboardGranularity(180), 'week');
  assert.equal(getDashboardGranularity(181), 'month');
});
