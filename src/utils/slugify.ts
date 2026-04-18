const CHAR_MAP: Record<string, string> = {
  à: 'a',
  á: 'a',
  ả: 'a',
  ã: 'a',
  ạ: 'a',
  ă: 'a',
  ắ: 'a',
  ặ: 'a',
  ẵ: 'a',
  ằ: 'a',
  ẳ: 'a',
  â: 'a',
  ấ: 'a',
  ầ: 'a',
  ẩ: 'a',
  ẫ: 'a',
  ậ: 'a',
  è: 'e',
  é: 'e',
  ẻ: 'e',
  ẽ: 'e',
  ẹ: 'e',
  ê: 'e',
  ế: 'e',
  ề: 'e',
  ể: 'e',
  ễ: 'e',
  ệ: 'e',
  ì: 'i',
  í: 'i',
  ỉ: 'i',
  ĩ: 'i',
  ị: 'i',
  ò: 'o',
  ó: 'o',
  ỏ: 'o',
  õ: 'o',
  ọ: 'o',
  ô: 'o',
  ố: 'o',
  ồ: 'o',
  ổ: 'o',
  ỗ: 'o',
  ộ: 'o',
  ơ: 'o',
  ớ: 'o',
  ờ: 'o',
  ở: 'o',
  ỡ: 'o',
  ợ: 'o',
  ù: 'u',
  ú: 'u',
  ủ: 'u',
  ũ: 'u',
  ụ: 'u',
  ư: 'u',
  ứ: 'u',
  ừ: 'u',
  ử: 'u',
  ữ: 'u',
  ự: 'u',
  ỳ: 'y',
  ý: 'y',
  ỷ: 'y',
  ỹ: 'y',
  ỵ: 'y',
  đ: 'd',
};

/**
 * Convert a Vietnamese string to a URL-safe slug.
 * Example: "Quận Bình Thạnh" → "quan-binh-thanh"
 */
export const slugifyVi = (text: string): string =>
  text
    .toLowerCase()
    .split('')
    .map((c) => CHAR_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * Convert a district display name to a slug, stripping administrative prefixes.
 * "Quận Bình Thạnh" → "binh-thanh"
 * "Quận 1" → "quan-1" (keeps prefix for numeric districts)
 * "Huyện Bình Chánh" → "binh-chanh"
 */
export const districtToSlug = (name: string): string => {
  // Keep "quan-" prefix for purely numeric districts to avoid ambiguity
  const numberedMatch = name.match(/^(?:Quận|Huyện)\s+(\d+)$/);
  if (numberedMatch) return `quan-${numberedMatch[1]}`;

  const stripped = name
    .replace(/^Quận\s+/, '')
    .replace(/^Huyện\s+/, '')
    .replace(/^Thành phố\s+/, '')
    .replace(/^Thị xã\s+/, '');

  return slugifyVi(stripped);
};
