'use client';

import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

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
  const isCloudinaryUrl = src?.includes('cloudinary.com');

  if (!isCloudinaryUrl) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  const publicId = extractPublicId(src);

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
