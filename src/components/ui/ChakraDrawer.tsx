'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box, Heading as ChakraHeading } from '@chakra-ui/react';

export const Drawer = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    position="fixed"
    top="0"
    right="0"
    bottom="0"
    width="100%"
    maxWidth="500px"
    bg="white"
    boxShadow="lg"
    zIndex="modal"
    {...props}
  >
    {children}
  </Box>
);

export const DrawerContent = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box height="100%" display="flex" flexDirection="column" {...props}>
    {children}
  </Box>
);

export const DrawerHeader = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" borderBottomWidth="1px" borderColor="gray.200" {...props}>
    <ChakraHeading size="md">{children}</ChakraHeading>
  </Box>
);

export const DrawerBody = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" flex="1" overflowY="auto" {...props}>
    {children}
  </Box>
);

export const DrawerFooter = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" borderTopWidth="1px" borderColor="gray.200" {...props}>
    {children}
  </Box>
);
