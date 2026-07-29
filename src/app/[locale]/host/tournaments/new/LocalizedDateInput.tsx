'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { CalendarDays } from 'lucide-react';

import { formatDateForLocale } from './form-utils';

interface LocalizedDateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  displayValue: string;
  locale: string;
  placeholder: string;
  ariaLabel: string;
  invalid?: boolean;
}

const LocalizedDateInput = forwardRef<
  HTMLInputElement,
  LocalizedDateInputProps
>(function LocalizedDateInput(
  {
    displayValue,
    locale,
    placeholder,
    ariaLabel,
    invalid = false,
    disabled,
    ...inputProps
  },
  ref
) {
  const formattedValue = formatDateForLocale(displayValue, locale);

  return (
    <Box
      position="relative"
      display="flex"
      alignItems="center"
      minH="48px"
      w="full"
      px={4}
      pe={12}
      borderWidth="1px"
      borderColor={
        invalid ? 'border.error' : { base: 'gray.200', _dark: 'whiteAlpha.300' }
      }
      borderRadius="xl"
      bg={{ base: 'white', _dark: 'gray.800' }}
      color={formattedValue ? 'fg' : 'gray.500'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      touchAction="manipulation"
      opacity={disabled ? 0.6 : 1}
      transitionProperty="border-color, box-shadow, background-color"
      transitionDuration="160ms"
      _hover={
        disabled
          ? undefined
          : {
              borderColor: invalid ? 'border.error' : 'gray.300',
              _dark: {
                borderColor: invalid ? 'border.error' : 'whiteAlpha.400',
              },
            }
      }
      _focusWithin={{
        borderColor: invalid ? 'border.error' : 'brand.500',
        boxShadow: invalid
          ? '0 0 0 1px var(--chakra-colors-border-error)'
          : '0 0 0 1px var(--chakra-colors-brand-500)',
      }}
      css={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <Text
        aria-hidden="true"
        fontSize="md"
        lineHeight="1.4"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        pointerEvents="none"
      >
        {formattedValue || placeholder}
      </Text>
      <Box
        as={CalendarDays}
        aria-hidden="true"
        position="absolute"
        insetInlineEnd={4}
        boxSize={5}
        color="fg.muted"
        pointerEvents="none"
      />
      <input
        {...inputProps}
        ref={ref}
        type="date"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
    </Box>
  );
});

LocalizedDateInput.displayName = 'LocalizedDateInput';

export default LocalizedDateInput;
