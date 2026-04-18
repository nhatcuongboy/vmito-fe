export const formatVenueName = (
  name: string,
  formatPattern: string
): string => {
  if (!name) return name;

  // Check if name already has a prefix/suffix indicating it's a venue
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

  if (hasViPrefix || hasEnSuffix || hasCnSuffix) {
    return name;
  }

  // Format using the provided pattern
  return formatPattern.replace('{name}', name);
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
