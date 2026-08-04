import { locationKey, type UserLocation } from '@/lib/user-location';

interface BrowseSeedQuery {
  city?: string | null;
  sortBy: string;
  sortOrder: string;
  location: UserLocation | null;
}

export function buildBrowseSeedKey({
  city,
  sortBy,
  sortOrder,
  location,
}: BrowseSeedQuery): string {
  return [
    'v1',
    `city=${city ?? ''}`,
    `sort=${sortBy}:${sortOrder}`,
    `location=${locationKey(location)}`,
  ].join('|');
}
