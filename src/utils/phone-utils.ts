/**
 * Trims whitespace from a phone number.
 * @param phone The phone number string to trim.
 * @returns The trimmed phone number (replaces all whitespace with empty string), or an empty string if input is null/undefined.
 */
export const trimPhone = (phone?: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\s+/g, '').trim();
};

/**
 * Normalizes a phone number for Zalo links (e.g., replaces leading 0 with 84).
 * @param phone The phone number string.
 * @returns Normalized phone number for Zalo.
 */
export const normalizePhoneForZalo = (phone?: string | null): string => {
  const trimmed = trimPhone(phone);
  if (!trimmed) return '';
  return trimmed.replace(/^0/, '84').replace(/\s+/g, '');
};

/**
 * Normalizes a phone number for tel: links (removes spaces).
 * @param phone The phone number string.
 * @returns Normalized phone number for tel:.
 */
export const normalizePhoneForTel = (phone?: string | null): string => {
  const trimmed = trimPhone(phone);
  if (!trimmed) return '';
  return trimmed.replace(/\s+/g, '');
};
