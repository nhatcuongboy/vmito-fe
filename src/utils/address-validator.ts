/**
 * Utility functions for validating and extracting street addresses
 * and administrative units in Vietnam.
 */

// Regex patterns to detect administrative divisions entered into the street field
const ADMIN_KEYWORD_PATTERN =
  /(?:^|[,\s])(phường|xã|thị\s+trấn|thị\s*xã|quận|huyện|thành\s+phố|tỉnh|p\.|q\.|h\.|tx\.|tt\.|tp\.)(?:\s+|\.|\d|$)/i;

/**
 * Checks if a given street string contains administrative division markers
 * (Ward, District, Province/City) which should instead be selected via dropdowns.
 */
export function hasAdminUnitsInStreet(street: string): boolean {
  if (!street || !street.trim()) return false;
  return ADMIN_KEYWORD_PATTERN.test(street.trim());
}

/**
 * Attempts to extract the pure street address (number, road, lane, hamlet)
 * from a full address string by trimming off ward, district, and city parts.
 */
export function extractCleanStreetAddress(fullAddress: string): string {
  if (!fullAddress) return '';
  const trimmed = fullAddress.trim();

  // If separated by commas, inspect each segment
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    const streetParts: string[] = [];

    for (const part of parts) {
      if (
        ADMIN_KEYWORD_PATTERN.test(part) ||
        /^(tp|tphcm|hcm|hn|hà nội|hồ chí minh)$/i.test(part)
      ) {
        // Stop at first administrative segment
        break;
      }
      streetParts.push(part);
    }

    if (streetParts.length > 0) {
      return streetParts.join(', ').trim();
    }
  }

  // Fallback: search for the first occurrence of an admin unit indicator
  const match = trimmed.match(ADMIN_KEYWORD_PATTERN);
  if (match && match.index !== undefined) {
    const extracted = trimmed.slice(0, match.index).replace(/,\s*$/, '').trim();
    if (extracted.length > 0) {
      return extracted;
    }
  }

  return trimmed;
}
