'use client';

import * as React from 'react';
import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  Box,
} from '@chakra-ui/react';

export interface InputProps extends ChakraInputProps {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

/**
 * Custom Input component based on Chakra UI's Input
 * Provides a consistent styling and support for custom icons/elements
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { variant = 'outline', size = 'md', leftElement, rightElement, ...props },
    ref
  ) => {
    const isNumber = props.type === 'number';

    const inputProps = {
      variant,
      size,
      ref,
      ...props,
      _focusVisible: {
        borderColor: 'brand.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
      },
      _invalid: {
        borderColor: 'border.error',
        boxShadow: '0 0 0 1px var(--chakra-colors-border-error)',
      },
      // Adjust padding if elements are present
      paddingStart: leftElement ? '10' : props.paddingStart,
      paddingEnd: rightElement ? '10' : props.paddingEnd,
    };

    if (leftElement || rightElement) {
      return (
        <Box position="relative" width="100%">
          {leftElement && (
            <Box
              position="absolute"
              left="3"
              top="50%"
              transform="translateY(-50%)"
              zIndex="1"
              pointerEvents="none"
              display="flex"
              alignItems="center"
              color="gray.400"
            >
              {leftElement}
            </Box>
          )}

          <ChakraInput {...inputProps} />

          {rightElement && (
            <Box
              position="absolute"
              right={isNumber ? '7' : '3'}
              top="50%"
              transform="translateY(-50%)"
              zIndex="1"
              pointerEvents="none"
              display="flex"
              alignItems="center"
              color="gray.400"
            >
              {rightElement}
            </Box>
          )}
        </Box>
      );
    }

    return <ChakraInput {...inputProps} />;
  }
);

Input.displayName = 'Input';

export { Input };
