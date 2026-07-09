'use client';

import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';

interface PostAvatarProps {
  name: string;
  image?: string | null;
  /** Diameter in pixels. Defaults to 44. */
  size?: number;
  className?: string;
}

/**
 * Shared avatar used across the newsfeed (composer, post header, shared post,
 * comments). Renders the user's image when available, otherwise a colored
 * circle with the first letter of their name as a fallback.
 */
export function PostAvatar({
  name,
  image,
  size = 44,
  className = '',
}: PostAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || '?';
  const fontSize = Math.max(12, Math.round(size * 0.4));
  const imageSrc = normalizeImageUrl(image);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 dark:from-gray-600 dark:to-gray-700 dark:text-gray-100 ${className}`}
      style={{ width: size, height: size }}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="font-semibold" style={{ fontSize }}>
          {initial}
        </span>
      )}
    </span>
  );
}

export default PostAvatar;
