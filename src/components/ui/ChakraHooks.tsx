'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useDisclosure as useChakraDisclosure } from '@chakra-ui/react';

// Re-export color mode hooks from color-mode-provider
export { useColorModeValue, useColorMode } from './color-mode-provider';

// Create useDisclosure wrapper that returns isOpen instead of open
export const useDisclosure = (defaultIsOpen = false) => {
  const { open, onOpen, onClose, onToggle, setOpen } = useChakraDisclosure({
    defaultOpen: defaultIsOpen,
  });
  return {
    isOpen: open,
    onOpen,
    onClose,
    onToggle,
    setOpen,
  };
};
