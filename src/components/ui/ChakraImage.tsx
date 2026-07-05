'use client';

import { Box, BoxProps } from '@chakra-ui/react';

export interface ImageProps extends Omit<BoxProps, 'as'> {
  src?: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'sync' | 'async' | 'auto';
}

export const Image = ({
  src,
  alt = '',
  loading,
  fetchPriority,
  decoding,
  ...props
}: ImageProps) => (
  <Box
    as="img"
    {...props}
    {...({ src, alt, loading, fetchPriority, decoding } as Record<
      string,
      unknown
    >)}
  />
);
