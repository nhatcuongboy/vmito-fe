import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VenueCustomerType,
  VenueDayType,
  type VenuePriceBook,
  type VenuePriceRule,
} from '../../../lib/api/types.ts';
import {
  createEmptyPriceBook,
  createEmptyPriceRule,
  createPriceBookSchema,
  createPriceRuleSchema,
  minuteToTime,
  selectPriceBook,
  sortPriceRules,
  timeToMinute,
} from './pricing-utils.ts';

const translate = (key: string) => key;

const createBook = (id: string, isActive: boolean): VenuePriceBook => ({
  id,
  venueId: 'venue',
  name: id,
  currency: 'VND',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  isActive,
  priority: 0,
  rules: [],
});

const createRule = (
  id: string,
  dayType: VenueDayType,
  startMinute: number,
  customerType = VenueCustomerType.WALK_IN
): VenuePriceRule => ({
  id,
  priceBookId: 'book',
  dayType,
  daysOfWeek: [],
  startMinute,
  endMinute: startMinute + 60,
  customerType,
  pricePerHour: 100000,
  priority: 0,
});

test('selects a requested price book before the active default', () => {
  const books = [createBook('inactive', false), createBook('active', true)];
  assert.equal(selectPriceBook(books, 'inactive')?.id, 'inactive');
  assert.equal(selectPriceBook(books, 'missing')?.id, 'active');
});

test('selects the first active price book in API order', () => {
  const books = [
    createBook('inactive', false),
    createBook('active-1', true),
    createBook('active-2', true),
  ];
  assert.equal(selectPriceBook(books, null)?.id, 'active-1');
});

test('sorts rates by day scope and start time without mutating input', () => {
  const rules = [
    createRule('weekend', VenueDayType.WEEKEND, 360),
    createRule('late', VenueDayType.WEEKDAY, 960),
    createRule('early', VenueDayType.WEEKDAY, 360),
  ];
  const sorted = sortPriceRules(rules);
  assert.deepEqual(
    sorted.map((rule) => rule.id),
    ['early', 'late', 'weekend']
  );
  assert.equal(rules[0].id, 'weekend');
});

test('converts midnight boundary between minutes and time', () => {
  assert.equal(minuteToTime(1440), '24:00');
  assert.equal(timeToMinute('24:00'), 1440);
  assert.equal(timeToMinute('06:30'), 390);
});

test('requires weekdays for a selected-weekday rate', () => {
  const schema = createPriceRuleSchema(translate);
  const result = schema.safeParse({
    ...createEmptyPriceRule(),
    dayType: VenueDayType.WEEKDAY,
    pricePerHour: 100000,
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some((issue) => issue.path[0] === 'daysOfWeek'),
      true
    );
  }
});

test('requires a specific date and rejects an inverted time range', () => {
  const schema = createPriceRuleSchema(translate);
  const result = schema.safeParse({
    ...createEmptyPriceRule(),
    dayType: VenueDayType.SPECIFIC_DATE,
    startTime: '10:00',
    endTime: '09:00',
    pricePerHour: 100000,
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path[0]);
    assert.equal(paths.includes('specificDate'), true);
    assert.equal(paths.includes('endTime'), true);
  }
});

test('rejects an inverted price-book effective range', () => {
  const schema = createPriceBookSchema(translate);
  const result = schema.safeParse({
    ...createEmptyPriceBook(),
    name: 'Summer pricing',
    effectiveFrom: '2026-08-31',
    effectiveTo: '2026-08-01',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some((issue) => issue.path[0] === 'effectiveTo'),
      true
    );
  }
});

test('rejects a non-positive hourly price', () => {
  const schema = createPriceRuleSchema(translate);
  const result = schema.safeParse({
    ...createEmptyPriceRule(),
    pricePerHour: 0,
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some((issue) => issue.path[0] === 'pricePerHour'),
      true
    );
  }
});
