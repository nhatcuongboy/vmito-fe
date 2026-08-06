import { SportType } from '@/lib/api/types';

/**
 * Central sport registry. Maps are exhaustive `Record<SportType, ...>` so adding
 * a sport to the enum surfaces a type error at every place that needs updating.
 */
export const SPORT_TYPES = Object.values(SportType);

export const DEFAULT_SPORT_TYPE = SportType.BADMINTON;

export const SPORT_COLOR_PALETTE: Record<SportType, string> = {
  [SportType.BADMINTON]: 'green',
  [SportType.PICKLEBALL]: 'purple',
};

export const isSportType = (value: unknown): value is SportType =>
  typeof value === 'string' && (SPORT_TYPES as string[]).includes(value);

export const normalizeSportType = (value: unknown): SportType =>
  isSportType(value) ? value : DEFAULT_SPORT_TYPE;

/** Sports a venue offers, tolerating records saved before `sportTypes` existed. */
export const getVenueSportTypes = (venue: {
  sportType?: SportType | null;
  sportTypes?: SportType[] | null;
}): SportType[] => {
  const supported = (venue.sportTypes ?? []).filter(isSportType);
  return supported.length > 0
    ? supported
    : [normalizeSportType(venue.sportType)];
};
