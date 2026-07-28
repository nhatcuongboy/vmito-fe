import assert from 'node:assert/strict';
import test from 'node:test';

import { ISession, SessionLocationType, SessionStatus } from '@/lib/api/types';
import { buildSessionFormDefaults } from './sessionFormDefaults';

const baseSession = {
  id: 'session-1',
  name: 'Kèo tối',
  hostId: 'host-1',
  host: { id: 'host-1', name: 'Host', email: 'host@example.com' },
  numberOfCourts: 1,
  sessionDuration: 120,
  maxPlayersPerCourt: 8,
  requirePlayerInfo: false,
  status: SessionStatus.PREPARING,
  createdAt: new Date('2026-07-28T10:00:00Z'),
  updatedAt: new Date('2026-07-28T10:00:00Z'),
  startTime: new Date('2026-08-01T11:00:00Z'),
  endTime: new Date('2026-08-01T13:00:00Z'),
  courts: [],
} as ISession;

test('hydrates every custom location field when editing a session', () => {
  const defaults = buildSessionFormDefaults({
    isEditMode: true,
    initialData: {
      ...baseSession,
      location: 'Tên cũ tương thích',
      customLocationName: 'Sân ABC',
      customLocationAddress: '123 Nguyễn Trãi',
      customLocationPlaceId: 'place-1',
      customLocationLat: 10.75,
      customLocationLng: 106.67,
      customLocationDistrict: 'Quận 1',
      customLocationCity: 'Hồ Chí Minh',
    },
  });

  assert.equal(defaults.locationType, SessionLocationType.CUSTOM);
  assert.equal(defaults.selectedVenueId, '');
  assert.equal(defaults.customLocation, 'Sân ABC');
  assert.equal(defaults.customLocationAddress, '123 Nguyễn Trãi');
  assert.equal(defaults.customLocationPlaceId, 'place-1');
  assert.equal(defaults.customLocationLat, 10.75);
  assert.equal(defaults.customLocationLng, 106.67);
  assert.equal(defaults.customLocationDistrict, 'Quận 1');
  assert.equal(defaults.customLocationCity, 'Hồ Chí Minh');
});

test('hydrates legacy custom sessions from location when snapshot is absent', () => {
  const defaults = buildSessionFormDefaults({
    isEditMode: true,
    initialData: { ...baseSession, location: 'Sân legacy' },
  });

  assert.equal(defaults.locationType, SessionLocationType.CUSTOM);
  assert.equal(defaults.customLocation, 'Sân legacy');
  assert.equal(defaults.customLocationAddress, '');
});

test('hydrates a linked venue without leaking stale custom fields', () => {
  const defaults = buildSessionFormDefaults({
    isEditMode: true,
    initialData: {
      ...baseSession,
      customLocationName: 'Dữ liệu cũ',
      customLocationAddress: 'Địa chỉ cũ',
      venue: {
        id: 'venue-1',
        name: 'Sân chính thức',
        address: '456 Lê Lợi',
      } as ISession['venue'],
    },
  });

  assert.equal(defaults.locationType, SessionLocationType.VENUE);
  assert.equal(defaults.selectedVenueId, 'venue-1');
  assert.equal(defaults.customLocation, '');
  assert.equal(defaults.customLocationAddress, '');
  assert.equal(defaults.customLocationLat, undefined);
});
