'use client';

import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { ISession } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';
import {
  Box,
  Grid,
  Heading,
  Text,
  Flex,
  Badge,
  VStack,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { Button, Input } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import JoinSessionModal from './JoinSessionModal';
import FindSessionCard from './FindSessionCard';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import { useRouter } from '@/i18n/config';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  Search,
  X,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { toaster } from '@/components/ui/toaster';
import { QuickCreateSessionBar } from './QuickCreateSessionBar';
import { AISessionModal } from './AISessionModal';
import { UserRole } from '@/lib/api/types';
import { ExtractedSessionData } from '@/lib/api/ai.service';

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

  const [isLocating, setIsLocating] = useState(false);

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
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

      // Prepare filters for API
      const apiFilters: any = {
        date: filters.date,
        searchQuery: filters.searchQuery,
        // Pass first city if only one selected, otherwise filter on client
        city: filters.cities.length === 1 ? filters.cities[0] : undefined,
        // Pass first district if only one selected, otherwise filter on client
        district: filters.districts.length === 1 ? filters.districts[0] : undefined,
        hasSlots: filters.hasSlots ? true : undefined,
        minAvailableSlots:
          filters.minAvailableSlots > 0 ? filters.minAvailableSlots : undefined,
      };

      // Fee filter (only if changed from defaults or split evenly is selected)
      if (filters.minFee > 0 || filters.maxFee < 200000 || filters.splitEvenly) {
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
          const sessionCity = session.venue?.city || session.location;
          return filters.cities.some(
            (city) =>
              sessionCity?.includes(city) ||
              VIETNAM_CITIES.find((c) => c.code === city)?.name === sessionCity
          );
        });
      }

      // 2. Multi-district filter (if multiple districts selected)
      if (filters.districts.length > 1) {
        filteredData = filteredData.filter((session) => {
          const sessionDistrict = session.venue?.district;
          return filters.districts.some((district) =>
            sessionDistrict?.includes(district)
          );
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
          const statusMap: Record<
            string,
            'PENDING' | 'APPROVED' | 'REJECTED'
          > = {};
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
      setIsLocating(true);
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
      setIsLocating(false);
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
      router.push('/auth/signin');
      return;
    }
    setSelectedSession(session);
    setIsJoinModalOpen(true);
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

    // Redirect based on role
    if (user?.role === UserRole.HOST) {
      router.push('/host/sessions/new');
    } else {
      router.push('/player/sessions/new');
    }
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

        <Button
          variant={showFilters ? 'solid' : 'outline'}
          colorPalette="blue"
          onClick={toggleFilters}
          leftIcon={<Filter size={16} />}
        >
          {t('filters.title')}
          {activeFilterCount > 0 && (
            <Badge ml={2} colorPalette="whiteAlpha" variant="solid">
              {activeFilterCount}
            </Badge>
          )}
          {showFilters ? (
            <ChevronUp size={16} style={{ marginLeft: 4 }} />
          ) : (
            <ChevronDown size={16} style={{ marginLeft: 4 }} />
          )}
        </Button>
      </Flex>

      {/* Collapsible Filter Panel - Compact Design */}
      {showFilters && (
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          p={3}
          borderRadius="lg"
          borderWidth="1px"
          mb={4}
          shadow="sm"
        >
          <VStack align="stretch" gap={3}>
            {/* Quick Actions Row: Date, Status, Near Me */}
            <Flex gap={2} wrap="wrap" align="center">
              <Input
                type="date"
                size="sm"
                width="auto"
                minW="140px"
                value={filters.date}
                onChange={(e) => setFilters({ date: e.target.value })}
              />
              <Badge
                px={4}
                py={1.5}
                borderRadius="full"
                cursor="pointer"
                variant={filters.hasSlots ? 'solid' : 'outline'}
                colorPalette={filters.hasSlots ? 'green' : 'gray'}
                onClick={() => setFilters({ hasSlots: !filters.hasSlots })}
                fontSize="md"
                fontWeight="medium"
              >
                {t('filters.availableSlots')}
              </Badge>
              <Badge
                px={4}
                py={1.5}
                borderRadius="full"
                cursor="pointer"
                variant={sortByDistance ? 'solid' : 'outline'}
                colorPalette={sortByDistance ? 'blue' : 'gray'}
                onClick={handleNearMe}
                fontSize="md"
                fontWeight="medium"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <MapPin size={16} />
                {sortByDistance ? t('filters.sortByDistance') : t('filters.nearMe')}
              </Badge>
            </Flex>

            {/* City Selection - Horizontal Scroll */}
            <Box>
              <Flex justify="space-between" align="center" mb={1}>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  {t('filters.area')}
                  {filters.cities.length > 0 && (
                    <Badge ml={1} size="sm" colorPalette="blue" variant="subtle">
                      {filters.cities.length}
                    </Badge>
                  )}
                </Text>
                {filters.cities.length > 0 && (
                  <Button size="xs" variant="ghost" onClick={clearLocation} p={0} h="auto" minW="auto">
                    <X size={14} />
                  </Button>
                )}
              </Flex>
              <Flex gap={1.5} flexWrap="wrap">
                {VIETNAM_CITIES.map((city) => (
                  <Badge
                    key={city.code}
                    px={2.5}
                    py={1}
                    borderRadius="md"
                    cursor="pointer"
                    variant={filters.cities.includes(city.code) ? 'solid' : 'outline'}
                    colorPalette={filters.cities.includes(city.code) ? 'blue' : 'gray'}
                    onClick={() => toggleCity(city.code)}
                    fontSize="sm"
                  >
                    {city.name}
                  </Badge>
                ))}
              </Flex>
            </Box>

            {/* District Selection - Only show if cities selected */}
            {filters.cities.length > 0 && availableDistricts.length > 0 && (
              <Box>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    {t('filters.allDistricts')}
                    {filters.districts.length > 0 && (
                      <Badge ml={1} size="sm" colorPalette="blue" variant="subtle">
                        {filters.districts.length}
                      </Badge>
                    )}
                  </Text>
                  {filters.districts.length > 0 && (
                    <Button size="xs" variant="ghost" onClick={() => setFilters({ districts: [] })} p={0} h="auto" minW="auto">
                      <X size={14} />
                    </Button>
                  )}
                </Flex>
                <Flex gap={1.5} flexWrap="wrap" maxH="100px" overflowY="auto">
                  {availableDistricts.map((district) => (
                    <Badge
                      key={district.code}
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      cursor="pointer"
                      variant={filters.districts.includes(district.name) ? 'solid' : 'outline'}
                      colorPalette={filters.districts.includes(district.name) ? 'blue' : 'gray'}
                      onClick={() => toggleDistrict(district.name)}
                      fontSize="sm"
                    >
                      {district.name}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Levels & Time Row */}
            <Flex gap={4} wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                  {t('level')}
                </Text>
                <Flex gap={1.5} flexWrap="wrap">
                  {VALID_LEVELS.map((level) => {
                    const skillColor = getSkillLevelColor([level]);
                    return (
                      <Badge
                        key={level}
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        cursor="pointer"
                        variant={filters.levels.includes(level) ? 'solid' : 'outline'}
                        colorPalette={filters.levels.includes(level) ? skillColor.colorPalette : 'gray'}
                        onClick={() => toggleLevel(level)}
                        fontSize="sm"
                      >
                        {getLevelShortLabel(level)}
                      </Badge>
                    );
                  })}
                </Flex>
              </Box>

              <Box minW="180px">
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                  {t('timeRange')}
                </Text>
                <Flex gap={1.5} flexWrap="wrap">
                  {TIME_RANGES.map((range) => (
                    <Badge
                      key={range.key}
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      variant={filters.timeRanges.includes(range.key) ? 'solid' : 'outline'}
                      colorPalette={filters.timeRanges.includes(range.key) ? 'purple' : 'gray'}
                      onClick={() => toggleTimeRange(range.key)}
                      fontSize="sm"
                    >
                      {t(`timeRanges.${range.key}`)}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </Flex>

            {/* Fee Range - Compact Inline */}
            <Flex gap={3} align="center" wrap="wrap">
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                {t('filters.cost')}:
              </Text>
              <HStack gap={2}>
                <Input
                  size="sm"
                  type="number"
                  width="90px"
                  value={filters.minFee}
                  onChange={(e) => setFilters({ minFee: Number(e.target.value) })}
                  step={5000}
                  min={0}
                />
                <Text fontSize="sm">-</Text>
                <Input
                  size="sm"
                  type="number"
                  width="90px"
                  value={filters.maxFee}
                  onChange={(e) => setFilters({ maxFee: Number(e.target.value) })}
                  step={5000}
                  min={0}
                />
                <Text fontSize="sm" color="gray.500">VND</Text>
              </HStack>
              <Box as="label" cursor="pointer" display="flex" alignItems="center" gap={2}>
                <input
                  type="checkbox"
                  checked={filters.splitEvenly}
                  onChange={(e) => setFilters({ splitEvenly: e.target.checked })}
                />
                <Text fontSize="sm">{t('filters.splitEvenly')}</Text>
              </Box>

              {/* Clear Filters - Inline */}
              {activeFilterCount > 0 && (
                <Button
                  size="sm"
                  variant="solid"
                  colorPalette="red"
                  onClick={clearFilters}
                  ml="auto"
                  leftIcon={<X size={16} />}
                  fontWeight="semibold"
                >
                  {t('clearFilters')}
                </Button>
              )}
            </Flex>
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
                userRegistrationStatus={registrationStatusMap[session.id] || null}
                onRegistrationUpdate={fetchSessions}
                distance={session.distance}
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
          onSuccess={fetchSessions}
        />
      )}

      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />
    </Box>
  );
}
