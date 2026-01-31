export function extractPublicId(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return null;

    const afterUpload = urlParts[1];
    const parts = afterUpload.split('/');

    if (parts.length < 2) return null;

    parts.shift();

    const publicIdWithExt = parts.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('Failed to extract public ID:', error);
    return null;
  }
}

export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
    return '';
  }

  const transformations: string[] = [];

  if (options?.width || options?.height) {
    const w = options.width ? `w_${options.width}` : '';
    const h = options.height ? `h_${options.height}` : '';
    const c = options.crop ? `c_${options.crop}` : 'c_fill';
    transformations.push([w, h, c].filter(Boolean).join(','));
  }

  if (options?.quality) {
    transformations.push(`q_${options.quality}`);
  }

  if (options?.format) {
    transformations.push(`f_${options.format}`);
  }

  const transformStr =
    transformations.length > 0 ? transformations.join('/') + '/' : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}${publicId}`;
}

export function getThumbnailUrl(publicId: string, size: number = 200): string {
  return getOptimizedUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
  });
}

export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') || false;
}
