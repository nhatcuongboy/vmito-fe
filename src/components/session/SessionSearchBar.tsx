'use client';

import { IconButton, Input } from '@/components/ui/chakra-compat';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { Badge, Box, Flex } from '@chakra-ui/react';
import { Filter, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { SessionSearchBarProps } from './SessionSearchBar.types';

export default function SessionSearchBar({
  searchQuery,
  onSearchChange,
  onToggleFilters,
  activeFilterCount,
}: SessionSearchBarProps) {
  const t = useTranslations('session');

  // Local input value — updates immediately for snappy typing feel
  const [localValue, setLocalValue] = useState(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value (e.g. reset from URL) into local state
  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  const handleChange = (val: string) => {
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 400);
  };

  return (
    <Box
      position="sticky"
      top={{
        base: `${TOP_BAR_HEIGHT_MOBILE}px`,
        md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
      }}
      zIndex={100}
      // bg={{ base: 'green.50', _dark: 'gray.900' }}
      // py={4}
      mb={4}
      // boxShadow="sm"
      // borderBottom="1px solid"
      // borderColor={{ base: 'green.100', _dark: 'gray.700' }}
    >
      <Flex
        gap={2}
        align="center"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        px={3}
        h="48px"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Box flex="1" minW="200px">
          <Input
            h="36px"
            placeholder={t('searchPlaceholder')}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            bg="white"
            _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
            borderRadius="md"
            borderColor="gray.200"
            leftElement={
              <Box color="gray.400">
                <Search size={18} />
              </Box>
            }
            _focus={{
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
              _dark: {
                bg: 'gray.600',
              },
            }}
            fontSize="sm"
            transition="all 0.2s"
          />
        </Box>

        {/* Filter Button */}
        <Box position="relative">
          <IconButton
            h="36px"
            w="36px"
            minW="36px"
            variant="solid"
            bg="green"
            color="white"
            _hover={{ bg: 'green.600', transform: 'scale(1.05)' }}
            _active={{ bg: 'green.700' }}
            onClick={onToggleFilters}
            aria-label={t('filters.title')}
            icon={<Filter size={18} />}
            borderRadius="md"
            transition="all 0.2s"
          />
          {activeFilterCount > 0 && (
            <Badge
              position="absolute"
              top="-6px"
              right="-6px"
              borderRadius="full"
              colorPalette="red"
              variant="solid"
              px={1.5}
              minW="20px"
              h="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="bold"
              border="2px solid"
              borderColor="white"
              _dark={{ borderColor: 'gray.800' }}
              zIndex={1}
              boxShadow="sm"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
