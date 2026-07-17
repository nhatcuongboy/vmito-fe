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
  { key: 'hourlyRateFixed' },
  { key: 'hourlyRateWalkIn' },
  { key: 'phone' },
  { key: 'website' },
  { key: 'locatedWithin' },
  { key: 'bookingPolicy' },
  { key: 'description' },
  { key: 'note' },
];

export const formatVenueRequestValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'number')
    return new Intl.NumberFormat('vi-VN').format(value);
  return String(value);
};
