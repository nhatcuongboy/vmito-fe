'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useDisclosure as useChakraDisclosure } from '@chakra-ui/react';

// Create a function to mimic useColorModeValue
export const useColorModeValue = (lightValue: any) => {
  // For now, we'll always return the light value, but this can be enhanced
  return lightValue;
};

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
