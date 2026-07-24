import { Tournament, TournamentVenue, Venue } from '@/lib/api/types';

// Check if name already has a prefix/suffix indicating it's a venue
const hasVenueNameAffix = (name: string): boolean => {
  const lowerName = name.toLowerCase();

  // Vietnamese prefixes
  const hasViPrefix =
    lowerName.startsWith('sân ') ||
    lowerName.startsWith('sân.') ||
    lowerName.startsWith('clb ') ||
    lowerName.startsWith('câu lạc bộ ') ||
    lowerName.startsWith('câu lạc bộ\n');

  // English suffixes
  const hasEnSuffix =
    lowerName.endsWith(' court') || lowerName.endsWith(' club');

  // Chinese suffixes
  const hasCnSuffix = lowerName.endsWith('场') || lowerName.endsWith('俱乐部');

  return hasViPrefix || hasEnSuffix || hasCnSuffix;
};

export const formatVenueName = (
  name: string,
  formatPattern: string
): string => {
  if (!name) return name;

  if (hasVenueNameAffix(name)) {
    return name;
  }

  // Format using the provided pattern
  return formatPattern.replace('{name}', name);
};

/**
 * Format the full venue name with the sport-specific prefix/suffix
 * (e.g. vi "Sân cầu lông {name}", en "{name} Badminton Court").
 * Used on the venue detail page and its SEO metadata so the page title
 * and the search-engine title always match.
 */
export const formatVenueFullName = (
  name: string,
  formatPattern: string
): string => formatVenueName(name, formatPattern);

const WARD_PATTERNS = [
  /(?:,\s*)(Phường\s+[^,]+)/i,
  /(?:,\s*)(Xã\s+[^,]+)/i,
  /(?:,\s*)(Thị\s+[Tt]rấn\s+[^,]+)/i,
  /^(Phường\s+[^,]+)/i,
  /^(Xã\s+[^,]+)/i,
];

/**
 * Best-effort client-side mirror of AddressMappingService's ward detection,
 * used only to live-preview the composed new-format address as the admin
 * types — the server is the source of truth and re-derives streetAddress on
 * save, so a mismatch here is cosmetic, never a data-integrity issue.
 */
export const guessStreetAddress = (address?: string): string => {
  if (!address) return '';
  let ward: string | null = null;
  for (const pattern of WARD_PATTERNS) {
    const match = address.match(pattern);
    if (match) {
      ward = match[1].trim();
      break;
    }
  }
  if (!ward) return address.trim();
  const idx = address.lastIndexOf(ward);
  return address.slice(0, idx).replace(/,\s*$/, '').trim();
};

/**
 * Compose the new-era (post Nghị quyết 60) full address for preview —
 * street + Phường/Xã mới + Tỉnh/Thành phố mới. This mirrors the derivation
 * VenuesService performs server-side (AddressMappingService.resolve); the
 * server is the source of truth for the persisted `newAddress`, this is only
 * for showing admins a live preview while they pick the dropdown values.
 */
export const composeNewAddress = (
  streetAddress?: string,
  newDistrict?: string,
  newCity?: string
): string => [streetAddress, newDistrict, newCity].filter(Boolean).join(', ');

/**
 * Uniform venue display shape for tournaments, resolved from either a linked
 * Venue record or a TournamentVenue's inline address fields.
 */
export interface VenueDisplay {
  name?: string;
  acronym?: string;
  placeId?: string;
  address?: string;
  district?: string;
  city?: string;
  newAddress?: string;
  newDistrict?: string;
  newCity?: string;
  lat?: number;
  lng?: number;
  coverPhoto?: string;
  images?: string[];
  isVerified?: boolean;
  /** Set only when backed by a directory Venue record. */
  venueId?: string;
}

const mapVenue = (venue: Venue): VenueDisplay => ({
  name: venue.name,
  acronym: venue.acronym,
  placeId: venue.placeId,
  address: venue.address,
  district: venue.district,
  city: venue.city,
  newAddress: venue.newAddress,
  newDistrict: venue.newDistrict,
  newCity: venue.newCity,
  lat: venue.lat,
  lng: venue.lng,
  coverPhoto: venue.coverPhoto,
  images: venue.images,
  isVerified: venue.isVerified,
  venueId: venue.id,
});

/**
 * Display info for one TournamentVenue row: linked Venue fields win, inline
 * address fields fill in for address-only rows. Photos and newCity only exist
 * on directory venues.
 */
export const getTournamentVenueDisplay = (
  tv: TournamentVenue
): VenueDisplay => ({
  name: tv.venue?.name ?? tv.name,
  acronym: tv.venue?.acronym ?? tv.acronym,
  placeId: tv.venue?.placeId ?? tv.placeId,
  address: tv.venue?.address ?? tv.address,
  district: tv.venue?.district ?? tv.district,
  city: tv.venue?.city ?? tv.city,
  newAddress: tv.venue?.newAddress,
  newDistrict: tv.venue?.newDistrict,
  newCity: tv.venue?.newCity,
  lat: tv.venue?.lat ?? tv.lat,
  lng: tv.venue?.lng ?? tv.lng,
  coverPhoto: tv.venue?.coverPhoto,
  images: tv.venue?.images,
  isVerified: tv.venue?.isVerified,
  venueId: tv.venueId ?? tv.venue?.id,
});

/**
 * The tournament's primary venue for display: the denormalized primary
 * pointer (tournament.venue) when set, otherwise the first TournamentVenue
 * (which may be inline/address-only). Null when the tournament has no venue.
 */
export const getPrimaryVenueDisplay = (
  tournament: Pick<Tournament, 'venue' | 'tournamentVenues'>
): VenueDisplay | null => {
  if (tournament.venue) return mapVenue(tournament.venue);
  const first = tournament.tournamentVenues?.[0];
  return first ? getTournamentVenueDisplay(first) : null;
};

export interface MapUrlOptions {
  address?: string | null;
  name?: string | null;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export const getGoogleMapsUrl = ({
  address,
  name,
  placeId,
  lat,
  lng,
}: MapUrlOptions): string => {
  const query = encodeURIComponent(address || name || '');

  if (placeId && query) {
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${placeId}`;
  }

  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  return '';
};
