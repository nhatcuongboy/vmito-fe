'use client';

import { Button, IconButton, Input } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { VALID_LEVELS } from '@/constants/levels';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Check, Filter, MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { SessionFilterDrawerProps } from './SessionFilterDrawer.types';
import {
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  TIME_RANGES,
} from '@/constants';

type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];

export default function SessionFilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  sortByDistance,
  setSortByDistance,
  onSubmit,
  onReset,
  activeFilterCount,
  userLocation,
  setUserLocation,
}: SessionFilterDrawerProps) {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();

  // Handle Location
  const handleNearMe = async () => {
    if (sortByDistance) {
      // Toggle off
      setSortByDistance(false);
      return;
    }

    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setSortByDistance(true);
    } catch (error: any) {
      toaster.error({
        title: t('filters.locationPermissionDenied'),
        description: error.message,
      });
      setSortByDistance(false);
    }
  };

  const toggleLevel = (level: number) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
    setFilters({ ...filters, levels: newLevels });
  };

  const toggleTimeRange = (rangeKey: TimeRangeKey) => {
    const newTimeRanges = filters.timeRanges.includes(rangeKey)
      ? filters.timeRanges.filter((r) => r !== rangeKey)
      : [...filters.timeRanges, rangeKey];
    setFilters({ ...filters, timeRanges: newTimeRanges });
  };

  const toggleCity = (cityCode: string) => {
    const newCities = filters.cities.includes(cityCode)
      ? filters.cities.filter((c) => c !== cityCode)
      : [...filters.cities, cityCode];
    setFilters({ ...filters, cities: newCities });
  };

  const toggleDistrict = (districtName: string) => {
    const newDistricts = filters.districts.includes(districtName)
      ? filters.districts.filter((d) => d !== districtName)
      : [...filters.districts, districtName];
    setFilters({ ...filters, districts: newDistricts });
  };

  const clearLocation = () => {
    setFilters({ ...filters, cities: [], districts: [] });
  };

  // Derived data for display
  const availableDistricts = useMemo(() => {
    if (filters.cities.length === 0) return [];
    return VIETNAM_CITIES.filter((city) =>
      filters.cities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [filters.cities]);

  return (
    <>
      {/* Filter Drawer Overlay */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          onClick={onClose}
        />
      )}

      {/* Filter Drawer - Slide from Right */}
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
        transform={isOpen ? 'translateX(0)' : 'translateX(100%)'}
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
              <Heading size="md">{t('filters.title') || 'Bộ lọc'}</Heading>
              {activeFilterCount > 0 && (
                <Badge
                  colorPalette="green"
                  variant="solid"
                  borderRadius="full"
                  px={2}
                >
                  {activeFilterCount}
                </Badge>
              )}
            </HStack>
            <IconButton
              variant="ghost"
              onClick={onClose}
              aria-label="Close filters"
              icon={<X size={20} />}
            />
          </Flex>
        </Box>

        {/* Drawer Body - Scrollable */}
        <Box flex="1" overflowY="auto" p={5}>
          <VStack align="stretch" gap={5}>
            {/* Date & Time Range Section */}
            <Box>
              <Flex gap={3} wrap="wrap" align="flex-end">
                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.500"
                    mb={1.5}
                    textTransform="uppercase"
                  >
                    {t('filters.date') || 'Ngày'}
                  </Text>
                  <Flex align="center" gap={2}>
                    <Box position="relative" flex="1">
                      <Input
                        type="date"
                        size="md"
                        width="auto"
                        minW="160px"
                        value={filters.date}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            date: e.target.value,
                          })
                        }
                        onInput={(e) => {
                          // Handle iOS date picker Reset button
                          const target = e.target as HTMLInputElement;
                          if (target.value === '') {
                            setFilters({ ...filters, date: '' });
                          }
                        }}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor="gray.300"
                        color="gray.800"
                        bg="white"
                        px={3}
                        _hover={{ borderColor: 'brand.400' }}
                        _focus={{ borderColor: 'brand.500', shadow: 'outline' }}
                        _dark={{
                          color: 'white',
                          bg: 'gray.700',
                          borderColor: 'gray.600',
                          _hover: { borderColor: 'brand.400' },
                        }}
                        css={{
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
                          // Hide native placeholder fields when empty to show custom overlay
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
                      {/* Placeholder overlay for iOS */}
                      {!filters.date && (
                        <Box
                          position="absolute"
                          left="12px"
                          top="50%"
                          transform="translateY(-50%)"
                          color="gray.400"
                          pointerEvents="none"
                          fontSize="md"
                          userSelect="none"
                        >
                          {t('filters.allDays')}
                        </Box>
                      )}
                    </Box>
                    {/* Clear date button */}
                    {filters.date && (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorPalette="gray"
                        onClick={() => setFilters({ ...filters, date: '' })}
                        aria-label="Clear date"
                        icon={<X size={16} />}
                      />
                    )}
                  </Flex>
                </Box>

                <Box minW="250px">
                  <HStack gap={2} mb={1.5}>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.500"
                      textTransform="uppercase"
                    >
                      ⏰ {t('timeRange')}
                    </Text>
                    {filters.timeRanges.length > 0 && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {filters.timeRanges.length}
                      </Badge>
                    )}
                  </HStack>
                  <Flex gap={2} flexWrap="wrap">
                    {TIME_RANGES.map((range) => {
                      const isSelected = filters.timeRanges.includes(range.key);
                      return (
                        <Badge
                          key={range.key}
                          px={4}
                          py={1.5}
                          borderRadius="full"
                          cursor="pointer"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorPalette={isSelected ? 'orange' : 'gray'}
                          onClick={() => toggleTimeRange(range.key)}
                          fontSize="sm"
                          fontWeight="semibold"
                          transition="all 0.2s"
                          _hover={{ transform: 'scale(1.05)' }}
                          borderWidth={isSelected ? '0' : '2px'}
                        >
                          {t(`timeRanges.${range.key}`)}
                        </Badge>
                      );
                    })}
                  </Flex>
                </Box>

                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.500"
                    mb={1.5}
                    textTransform="uppercase"
                  >
                    🚀 {t('filters.quickFilters') || 'Lọc nhanh'}
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    <Badge
                      px={5}
                      py={2}
                      borderRadius="full"
                      cursor="pointer"
                      variant={filters.hasSlots ? 'solid' : 'outline'}
                      colorPalette={filters.hasSlots ? 'green' : 'gray'}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          hasSlots: !filters.hasSlots,
                        })
                      }
                      fontSize="sm"
                      fontWeight="semibold"
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      borderWidth={filters.hasSlots ? '0' : '2px'}
                    >
                      {t('filters.availableSlots')}
                    </Badge>
                    <Badge
                      px={5}
                      py={2}
                      borderRadius="full"
                      cursor="pointer"
                      variant={sortByDistance ? 'solid' : 'outline'}
                      colorPalette={sortByDistance ? 'green' : 'gray'}
                      onClick={handleNearMe}
                      fontSize="sm"
                      fontWeight="semibold"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      borderWidth={sortByDistance ? '0' : '2px'}
                    >
                      <MapPin size={16} />
                      {t('filters.nearMe')}
                    </Badge>
                  </Flex>
                </Box>
              </Flex>
            </Box>

            {/* Divider */}
            <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

            {/* Location Section */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <HStack gap={2}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.700"
                    _dark={{ color: 'gray.200' }}
                  >
                    📍 {t('filters.area')}
                  </Text>
                  {filters.cities.length > 0 && (
                    <Badge
                      size="sm"
                      colorPalette="green"
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      {filters.cities.length}
                    </Badge>
                  )}
                </HStack>
                {filters.cities.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={clearLocation}
                    colorPalette="red"
                    fontWeight="semibold"
                  >
                    <X size={14} /> <Text ml={1}>Xóa</Text>
                  </Button>
                )}
              </Flex>
              <Flex gap={2} flexWrap="wrap">
                {VIETNAM_CITIES.map((city) => (
                  <Badge
                    key={city.code}
                    px={4}
                    py={2}
                    borderRadius="lg"
                    cursor="pointer"
                    variant={
                      filters.cities.includes(city.code) ? 'solid' : 'outline'
                    }
                    colorPalette={
                      filters.cities.includes(city.code) ? 'green' : 'gray'
                    }
                    onClick={() => toggleCity(city.code)}
                    fontSize="sm"
                    fontWeight="medium"
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.05)' }}
                    borderWidth={
                      filters.cities.includes(city.code) ? '0' : '2px'
                    }
                  >
                    {city.name}
                  </Badge>
                ))}
              </Flex>
            </Box>

            {/* District Selection */}
            {filters.cities.length > 0 && availableDistricts.length > 0 && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      🏘️ {t('filters.allDistricts')}
                    </Text>
                    {filters.districts.length > 0 && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {filters.districts.length}
                      </Badge>
                    )}
                  </HStack>
                  {filters.districts.length > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          districts: [],
                        })
                      }
                      colorPalette="red"
                      fontWeight="semibold"
                    >
                      <X size={14} /> <Text ml={1}>Xóa</Text>
                    </Button>
                  )}
                </Flex>
                <Flex
                  gap={2}
                  flexWrap="wrap"
                  maxH="120px"
                  overflowY="auto"
                  css={{
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    },
                  }}
                >
                  {availableDistricts.map((district) => (
                    <Badge
                      key={district.code}
                      px={3}
                      py={1.5}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        filters.districts.includes(district.name)
                          ? 'solid'
                          : 'outline'
                      }
                      colorPalette={
                        filters.districts.includes(district.name)
                          ? 'brand'
                          : 'gray'
                      }
                      onClick={() => toggleDistrict(district.name)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={
                        filters.districts.includes(district.name) ? '0' : '2px'
                      }
                    >
                      {district.name}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Divider */}
            <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

            {/* Skill Level Section */}
            <Box>
              <HStack gap={2} mb={3}>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                >
                  🏸 {t('level')}
                </Text>
                {filters.levels.length > 0 && (
                  <Badge
                    size="sm"
                    colorPalette="green"
                    variant="solid"
                    borderRadius="full"
                    px={2}
                  >
                    {filters.levels.length}
                  </Badge>
                )}
              </HStack>
              <Flex gap={2} flexWrap="wrap">
                {VALID_LEVELS.map((level) => {
                  const skillColor = getSkillLevelColor([level]);
                  const isSelected = filters.levels.includes(level);
                  return (
                    <Badge
                      key={level}
                      px={3.5}
                      py={1.5}
                      borderRadius="full"
                      cursor="pointer"
                      variant={isSelected ? 'solid' : 'outline'}
                      colorPalette={
                        isSelected ? skillColor.colorPalette : 'gray'
                      }
                      onClick={() => toggleLevel(level)}
                      fontSize="sm"
                      fontWeight="bold"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.1)' }}
                      borderWidth={isSelected ? '0' : '2px'}
                    >
                      {getLevelShortLabel(level)}
                    </Badge>
                  );
                })}
              </Flex>
            </Box>

            {/* Divider */}
            <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

            {/* Fee Section */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="gray.700"
                _dark={{ color: 'gray.200' }}
                mb={3}
              >
                💰 {t('filters.cost')}
              </Text>
              <Flex gap={4} align="center" wrap="wrap">
                <HStack gap={2}>
                  <Input
                    size="md"
                    type="number"
                    width="110px"
                    value={filters.minFee}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minFee: Number(e.target.value),
                      })
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
                    value={filters.maxFee}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxFee: Number(e.target.value),
                      })
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
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600">
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
                  bg={filters.splitEvenly ? 'brand.50' : 'transparent'}
                  _dark={{
                    bg: filters.splitEvenly ? 'brand.900' : 'transparent',
                  }}
                  borderWidth="2px"
                  borderColor={filters.splitEvenly ? 'brand.400' : 'gray.300'}
                  transition="all 0.2s"
                  _hover={{ borderColor: 'brand.400' }}
                >
                  <input
                    type="checkbox"
                    checked={filters.splitEvenly}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        splitEvenly: e.target.checked,
                      })
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color={filters.splitEvenly ? 'brand.700' : 'gray.700'}
                    _dark={{
                      color: filters.splitEvenly ? 'brand.200' : 'gray.200',
                    }}
                  >
                    {t('filters.splitEvenly')}
                  </Text>
                </Box>
              </Flex>
            </Box>
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
              onClick={onSubmit}
              leftIcon={<Check size={18} />}
            >
              {t('filters.applySearch') || 'Tìm kiếm'}
            </Button>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={onReset}
              leftIcon={<X size={18} />}
            >
              {t('filters.reset') || 'Đặt lại'}
            </Button>
          </Flex>
        </Box>
      </Box>
    </>
  );
}
