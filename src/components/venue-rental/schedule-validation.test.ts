import assert from 'node:assert/strict';
import test from 'node:test';
import type { VenueOperatingPeriod } from '../../lib/api/types.ts';
import {
  daysWithPeriods,
  hasAnyPeriod,
  minuteToTime,
  timeToMinute,
  validateBlock,
  validatePeriods,
} from './schedule-validation.ts';

const period = (
  dayOfWeek: number,
  start: string,
  end: string
): VenueOperatingPeriod => ({
  dayOfWeek,
  startMinute: timeToMinute(start),
  endMinute: timeToMinute(end),
});

test('accepts a well-formed week', () => {
  const errors = validatePeriods([
    period(1, '08:00', '12:00'),
    period(1, '13:00', '22:00'),
    period(2, '08:00', '22:00'),
  ]);
  assert.deepEqual(errors, {});
});

test('flags end before or equal to start', () => {
  assert.equal(
    validatePeriods([period(1, '10:00', '09:00')])[0],
    'endBeforeStart'
  );
  assert.equal(
    validatePeriods([period(1, '10:00', '10:00')])[0],
    'endBeforeStart'
  );
});

test('flags times off the 30-minute grid', () => {
  assert.equal(validatePeriods([period(1, '08:15', '10:00')])[0], 'notAligned');
  assert.equal(validatePeriods([period(1, '08:00', '10:45')])[0], 'notAligned');
});

test('alignment is reported instead of ordering when both are wrong', () => {
  assert.equal(validatePeriods([period(1, '10:15', '09:15')])[0], 'notAligned');
});

test('flags both sides of an overlap on the same day', () => {
  const errors = validatePeriods([
    period(3, '08:00', '12:00'),
    period(3, '11:00', '14:00'),
  ]);
  assert.deepEqual(errors, { 0: 'overlap', 1: 'overlap' });
});

test('touching ranges do not overlap', () => {
  const errors = validatePeriods([
    period(3, '08:00', '12:00'),
    period(3, '12:00', '14:00'),
  ]);
  assert.deepEqual(errors, {});
});

test('same times on different days do not overlap', () => {
  const errors = validatePeriods([
    period(1, '08:00', '12:00'),
    period(2, '08:00', '12:00'),
  ]);
  assert.deepEqual(errors, {});
});

test('overlap detection ignores rows that are already invalid', () => {
  const errors = validatePeriods([
    period(4, '08:15', '12:00'),
    period(4, '09:00', '14:00'),
  ]);
  assert.equal(errors[0], 'notAligned');
  assert.equal(errors[1], undefined);
});

test('daysWithPeriods and hasAnyPeriod reflect the week', () => {
  assert.deepEqual([...daysWithPeriods([period(1, '08:00', '09:00')])], [1]);
  assert.equal(hasAnyPeriod([]), false);
  assert.equal(hasAnyPeriod([period(1, '08:00', '09:00')]), true);
});

test('validateBlock rejects bad ranges and missing fields', () => {
  assert.equal(
    validateBlock({ date: '2026-07-20', start: '08:00', end: '10:00' }),
    null
  );
  assert.equal(
    validateBlock({ date: '2026-07-20', start: '10:00', end: '08:00' }),
    'endBeforeStart'
  );
  assert.equal(
    validateBlock({ date: '', start: '08:00', end: '10:00' }),
    'emptyDay'
  );
});

test('minute/time helpers round-trip', () => {
  assert.equal(minuteToTime(0), '00:00');
  assert.equal(minuteToTime(1440), '24:00');
  assert.equal(timeToMinute(minuteToTime(630)), 630);
});
