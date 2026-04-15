'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box } from '@chakra-ui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, size, children }: ModalProps) => {
  if (!isOpen) return null;

  const maxWidth =
    size === 'xl'
      ? '800px'
      : size === 'lg'
        ? '600px'
        : size === 'md'
          ? '500px'
          : '400px';

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={1300}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        maxW={maxWidth}
        w="full"
        maxH="90vh"
        overflow="auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Box>
    </Box>
  );
};

export const ModalOverlay = () => null; // Handled by Modal

export const ModalContent = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box position="relative" {...props}>
    {children}
  </Box>
);

export const ModalHeader = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    p={4}
    pr={12}
    borderBottomWidth="1px"
    borderColor="gray.200"
    fontWeight="bold"
    fontSize="lg"
    {...props}
  >
    {children}
  </Box>
);

export const ModalBody = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p={4} {...props}>
    {children}
  </Box>
);

export const ModalFooter = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    p={4}
    borderTopWidth="1px"
    borderColor="gray.200"
    display="flex"
    justifyContent="flex-end"
    gap={3}
    {...props}
  >
    {children}
  </Box>
);

export const ModalCloseButton = ({
  onClose,
  ...props
}: { onClose?: () => void } & any) => (
  <Box
    as="button"
    position="absolute"
    top={2}
    right={2}
    p={1}
    borderRadius="md"
    _hover={{ bg: 'gray.100' }}
    onClick={onClose}
    {...props}
  >
    <Box as="span" fontSize="xl" lineHeight={1}>
      ×
    </Box>
  </Box>
);
