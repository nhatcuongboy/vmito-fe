'use client';

import { Button, IconButton, Input } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { toaster } from '@/components/ui/toaster';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowDownAZ,
  CalendarArrowDown,
  Check,
  ChevronDown,
  Filter,
  Grid2X2,
  MapPin,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import VenueCard from './VenueCard';
import VenueCardSkeleton from './VenueCardSkeleton';
import {
  useUrlFilters,
  stringField,
  stringArrayField,
  booleanField,
} from '@/hooks/useUrlFilters';

const PAGE_SIZE = 12;

// Sort option definition
interface ISortOption {
  value: string;
  label: string;
  sortBy: 'name' | 'createdAt' | 'numberOfCourts' | 'hourlyRateFixed';
  sortOrder: 'asc' | 'desc';
  icon: React.ComponentType<{ size?: number }>;
}

const SORT_OPTIONS: ISortOption[] = [
  {
    value: 'newest',
    label: 'Mới nhất',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    icon: CalendarArrowDown,
  },
  {
    value: 'name_asc',
    label: 'Tên A→Z',
    sortBy: 'name',
    sortOrder: 'asc',
    icon: ArrowDownAZ,
  },
  {
    value: 'price_asc',
    label: 'Giá thấp nhất',
    sortBy: 'hourlyRateFixed',
    sortOrder: 'asc',
    icon: TrendingUp,
  },
  {
    value: 'courts_desc',
    label: 'Nhiều sân nhất',
    sortBy: 'numberOfCourts',
    sortOrder: 'desc',
    icon: Grid2X2,
  },
];

// URL filter schema for the venue search page.
// q        → keyword (string)
// city     → comma-separated city codes  (e.g. "HCM,HN")
// district → comma-separated district names (e.g. "Bình Thạnh,Quận 1")
// near     → sort by distance flag       ("1" = true)
// sort     → active sort option value    (e.g. "newest", "name_asc")
const VENUE_FILTERS_SCHEMA = {
  q: stringField(''),
  city: stringArrayField(),
  district: stringArrayField(),
  near: booleanField(false),
  sort: stringField('name_asc'),
};

