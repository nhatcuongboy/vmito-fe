'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box } from '@chakra-ui/react';

export const Table = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="table" width="100%" borderCollapse="collapse" {...props}>
    {children}
  </Box>
);

export const Thead = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    as="thead"
    bg="gray.50"
    _dark={{ bg: 'gray.700' }}
    borderBottomWidth="1px"
    borderColor="gray.200"
    {...props}
  >
    {children}
  </Box>
);

export const Tbody = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="tbody" {...props}>
    {children}
  </Box>
);

export const Tr = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    as="tr"
    display="flex"
    borderBottomWidth="1px"
    borderColor="gray.100"
    _dark={{ borderColor: 'gray.700' }}
    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.750' } }}
    transition="background 0.15s"
    {...props}
  >
    {children}
  </Box>
);

export const Th = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    as="th"
    px="4"
    py="3"
    fontWeight="semibold"
    fontSize="xs"
    textTransform="uppercase"
    letterSpacing="wider"
    color="gray.600"
    _dark={{ color: 'gray.400' }}
    flex="1"
    textAlign="left"
    {...props}
  >
    {children}
  </Box>
);

export const Td = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    as="td"
    px="4"
    py="3"
    flex="1"
    display="flex"
    alignItems="center"
    fontSize="sm"
    {...props}
  >
    {children}
  </Box>
);

export const TableContainer = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    overflowX="auto"
    bg="white"
    _dark={{ bg: 'gray.800' }}
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
    _darkBorderColor="gray.700"
    boxShadow="sm"
    {...props}
  >
    {children}
  </Box>
);
