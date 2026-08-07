'use client';

import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';

/** Curated colorful gradient rings, Instagram-style. */
const RING_GRADIENTS = [
  ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'],
  ['#12c2e9', '#c471ed', '#f64f59'],
  ['#f7971e', '#ffd200', '#f7971e'],
  ['#00c6ff', '#0072ff', '#00c6ff'],
  ['#f857a6', '#ff5858', '#f857a6'],
  ['#43e97b', '#38f9d7', '#43e97b'],
  ['#fa709a', '#fee140', '#fa709a'],
  ['#30cfd0', '#330867', '#30cfd0'],
  ['#ff6a00', '#ee0979', '#ff6a00'],
  ['#7f00ff', '#e100ff', '#7f00ff'],
];

/** Stable hash so each name keeps the same "random" ring across renders. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface PostAvatarProps {
  name: string;
  image?: string | null;
  /** Diameter in pixels. Defaults to 44. */
  size?: number;
  className?: string;
  /**
   * Wrap the avatar in an Instagram-style colorful gradient ring. Defaults to
   * false so existing usages stay unchanged.
   */
  bordered?: boolean;
  ringVariant?: 'gradient' | 'solid';
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
  bordered = false,
  ringVariant = 'gradient',
}: PostAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || '?';
  const fontSize = Math.max(12, Math.round(size * 0.4));
  const imageSrc = normalizeImageUrl(image);

  const circle = (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 border border-black/10 dark:from-gray-600 dark:to-gray-700 dark:text-gray-100 dark:border-white/40 ${bordered ? '' : className}`}
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

  if (!bordered) {
    return circle;
  }

  // Newsfeed uses a gradient with a gap; compact surfaces can use a solid ring.
  const ringWidth = Math.max(2, Math.round(size * 0.06));
  const gapWidth =
    ringVariant === 'gradient' ? Math.max(2, Math.round(size * 0.045)) : 0;
  const colors =
    RING_GRADIENTS[hashString(name || '?') % RING_GRADIENTS.length];
  const ringBackground =
    ringVariant === 'gradient'
      ? `conic-gradient(from 0deg, ${[...colors, colors[0]].join(', ')})`
      : colors[1] || colors[0];

  if (ringVariant === 'solid') {
    return (
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-full ${className}`}
        style={{ padding: ringWidth, background: ringBackground }}
      >
        {circle}
      </span>
    );
  }

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ padding: ringWidth, background: ringBackground }}
    >
      <span
        className="flex items-center justify-center rounded-full bg-white dark:bg-gray-900"
        style={{ padding: gapWidth }}
      >
        {circle}
      </span>
    </span>
  );
}

export default PostAvatar;
