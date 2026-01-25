'use client';

import React from 'react';
import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  Box,
} from '@chakra-ui/react';

interface InputProps extends ChakraInputProps {
  leftElement?: React.ReactNode;
}

export const Input = ({ leftElement, ...props }: InputProps) => {
  if (leftElement) {
    return (
      <Box position="relative" width="100%">
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          pointerEvents="none"
        >
          {leftElement}
        </Box>
        <ChakraInput pl={10} {...props} />
      </Box>
    );
  }
  return <ChakraInput {...props} />;
};
