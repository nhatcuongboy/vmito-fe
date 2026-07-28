import type { ISession } from '@/lib/api/types';
import { getGoogleMapsUrl } from './venue-helpers';

export const getSessionLocationName = (session: ISession): string =>
  session.venue?.name ||
  session.customLocationName ||
  (!session.venue ? session.location : '') ||
  '';

export const getSessionLocationAddress = (
  session: ISession
): string | undefined =>
  session.venue?.address || session.customLocationAddress || undefined;

export const getSessionLocationMapUrl = (
  session: ISession,
  venueDisplayName?: string
): string => {
  if (session.venue) {
    return getGoogleMapsUrl({
      address: session.venue.address,
      name: venueDisplayName || session.venue.name,
      placeId: session.venue.placeId,
      lat: session.venue.lat,
      lng: session.venue.lng,
    });
  }

  if (
    !session.customLocationAddress &&
    !session.customLocationPlaceId &&
    (session.customLocationLat == null || session.customLocationLng == null)
  ) {
    return '';
  }

  return getGoogleMapsUrl({
    address: session.customLocationAddress,
    name: session.customLocationName || session.location,
    placeId: session.customLocationPlaceId,
    lat: session.customLocationLat,
    lng: session.customLocationLng,
  });
};
