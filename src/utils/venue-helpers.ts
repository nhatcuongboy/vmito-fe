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
