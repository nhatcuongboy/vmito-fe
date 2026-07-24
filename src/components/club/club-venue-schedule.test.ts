import assert from 'node:assert/strict';
import test from 'node:test';
import type { ClubVenueGroupDraft } from './club-venue-schedule.ts';
import {
  createClubScheduleDraft,
  createClubVenueGroupDraft,
  validateClubVenueSchedule,
} from './club-venue-schedule.ts';

const venueGroup = (
  venueId: string,
  schedules: Array<{
    dayOfWeek?: number;
    startTime: string;
    endTime: string;
  }> = []
): ClubVenueGroupDraft =>
  createClubVenueGroupDraft(
    { venueId },
    schedules.map((schedule) => createClubScheduleDraft(schedule))
  );

test('starts a new venue without a schedule', () => {
  assert.deepEqual(createClubVenueGroupDraft().schedules, []);
});

test('uses the suggested values when a schedule is explicitly added', () => {
  const schedule = createClubScheduleDraft();

  assert.equal(schedule.dayOfWeek, 1);
  assert.equal(schedule.startTime, '19:00');
  assert.equal(schedule.endTime, '21:00');
});

test('allows an empty venue section', () => {
  assert.equal(validateClubVenueSchedule([]).isValid, true);
});

test('requires a venue for an added group', () => {
  const group = venueGroup('');
  const result = validateClubVenueSchedule([group]);

  assert.equal(result.isValid, false);
  assert.equal(result.venueErrors[group.id], 'venueRequired');
});

test('rejects duplicate venues', () => {
  const first = venueGroup('venue-1');
  const second = venueGroup('venue-1');
  const result = validateClubVenueSchedule([first, second]);

  assert.equal(result.venueErrors[first.id], 'duplicateVenue');
  assert.equal(result.venueErrors[second.id], 'duplicateVenue');
});

test('rejects an end time that is not after the start time', () => {
  const group = venueGroup('venue-1', [
    { startTime: '21:00', endTime: '19:00' },
  ]);
  const result = validateClubVenueSchedule([group]);

  assert.equal(result.scheduleErrors[group.schedules[0].id], 'endBeforeStart');
});

test('rejects overlapping schedules for the same venue and day', () => {
  const group = venueGroup('venue-1', [
    { startTime: '19:00', endTime: '21:00' },
    { startTime: '20:30', endTime: '22:00' },
  ]);
  const result = validateClubVenueSchedule([group]);

  assert.equal(result.scheduleErrors[group.schedules[0].id], 'overlap');
  assert.equal(result.scheduleErrors[group.schedules[1].id], 'overlap');
});

test('allows adjacent schedules', () => {
  const group = venueGroup('venue-1', [
    { startTime: '19:00', endTime: '20:00' },
    { startTime: '20:00', endTime: '21:00' },
  ]);

  assert.equal(validateClubVenueSchedule([group]).isValid, true);
});

test('does not compare schedules from different days or venues', () => {
  const firstVenue = venueGroup('venue-1', [
    { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
    { dayOfWeek: 2, startTime: '19:00', endTime: '21:00' },
  ]);
  const secondVenue = venueGroup('venue-2', [
    { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
  ]);

  assert.equal(
    validateClubVenueSchedule([firstVenue, secondVenue]).isValid,
    true
  );
});
