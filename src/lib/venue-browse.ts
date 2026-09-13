import type { SearchVenueResponse, SportType } from './api/types';
import type { UserLocation } from './user-location';

export interface VenueBrowseQuery {
  keyword?: string;
  city?: string;
  district?: string;
  sportType?: SportType[];
  closureStatus: 'OPERATING';
  favoriteOnly?: boolean;
  lat?: number;
  lng?: number;
  sortBy: string;
  sortOrder: string;
  limit: number;
}

export interface VenueBrowseSeed {
  queryKey: string;
  result: SearchVenueResponse;
  location: UserLocation;
}

/** The complete API query, excluding only the requested page. */
export function venueQueryKey(query: VenueBrowseQuery): string {
  return JSON.stringify({
    keyword: query.keyword || '',
    city: (query.city || '').split(',').filter(Boolean).sort(),
    district: (query.district || '').split(',').filter(Boolean).sort(),
    sports: [...(query.sportType || [])].sort(),
    closureStatus: query.closureStatus,
    favoriteOnly: !!query.favoriteOnly,
    lat: query.lat ?? null,
    lng: query.lng ?? null,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    limit: query.limit,
  });
}

export interface VenueRequest {
  key: string;
  page: number;
  controller: AbortController;
}

/** A single lane for initial loads, auth refreshes and subsequent pages. */
export class VenueRequestCoordinator {
  private key = '';
  private active: VenueRequest | null = null;

  reset(key: string) {
    this.active?.controller.abort();
    this.active = null;
    this.key = key;
  }

  begin(key: string, page: number): VenueRequest | null {
    if (key !== this.key || this.active) return null;
    const request = { key, page, controller: new AbortController() };
    this.active = request;
    return request;
  }

  isCurrent(request: VenueRequest) {
    return this.active === request && this.key === request.key;
  }

  finish(request: VenueRequest) {
    if (!this.isCurrent(request)) return false;
    this.active = null;
    return true;
  }
}

export function appendVenuePage(
  previous: SearchVenueResponse,
  next: SearchVenueResponse
): SearchVenueResponse {
  const ids = new Set(previous.data.map((venue) => venue.id));
  return {
    ...next,
    data: [
      ...previous.data,
      ...next.data.filter((venue) => {
        if (ids.has(venue.id)) return false;
        ids.add(venue.id);
        return true;
      }),
    ],
  };
}
