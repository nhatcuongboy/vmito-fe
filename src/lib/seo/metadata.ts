import type { Metadata } from 'next';

export const defaultOpenGraphImage = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Vmito - Tìm kèo cầu lông',
  type: 'image/jpeg',
};

export const defaultSeoDescription =
  'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam.';

/**
 * Shared metadata for authenticated application areas.
 *
 * These pages remain crawlable so search engines can read the noindex
 * directive. Access control must still be enforced by auth guards and APIs.
 */
export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
