'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box } from '@chakra-ui/react';

export const Table = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="table" width="100%" {...props}>
    {children}
  </Box>
);

export const Thead = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="thead" {...props}>
    {children}
  </Box>
);

export const Tbody = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="tbody" {...props}>
    {children}
  </Box>
);

export const Tr = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="tr" display="flex" {...props}>
    {children}
  </Box>
);

export const Th = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="th" padding="2" fontWeight="bold" flex="1" {...props}>
    {children}
  </Box>
);

export const Td = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="td" padding="2" flex="1" {...props}>
    {children}
  </Box>
);

export const TableContainer = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box overflowX="auto" {...props}>
    {children}
  </Box>
);
