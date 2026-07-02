const CLOUDINARY_HOST = 'res.cloudinary.com';

export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname === CLOUDINARY_HOST &&
      parsedUrl.protocol === 'http:'
    ) {
      parsedUrl.protocol = 'https:';
      return parsedUrl.toString();
    }

    return url;
  } catch {
    return url;
  }
}
