'use client';

import * as React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Input, InputProps } from './Input';

/**
 * VDateTimeInput: A specialized Input component for date, time, and datetime-local
 * that fixes the "blank" issue on mobile by showing a placeholder when empty.
 */
export const VDateTimeInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ placeholder, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasInternalValue, setHasInternalValue] = React.useState(!!value);

    // Internal ref to check value if not provided via props (for react-hook-form)
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const combinedRef = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      // Initial check
      if (node) setHasInternalValue(!!node.value);
    };

    // Update internal state when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setHasInternalValue(!!value);
      }
    }, [value]);

    // Check value on input change to handle both controlled and uncontrolled
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasInternalValue(!!e.target.value);
      onChange?.(e);
    };

    const hasValue = value !== undefined ? !!value : hasInternalValue;

    return (
      <Box position="relative" width="full">
        <Input
          {...props}
          bg={props.bg ?? { base: 'white', _dark: 'gray.800' }}
          ref={combinedRef}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          css={{
            // Fix for vertical alignment in some mobile browsers
            '&::-webkit-date-and-time-value': {
              minHeight: '1.5em',
              display: 'flex',
              alignItems: 'center',
            },
            // Hide native placeholder text (like --:-- or mm/dd/yyyy) when our custom placeholder is shown
            ...(!hasValue &&
              !isFocused && {
                '&::-webkit-datetime-edit': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-fields-wrapper': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-text': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-month-field': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-day-field': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-year-field': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-hour-field': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-minute-field': {
                  color: 'transparent',
                },
                '&::-webkit-datetime-edit-ampm-field': {
                  color: 'transparent',
                },
              }),
            ...props.css,
          }}
        />

        {/* Placeholder overlay - only shown when empty and not focused */}
        {!hasValue && !isFocused && placeholder && (
          <Text
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
            pointerEvents="none"
            fontSize={props.size === 'sm' ? 'sm' : 'md'}
            zIndex={1}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxW="calc(100% - 24px)"
          >
            {placeholder}
          </Text>
        )}
      </Box>
    );
  }
);

VDateTimeInput.displayName = 'VDateTimeInput';
