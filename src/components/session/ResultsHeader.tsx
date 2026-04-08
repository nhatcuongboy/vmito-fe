'use client';

import { Box, Flex, Text, Icon, HStack } from '@chakra-ui/react';
import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  CalendarArrowDown,
  CalendarArrowUp,
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  Activity,
  Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useSessionFilterStore,
  SessionSortBy,
} from '@/stores/useSessionFilterStore';
import ViewModeToggle from './ViewModeToggle';
import { Button } from '@/components/ui/chakra-compat';
import { LucideIcon } from 'lucide-react';

export interface SortOption {
  value: SessionSortBy;
  labelKey: string;
}

const SORT_ICONS: Record<SessionSortBy, LucideIcon> = {
  date_desc: CalendarArrowDown,
  date_asc: CalendarArrowUp,
  status: Activity,
  price_asc: TrendingUp,
  price_desc: TrendingDown,
  distance: MapPin,
  slots_desc: Users,
  created_desc: CalendarArrowDown,
  created_asc: CalendarArrowUp,
};

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'date_asc', labelKey: 'sort.dateNearest' },
  { value: 'date_desc', labelKey: 'sort.dateFurthest' },
  { value: 'status', labelKey: 'sort.status' },
  { value: 'price_asc', labelKey: 'sort.priceLow' },
  { value: 'price_desc', labelKey: 'sort.priceHigh' },
  { value: 'distance', labelKey: 'sort.distance' },
  { value: 'slots_desc', labelKey: 'sort.slotsAvailable' },
];

interface ResultsHeaderProps {
  count: number;
  mode?: 'browse' | 'auto';
  onModeChange?: (mode: 'browse' | 'auto') => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  sortOptions?: SortOption[];
  sortBy?: SessionSortBy;
  onSortChange?: (sort: SessionSortBy) => void;
}

export default function ResultsHeader({
  count,
  mode,
  onModeChange,
  children,
  sortOptions,
  sortBy: controlledSortBy,
  onSortChange,
}: ResultsHeaderProps) {
  const t = useTranslations('session');
  const tSuggestions = useTranslations('suggestions');
  const tCommon = useTranslations('common');
  const { isAuthenticated } = useAuthStore();
  const store = useSessionFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSortBy = controlledSortBy ?? store.sortBy;

  const options = sortOptions ?? DEFAULT_SORT_OPTIONS;
  const activeOption =
    options.find((o) => o.value === currentSortBy) ?? options[0];

  const handleSelect = (value: SessionSortBy) => {
    if (onSortChange) {
      onSortChange(value);
    } else {
      store.setSortBy(value);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <Box mb={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        {/* Left: Results count + Mode Toggle Button */}
        <HStack gap={2} flexShrink={0} flexWrap="wrap">
          <Text
            fontSize="sm"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            whiteSpace="nowrap"
          >
            {`${count} ${tCommon('sessions')}`}
          </Text>

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
        </HStack>

        {/* Right: Sort + View mode toggle */}
        <HStack gap={2} flexShrink={0}>
          {/* Sort Dropdown */}
          <Box position="relative" ref={dropdownRef}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen((v) => !v)}
              display="flex"
              alignItems="center"
              gap={1.5}
              h="32px"
              px={3}
              borderRadius="full"
              borderColor="gray.200"
              bg={{ base: 'white', _dark: 'gray.800' }}
              color={{ base: 'gray.700', _dark: 'gray.200' }}
              fontWeight="normal"
              fontSize="sm"
              _hover={{ bg: { base: 'gray.50', _dark: 'gray.700' } }}
              _active={{ bg: { base: 'gray.100', _dark: 'gray.600' } }}
            >
              <ArrowUpDown size={14} />
              <Text as="span" maxW="100px" truncate>
                {t(activeOption.labelKey)}
              </Text>
              <ChevronDown
                size={13}
                style={{
                  transition: 'transform 0.2s',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Button>

            {isOpen && (
              <Box
                position="absolute"
                top="calc(100% + 6px)"
                right={0}
                zIndex={200}
                bg={{ base: 'white', _dark: 'gray.800' }}
                border="1px solid"
                borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                borderRadius="xl"
                boxShadow="lg"
                minW="180px"
                overflow="hidden"
                py={1}
              >
                {options.map((opt) => {
                  const OptionIcon = SORT_ICONS[opt.value] ?? ArrowUpDown;
                  const isActive = opt.value === currentSortBy;
                  return (
                    <Flex
                      key={opt.value}
                      align="center"
                      gap={2.5}
                      px={3}
                      py={2}
                      cursor="pointer"
                      bg={
                        isActive
                          ? { base: 'green.50', _dark: 'green.900' }
                          : 'transparent'
                      }
                      color={
                        isActive
                          ? 'green.600'
                          : { base: 'gray.700', _dark: 'gray.200' }
                      }
                      fontWeight={isActive ? 'semibold' : 'normal'}
                      fontSize="sm"
                      _hover={{
                        bg: isActive
                          ? { base: 'green.100', _dark: 'green.800' }
                          : { base: 'gray.50', _dark: 'gray.700' },
                      }}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <OptionIcon size={14} />
                      <Text flex={1}>{t(opt.labelKey)}</Text>
                      {isActive && <Check size={13} />}
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* View Mode Toggle */}
          <ViewModeToggle />
        </HStack>
      </Flex>

      {/* Active Filters row */}
      {children && <Box mt={2}>{children}</Box>}
    </Box>
  );
}
