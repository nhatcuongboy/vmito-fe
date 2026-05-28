'use client';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowDownAZ,
  CalendarArrowDown,
  Check,
  ChevronDown,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { toaster } from '@/components/ui/toaster';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import {
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  ROUTES,
  BOTTOM_TAB_HEIGHT,
} from '@/constants';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { ClubsService } from '@/lib/api/clubs.service';
import ClubCard from '@/components/clubs/ClubCard';
import ClubCardSkeleton from '@/components/clubs/ClubCardSkeleton';
import ClubMap from '@/components/clubs/ClubMap';
import AppViewModeToggle from '@/components/common/AppViewModeToggle';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { useViewMode } from '@/hooks/useViewMode';
import { IClubListItem, IClub } from '@/types/club';
import PageLayout from '@/components/layout/PageLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { AppSearchBar } from '@/components/common/AppSearchBar';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);

const CLUB_SKELETON_COUNT = 6;

interface IClubSortOption {
  value: string;
  label: string;
  sortBy: 'distance' | 'relevance' | 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
  icon: React.ComponentType<{ size?: number }>;
}

const CLUB_SORT_OPTIONS: IClubSortOption[] = [
  {
    value: 'distance',
    label: 'Gần nhất',
    sortBy: 'distance',
    sortOrder: 'asc',
    icon: MapPin,
  },
  {
    value: 'relevance',
    label: 'Phù hợp nhất',
    sortBy: 'relevance',
    sortOrder: 'desc',
    icon: Star,
  },
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
];

