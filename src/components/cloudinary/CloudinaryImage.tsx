'use client';

import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: string | number;
  crop?: 'fill' | 'scale' | 'fit' | 'crop' | 'thumb' | 'limit';
  gravity?: string;
  className?: string;
}

export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  quality = 'auto:good',
  crop = 'fill',
  gravity = 'auto',
  className,
}: CloudinaryImageProps) {
  const normalizedSrc = normalizeImageUrl(src) ?? src;
  const isCloudinaryUrl = normalizedSrc?.includes('cloudinary.com');

  if (!isCloudinaryUrl) {
    return (
      <Image
        src={normalizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  const publicId = extractPublicId(normalizedSrc);

  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      crop={crop}
      gravity={gravity}
      quality={quality}
      className={className}
    />
  );
}

function extractPublicId(url: string): string {
  try {
    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return url;

    const afterUpload = urlParts[1];
    const parts = afterUpload.split('/');

    if (parts.length < 2) return url;

    parts.shift();

    const publicIdWithExt = parts.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('Failed to extract public ID:', error);
    return url;
  }
}
