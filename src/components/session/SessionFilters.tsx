'use client';
import { Input } from '@/components/ui/Input';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import SessionSearchBar from './SessionSearchBar';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Calendar, Check, Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ISessionFiltersProps,
  ISessionFilterState,
} from './SessionFilters.types';
import { FeeType, SessionStatus } from '@/lib/api/types';
import {
  TIME_RANGES,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';

const SessionFilters: React.FC<ISessionFiltersProps> = ({
  onFilterChange,
  showLevelFilter = false,
  showDateFilter = true,
  showSearchFilter = true,
  showStatusFilter = true,
  showTimeFilter = false,
  showFeeFilter = false,
  initialFilters = {},
  onCreateClick,
  topAddon,
  hideCreateOnMobile = false,
}) => {
  const t = useTranslations('session.filters');
  const tSession = useTranslations('session');
  const tStatus = useTranslations('session.status');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();

  const [filters, setFilters] = useState<ISessionFilterState>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(
    initialFilters.searchQuery || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Pending filter states for drawer
  const [pendingStatus, setPendingStatus] = useState<string | undefined>(
    initialFilters.status
  );
  const [pendingDate, setPendingDate] = useState<string | undefined>(
    initialFilters.date
  );
  const [pendingLevel, setPendingLevel] = useState<number | undefined>(
    initialFilters.level
  );
  const [pendingLevels, setPendingLevels] = useState<number[]>(
    initialFilters.levels ?? []
  );
  const [pendingTimeRanges, setPendingTimeRanges] = useState<string[]>(
    initialFilters.timeRanges ?? []
  );
  const [pendingMinFee, setPendingMinFee] = useState<number>(
    initialFilters.minFee ?? 0
  );
  const [pendingMaxFee, setPendingMaxFee] = useState<number>(
    initialFilters.maxFee ?? 200000
  );
  const [pendingSplitEvenly, setPendingSplitEvenly] = useState<boolean>(
    initialFilters.splitEvenly ?? false
  );

  const { isOpen: showDrawer, onToggle: toggleDrawer } = useDisclosure(false);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showDrawer) {
      setPendingStatus(filters.status);
      setPendingDate(filters.date);
      setPendingLevel(filters.level);
      setPendingLevels(filters.levels ?? []);
      setPendingTimeRanges(filters.timeRanges ?? []);
      setPendingMinFee(filters.minFee ?? 0);
      setPendingMaxFee(filters.maxFee ?? 200000);
      setPendingSplitEvenly(filters.splitEvenly ?? false);
    }
  }, [
    showDrawer,
    filters.status,
    filters.date,
    filters.level,
    filters.levels,
    filters.timeRanges,
    filters.minFee,
    filters.maxFee,
    filters.splitEvenly,
  ]);

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

  const handleSubmitFilters = () => {
    setFilters((prev) => ({
      ...prev,
      status: pendingStatus,
      date: pendingDate,
      level: pendingLevel,
      levels: pendingLevels,
      timeRanges: pendingTimeRanges,
      minFee: pendingMinFee,
      maxFee: pendingMaxFee,
      splitEvenly: pendingSplitEvenly,
    }));
    toggleDrawer();
  };

  const handleResetFilters = () => {
    setPendingStatus(undefined);
    setPendingDate(undefined);
    setPendingLevel(undefined);
    setPendingLevels([]);
    setPendingTimeRanges([]);
    setPendingMinFee(0);
    setPendingMaxFee(200000);
    setPendingSplitEvenly(false);
  };

  const activeFilterCount =
    (filters.status ? 1 : 0) +
    (filters.date ? 1 : 0) +
    (filters.level ? 1 : 0) +
    (filters.levels?.length ? 1 : 0) +
    (filters.timeRanges?.length ? 1 : 0) +
    ((filters.minFee && filters.minFee > 0) ||
    (filters.maxFee !== undefined && filters.maxFee < 200000) ||
    filters.splitEvenly
      ? 1
      : 0);

  const statusItems = [
    { value: SessionStatus.PREPARING, label: tStatus('preparing') },
    { value: SessionStatus.IN_PROGRESS, label: tStatus('inProgress') },
    { value: SessionStatus.FINISHED, label: tStatus('finished') },
    { value: SessionStatus.CANCELLED, label: tStatus('cancelled') },
  ];

  const levelItems = VALID_LEVELS.map((level) => ({
    value: level,
    label: getLevelShortLabel(level),
    colorPalette: getSkillLevelColor([level]).colorPalette,
  }));

  return (
    <>
      {/* Sticky Search Bar */}
      {showSearchFilter && (
        <SessionSearchBar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          onToggleFilters={toggleDrawer}
          activeFilterCount={activeFilterCount}
          onCreateClick={onCreateClick}
          topAddon={topAddon}
          hideCreateOnMobile={hideCreateOnMobile}
        />
      )}

      {/* Filter Drawer Overlay */}
      {showDrawer && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          onClick={toggleDrawer}
        />
      )}

      {/* Filter Drawer */}
      <Box
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: '90%', md: '480px', lg: '520px' }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        shadow="2xl"
        zIndex={2100}
        transform={showDrawer ? 'translateX(0)' : 'translateX(100%)'}
        transition="transform 0.3s ease-in-out"
        display="flex"
        flexDirection="column"
      >
        {/* Drawer Header */}
        <Box
          px={4}
          height={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          pt="env(safe-area-inset-top)"
          display="flex"
          alignItems="center"
          borderBottomWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Flex justify="space-between" align="center" width="full">
            <HStack gap={2}>
              <Filter size={20} />
              <Heading size="md">{t('title') || 'Bộ lọc'}</Heading>
            </HStack>
            <IconButton
              variant="ghost"
              onClick={toggleDrawer}
              aria-label="Đóng"
              icon={<X size={20} />}
            />
          </Flex>
        </Box>

        {/* Drawer Body */}
        <Box flex="1" overflowY="auto" p={5}>
          <VStack align="stretch" gap={5}>
            {/* Status Filter */}
            {showStatusFilter && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      {t('sessionStatus')}
                    </Text>
                    {pendingStatus && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        1
                      </Badge>
                    )}
                  </HStack>
                  {pendingStatus && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingStatus(undefined)}
                      colorPalette="red"
                      fontWeight="semibold"
                    >
                      <X size={14} /> <Text ml={1}>Xóa</Text>
                    </Button>
                  )}
                </Flex>
                <Flex gap={2} flexWrap="wrap">
                  {statusItems.map((item) => (
                    <Badge
                      key={item.value}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingStatus === item.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingStatus === item.value ? 'green' : 'gray'
                      }
                      onClick={() =>
                        setPendingStatus(
                          pendingStatus === item.value ? undefined : item.value
                        )
                      }
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={pendingStatus === item.value ? '0' : '2px'}
                    >
                      {item.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}

            {showStatusFilter && showDateFilter && (
              <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
            )}

            {/* Date Filter */}
            {showDateFilter && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      {t('date')}
                    </Text>
                    {pendingDate && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        1
                      </Badge>
                    )}
                  </HStack>
                  {pendingDate && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingDate(undefined)}
                      colorPalette="red"
                      fontWeight="semibold"
                    >
                      <X size={14} /> <Text ml={1}>Xóa</Text>
                    </Button>
                  )}
                </Flex>
                <VDateTimeInput
                  type="date"
                  value={pendingDate || ''}
                  onChange={(e) => setPendingDate(e.target.value || undefined)}
                  bg="gray.50"
                  borderColor="gray.200"
                  h="44px"
                  fontSize="sm"
                  _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                  leftElement={<Calendar size={16} style={{ opacity: 0.6 }} />}
                  borderRadius="lg"
                  placeholder={t('date')}
                />
              </Box>
            )}

            {/* Time Range Filter */}
            {showTimeFilter && (
              <>
                <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
                <Box>
                  <HStack gap={2} mb={3}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      ⏰ {tSession('timeRange')}
                    </Text>
                    {pendingTimeRanges.length > 0 && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {pendingTimeRanges.length}
                      </Badge>
                    )}
                  </HStack>
                  <Flex gap={2} flexWrap="wrap">
                    {TIME_RANGES.map((range) => {
                      const isSelected = pendingTimeRanges.includes(range.key);
                      return (
                        <Badge
                          key={range.key}
                          px={4}
                          py={2}
                          borderRadius="full"
                          cursor="pointer"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorPalette={isSelected ? 'orange' : 'gray'}
                          onClick={() =>
                            setPendingTimeRanges(
                              isSelected
                                ? pendingTimeRanges.filter(
                                    (r) => r !== range.key
                                  )
                                : [...pendingTimeRanges, range.key]
                            )
                          }
                          fontSize="sm"
                          fontWeight="semibold"
                          transition="all 0.2s"
                          _hover={{ transform: 'scale(1.05)' }}
                          borderWidth={isSelected ? '0' : '2px'}
                        >
                          {tSession(`timeRanges.${range.key}`)}
                        </Badge>
                      );
                    })}
                  </Flex>
                </Box>
              </>
            )}

            {/* Level Filter */}
            {showLevelFilter && (
              <>
                <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
                <Box>
                  <Flex justify="space-between" align="center" mb={3}>
                    <HStack gap={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.700"
                        _dark={{ color: 'gray.200' }}
                      >
                        🏸 {tCommon('selectLevel')}
                      </Text>
                      {pendingLevels.length > 0 && (
                        <Badge
                          size="sm"
                          colorPalette="green"
                          variant="solid"
                          borderRadius="full"
                          px={2}
                        >
                          {pendingLevels.length}
                        </Badge>
                      )}
                    </HStack>
                    {pendingLevels.length > 0 && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setPendingLevels([])}
                        colorPalette="red"
                        fontWeight="semibold"
                      >
                        <X size={14} /> <Text ml={1}>Xóa</Text>
                      </Button>
                    )}
                  </Flex>
                  <Flex gap={2} flexWrap="wrap">
                    {levelItems.map((item) => {
                      const isSelected = pendingLevels.includes(item.value);
                      return (
                        <Badge
                          key={item.value}
                          px={3.5}
                          py={1.5}
                          borderRadius="full"
                          cursor="pointer"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorPalette={isSelected ? item.colorPalette : 'gray'}
                          onClick={() =>
                            setPendingLevels(
                              isSelected
                                ? pendingLevels.filter((l) => l !== item.value)
                                : [...pendingLevels, item.value]
                            )
                          }
                          fontSize="sm"
                          fontWeight="bold"
                          transition="all 0.2s"
                          _hover={{ transform: 'scale(1.1)' }}
                          borderWidth={isSelected ? '0' : '2px'}
                        >
                          {item.label}
                        </Badge>
                      );
                    })}
                  </Flex>
                </Box>
              </>
            )}

            {/* Fee Filter */}
            {showFeeFilter && (
              <>
                <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.700"
                    _dark={{ color: 'gray.200' }}
                    mb={3}
                  >
                    💰 {t('cost')}
                  </Text>
                  <Flex gap={4} align="center" wrap="wrap">
                    <HStack gap={2}>
                      <Input
                        size="md"
                        type="number"
                        width="110px"
                        value={pendingMinFee}
                        onChange={(e) =>
                          setPendingMinFee(Number(e.target.value))
                        }
                        step={5000}
                        min={0}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor="gray.300"
                        color="gray.800"
                        bg="white"
                        _hover={{ borderColor: 'brand.400' }}
                        _focus={{ borderColor: 'brand.500', shadow: 'outline' }}
                        _dark={{
                          color: 'white',
                          bg: 'gray.700',
                          borderColor: 'gray.600',
                        }}
                      />
                      <Text fontSize="md" fontWeight="bold" color="gray.500">
                        →
                      </Text>
                      <Input
                        size="md"
                        type="number"
                        width="110px"
                        value={pendingMaxFee}
                        onChange={(e) =>
                          setPendingMaxFee(Number(e.target.value))
                        }
                        step={5000}
                        min={0}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor="gray.300"
                        color="gray.800"
                        bg="white"
                        _hover={{ borderColor: 'brand.400' }}
                        _focus={{ borderColor: 'brand.500', shadow: 'outline' }}
                        _dark={{
                          color: 'white',
                          bg: 'gray.700',
                          borderColor: 'gray.600',
                        }}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.600"
                      >
                        VND
                      </Text>
                    </HStack>
                    <Box
                      as="label"
                      cursor="pointer"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={pendingSplitEvenly ? 'brand.50' : 'transparent'}
                      _dark={{
                        bg: pendingSplitEvenly ? 'brand.900' : 'transparent',
                      }}
                      borderWidth="2px"
                      borderColor={
                        pendingSplitEvenly ? 'brand.400' : 'gray.300'
                      }
                      transition="all 0.2s"
                      _hover={{ borderColor: 'brand.400' }}
                    >
                      <input
                        type="checkbox"
                        checked={pendingSplitEvenly}
                        onChange={(e) =>
                          setPendingSplitEvenly(e.target.checked)
                        }
                        style={{ cursor: 'pointer' }}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={pendingSplitEvenly ? 'brand.700' : 'gray.700'}
                        _dark={{
                          color: pendingSplitEvenly ? 'brand.200' : 'gray.200',
                        }}
                      >
                        {t('splitEvenly')}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </>
            )}
          </VStack>
        </Box>

        {/* Drawer Footer */}
        <Box
          p={4}
          pb={{ base: 'calc(16px + env(safe-area-inset-bottom))', md: 4 }}
          borderTopWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
          _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
        >
          <Flex gap={3}>
            <Button
              flex="1"
              variant="solid"
              colorPalette="green"
              onClick={handleSubmitFilters}
              leftIcon={<Check size={18} />}
            >
              {t('applySearch')}
            </Button>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={handleResetFilters}
              leftIcon={<X size={18} />}
            >
              {t('reset')}
            </Button>
          </Flex>
        </Box>
      </Box>
    </>
  );
};

export default SessionFilters;
