'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import {
  Stack,
  StackProps,
  SimpleGrid as ChakraSimpleGrid,
  SimpleGridProps as ChakraSimpleGridProps,
} from '@chakra-ui/react';

// Create enhanced Stack components with spacing support
interface EnhancedStackProps extends StackProps {
  spacing?: number | string;
}

export const HStack = ({ spacing, children, ...props }: EnhancedStackProps) => (
  <Stack direction="row" gap={spacing} {...props}>
    {children}
  </Stack>
);

export const VStack = ({
  spacing,
  children,
  align,
  ...props
}: EnhancedStackProps & { align?: string }) => (
  <Stack
    direction="column"
    gap={spacing}
    alignItems={
      align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align
    }
    {...props}
  >
    {children}
  </Stack>
);

// Create enhanced SimpleGrid with spacing support
interface EnhancedSimpleGridProps extends ChakraSimpleGridProps {
  spacing?: number | string;
}

export const SimpleGrid = ({
  spacing,
  children,
  ...props
}: EnhancedSimpleGridProps) => (
  <ChakraSimpleGrid gap={spacing} {...props}>
    {children}
  </ChakraSimpleGrid>
);
