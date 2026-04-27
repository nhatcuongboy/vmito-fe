'use client';

import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { Box, Flex, Icon } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { SessionSearchBarProps } from './SessionSearchBar.types';
import { AppSearchBar } from '../common/AppSearchBar';
import { Button } from '../ui/chakra-compat';

export default function SessionSearchBar({
  searchQuery,
  onSearchChange,
  onToggleFilters,
  activeFilterCount,
  onCreateClick,
  isLoadingCreate,
  topAddon,
  hideCreateOnMobile = false,
  topOffset = 0,
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

  const createBtn = onCreateClick && (
    <Button
      colorPalette="green"
      onClick={onCreateClick}
      size={{ base: 'sm', md: 'md' }}
      shadow="md"
      h={{ base: '36px', md: '40px' }}
      px={5}
      borderRadius="lg"
      fontWeight="bold"
      whiteSpace="nowrap"
      loading={isLoadingCreate}
      disabled={isLoadingCreate}
    >
      <Icon as={Plus} mr={1} boxSize={4} />
      {t('createSession')}
    </Button>
  );

  return (
    <>
      {/* Sticky Area: Search (Mobile/Desktop) */}
      <Box
        position="sticky"
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE + topOffset}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        left={0}
        right={0}
        width="100vw"
        marginLeft="calc(50% - 50vw)"
        zIndex={100}
        bg="transparent"
        pt={topAddon ? 0 : 2}
        pb={2}
        transition="all 0.2s"
      >
        <Flex direction="column" align="center" gap={1.5} w="100%">
          {topAddon && (
            <Box w="100%">
              <Box maxW="1280px" mx="auto">
                {topAddon}
              </Box>
            </Box>
          )}
          <Flex align="center" gap={2} w="100%" maxW="650px" mx="auto" px={4}>
            <Box flex={1} w="100%">
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
        </Flex>
      </Box>

      {/* Desktop Create Button (Sticky, centered) */}
      <Flex
        display={{ base: 'none', md: 'flex' }}
        justify="right"
        mt={2}
        mb={4}
        w="100%"
      >
        {createBtn}
      </Flex>

      {/* Mobile Create Button (NON-Sticky, right-aligned) */}
      <Box
        display={hideCreateOnMobile ? 'none' : { base: 'block', md: 'none' }}
        mt={2}
        mb={4}
      >
        <Flex justify="flex-end" w="100%" maxW="650px" mx="auto">
          {createBtn}
        </Flex>
      </Box>
    </>
  );
}
