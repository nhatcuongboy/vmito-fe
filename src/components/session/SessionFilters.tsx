'use client';
import { Input } from '@/components/ui/Input';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Box, Flex } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { VSelect } from '@/components/ui/VSelect';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ISessionFiltersProps,
  ISessionFilterState,
} from './SessionFilters.types';
import { SessionStatus } from '@/lib/api/types';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

const SessionFilters: React.FC<ISessionFiltersProps> = ({
  onFilterChange,
  showLevelFilter = false,
  showDateFilter = true,
  showSearchFilter = true,
  showStatusFilter = true,
  initialFilters = {},
}) => {
  const t = useTranslations('session.filters');
  const tStatus = useTranslations('session.status');
  const tCommon = useTranslations('common');

  const [filters, setFilters] = useState<ISessionFilterState>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(
    initialFilters.searchQuery || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: debouncedSearchTerm || undefined,
    }));
  }, [debouncedSearchTerm]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (
    key: keyof ISessionFilterState,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ''
  );

  // Create collections for select components
  const statusItems = [
    { value: 'ALL', label: tStatus('all') },
    { value: SessionStatus.PREPARING, label: tStatus('preparing') },
    { value: SessionStatus.IN_PROGRESS, label: tStatus('inProgress') },
    { value: SessionStatus.FINISHED, label: tStatus('finished') },
  ];

  const levelItems = [
    { value: '', label: tCommon('allLevels') },
    ...Array.from({ length: 8 }, (_, i) => ({
      value: String(i + 1),
      label: tCommon(`levels.${i + 1}`),
    })),
  ];

  return (
    <Box
      position="sticky"
      top={{
        base: `${TOP_BAR_HEIGHT_MOBILE}px`,
        md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
      }}
      zIndex={50}
      mb={4}
      p={4}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      shadow="sm"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Flex gap={3} direction="row" flexWrap="wrap" align="stretch">
        {/* Search Filter - Full width on mobile, flexible on desktop */}
        {showSearchFilter && (
          <Box flex={{ base: '1 1 100%', lg: '1 1 300px' }}>
            <Input
              placeholder={t('searchSessions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.50"
              borderColor="gray.200"
              h="40px"
              fontSize="sm"
              _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
              leftElement={<Search size={18} style={{ opacity: 0.5 }} />}
              _placeholder={{ color: 'gray.400' }}
            />
          </Box>
        )}

        {/* Group Box for Status and Date to ensure they stay on one row on mobile */}
        {(showStatusFilter || showDateFilter) && (
          <Box flex={{ base: '1 1 100%', lg: '0 1 auto' }}>
            <Flex gap={3}>
              {/* Status Filter */}
              {showStatusFilter && (
                <Box flex="1" minW={{ lg: '180px' }}>
                  <VSelect
                    value={filters.status || 'ALL'}
                    onChange={(e) =>
                      handleFilterChange(
                        'status',
                        e.target.value === 'ALL' ? undefined : e.target.value
                      )
                    }
                    leftElement={<Filter size={16} opacity={0.6} />}
                    placeholder={t('sessionStatus')}
                  >
                    {statusItems.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </VSelect>
                </Box>
              )}

              {/* Date Filter */}
              {showDateFilter && (
                <Box flex="1" minW={{ lg: '180px' }} position="relative">
                  <Input
                    type="date"
                    value={filters.date || ''}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    bg="gray.50"
                    borderColor="gray.200"
                    h="40px"
                    fontSize="sm"
                    _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                    leftElement={
                      <Calendar size={16} style={{ opacity: 0.6 }} />
                    }
                    _placeholder={{ color: 'gray.400' }}
                    css={{
                      '&::-webkit-calendar-picker-indicator': {
                        position: 'absolute',
                        right: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                      },
                      '&::-webkit-date-and-time-value': {
                        minHeight: '1.5em',
                        display: 'flex',
                        alignItems: 'center',
                      },
                      '&::-webkit-datetime-edit': {
                        minHeight: '1.5em',
                      },
                      '&::-webkit-datetime-edit-fields-wrapper': {
                        padding: '0',
                      },
                      '&::-webkit-datetime-edit-text': {
                        color: !filters.date ? 'transparent' : 'inherit',
                        padding: '0 1px',
                      },
                      '&::-webkit-datetime-edit-month-field': {
                        color: !filters.date ? 'transparent' : 'inherit',
                      },
                      '&::-webkit-datetime-edit-day-field': {
                        color: !filters.date ? 'transparent' : 'inherit',
                      },
                      '&::-webkit-datetime-edit-year-field': {
                        color: !filters.date ? 'transparent' : 'inherit',
                      },
                    }}
                  />
                  {/* Placeholder overlay */}
                  {!filters.date && (
                    <Box
                      position="absolute"
                      left="40px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.400"
                      pointerEvents="none"
                      fontSize="sm"
                      userSelect="none"
                    >
                      {t('allDays') || 'Tất cả ngày'}
                    </Box>
                  )}
                </Box>
              )}
            </Flex>
          </Box>
        )}

        {/* Level Filter */}
        {showLevelFilter && (
          <Box flex={{ base: '1 1 100%', lg: '0 1 180px' }}>
            <VSelect
              value={filters.level ? String(filters.level) : ''}
              onChange={(e) =>
                handleFilterChange(
                  'level',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder={tCommon('selectLevel')}
            >
              {levelItems.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </VSelect>
          </Box>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Box flex={{ base: '1 1 100%', lg: '0 0 auto' }}>
            <Button
              w="100%"
              h="40px"
              variant="outline"
              onClick={handleClearFilters}
              colorPalette="red"
              borderColor="red.200"
              _dark={{ borderColor: 'red.700' }}
              _hover={{
                bg: 'red.50',
                _dark: { bg: 'red.900/20' },
              }}
            >
              <X size={16} style={{ marginRight: 4 }} />
              {t('clearFilters')}
            </Button>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default SessionFilters;
