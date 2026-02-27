'use client';

import { Flex, Text, Icon, HStack } from '@chakra-ui/react';
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import ViewModeToggle from './ViewModeToggle';
import { Button, IconButton } from '@/components/ui/chakra-compat';

interface ResultsHeaderProps {
  count: number;
  mode?: 'browse' | 'auto';
  onModeChange?: (mode: 'browse' | 'auto') => void;

  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function ResultsHeader({
  count,
  mode,
  onModeChange,

  isLoading,
  children,
}: ResultsHeaderProps) {
  const t = useTranslations('session');
  const tSuggestions = useTranslations('suggestions');
  const { isAuthenticated } = useAuthStore();

  return (
    <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
      {/* Left: Results count + Active Filters */}
      <HStack gap={4} wrap="wrap">
        <Text
          fontSize="sm"
          color="gray.600"
          _dark={{ color: 'gray.400' }}
          whiteSpace="nowrap"
        >
          {t('resultsCount', { count })}
        </Text>
        {children}
      </HStack>

      {/* Right: Mode toggle + View mode toggle */}
      <HStack gap={2}>
        {/* Mode Toggle Button (On/Off) */}
        {mode && onModeChange && isAuthenticated && (
          <Button
            size="sm"
            variant={mode === 'auto' ? 'solid' : 'outline'}
            colorPalette={mode === 'auto' ? 'yellow' : 'gray'}
            onClick={() => onModeChange(mode === 'auto' ? 'browse' : 'auto')}
            borderRadius="full"
            gap={1.5}
            px={3}
            h="32px"
            borderColor={mode === 'auto' ? 'transparent' : 'gray.200'}
            _light={{
              bg: mode === 'auto' ? 'yellow.400' : 'white',
              color: mode === 'auto' ? 'yellow.900' : 'gray.600',
              _hover: {
                bg: mode === 'auto' ? 'yellow.500' : 'gray.50',
              },
            }}
          >
            <Icon
              as={Sparkles}
              boxSize={4}
              fill={mode === 'auto' ? 'currentColor' : 'none'}
            />
            <Text
              fontSize="sm"
              fontWeight={mode === 'auto' ? 'bold' : 'normal'}
            >
              {tSuggestions('modeAuto')}
            </Text>
          </Button>
        )}

        {/* View Mode Toggle */}
        <ViewModeToggle />
      </HStack>
    </Flex>
  );
}
