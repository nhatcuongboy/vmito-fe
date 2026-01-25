'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box } from '@chakra-ui/react';

export const Card = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    border="1px"
    borderColor="gray.200"
    borderRadius="md"
    overflow="hidden"
    bg="white"
    _dark={{ bg: 'gray.800' }}
    boxShadow="sm"
    {...props}
  >
    {children}
  </Box>
);

export const CardHeader = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    p="4"
    fontWeight="bold"
    borderBottomWidth="1px"
    borderColor="gray.200"
    {...props}
  >
    {children}
  </Box>
);

export const CardBody = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" {...props}>
    {children}
  </Box>
);
