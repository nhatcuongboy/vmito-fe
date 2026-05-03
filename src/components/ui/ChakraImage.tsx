'use client';

import { Box, BoxProps } from '@chakra-ui/react';

export interface ImageProps extends Omit<BoxProps, 'as'> {
  src?: string;
  alt?: string;
}

export const Image = ({ src, alt = '', ...props }: ImageProps) => (
  <Box as="img" {...props} {...({ src, alt } as any)} />
);
