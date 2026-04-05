'use client';

import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { Box, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { SessionSearchBarProps } from './SessionSearchBar.types';
import { AppSearchBar } from '../common/AppSearchBar';

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
      mb={4}
    >
      <Flex justify="center">
        <Box w="100%" maxW="500px">
          <AppSearchBar
            value={localValue}
            onChange={handleChange}
            placeholder={t('searchPlaceholder')}
            onFilterClick={onToggleFilters}
            activeFilterCount={activeFilterCount}
            showFilter={true}
          />
        </Box>
      </Flex>
    </Box>
  );
}
