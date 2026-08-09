import assert from 'node:assert/strict';
import test from 'node:test';
import { SportType } from '@/lib/api/types';
import { classFormSchema } from './classFormSchema';

const baseForm = {
  name: 'Lớp cầu lông cơ bản',
  description: '',
  sportType: SportType.BADMINTON,
  contactName: 'Huấn luyện viên A',
  contactPhone: '0900000000',
  zaloUrl: '',
  locationType: 'VENUE' as const,
  selectedVenueId: 'venue-1',
  customLocationName: '',
  customLocationAddress: '',
  customLocationPlaceId: '',
  customLocationLat: undefined,
  customLocationLng: undefined,
  customLocationDistrict: '',
  customLocationCity: '',
  startDate: '2026-08-01',
  endDate: '2026-09-01',
  capacity: 12,
  tuitionPeriod: 'CONTACT' as const,
  tuitionAmount: undefined,
  tuitionNotes: '',
  requiredLevels: [],
  allLevelsSelected: true,
  schedules: [
    { dayOfWeek: 1, startTime: '18:00', endTime: '19:30', isActive: true },
  ],
};

test('accepts a Vmito venue and contact tuition', () => {
  assert.equal(classFormSchema.safeParse(baseForm).success, true);
});

test('accepts a custom location selected from autocomplete', () => {
  const result = classFormSchema.safeParse({
    ...baseForm,
    locationType: 'CUSTOM',
    selectedVenueId: '',
    customLocationName: 'Nhà thi đấu Quận 7',
    customLocationAddress: '123 Nguyễn Văn Linh',
    customLocationPlaceId: 'place-1',
    customLocationLat: 10.73,
    customLocationLng: 106.72,
    customLocationDistrict: 'Quận 7',
    customLocationCity: 'Hồ Chí Minh',
  });
  assert.equal(result.success, true);
});

test('rejects invalid schedule, date range, and missing non-contact tuition', () => {
  const result = classFormSchema.safeParse({
    ...baseForm,
    endDate: '2026-07-01',
    tuitionPeriod: 'MONTHLY',
    tuitionAmount: undefined,
    schedules: [
      { dayOfWeek: 1, startTime: '20:00', endTime: '19:30', isActive: true },
    ],
  });
  assert.equal(result.success, false);
});
