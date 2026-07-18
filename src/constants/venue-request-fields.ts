import { Venue, VenueRequestPayload } from '@/lib/api/types';

export const VENUE_REQUEST_FIELDS: Array<{
  key: keyof VenueRequestPayload;
  venueKey?: keyof Venue;
}> = [
  { key: 'name' },
  { key: 'address' },
  { key: 'city' },
  { key: 'district' },
  { key: 'numberOfCourts' },
  { key: 'openingHours' },
  { key: 'phone' },
  { key: 'website' },
  { key: 'locatedWithin' },
  { key: 'bookingPolicy' },
  { key: 'wifiName' },
  { key: 'wifiPassword' },
  { key: 'closureStatus' },
  { key: 'description' },
  { key: 'note' },
];

const CLOSURE_STATUS_LABELS: Record<string, string> = {
  OPERATING: 'Đang hoạt động',
  TEMPORARILY_CLOSED: 'Tạm đóng cửa',
  PERMANENTLY_CLOSED: 'Đóng cửa vĩnh viễn',
};

export const formatVenueRequestValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'number')
    return new Intl.NumberFormat('vi-VN').format(value);
  if (typeof value === 'string' && value in CLOSURE_STATUS_LABELS) {
    return CLOSURE_STATUS_LABELS[value];
  }
  return String(value);
};
