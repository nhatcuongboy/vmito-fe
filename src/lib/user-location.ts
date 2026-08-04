export interface UserLocation {
  lat: number;
  lng: number;
}

export const USER_LOCATION_COOKIE = 'user-location';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const COORDINATE_PRECISION = 3;

export function roundCoord(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

export function normalizeUserLocation(location: UserLocation): UserLocation {
  return {
    lat: roundCoord(location.lat),
    lng: roundCoord(location.lng),
  };
}

export function parseUserLocationCookie(
  raw: string | null | undefined
): UserLocation | null {
  if (!raw) return null;

  const [rawLat, rawLng] = raw.split(',');
  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return normalizeUserLocation({ lat, lng });
}

export function readUserLocationCookie(): UserLocation | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${USER_LOCATION_COOKIE}=([^;]*)`)
  );
  return parseUserLocationCookie(
    match ? decodeURIComponent(match[1]) : undefined
  );
}

export function writeUserLocationCookie(location: UserLocation): void {
  if (typeof document === 'undefined') return;

  const normalizedLocation = normalizeUserLocation(location);
  document.cookie =
    `${USER_LOCATION_COOKIE}=${encodeURIComponent(locationKey(normalizedLocation))}; ` +
    `path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearUserLocationCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${USER_LOCATION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function locationKey(location: UserLocation | null): string {
  return location
    ? `${location.lat.toFixed(COORDINATE_PRECISION)},${location.lng.toFixed(COORDINATE_PRECISION)}`
    : '';
}
