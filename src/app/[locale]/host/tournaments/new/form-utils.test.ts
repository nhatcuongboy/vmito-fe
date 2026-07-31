import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTournamentFormSchema,
  formatDateForLocale,
  getLocalDateInputValue,
  toCreateTournamentPayload,
} from './form-utils.ts';

const messages = {
  nameRequired: 'nameRequired',
  startDateRequired: 'startDateRequired',
  endDateRequired: 'endDateRequired',
  startDatePast: 'startDatePast',
  endBeforeStart: 'endBeforeStart',
};

const schema = createTournamentFormSchema(messages, '2026-07-30');
const validForm = {
  name: 'Giải mùa hè',
  sportType: 'BADMINTON' as const,
  startDate: '2026-07-30',
  endDate: '2026-07-31',
  locationQuery: '',
  location: null,
};

test('formats local dates for native date inputs', () => {
  assert.equal(getLocalDateInputValue(new Date(2026, 6, 3)), '2026-07-03');
});

test('formats selected dates for the active app locale', () => {
  assert.equal(formatDateForLocale('2026-07-03', 'vi-VN'), '03/07/2026');
  assert.equal(formatDateForLocale('2026-07-03', 'en-US'), '07/03/2026');
});

test('accepts a valid tournament form', () => {
  assert.equal(schema.safeParse(validForm).success, true);
});

test('rejects a blank tournament name', () => {
  const result = schema.safeParse({ ...validForm, name: '   ' });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0]?.path[0], 'name');
  }
});

test('requires both tournament dates', () => {
  const result = schema.safeParse({
    ...validForm,
    startDate: '',
    endDate: '',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path[0]);
    assert.equal(paths.includes('startDate'), true);
    assert.equal(paths.includes('endDate'), true);
  }
});

test('rejects a start date in the past', () => {
  const result = schema.safeParse({
    ...validForm,
    startDate: '2026-07-29',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === 'startDate' && issue.message === 'startDatePast'
      ),
      true
    );
  }
});

test('rejects an end date before the start date', () => {
  const result = schema.safeParse({
    ...validForm,
    endDate: '2026-07-29',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === 'endDate' && issue.message === 'endBeforeStart'
      ),
      true
    );
  }
});

test('trims text and keeps the selected structured location', () => {
  const payload = toCreateTournamentPayload({
    ...validForm,
    name: '  Giải mùa hè  ',
    locationQuery: 'Sân A, Quận 1',
    location: {
      placeId: 'place-1',
      name: 'Sân A',
      address: 'Sân A, Quận 1',
      lat: 10.7,
      lng: 106.6,
    },
  });

  assert.equal(payload.name, 'Giải mùa hè');
  assert.equal(payload.location?.placeId, 'place-1');
  assert.equal(payload.startDate.toISOString(), '2026-07-30T00:00:00.000Z');
});

test('uses manually entered location text when no suggestion is selected', () => {
  const payload = toCreateTournamentPayload({
    ...validForm,
    locationQuery: '  Nhà thi đấu phường 1  ',
  });

  assert.deepEqual(payload.location, {
    name: 'Nhà thi đấu phường 1',
    address: 'Nhà thi đấu phường 1',
  });
});
