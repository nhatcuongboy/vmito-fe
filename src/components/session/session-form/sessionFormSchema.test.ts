import assert from 'node:assert/strict';
import test from 'node:test';

import { CourtDirection, SessionLocationType } from '@/lib/api/types';
import { createSessionFormSchema } from './sessionFormSchema';

const t = (key: string) => key;
const schema = createSessionFormSchema(t);
const baseForm = {
  name: 'Kèo tối thứ ba',
  locationType: SessionLocationType.VENUE,
  selectedVenueId: 'venue-1',
  customLocation: '',
  customLocationAddress: '',
  customLocationPlaceId: '',
  customLocationLat: undefined,
  customLocationLng: undefined,
  customLocationDistrict: '',
  customLocationCity: '',
  clubId: '',
  hostName: 'Host',
  hostPhone: '',
  startTime: '2099-01-01T18:00',
  endTime: '2099-01-01T20:00',
  courts: [
    {
      courtNumber: 1,
      courtName: '',
      direction: CourtDirection.HORIZONTAL,
    },
  ],
  courtColor: '#179a3b',
  maxPlayersPerCourt: 8,
  description: '',
  referenceVideoUrl: '',
  requirePlayerInfo: false,
  allowGuestJoin: true,
  allowNewPlayers: true,
  allowZaloContact: false,
  allLevelsSelected: true,
  requiredLevels: [],
  shuttlecock: '',
  defaultMatchType: 'DOUBLES' as const,
};

test('accepts an existing venue selection', () => {
  assert.equal(schema.safeParse(baseForm).success, true);
});

test('accepts and trims a custom location', () => {
  const result = schema.safeParse({
    ...baseForm,
    locationType: SessionLocationType.CUSTOM,
    selectedVenueId: '',
    customLocation: '  Sân nội bộ ABC  ',
  });

  assert.equal(result.success, true);
  if (result.success)
    assert.equal(result.data.customLocation, 'Sân nội bộ ABC');
});

test('requires a venue id in venue mode', () => {
  const result = schema.safeParse({ ...baseForm, selectedVenueId: '' });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'selectedVenueId'
      ),
      true
    );
  }
});

test('requires at least two characters in custom mode', () => {
  const result = schema.safeParse({
    ...baseForm,
    locationType: SessionLocationType.CUSTOM,
    selectedVenueId: '',
    customLocation: ' ',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'customLocation'
      ),
      true
    );
  }
});

test('accepts a custom location with an optional address snapshot', () => {
  const result = schema.safeParse({
    ...baseForm,
    locationType: SessionLocationType.CUSTOM,
    selectedVenueId: '',
    customLocation: 'Sân nội bộ ABC',
    customLocationAddress: '123 Nguyễn Trãi',
    customLocationPlaceId: 'place-1',
    customLocationLat: 10.75,
    customLocationLng: 106.67,
    customLocationDistrict: 'Quận 1',
    customLocationCity: 'Hồ Chí Minh',
  });

  assert.equal(result.success, true);
});
