'use client';

import { Box, Button, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';

interface TournamentIconToggleProps {
  active: boolean;
  children: ReactNode;
  onToggle: () => void;
  title: string;
  label?: string;
  fullWidthOnMobile?: boolean;
  /** Square button size in px (icon-only variant). Defaults to 36. */
  size?: number;
}

export default function TournamentIconToggle({
  active,
  children,
  onToggle,
  title,
  label,
  fullWidthOnMobile = false,
  size = 36,
}: TournamentIconToggleProps) {
  const hasLabel = !!label;

  return (
    <Button
      type="button"
      variant="plain"
      position="relative"
      cursor="pointer"
      aria-label={title}
      aria-pressed={active}
      title={title}
      onClick={onToggle}
      flex={fullWidthOnMobile ? { base: 1, sm: '0 0 auto' } : '0 0 auto'}
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={hasLabel ? 2 : 0}
      h={`${size}px`}
      w={
        hasLabel
          ? 'auto'
          : fullWidthOnMobile
            ? { base: 'full', sm: `${size}px` }
            : `${size}px`
      }
      minW={hasLabel ? 'max-content' : `${size}px`}
      minH={`${size}px`}
      px={hasLabel ? 3 : 0}
      py={0}
      borderRadius={hasLabel ? 'full' : 'md'}
      borderWidth="1px"
      borderColor={active ? 'green.400' : 'gray.300'}
      bg={active ? 'green.500' : 'white'}
      color={active ? 'white' : 'gray.600'}
      boxShadow="sm"
      transitionProperty="background-color, border-color, color, box-shadow"
      transitionDuration="0.15s"
      transitionTimingFunction="ease"
      _focusVisible={{
        outline: '2px solid var(--chakra-colors-green-500)',
        outlineOffset: '2px',
      }}
      _hover={{
        bg: active ? 'green.600' : 'gray.100',
        borderColor: active ? 'green.500' : 'gray.300',
      }}
      _dark={{
        borderColor: active ? 'green.500' : 'gray.600',
        bg: active ? 'green.600' : 'gray.800',
        color: active ? 'white' : 'gray.300',
        _hover: {
          bg: active ? 'green.700' : 'gray.700',
        },
      }}
    >
      {children}
      {hasLabel && (
        <Text
          fontSize="sm"
          fontWeight="semibold"
          lineHeight="1"
          whiteSpace="nowrap"
        >
          {label}
        </Text>
      )}
      {active && (
        <Box
          aria-hidden="true"
          position="absolute"
          top={0}
          right={0}
          transform="translate(50%, -50%)"
          w="14px"
          h="14px"
          borderRadius="full"
          bg="green.400"
          borderWidth="2px"
          borderColor="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          _dark={{ borderColor: 'gray.900' }}
        >
          <Check size={8} strokeWidth={3} color="white" aria-hidden="true" />
        </Box>
      )}
    </Button>
  );
}
