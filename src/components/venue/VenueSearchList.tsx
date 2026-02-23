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
import { Check, Filter, MapPin, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import VenueCard from './VenueCard';
import VenueCardSkeleton from './VenueCardSkeleton';

const PAGE_SIZE = 12;

export default function VenueSearchList() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sortByDistance, setSortByDistance] = useState(false);
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

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingCities(cities);
      setPendingDistricts(districts);
      setPendingSortByDistance(sortByDistance);
      setPendingUserLocation(userLocation);
    }
  }, [showFilters, cities, districts, sortByDistance, userLocation]);

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

      const apiFilters: Record<string, string | number | boolean | undefined> =
        {
          keyword: keyword || undefined,
          city:
            cities.length === 1
              ? VIETNAM_CITIES.find((c) => c.code === cities[0])?.name
              : undefined,
          district: districts.length === 1 ? districts[0] : undefined,
          page: currentPage,
          limit: PAGE_SIZE,
        };

      if (sortByDistance && userLocation) {
        apiFilters.lat = userLocation.lat;
        apiFilters.lng = userLocation.lng;
        apiFilters.sortBy = 'distance';
        apiFilters.sortOrder = 'asc';
      }

      const result = await VenueService.searchVenues(apiFilters);
      setTotalCount(result.pagination.total);
      let venueData = result.data;

      // Client-side multi-city filter
      if (cities.length > 1) {
        venueData = venueData.filter((venue) => {
          const venueCity = venue.city || '';
          return cities.some((cityCode) => {
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
      if (districts.length > 1) {
        venueData = venueData.filter((venue) => {
          const venueDistrict = venue.district || '';
          return districts.some(
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

  // Debounced fetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVenues();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, cities, districts, sortByDistance, userLocation]);

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
    } catch (err: any) {
      toaster.error({
        title: 'Không thể lấy vị trí',
        description: err.message,
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
    setCities(pendingCities);
    setDistricts(pendingDistricts);
    setSortByDistance(pendingSortByDistance);
    if (pendingUserLocation) {
      setUserLocation(pendingUserLocation);
    } else {
      setUserLocation(null);
    }
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
    setCities([]);
    setDistricts([]);
    setSortByDistance(false);
    setUserLocation(null);
  };

  const removeCity = (cityCode: string) => {
    const nextCities = cities.filter((c) => c !== cityCode);
    setCities(nextCities);
    if (nextCities.length === 0) setDistricts([]);
  };

  const removeDistrict = (districtName: string) => {
    setDistricts((prev) => prev.filter((d) => d !== districtName));
  };

  const activeFilterCount =
    (keyword ? 1 : 0) +
    cities.length +
    districts.length +
    (sortByDistance ? 1 : 0);

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
        <Flex
          gap={3}
          align="center"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          p={3}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="sm"
        >
          <Box flex="1" minW="200px">
            <Input
              h="44px"
              placeholder="Tìm sân cầu lông..."
              value={keyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setKeyword(e.target.value)
              }
              bg="gray.50"
              _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
              borderRadius="md"
              leftElement={<Search size={20} />}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                bg: 'white',
                _dark: {
                  bg: 'gray.600',
                },
              }}
              fontSize="md"
              transition="all 0.2s"
            />
          </Box>

          <Box position="relative">
            <IconButton
              h="44px"
              w="44px"
              variant="solid"
              colorPalette="green"
              onClick={toggleFilters}
              aria-label="Bộ lọc"
              icon={<Filter size={20} />}
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

      {/* Results info + active filter chips */}
      {!loading &&
        (cities.length > 0 ||
          districts.length > 0 ||
          sortByDistance ||
          totalCount !== null) && (
          <Flex align="center" flexWrap="wrap" gap={2} mb={4} minH="28px">
            {totalCount !== null && (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                flexShrink={0}
              >
                {totalCount} kết quả
              </Text>
            )}

            {sortByDistance && (
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
                    setSortByDistance(false);
                    setUserLocation(null);
                  }}
                  _hover={{ color: 'blue.700' }}
                >
                  <X size={12} />
                </Box>
              </Badge>
            )}

            {cities.map((cityCode) => {
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

            {districts.map((districtName) => (
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