export default function VenueSearchList() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL-synced applied filters
  const [filters, setFilters, resetFilters] =
    useUrlFilters(VENUE_FILTERS_SCHEMA);

  // Local keyword state drives the search input; synced to URL with debounce.
  const [keyword, setKeyword] = useState(filters.q);

  // User location is never stored in URL (privacy).
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Pending filters (for drawer)
  const [pendingCities, setPendingCities] = useState<string[]>([]);
  const [pendingDistricts, setPendingDistricts] = useState<string[]>([]);
  const [pendingSortByDistance, setPendingSortByDistance] = useState(false);
  const [pendingUserLocation, setPendingUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Stable string keys for array filters — used in useEffect dependency arrays.
  const citiesKey = filters.city.join(',');
  const districtsKey = filters.district.join(',');

  // Sync pending filters when drawer opens.
  useEffect(() => {
    if (showFilters) {
      setPendingCities(filters.city);
      setPendingDistricts(filters.district);
      setPendingSortByDistance(filters.near);
      setPendingUserLocation(userLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  // Plain function (not useCallback) to always read the latest `page` state
  const fetchVenues = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setError(null);

      const currentPage = isLoadMore ? page + 1 : 1;

      // Resolve the active sort option
      const activeSortOption =
        SORT_OPTIONS.find((opt) => opt.value === filters.sort) ??
        SORT_OPTIONS[0];

      const apiFilters: Record<string, string | number | boolean | undefined> =
        {
          keyword: filters.q || undefined,
          city:
            filters.city.length === 1
              ? VIETNAM_CITIES.find((c) => c.code === filters.city[0])?.name
              : undefined,
          district:
            filters.district.length === 1 ? filters.district[0] : undefined,
          page: currentPage,
          limit: PAGE_SIZE,
        };

      if (filters.near && userLocation) {
        // Distance sort overrides the sort bar when "Near me" is active
        apiFilters.lat = userLocation.lat;
        apiFilters.lng = userLocation.lng;
        apiFilters.sortBy = 'distance';
        apiFilters.sortOrder = 'asc';
      } else {
        apiFilters.sortBy = activeSortOption.sortBy;
        apiFilters.sortOrder = activeSortOption.sortOrder;
      }

      const result = await VenueService.searchVenues(apiFilters);
      setTotalCount(result.pagination.total);
      let venueData = result.data;

      // Client-side multi-city filter
      if (filters.city.length > 1) {
        venueData = venueData.filter((venue) => {
          const venueCity = venue.city || '';
          return filters.city.some((cityCode) => {
            const cityName = VIETNAM_CITIES.find(
              (c) => c.code === cityCode
            )?.name;
            return (
              venueCity.includes(cityCode) ||
              (cityName && venueCity.includes(cityName))
            );
          });
        });
      }

      // Client-side multi-district filter
      if (filters.district.length > 1) {
        venueData = venueData.filter((venue) => {
          const venueDistrict = venue.district || '';
          return filters.district.some(
            (d) => venueDistrict.toLowerCase() === d.toLowerCase()
          );
        });
      }

      if (isLoadMore) {
        setVenues((prev) => [...prev, ...venueData]);
        setPage(currentPage);
      } else {
        setVenues(venueData);
      }

      setHasMore(result.data.length === PAGE_SIZE);
    } catch (err) {
      setError('Không thể tải danh sách sân. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Sync keyword input → URL with 500 ms debounce (avoids polluting history on every keystroke).
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ q: keyword });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Keep the input display in sync when the URL changes externally (browser back/forward).
  useEffect(() => {
    setKeyword(filters.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  // Fetch whenever URL-applied filters, sort, or user location change.
  useEffect(() => {
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    citiesKey,
    districtsKey,
    filters.near,
    filters.sort,
    userLocation,
  ]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchVenues(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Near me handler
  const handleNearMe = async () => {
    if (pendingSortByDistance) {
      setPendingSortByDistance(false);
      setPendingUserLocation(null);
      return;
    }
    try {
      const location = await getUserLocation();
      setPendingUserLocation(location);
      setPendingSortByDistance(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toaster.error({
        title: 'Không thể lấy vị trí',
        description: message,
      });
    }
  };

  // Pending filter helpers
  const togglePendingCity = (cityCode: string) => {
    setPendingCities((prev) =>
      prev.includes(cityCode)
        ? prev.filter((c) => c !== cityCode)
        : [...prev, cityCode]
    );
    setPendingDistricts([]);
  };

  const togglePendingDistrict = (districtName: string) => {
    setPendingDistricts((prev) =>
      prev.includes(districtName)
        ? prev.filter((d) => d !== districtName)
        : [...prev, districtName]
    );
  };

  const handleSubmitFilters = () => {
    setFilters({
      city: pendingCities,
      district: pendingDistricts,
      near: pendingSortByDistance,
    });
    setUserLocation(pendingUserLocation ?? null);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingCities([]);
    setPendingDistricts([]);
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
  };

  const clearAllFilters = () => {
    setKeyword('');
    resetFilters();
    setUserLocation(null);
  };

  // Handle sort chip click — clear "near" if it was active
  const handleSortChange = (value: string) => {
    if (filters.near) {
      setFilters({ sort: value, near: false });
      setUserLocation(null);
    } else {
      setFilters({ sort: value });
    }
  };

  const removeCity = (cityCode: string) => {
    const nextCities = filters.city.filter((c) => c !== cityCode);
    setFilters({
      city: nextCities,
      ...(nextCities.length === 0 ? { district: [] } : {}),
    });
  };

  const removeDistrict = (districtName: string) => {
    setFilters({
      district: filters.district.filter((d) => d !== districtName),
    });
  };

  const activeFilterCount =
    (filters.q ? 1 : 0) +
    filters.city.length +
    filters.district.length +
    (filters.near ? 1 : 0);

  // Sort dropdown state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const activeSortOption =
    SORT_OPTIONS.find((opt) => opt.value === filters.sort) ?? SORT_OPTIONS[0];

  // When "near me" is active, distance sort overrides; show MapPin label
  const sortButtonLabel = filters.near ? 'Gần tôi' : activeSortOption.label;
  const SortButtonIcon = filters.near ? MapPin : activeSortOption.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const availableDistricts = useMemo(() => {
    if (pendingCities.length === 0) return [];
    return VIETNAM_CITIES.filter((city) =>
      pendingCities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [pendingCities]);

  return (
    <Box>
      {/* Search Bar - Sticky */}
      <Box
        position="sticky"
        top={{
          base: `${TOP_BAR_HEIGHT_MOBILE}px`,
          md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
        }}
        zIndex={100}
        mb={6}
      >
        {/* Search & filter row */}
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
              placeholder="Tìm sân cầu lông..."
              value={keyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setKeyword(e.target.value)
              }
              bg="white"
              _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
              borderRadius="md"
              leftElement={<Search size={18} />}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                bg: 'white',
                _dark: {
                  bg: 'gray.600',
                },
              }}
              fontSize="sm"
              transition="all 0.2s"
            />
          </Box>

          <Box position="relative">
            <IconButton
              h="36px"
              w="36px"
              minW="36px"
              variant="solid"
              colorPalette="green"
              onClick={toggleFilters}
              aria-label="Bộ lọc"
              icon={<Filter size={18} />}
              borderRadius="md"
              transition="all 0.2s"
              _hover={{
                transform: 'scale(1.05)',
              }}
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

      {/* Results bar: count + sort dropdown */}
      {!loading && (
        <Flex
          justify="space-between"
          align="center"
          mb={
            filters.city.length > 0 ||
            filters.district.length > 0 ||
            filters.near
              ? 2
              : 4
          }
          minH="28px"
        >
          {/* Count */}
          <Text
            fontSize="sm"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
            flexShrink={0}
          >
            {totalCount !== null ? `${totalCount} kết quả` : ''}
          </Text>

          {/* Sort dropdown */}
          <Box position="relative" ref={sortDropdownRef}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSortOpen((v) => !v)}
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
              <SortButtonIcon size={14} />
              <Text as="span" maxW="110px" truncate>
                {sortButtonLabel}
              </Text>
              <ChevronDown
                size={13}
                style={{
                  transition: 'transform 0.2s',
                  transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Button>

            {isSortOpen && (
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
                {SORT_OPTIONS.map((opt) => {
                  const OptionIcon = opt.icon;
                  const isActive = !filters.near && opt.value === filters.sort;
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
                      onClick={() => {
                        handleSortChange(opt.value);
                        setIsSortOpen(false);
                      }}
                    >
                      <OptionIcon size={14} />
                      <Text flex={1}>{opt.label}</Text>
                      {isActive && <Check size={13} />}
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Box>
        </Flex>
      )}

      {/* Active filter chips */}
      {!loading &&
        (filters.city.length > 0 ||
          filters.district.length > 0 ||
          filters.near) && (
          <Flex align="center" flexWrap="wrap" gap={2} mb={4} minH="28px">
            {filters.near && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="semibold"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <MapPin size={11} />
                Gần tôi
                <Box
                  as="span"
                  cursor="pointer"
                  display="inline-flex"
                  alignItems="center"
                  onClick={() => {
                    setFilters({ near: false });
                    setUserLocation(null);
                  }}
                  _hover={{ color: 'blue.700' }}
                >
                  <X size={12} />
                </Box>
              </Badge>
            )}

            {filters.city.map((cityCode) => {
              const cityName =
                VIETNAM_CITIES.find((c) => c.code === cityCode)?.name ??
                cityCode;
              return (
                <Badge
                  key={cityCode}
                  colorPalette="green"
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  {cityName}
                  <Box
                    as="span"
                    cursor="pointer"
                    display="inline-flex"
                    alignItems="center"
                    onClick={() => removeCity(cityCode)}
                    _hover={{ color: 'green.700' }}
                  >
                    <X size={12} />
                  </Box>
                </Badge>
              );
            })}

            {filters.district.map((districtName) => (
              <Badge
                key={districtName}
                colorPalette="purple"
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="semibold"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                {districtName}
                <Box
                  as="span"
                  cursor="pointer"
                  display="inline-flex"
                  alignItems="center"
                  onClick={() => removeDistrict(districtName)}
                  _hover={{ color: 'purple.700' }}
                >
                  <X size={12} />
                </Box>
              </Badge>
            ))}
          </Flex>
        )}

      {/* Filter Drawer Overlay */}
      {showFilters && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          onClick={toggleFilters}
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
        transform={showFilters ? 'translateX(0)' : 'translateX(100%)'}
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
              <Heading size="md">Bộ lọc</Heading>
            </HStack>
            <IconButton
              variant="ghost"
              onClick={toggleFilters}
              aria-label="Đóng"
              icon={<X size={20} />}
            />
          </Flex>
        </Box>

        {/* Drawer Body */}
        <Box flex="1" overflowY="auto" p={5}>
          <VStack align="stretch" gap={5}>
            {/* Near Me */}
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                mb={2}
                textTransform="uppercase"
              >
                Lọc nhanh
              </Text>
              <Badge
                px={5}
                py={2}
                borderRadius="full"
                cursor="pointer"
                variant={pendingSortByDistance ? 'solid' : 'outline'}
                colorPalette={pendingSortByDistance ? 'green' : 'gray'}
                onClick={handleNearMe}
                fontSize="sm"
                fontWeight="semibold"
                display="flex"
                alignItems="center"
                gap={2}
                width="fit-content"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                borderWidth={pendingSortByDistance ? '0' : '2px'}
              >
                <MapPin size={16} />
                Gần tôi
              </Badge>
            </Box>

            <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

            {/* City Selection */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <HStack gap={2}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.700"
                    _dark={{ color: 'gray.200' }}
                  >
                    Khu vực
                  </Text>
                  {pendingCities.length > 0 && (
                    <Badge
                      size="sm"
                      colorPalette="green"
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      {pendingCities.length}
                    </Badge>
                  )}
                </HStack>
                {pendingCities.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setPendingCities([]);
                      setPendingDistricts([]);
                    }}
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
                      pendingCities.includes(city.code) ? 'solid' : 'outline'
                    }
                    colorPalette={
                      pendingCities.includes(city.code) ? 'green' : 'gray'
                    }
                    onClick={() => togglePendingCity(city.code)}
                    fontSize="sm"
                    fontWeight="medium"
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.05)' }}
                    borderWidth={
                      pendingCities.includes(city.code) ? '0' : '2px'
                    }
                  >
                    {city.name}
                  </Badge>
                ))}
              </Flex>
            </Box>

            {/* District Selection */}
            {pendingCities.length > 0 && availableDistricts.length > 0 && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      Quận / Huyện
                    </Text>
                    {pendingDistricts.length > 0 && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {pendingDistricts.length}
                      </Badge>
                    )}
                  </HStack>
                  {pendingDistricts.length > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingDistricts([])}
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
                        pendingDistricts.includes(district.name)
                          ? 'solid'
                          : 'outline'
                      }
                      colorPalette={
                        pendingDistricts.includes(district.name)
                          ? 'green'
                          : 'gray'
                      }
                      onClick={() => togglePendingDistrict(district.name)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={
                        pendingDistricts.includes(district.name) ? '0' : '2px'
                      }
                    >
                      {district.name}
                    </Badge>
                  ))}
                </Flex>
              </Box>
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
              Tìm kiếm
            </Button>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={handleResetFilters}
              leftIcon={<X size={18} />}
            >
              Đặt lại
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* Results */}
      {loading ? (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <VenueCardSkeleton key={i} />
          ))}
        </Grid>
      ) : error ? (
        <Box
          p={4}
          bg="red.50"
          color="red.600"
          borderRadius="md"
          borderWidth="1px"
          borderColor="red.200"
        >
          <Text fontWeight="medium">{error}</Text>
        </Box>
      ) : venues.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          px={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        >
          <Heading size="md" mb={2}>
            Không tìm thấy sân nào
          </Heading>
          <Text color="gray.500">
            Thử thay đổi từ khóa hoặc bộ lọc để tìm sân phù hợp.
          </Text>
          {activeFilterCount > 0 && (
            <Button
              mt={4}
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
            >
              Xóa bộ lọc
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </Grid>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <Box ref={ref} mt={8} mb={10} width="full">
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }}
                gap={6}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <VenueCardSkeleton key={i} />
                ))}
              </Grid>
              <Flex justify="center" mt={4}>
                <Text color="gray.500" fontSize="sm">
                  Đang tải thêm...
                </Text>
              </Flex>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
