const CLOUDINARY_HOST = 'res.cloudinary.com';
const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';

export function normalizeImageUrl(
  url?: string | null,
  options?: {
    /**
     * Inject a Cloudinary delivery transformation (f_auto,q_auto,w_<n>,c_limit)
     * so the image is served as AVIF/WebP at display size instead of the
     * original upload. Only applied to untransformed Cloudinary URLs.
     */
    cloudinaryWidth?: number;
    /**
     * When set together with cloudinaryWidth, crops server-side to the exact
     * display aspect ratio (c_fill) instead of only limiting the width. The
     * browser's objectFit:cover crops to the same region anyway, so this
     * only strips bytes that were never visible.
     */
    cloudinaryHeight?: number;
  }
): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== CLOUDINARY_HOST) {
      return url;
    }

    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
    }

    if (options?.cloudinaryWidth) {
      const markerIndex = parsedUrl.pathname.indexOf(CLOUDINARY_UPLOAD_MARKER);
      if (markerIndex !== -1) {
        const insertAt = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;
        const firstSegment = parsedUrl.pathname.slice(insertAt).split('/')[0];
        // Skip URLs that already carry a transformation segment
        // (e.g. "w_400" or "f_auto,q_auto"); version markers ("v123…")
        // and public-id folders are safe to prefix.
        const hasTransform =
          firstSegment.includes(',') || /^[a-z]{1,3}_[^/]+$/.test(firstSegment);
        if (!hasTransform) {
          const transform = options.cloudinaryHeight
            ? `f_auto,q_auto,w_${options.cloudinaryWidth},h_${options.cloudinaryHeight},c_fill`
            : `f_auto,q_auto,w_${options.cloudinaryWidth},c_limit`;
          parsedUrl.pathname =
            parsedUrl.pathname.slice(0, insertAt) +
            transform +
            '/' +
            parsedUrl.pathname.slice(insertAt);
        }
      }
    }

    return parsedUrl.toString();
  } catch {
    return url;
  }
}