function BrowseClubsContent() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [viewMode] = useViewMode('clubs');

  const [clubs, setClubs] = useState<IClubListItem[]>([]);
  const [fullClubs, setFullClubs] = useState<IClub[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFullDetails, setIsLoadingFullDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Active filters
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [sort, setSort] = useState('distance');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (sort === 'distance' && !userLocation) {
      getUserLocation()
        .then((location) => setUserLocation(location))
        .catch(() => setSort('relevance'));
    }
  }, [sort, userLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const fetchClubs = async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);
      const activeSortOption =
        CLUB_SORT_OPTIONS.find((option) => option.value === sort) ??
        CLUB_SORT_OPTIONS[0];

      const params: Record<string, string | number | undefined> = {
        page: pageNum,
        limit: 12,
        search: debouncedSearch || undefined,
        city:
          cities.length === 1
            ? VIETNAM_CITIES.find((c) => c.code === cities[0])?.name
            : undefined,
        district: districts.length === 1 ? districts[0] : undefined,
        sortBy: activeSortOption.sortBy,
        sortOrder: activeSortOption.sortOrder,
      };

      if (sortByDistance && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.sortBy = 'distance';
        params.sortOrder = 'asc';
      } else if (activeSortOption.sortBy === 'distance' && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      } else if (activeSortOption.sortBy === 'distance') {
        params.sortBy = 'relevance';
        params.sortOrder = 'desc';
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
          const venueDistrict =
            (club.defaultVenue as { district?: string } | undefined)
              ?.district ?? '';
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
  }, [debouncedSearch, cities, districts, sortByDistance, sort, userLocation]);

  // Fetch full club details when in map mode
  useEffect(() => {
    if (viewMode === 'map' && clubs.length > 0) {
      const fetchFullDetails = async () => {
        setIsLoadingFullDetails(true);
        try {
          const detailsPromises = clubs.map((club) =>
            ClubsService.getClubDetails(club.id)
          );
          const details = await Promise.all(detailsPromises);
          setFullClubs(details);
        } catch (error) {
          console.error('Failed to fetch full club details:', error);
        } finally {
          setIsLoadingFullDetails(false);
        }
      };
      fetchFullDetails();
    }
  }, [viewMode, clubs]);

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
    } catch (err: unknown) {
      toaster.error({
        title: 'Không thể lấy vị trí',
        description: err instanceof Error ? err.message : undefined,
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
    setCities([]);
    setDistricts([]);
    setSortByDistance(false);
    setUserLocation(null);
    toggleFilters();
  };

  const removeCity = (cityCode: string) => {
    const next = cities.filter((c) => c !== cityCode);
    setCities(next);
    if (next.length === 0) setDistricts([]);
  };

  const removeDistrict = (districtName: string) => {
    setDistricts((prev) => prev.filter((d) => d !== districtName));
  };

  const handleSortChange = async (value: string) => {
    if (value === 'distance') {
      if (!userLocation) {
        try {
          const location = await getUserLocation();
          setUserLocation(location);
          setSort('distance');
          setSortByDistance(false);
        } catch {
          toaster.error({
            title: 'Không thể lấy vị trí',
            description:
              'Vui lòng cho phép truy cập vị trí để sắp xếp theo khoảng cách.',
          });
          setSort('relevance');
          setSortByDistance(false);
        }
      } else {
        setSort('distance');
        setSortByDistance(false);
      }
      return;
    }

    setSort(value);
    if (sortByDistance) {
      setSortByDistance(false);
      setUserLocation(null);
    }
  };

  const availableDistricts = useMemo(() => {
    if (pendingCities.length === 0) return [];
    return VIETNAM_CITIES.filter((city) =>
      pendingCities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [pendingCities]);

  const activeFilterCount =
    cities.length + districts.length + (sortByDistance ? 1 : 0);
  const activeSortOption =
    CLUB_SORT_OPTIONS.find((option) => option.value === sort) ??
    CLUB_SORT_OPTIONS[0];
  const sortButtonLabel = sortByDistance ? 'Gần tôi' : activeSortOption.label;
  const SortButtonIcon = sortByDistance ? MapPin : activeSortOption.icon;
  const skeletonVariant = viewMode === 'list' ? 'list' : 'grid';

  return (
    <Box>
      {/* Search Bar - Fixed on mobile, sticky on desktop */}
      <Box
        position={{ base: 'fixed', md: 'sticky' }}
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        left={0}
        right={0}
        width="100vw"
        marginLeft={{ base: 0, md: 'calc(50% - 50vw)' }}
        zIndex={1100}
        bg={{ base: 'bg', md: 'transparent' }}
        pt={2}
        pb={{ base: 0, md: 2 }}
      >
        <Box w="100%" maxW="650px" mx="auto">
          <AppSearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('clubs.searchPlaceholder')}
            onFilterClick={toggleFilters}
            activeFilterCount={activeFilterCount}
            showFilter={true}
          />
        </Box>
      </Box>

      <Flex
        justify="flex-end"
        mt={2}
        mb={3}
        display={{ base: 'none', md: 'flex' }}
      >
        <Button
          colorPalette="green"
          size="sm"
          onClick={() => {
            if (user) {
              router.push(ROUTES.HOST.CLUBS.CREATE);
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        >
          <Plus size={16} />
          {t('navigation.createClub')}
        </Button>
      </Flex>

      {/* Results info + view mode */}
      {!isLoading && (
        <VStack align="stretch" gap={2} mb={4}>
          <Flex align="center" gap={2} minH="28px">
            {totalCount !== null && (
              <Text
                fontSize="sm"
                color="fg.muted"
                display={{ base: 'none', md: 'block' }}
              >
                {totalCount} kết quả
              </Text>
            )}

            <Flex align="center" gap={2} ml="auto">
              <Box position="relative" ref={sortDropdownRef}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSortOpen((value) => !value)}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  h="32px"
                  px={{ base: 2, md: 3 }}
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
                  <Text
                    as="span"
                    maxW="110px"
                    truncate
                    display={{ base: 'none', md: 'inline' }}
                  >
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
                    {CLUB_SORT_OPTIONS.map((option) => {
                      const OptionIcon = option.icon;
                      const isActive = !sortByDistance && option.value === sort;
                      return (
                        <Flex
                          key={option.value}
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
                            handleSortChange(option.value);
                            setIsSortOpen(false);
                          }}
                        >
                          <OptionIcon size={14} />
                          <Text flex={1}>{option.label}</Text>
                          {isActive && <Check size={13} />}
                        </Flex>
                      );
                    })}
                  </Box>
                )}
              </Box>

              <AppViewModeToggle scope="clubs" />
            </Flex>
          </Flex>

          {activeFilterCount > 0 && (
            <Flex align="center" flexWrap="wrap" gap={2}>
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
        </VStack>
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
                <Flex gap={2} flexWrap="wrap">
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
        viewMode === 'map' ? (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <Skeleton
              height={{ base: '360px', md: '520px' }}
              borderRadius="2xl"
            />
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {Array.from({ length: CLUB_SKELETON_COUNT }).map((_, index) => (
              <ClubCardSkeleton
                key={`club-skeleton-${index}`}
                variant={skeletonVariant}
              />
            ))}
          </SimpleGrid>
        )
      ) : clubs.length === 0 && viewMode !== 'map' ? (
        <AppEmptyState
          minH={{ base: '300px', md: '340px' }}
          icon={<Users size={40} color="var(--chakra-colors-gray-400)" />}
          title={t('clubs.noClubsFound')}
          actions={
            activeFilterCount > 0 ? (
              <Button
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
            ) : undefined
          }
        />
      ) : viewMode === 'map' ? (
        isLoadingFullDetails ? (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <Skeleton
              height={{ base: '360px', md: '520px' }}
              borderRadius="2xl"
            />
          </Box>
        ) : (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <ClubMap clubs={fullClubs} userLocation={userLocation} />
          </Box>
        )
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                variant={viewMode === 'list' ? 'list' : 'grid'}
              />
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
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          featureName={t('navigation.createClub')}
          returnUrl={ROUTES.HOST.CLUBS.CREATE}
        />
      )}
    </Box>
  );
}

export default function BrowseClubsPage() {
  const t = useTranslations();
  return (
    <PageLayout title={t('clubs.browseClubs')}>
      <Suspense
        fallback={
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {Array.from({ length: CLUB_SKELETON_COUNT }).map((_, index) => (
              <ClubCardSkeleton key={`club-suspense-${index}`} />
            ))}
          </SimpleGrid>
        }
      >
        <BrowseClubsContent />
      </Suspense>
    </PageLayout>
  );
}
