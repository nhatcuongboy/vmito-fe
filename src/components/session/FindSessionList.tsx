'use client';

import { Button, IconButton, Input } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { toaster } from '@/components/ui/toaster';
import { VALID_LEVELS } from '@/constants/levels';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useRouter } from '@/i18n/config';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';
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
import { Filter, MapPin, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { AISessionModal } from './AISessionModal';
import FindSessionCard from './FindSessionCard';
import JoinSessionModal from './JoinSessionModal';
import { QuickCreateSessionBar } from './QuickCreateSessionBar';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import { CommonModal } from '@/components/ui/CommonModal';
import AppHostDetail from './AppHostDetail';
import {
  ROUTES,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';
import { Check } from 'lucide-react';

// Time range definitions
const TIME_RANGES = [
  { key: 'morning', start: 5, end: 12 },
  { key: 'afternoon', start: 12, end: 18 },
  { key: 'evening', start: 18, end: 22 },
  { key: 'night', start: 22, end: 5 },
] as const;

const PAGE_SIZE = 12;

type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];

interface FindSessionListProps {
  initialSessions?: ISession[];
}

export default function FindSessionList({
  initialSessions = [],
}: FindSessionListProps) {
  const [sessions, setSessions] = useState<ISession[]>(initialSessions);
  const [loading, setLoading] = useState(initialSessions.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(
    new Set()
  );
  const [registrationStatusMap, setRegistrationStatusMap] = useState<
    Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'>
  >({});

  // Use Zustand store for filters
  const {
    filters,
    setFilters,
    clearFilters: clearStoreFilters,
    sortByDistance,
    setSortByDistance,
    userLocation,
    setUserLocation,
  } = useSessionFilterStore();

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

  // Local state for pending filters (before Submit)
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [pendingSortByDistance, setPendingSortByDistance] =
    useState(sortByDistance);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
      setPendingSortByDistance(sortByDistance);
    }
  }, [showFilters, filters, sortByDistance]);

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [selectedSessionForDetail, setSelectedSessionForDetail] =
    useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations('session');
  const { user } = useAuthStore();
  const { getLevelShortLabel } = useLevelLabel();

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Load initial date from URL or today
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setFilters({ date: dateParam });
    }
  }, [searchParams, setFilters]);

  const fetchSessions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1); // Reset to first page on filter change
      }
      setError(null);

      // Helper to clean district/city names for searching (remove "Quận", "Huyện", etc.)
      const normalizeLocation = (name: string) =>
        name.replace(/^(Quận|Huyện|Thành phố|Thị xã)\s+/i, '').trim();

      const currentPage = isLoadMore ? page + 1 : 1;

      // Prepare filters for API
      const apiFilters: any = {
        date: filters.date,
        searchQuery: filters.searchQuery,
        // Send City NAME instead of CODE
        city:
          filters.cities.length === 1
            ? VIETNAM_CITIES.find((c) => c.code === filters.cities[0])?.name
            : undefined,
        // Send cleaned District name
        district:
          filters.districts.length === 1
            ? normalizeLocation(filters.districts[0])
            : undefined,
        hasSlots: filters.hasSlots ? true : undefined,
        minAvailableSlots:
          filters.minAvailableSlots > 0 ? filters.minAvailableSlots : undefined,
        page: currentPage,
        limit: PAGE_SIZE,
      };

      // Fee filter (only if changed from defaults or split evenly is selected)
      if (
        filters.minFee > 0 ||
        filters.maxFee < 200000 ||
        filters.splitEvenly
      ) {
        apiFilters.minFee = filters.minFee;
        apiFilters.maxFee = filters.maxFee;
        // Note: splitEvenly is a frontend-only filter for now
      }

      // Geospatial filter
      if (sortByDistance && userLocation) {
        apiFilters.lat = userLocation.lat;
        apiFilters.lng = userLocation.lng;
        apiFilters.sortByDistance = true;
      }

      // Add level filter (basic logic: pass first selected level or handle in client)
      if (filters.levels.length === 1) {
        apiFilters.level = filters.levels[0];
      }

      const data = await SessionService.getAvailableSessions(apiFilters);

      // Client-side post-filtering for complex logic (multiple levels, time ranges, multi-city/district)
      let filteredData = data;

      // 1. Multi-city filter (if multiple cities selected)
      if (filters.cities.length > 1) {
        filteredData = filteredData.filter((session) => {
          const sessionCity = session.venue?.city || session.location || '';
          return filters.cities.some((cityCode) => {
            const cityName = VIETNAM_CITIES.find(
              (c) => c.code === cityCode
            )?.name;
            return (
              sessionCity.includes(cityCode) ||
              (cityName && sessionCity.includes(cityName))
            );
          });
        });
      }

      // 2. Multi-district filter (if multiple districts selected)
      if (filters.districts.length > 1) {
        filteredData = filteredData.filter((session) => {
          const sessionDistrict = session.venue?.district || '';
          return filters.districts.some((districtFilter) => {
            const cleanFilter = normalizeLocation(districtFilter);
            const cleanSession = normalizeLocation(sessionDistrict);
            return cleanSession.includes(cleanFilter);
          });
        });
      }

      // 3. Time range filter
      if (filters.timeRanges.length > 0) {
        filteredData = filteredData.filter((session) => {
          if (!session.startTime) return false;
          const hour = new Date(session.startTime).getHours();
          return filters.timeRanges.some((rangeKey) => {
            const rangeDef = TIME_RANGES.find((r) => r.key === rangeKey);
            if (!rangeDef) return false;
            if (rangeDef.start < rangeDef.end) {
              return hour >= rangeDef.start && hour < rangeDef.end;
            } else {
              // Night wraps around midnight
              return hour >= rangeDef.start || hour < rangeDef.end;
            }
          });
        });
      }

      // 4. Multi-level filter (if backend didn't handle it or multiple selected)
      if (filters.levels.length > 0) {
        filteredData = filteredData.filter((session) => {
          const sessionLevels = session.requiredLevels || [];
          if (sessionLevels.length === 0) return true; // Open to all
          return filters.levels.some((l) => sessionLevels.includes(l));
        });
      }

      // 5. Split evenly filter (filter sessions with split evenly fee type)
      if (filters.splitEvenly) {
        filteredData = filteredData.filter((session) => {
          return session.feeConfig?.feeType === 'SPLIT_EVENLY';
        });
      }

      if (isLoadMore) {
        setSessions((prev) => [...prev, ...filteredData]);
        setPage(currentPage);
      } else {
        setSessions(filteredData);
      }

      setHasMore(data.length === PAGE_SIZE);

      // Fetch user specific data
      if (user) {
        try {
          const mySessions = await PlayerService.getMySessions();
          setJoinedSessionIds(new Set(mySessions.map((s) => s.id)));

          const registrations = await PlayerService.getMyRegistrations();
          const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> =
            {};
          registrations.forEach((reg) => {
            statusMap[reg.sessionId] = reg.status as
              | 'PENDING'
              | 'APPROVED'
              | 'REJECTED';
          });
          setRegistrationStatusMap(statusMap);
        } catch (err) {
          console.error('Failed to fetch user session data', err);
        }
      }
    } catch (err) {
      setError(t('loadingError'));
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Debounce fetch for search query, but immediate for others if needed.
    const timer = setTimeout(() => {
      fetchSessions();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.date,
    filters.cities,
    filters.districts,
    filters.hasSlots,
    filters.minAvailableSlots,
    filters.minFee,
    filters.maxFee,
    filters.levels,
    filters.timeRanges,
    filters.splitEvenly,
    sortByDistance,
    userLocation,
    filters.searchQuery,
  ]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Handle Location (for pending filters)
  const handleNearMe = async () => {
    if (pendingSortByDistance) {
      // Toggle off
      setPendingSortByDistance(false);
      return;
    }

    try {
      setLoading(true);
      const location = await getUserLocation();
      setUserLocation(location);
      setPendingSortByDistance(true);
    } catch (error: any) {
      toaster.error({
        title: t('filters.locationPermissionDenied'),
        description: error.message,
      });
      setPendingSortByDistance(false);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for pending filters
  const handleSearchQueryChange = (val: string) => {
    setFilters({ searchQuery: val });
  };

  const toggleLevel = (level: number) => {
    const newLevels = pendingFilters.levels.includes(level)
      ? pendingFilters.levels.filter((l) => l !== level)
      : [...pendingFilters.levels, level];
    setPendingFilters({ ...pendingFilters, levels: newLevels });
  };

  const toggleTimeRange = (rangeKey: TimeRangeKey) => {
    const newTimeRanges = pendingFilters.timeRanges.includes(rangeKey)
      ? pendingFilters.timeRanges.filter((r) => r !== rangeKey)
      : [...pendingFilters.timeRanges, rangeKey];
    setPendingFilters({ ...pendingFilters, timeRanges: newTimeRanges });
  };

  const togglePendingCity = (cityCode: string) => {
    const newCities = pendingFilters.cities.includes(cityCode)
      ? pendingFilters.cities.filter((c) => c !== cityCode)
      : [...pendingFilters.cities, cityCode];
    setPendingFilters({ ...pendingFilters, cities: newCities });
  };

  const togglePendingDistrict = (districtName: string) => {
    const newDistricts = pendingFilters.districts.includes(districtName)
      ? pendingFilters.districts.filter((d) => d !== districtName)
      : [...pendingFilters.districts, districtName];
    setPendingFilters({ ...pendingFilters, districts: newDistricts });
  };

  const clearPendingLocation = () => {
    setPendingFilters({ ...pendingFilters, cities: [], districts: [] });
  };

  const handleSubmitFilters = () => {
    setFilters(pendingFilters);
    setSortByDistance(pendingSortByDistance);
    toggleFilters(); // Close drawer
  };

  const handleResetFilters = () => {
    clearStoreFilters();
    setSortByDistance(false);
    setPendingFilters({
      date: '',
      searchQuery: '',
      cities: [],
      districts: [],
      levels: [],
      timeRanges: [],
      minFee: 0,
      maxFee: 200000,
      hasSlots: false,
      minAvailableSlots: 0,
      splitEvenly: false,
    });
    setPendingSortByDistance(false);
  };

  const clearFilters = () => {
    clearStoreFilters();
  };

  const activeFilterCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.date ? 1 : 0) +
    filters.levels.length +
    filters.timeRanges.length +
    filters.cities.length +
    filters.districts.length +
    (filters.hasSlots ? 1 : 0) +
    (filters.minAvailableSlots > 0 ? 1 : 0) +
    (filters.minFee > 0 || filters.maxFee < 200000 ? 1 : 0) +
    (filters.splitEvenly ? 1 : 0) +
    (sortByDistance ? 1 : 0);

  // Derived data for display (use pending filters in drawer)
  const availableDistricts = useMemo(() => {
    if (pendingFilters.cities.length === 0) return [];
    return VIETNAM_CITIES.filter((city) =>
      pendingFilters.cities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [pendingFilters.cities]);

  // Handle Join Actions
  const handleJoinClick = (session: ISession) => {
    if (!user) {
      router.push(ROUTES.AUTH.SIGNIN);
      return;
    }
    setSelectedSession(session);
    setIsJoinModalOpen(true);
  };

  const handleHostClick = (session: ISession) => {
    setSelectedSessionForDetail(session);
    setIsDetailModalOpen(true);
  };

  // Extract unique host IDs for batch rating stats loading
  const hostIds = useMemo(() => {
    const ids = sessions
      .map((s) => s.hostId)
      .filter((id): id is string => id !== null && id !== undefined);
    return [...new Set(ids)];
  }, [sessions]);

  const handleAISuccess = (data: ExtractedSessionData) => {
    // Save data to session storage to be picked up by the form
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));

    router.push(ROUTES.SESSIONS.NEW);
  };

  return (
    <Box>
      {/* Search Bar & Main Controls - Sticky at top when scrolling */}
      <Box
        position="sticky"
        top={{
          base: `${TOP_BAR_HEIGHT_MOBILE}px`,
          md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
        }}
        zIndex={100}
        bg="bg"
        py={3}
        mb={4}
      >
        <Flex gap={2} wrap="wrap">
          <Box flex="1" position="relative" minW="200px">
            <Input
              pl={10}
              placeholder={t('searchPlaceholder')}
              value={filters.searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              bg="white"
              _dark={{ bg: 'gray.800' }}
            />
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color="gray.400"
            >
              <Search size={18} />
            </Box>
          </Box>

          <Box position="relative">
            <IconButton
              variant={showFilters ? 'solid' : 'outline'}
              colorPalette="blue"
              onClick={toggleFilters}
              aria-label={t('filters.title')}
              icon={<Filter size={18} />}
            />
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-2"
                right="-2"
                borderRadius="full"
                colorPalette="red"
                variant="solid"
                px={1}
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                border="2px solid"
                borderColor="white"
                zIndex={1}
              >
                {activeFilterCount}
              </Badge>
            )}
          </Box>
        </Flex>
      </Box>

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
              <Heading size="md">{t('filters.title') || 'Bộ lọc'}</Heading>
              {activeFilterCount > 0 && (
                <Badge
                  colorPalette="blue"
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
              onClick={toggleFilters}
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
                        value={pendingFilters.date}
                        onChange={(e) =>
                          setPendingFilters({
                            ...pendingFilters,
                            date: e.target.value,
                          })
                        }
                        onInput={(e) => {
                          // Handle iOS date picker Reset button
                          const target = e.target as HTMLInputElement;
                          if (target.value === '') {
                            setPendingFilters({ ...pendingFilters, date: '' });
                          }
                        }}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor="gray.300"
                        color="gray.800"
                        bg="white"
                        px={3}
                        _hover={{ borderColor: 'blue.400' }}
                        _focus={{ borderColor: 'blue.500', shadow: 'outline' }}
                        _dark={{
                          color: 'white',
                          bg: 'gray.700',
                          borderColor: 'gray.600',
                          _hover: { borderColor: 'blue.400' },
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
                            color: !pendingFilters.date
                              ? 'transparent'
                              : 'inherit',
                            padding: '0 1px',
                          },
                          '&::-webkit-datetime-edit-month-field': {
                            color: !pendingFilters.date
                              ? 'transparent'
                              : 'inherit',
                          },
                          '&::-webkit-datetime-edit-day-field': {
                            color: !pendingFilters.date
                              ? 'transparent'
                              : 'inherit',
                          },
                          '&::-webkit-datetime-edit-year-field': {
                            color: !pendingFilters.date
                              ? 'transparent'
                              : 'inherit',
                          },
                        }}
                      />
                      {/* Placeholder overlay for iOS */}
                      {!pendingFilters.date && (
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
                          Tất cả ngày
                        </Box>
                      )}
                    </Box>
                    {/* Clear date button */}
                    {pendingFilters.date && (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorPalette="gray"
                        onClick={() =>
                          setPendingFilters({ ...pendingFilters, date: '' })
                        }
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
                    {pendingFilters.timeRanges.length > 0 && (
                      <Badge
                        size="sm"
                        colorPalette="orange"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {pendingFilters.timeRanges.length}
                      </Badge>
                    )}
                  </HStack>
                  <Flex gap={2} flexWrap="wrap">
                    {TIME_RANGES.map((range) => {
                      const isSelected = pendingFilters.timeRanges.includes(
                        range.key
                      );
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
                      variant={pendingFilters.hasSlots ? 'solid' : 'outline'}
                      colorPalette={pendingFilters.hasSlots ? 'green' : 'gray'}
                      onClick={() =>
                        setPendingFilters({
                          ...pendingFilters,
                          hasSlots: !pendingFilters.hasSlots,
                        })
                      }
                      fontSize="sm"
                      fontWeight="semibold"
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      borderWidth={pendingFilters.hasSlots ? '0' : '2px'}
                    >
                      {t('filters.availableSlots')}
                    </Badge>
                    <Badge
                      px={5}
                      py={2}
                      borderRadius="full"
                      cursor="pointer"
                      variant={pendingSortByDistance ? 'solid' : 'outline'}
                      colorPalette={pendingSortByDistance ? 'blue' : 'gray'}
                      onClick={handleNearMe}
                      fontSize="sm"
                      fontWeight="semibold"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      borderWidth={pendingSortByDistance ? '0' : '2px'}
                    >
                      <MapPin size={16} />
                      {pendingSortByDistance
                        ? t('filters.sortByDistance')
                        : t('filters.nearMe')}
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
                  {pendingFilters.cities.length > 0 && (
                    <Badge
                      size="sm"
                      colorPalette="blue"
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      {pendingFilters.cities.length}
                    </Badge>
                  )}
                </HStack>
                {pendingFilters.cities.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={clearPendingLocation}
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
                      pendingFilters.cities.includes(city.code)
                        ? 'solid'
                        : 'outline'
                    }
                    colorPalette={
                      pendingFilters.cities.includes(city.code)
                        ? 'blue'
                        : 'gray'
                    }
                    onClick={() => togglePendingCity(city.code)}
                    fontSize="sm"
                    fontWeight="medium"
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.05)' }}
                    borderWidth={
                      pendingFilters.cities.includes(city.code) ? '0' : '2px'
                    }
                  >
                    {city.name}
                  </Badge>
                ))}
              </Flex>
            </Box>

            {/* District Selection */}
            {pendingFilters.cities.length > 0 &&
              availableDistricts.length > 0 && (
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
                      {pendingFilters.districts.length > 0 && (
                        <Badge
                          size="sm"
                          colorPalette="blue"
                          variant="solid"
                          borderRadius="full"
                          px={2}
                        >
                          {pendingFilters.districts.length}
                        </Badge>
                      )}
                    </HStack>
                    {pendingFilters.districts.length > 0 && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          setPendingFilters({
                            ...pendingFilters,
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
                          pendingFilters.districts.includes(district.name)
                            ? 'solid'
                            : 'outline'
                        }
                        colorPalette={
                          pendingFilters.districts.includes(district.name)
                            ? 'blue'
                            : 'gray'
                        }
                        onClick={() => togglePendingDistrict(district.name)}
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s"
                        _hover={{ transform: 'scale(1.05)' }}
                        borderWidth={
                          pendingFilters.districts.includes(district.name)
                            ? '0'
                            : '2px'
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
                {pendingFilters.levels.length > 0 && (
                  <Badge
                    size="sm"
                    colorPalette="purple"
                    variant="solid"
                    borderRadius="full"
                    px={2}
                  >
                    {pendingFilters.levels.length}
                  </Badge>
                )}
              </HStack>
              <Flex gap={2} flexWrap="wrap">
                {VALID_LEVELS.map((level) => {
                  const skillColor = getSkillLevelColor([level]);
                  const isSelected = pendingFilters.levels.includes(level);
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
                    value={pendingFilters.minFee}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
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
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.500', shadow: 'outline' }}
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
                    value={pendingFilters.maxFee}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
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
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.500', shadow: 'outline' }}
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
                  bg={pendingFilters.splitEvenly ? 'blue.50' : 'transparent'}
                  _dark={{
                    bg: pendingFilters.splitEvenly ? 'blue.900' : 'transparent',
                  }}
                  borderWidth="2px"
                  borderColor={
                    pendingFilters.splitEvenly ? 'blue.400' : 'gray.300'
                  }
                  transition="all 0.2s"
                  _hover={{ borderColor: 'blue.400' }}
                >
                  <input
                    type="checkbox"
                    checked={pendingFilters.splitEvenly}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        splitEvenly: e.target.checked,
                      })
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color={pendingFilters.splitEvenly ? 'blue.700' : 'gray.700'}
                    _dark={{
                      color: pendingFilters.splitEvenly
                        ? 'blue.200'
                        : 'gray.200',
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
              variant="outline"
              colorPalette="gray"
              onClick={handleResetFilters}
              leftIcon={<X size={18} />}
            >
              {t('reset') || 'Đặt lại'}
            </Button>
            <Button
              flex="1"
              variant="solid"
              colorPalette="blue"
              onClick={handleSubmitFilters}
              leftIcon={<Check size={18} />}
            >
              {t('applySearch') || 'Tìm kiếm'}
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* Quick Create Bar */}
      {user && (
        <QuickCreateSessionBar onInputClick={() => setIsAIModalOpen(true)} />
      )}

      {/* Results List */}
      {loading ? (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <SessionCardSkeleton key={index} />
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
      ) : sessions.length === 0 ? (
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
            {t('noSessionsFound')}
          </Heading>
          <Text color="gray.500">{t('tryAdjustingFilters')}</Text>
          <Button mt={4} onClick={clearFilters} variant="outline" size="sm">
            {t('clearFilters')}
          </Button>
        </Box>
      ) : (
        <RatingStatsProvider userIds={hostIds}>
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {sessions.map((session) => (
              <FindSessionCard
                key={session.id}
                session={session}
                onJoin={() => handleJoinClick(session)}
                isJoined={joinedSessionIds.has(session.id)}
                userRegistrationStatus={
                  registrationStatusMap[session.id] || null
                }
                onRegistrationUpdate={() => fetchSessions()}
                distance={session.distance}
                onHostClick={() => handleHostClick(session)}
              />
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
                {Array.from({ length: 3 }).map((_, index) => (
                  <SessionCardSkeleton key={index} />
                ))}
              </Grid>
              <Flex justify="center" mt={4}>
                <Text color="gray.500" fontSize="sm">
                  {t('loadingMore') || 'Đang tải thêm...'}
                </Text>
              </Flex>
            </Box>
          )}
        </RatingStatsProvider>
      )}

      {selectedSession && (
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          session={selectedSession}
          onSuccess={() => {
            fetchSessions();
            router.push(ROUTES.SESSIONS.DETAIL(selectedSession.id));
          }}
        />
      )}

      {/* AI Session Creation Modal */}
      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />

      {/* Session Host Detail Modal */}
      <CommonModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('hostInfo') || 'Thông tin Host'}
        size="md"
        hideSecondaryAction={true}
      >
        {selectedSessionForDetail && (
          <AppHostDetail
            userId={selectedSessionForDetail.hostId}
            name={
              selectedSessionForDetail.hostName ||
              selectedSessionForDetail.host?.name
            }
            image={selectedSessionForDetail.host?.image || undefined}
            phone={selectedSessionForDetail.hostPhone}
            email={selectedSessionForDetail.host?.email}
            hideHeader={true}
          />
        )}
      </CommonModal>
    </Box>
  );
}
