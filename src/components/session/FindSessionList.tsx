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
import { ISession, UserRole } from '@/lib/api/types';
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
import { AISessionModal } from './AISessionModal';
import FindSessionCard from './FindSessionCard';
import JoinSessionModal from './JoinSessionModal';
import { QuickCreateSessionBar } from './QuickCreateSessionBar';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import { CommonModal } from '@/components/ui/CommonModal';
import AppHostDetail from './AppHostDetail';
import { ROUTES } from '@/constants';

// Time range definitions
const TIME_RANGES = [
  { key: 'morning', start: 5, end: 12 },
  { key: 'afternoon', start: 12, end: 18 },
  { key: 'evening', start: 18, end: 22 },
  { key: 'night', start: 22, end: 5 },
] as const;

type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];

interface FindSessionListProps {
  initialSessions?: ISession[];
}

export default function FindSessionList({
  initialSessions = [],
}: FindSessionListProps) {
  const [sessions, setSessions] = useState<ISession[]>(initialSessions);
  const [loading, setLoading] = useState(initialSessions.length === 0);
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
    toggleCity,
    toggleDistrict,
    clearLocation,
  } = useSessionFilterStore();

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

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

  // Load initial date from URL or today
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setFilters({ date: dateParam });
    }
  }, [searchParams, setFilters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Helper to clean district/city names for searching (remove "Quận", "Huyện", etc.)
      const normalizeLocation = (name: string) =>
        name.replace(/^(Quận|Huyện|Thành phố|Thị xã)\s+/i, '').trim();

      // Prepare filters for API
      const apiFilters: Record<string, unknown> = {
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

      setSessions(filteredData);

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

  // Handle Location
  const handleNearMe = async () => {
    if (sortByDistance) {
      // Toggle off
      setSortByDistance(false);
      return;
    }

    try {
      setLoading(true);
      const location = await getUserLocation();
      setUserLocation(location);
      setSortByDistance(true);
      // Clear city/district when using Near Me?
      // Optional: keep them as filters within the radius/sorted list
      // For now, let's keep them independent but maybe clear specifically if it conflicts logic?
      // Actually, sorting by distance inside a specific city makes sense.
    } catch (error: any) {
      toaster.error({
        title: t('filters.locationPermissionDenied'),
        description: error.message,
      });
      setSortByDistance(false);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSearchQueryChange = (val: string) => {
    setFilters({ searchQuery: val });
  };

  const toggleLevel = (level: number) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
    setFilters({ levels: newLevels });
  };

  const toggleTimeRange = (rangeKey: TimeRangeKey) => {
    const newTimeRanges = filters.timeRanges.includes(rangeKey)
      ? filters.timeRanges.filter((r) => r !== rangeKey)
      : [...filters.timeRanges, rangeKey];
    setFilters({ timeRanges: newTimeRanges });
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

  // Derived data for display
  const availableDistricts = useMemo(() => {
    if (filters.cities.length === 0) return [];
    return VIETNAM_CITIES.filter((city) =>
      filters.cities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [filters.cities]);

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
      {/* Search Bar & Main Controls - Always Visible */}
      <Flex gap={2} mb={4} wrap="wrap">
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

      {/* Enhanced Filter Panel */}
      {showFilters && (
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          mb={4}
          shadow="md"
        >
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
                        onChange={(e) => setFilters({ date: e.target.value })}
                        onInput={(e) => {
                          // Handle iOS date picker Reset button
                          const target = e.target as HTMLInputElement;
                          if (target.value === '') {
                            setFilters({ date: '' });
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
                          Tất cả ngày
                        </Box>
                      )}
                    </Box>
                    {/* Clear date button */}
                    {filters.date && (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorPalette="gray"
                        onClick={() => setFilters({ date: '' })}
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
                        colorPalette="orange"
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
                        setFilters({ hasSlots: !filters.hasSlots })
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
                      colorPalette={sortByDistance ? 'blue' : 'gray'}
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
                      {sortByDistance
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
                  {filters.cities.length > 0 && (
                    <Badge
                      size="sm"
                      colorPalette="blue"
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
                      filters.cities.includes(city.code) ? 'blue' : 'gray'
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
                        colorPalette="blue"
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
                      onClick={() => setFilters({ districts: [] })}
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
                    '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
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
                          ? 'blue'
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
                    colorPalette="purple"
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
                      setFilters({ minFee: Number(e.target.value) })
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
                    value={filters.maxFee}
                    onChange={(e) =>
                      setFilters({ maxFee: Number(e.target.value) })
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
                  bg={filters.splitEvenly ? 'blue.50' : 'transparent'}
                  _dark={{
                    bg: filters.splitEvenly ? 'blue.900' : 'transparent',
                  }}
                  borderWidth="2px"
                  borderColor={filters.splitEvenly ? 'blue.400' : 'gray.300'}
                  transition="all 0.2s"
                  _hover={{ borderColor: 'blue.400' }}
                >
                  <input
                    type="checkbox"
                    checked={filters.splitEvenly}
                    onChange={(e) =>
                      setFilters({ splitEvenly: e.target.checked })
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color={filters.splitEvenly ? 'blue.700' : 'gray.700'}
                    _dark={{
                      color: filters.splitEvenly ? 'blue.200' : 'gray.200',
                    }}
                  >
                    {t('filters.splitEvenly')}
                  </Text>
                </Box>
              </Flex>
            </Box>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <>
                <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
                <Flex justify="center">
                  <Button
                    size="md"
                    variant="solid"
                    colorPalette="red"
                    onClick={clearFilters}
                    leftIcon={<X size={18} />}
                    fontWeight="bold"
                    px={6}
                    borderRadius="full"
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.05)', shadow: 'lg' }}
                  >
                    {t('clearFilters')} ({activeFilterCount})
                  </Button>
                </Flex>
              </>
            )}
          </VStack>
        </Box>
      )}

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
                onRegistrationUpdate={fetchSessions}
                distance={session.distance}
                onHostClick={() => handleHostClick(session)}
              />
            ))}
          </Grid>
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
