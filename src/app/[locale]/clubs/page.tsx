'use client';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { toaster } from '@/components/ui/toaster';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { getUserLocation } from '@/lib/utils/geolocation.utils';

import { useState, useEffect, useMemo } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Check, Filter, MapPin, RefreshCw, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ClubsService } from '@/lib/api/clubs.service';
import ClubCard from '@/components/clubs/ClubCard';
import { IClubListItem } from '@/types/club';
import PageLayout from '@/components/layout/PageLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { AppSearchBar } from '@/components/common/AppSearchBar';

export default function BrowseClubsPage() {
  const t = useTranslations();

  const [clubs, setClubs] = useState<IClubListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Active filters
  const [search, setSearch] = useState('');
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
  const debouncedSearch = useDebounce(search, 500);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingCities(cities);
      setPendingDistricts(districts);
      setPendingSortByDistance(sortByDistance);
      setPendingUserLocation(userLocation);
    }
  }, [showFilters, cities, districts, sortByDistance, userLocation]);

  const fetchClubs = async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);

      const params: Record<string, string | number | undefined> = {
        page: pageNum,
        limit: 12,
        search: debouncedSearch || undefined,
        city:
          cities.length === 1
            ? VIETNAM_CITIES.find((c) => c.code === cities[0])?.name
            : undefined,
        district: districts.length === 1 ? districts[0] : undefined,
      };

      if (sortByDistance && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.sortBy = 'distance';
        params.sortOrder = 'asc';
      }

      const response = await ClubsService.browseClubs(params);
      let items = response.items || [];

      // Client-side multi-city filter
      if (cities.length > 1) {
        items = items.filter((club) => {
          const venueCity = club.defaultVenue
            ? `${club.defaultVenue.name} ${club.location || ''}`.toLowerCase()
            : (club.location || '').toLowerCase();
          return cities.some((cityCode) => {
            const cityName = VIETNAM_CITIES.find(
              (c) => c.code === cityCode
            )?.name;
            return cityName
              ? venueCity.includes(cityName.toLowerCase())
              : false;
          });
        });
      }

      // Client-side multi-district filter
      if (districts.length > 1) {
        items = items.filter((club) => {
          const venueDistrict = (club.defaultVenue as any)?.district || '';
          return districts.some(
            (d) => venueDistrict.toLowerCase() === d.toLowerCase()
          );
        });
      }

      if (append) {
        setClubs((prev) => [...prev, ...items]);
      } else {
        setClubs(items);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTotalCount(response.total);
      setTotalPages(response.totalPages || 1);
      setHasMore(pageNum < (response.totalPages || 0));
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchClubs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, cities, districts, sortByDistance, userLocation]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchClubs(nextPage, true);
  };

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
    setUserLocation(
      pendingSortByDistance ? (pendingUserLocation ?? null) : null
    );
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingCities([]);
    setPendingDistricts([]);
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
  };

  const removeCity = (cityCode: string) => {
    const next = cities.filter((c) => c !== cityCode);
    setCities(next);
    if (next.length === 0) setDistricts([]);
  };

  const removeDistrict = (districtName: string) => {
    setDistricts((prev) => prev.filter((d) => d !== districtName));
  };

  const availableDistricts = useMemo(() => {
    if (pendingCities.length === 0) return [];
    return VIETNAM_CITIES.filter((city) =>
      pendingCities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [pendingCities]);

  const activeFilterCount =
    (search ? 1 : 0) +
    cities.length +
    districts.length +
    (sortByDistance ? 1 : 0);

  return (
    <PageLayout title={t('clubs.browseClubs')}>
      {/* Search Bar - Sticky */}
      <Box
        position="sticky"
        top={{
          base: `${TOP_BAR_HEIGHT_MOBILE}px`,
          md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
        }}
        left={0}
        right={0}
        width="100vw"
        marginLeft="calc(50% - 50vw)"
        zIndex={100}
        bg="transparent"
        py={2}
        transition="all 0.2s"
      >
        <Flex align="center" gap={2} w="100%" maxW="650px" mx="auto">
          <Box flex={1} w="100%">
            <AppSearchBar
              value={search}
              onChange={setSearch}
              placeholder={t('clubs.searchPlaceholder')}
              onFilterClick={toggleFilters}
              activeFilterCount={activeFilterCount}
              showFilter={true}
            />
          </Box>
        </Flex>
      </Box>

      {/* Results info + active filter chips */}
      {!isLoading &&
        (cities.length > 0 ||
          districts.length > 0 ||
          sortByDistance ||
          totalCount !== null) && (
          <Flex align="center" flexWrap="wrap" gap={2} mb={4} minH="28px">
            {totalCount !== null && (
              <Text
                fontSize="sm"
                color="fg.muted"
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
        bg="bg"
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
          borderColor="border"
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
                color="fg.muted"
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
                    color="fg.muted"
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
                      color="fg.muted"
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
          borderColor="border"
          bg="bg.muted"
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

      {/* Content */}
      {isLoading && clubs.length === 0 ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      ) : clubs.length === 0 ? (
        <Box
          textAlign="center"
          py={16}
          px={6}
          bg="bg.muted"
          _dark={{ bg: 'gray.800' }}
          borderRadius="2xl"
        >
          <Text
            fontSize="xl"
            fontWeight="medium"
            color="fg.muted"
            _dark={{ color: 'gray.400' }}
          >
            {t('clubs.noClubsFound')}
          </Text>
          <Text mt={2} color="fg.muted" _dark={{ color: 'gray.500' }}>
            {t('clubs.noClubsFoundDescription')}
          </Text>
          {activeFilterCount > 0 && (
            <Button
              mt={4}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setCities([]);
                setDistricts([]);
                setSortByDistance(false);
                setUserLocation(null);
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Box>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </SimpleGrid>

          {hasMore && (
            <Flex justify="center" mt={8}>
              <Button
                onClick={handleLoadMore}
                loading={isLoading}
                colorPalette="green"
                variant="outline"
                size="lg"
              >
                <RefreshCw size={16} />
                {t('common.loadMore')}
              </Button>
            </Flex>
          )}
        </>
      )}
    </PageLayout>
  );
}
