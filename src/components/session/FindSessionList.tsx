'use client';

import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { ISession } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Box,
  Center,
  Grid,
  Heading,
  Spinner,
  Text,
  Flex,
  Badge,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Button, Input } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo, ChangeEvent } from 'react';
import JoinSessionModal from './JoinSessionModal';
import FindSessionCard from './FindSessionCard';
import { useRouter, usePathname } from '@/i18n/config';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
  const [filters, setFilters] = useState({
    date: '',
    levels: [] as number[],
    timeRanges: [] as TimeRangeKey[],
    searchQuery: '',
  });

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const t = useTranslations('session');
  const { user } = useAuthStore();
  const { getLevelShortLabel } = useLevelLabel();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Only use date for server-side filtering; levels, time ranges, and search are client-side
      const data = await SessionService.getAvailableSessions({
        date: filters.date,
      });
      setSessions(data);

      if (user) {
        try {
          const mySessions = await PlayerService.getMySessions();
          setJoinedSessionIds(new Set(mySessions.map((s) => s.id)));

          // Fetch user's registration status for all sessions
          const registrations = await PlayerService.getMyRegistrations();
          const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> = {};
          registrations.forEach((reg) => {
            statusMap[reg.sessionId] = reg.status as 'PENDING' | 'APPROVED' | 'REJECTED';
          });
          setRegistrationStatusMap(statusMap);
        } catch (err) {
          console.error('Failed to fetch joined sessions', err);
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
    // Only fetch if no initial data was provided
    if (initialSessions.length === 0) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle post-login redirect with sessionId parameter
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('sessionId');

    if (sessionIdFromUrl && user && sessions.length > 0) {
      // Find the session from the list
      const targetSession = sessions.find((s) => s.id === sessionIdFromUrl);

      if (targetSession) {
        // Open the join modal for this session
        setSelectedSession(targetSession);
        setIsJoinModalOpen(true);

        // Clean up URL parameter (remove sessionId from query string)
        // Use pathname from i18n which doesn't include locale prefix
        // and manually build new search params
        const params = new URLSearchParams(searchParams.toString());
        params.delete('sessionId');
        const newSearch = params.toString();
        router.replace(pathname + (newSearch ? `?${newSearch}` : ''));
      }
    }
  }, [searchParams, user, sessions, router, pathname]);

  // Client-side filtering
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // 1. Time range filter
      if (filters.timeRanges.length > 0 && session.startTime) {
        const hour = new Date(session.startTime).getHours();
        const matchesTimeRange = filters.timeRanges.some((rangeKey) => {
          const rangeDef = TIME_RANGES.find((r) => r.key === rangeKey);
          if (!rangeDef) return false;
          if (rangeDef.start < rangeDef.end) {
            return hour >= rangeDef.start && hour < rangeDef.end;
          } else {
            // Night wraps around midnight
            return hour >= rangeDef.start || hour < rangeDef.end;
          }
        });
        if (!matchesTimeRange) return false;
      }

      // 2. Level filter (multi-select)
      if (filters.levels.length > 0) {
        const sessionLevels = session.requiredLevels || [];
        if (sessionLevels.length > 0) {
          const hasMatchingLevel = filters.levels.some((level) =>
            sessionLevels.includes(level)
          );
          if (!hasMatchingLevel) return false;
        }
        // Sessions with no level restriction match any level filter
      }

      // 3. Search filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const searchFields = [
          session.venue?.name,
          session.venue?.address,
          session.location,
          session.host?.name,
          session.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchFields.includes(query)) return false;
      }

      return true;
    });
  }, [sessions, filters]);

  const handleDateChange = (value: string) => {
    setFilters((prev) => ({ ...prev, date: value }));
  };

  const handleSearchQueryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  const toggleLevel = (level: number) => {
    setFilters((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }));
  };

  const toggleTimeRange = (rangeKey: TimeRangeKey) => {
    setFilters((prev) => ({
      ...prev,
      timeRanges: prev.timeRanges.includes(rangeKey)
        ? prev.timeRanges.filter((r) => r !== rangeKey)
        : [...prev.timeRanges, rangeKey],
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      levels: [],
      timeRanges: [],
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.levels.length > 0 ||
    filters.timeRanges.length > 0 ||
    filters.searchQuery.trim() !== '';

  const handleSearch = () => {
    fetchSessions();
  };

  const handleJoinClick = (session: ISession) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSelectedSession(session);
    setIsJoinModalOpen(true);
  };

  const handleJoinSuccess = () => {
    fetchSessions();
  };

  return (
    <Box>
      {/* Filters */}
      <Flex
        gap={3}
        mb={6}
        wrap="wrap"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        p={3}
        borderRadius="lg"
        borderWidth="1px"
        direction="column"
      >
        {/* Search Bar & Date Row */}
        <Flex gap={2} wrap="wrap" align="end">
          <Box
            flex="1"
            minW={{ base: '100%', md: '200px' }}
            position="relative"
          >
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              zIndex={1}
              color="gray.400"
            >
              <Search size={16} />
            </Box>
            <Input
              pl={9}
              size="sm"
              placeholder={t('searchPlaceholder')}
              value={filters.searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSearchQueryChange(e.target.value)
              }
            />
          </Box>
          <Box width={{ base: '100%', md: '160px' }}>
            <Input
              type="date"
              size="sm"
              value={filters.date}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleDateChange(e.target.value)
              }
            />
          </Box>
          <Button colorPalette="blue" onClick={handleSearch} size="sm" px={6}>
            {t('search')}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              size="sm"
              leftIcon={<X size={14} />}
            >
              {t('clearFilters')}
            </Button>
          )}
        </Flex>

        {/* Time Range & Level Badges */}
        <Flex gap={4} wrap="wrap" direction={{ base: 'column', md: 'row' }}>
          <Box flex={{ base: '1', md: '0 0 auto' }}>
            <Text mb={1.5} fontWeight="medium" fontSize="sm" color="gray.600">
              {t('timeRange')}
            </Text>
            <Wrap gap={1.5}>
              {TIME_RANGES.map((range) => (
                <WrapItem key={range.key}>
                  <Badge
                    px={2.5}
                    py={1.5}
                    borderRadius="md"
                    cursor="pointer"
                    bg={
                      filters.timeRanges.includes(range.key)
                        ? 'blue.500'
                        : 'gray.200'
                    }
                    color={
                      filters.timeRanges.includes(range.key)
                        ? 'white'
                        : 'gray.700'
                    }
                    fontSize="xs"
                    fontWeight="semibold"
                    onClick={() => toggleTimeRange(range.key)}
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm',
                    }}
                    transition="all 0.2s"
                  >
                    {t(`timeRanges.${range.key}`)}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </Box>

          <Box flex={{ base: '1', md: '1' }}>
            <Text mb={1.5} fontWeight="medium" fontSize="sm" color="gray.600">
              {t('level')}
            </Text>
            <Wrap gap={1.5}>
              {VALID_LEVELS.map((level) => (
                <WrapItem key={level}>
                  <Badge
                    px={2.5}
                    py={1.5}
                    borderRadius="md"
                    cursor="pointer"
                    bg={
                      filters.levels.includes(level) ? 'blue.500' : 'gray.200'
                    }
                    color={
                      filters.levels.includes(level) ? 'white' : 'gray.700'
                    }
                    fontSize="xs"
                    fontWeight="semibold"
                    onClick={() => toggleLevel(level)}
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm',
                    }}
                    transition="all 0.2s"
                  >
                    {getLevelShortLabel(level)}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        </Flex>
      </Flex>

      {/* List */}
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" color="blue.500" />
        </Center>
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
      ) : filteredSessions.length === 0 ? (
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
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {filteredSessions.map((session) => (
            <FindSessionCard
              key={session.id}
              session={session}
              onJoin={() => handleJoinClick(session)}
              isJoined={joinedSessionIds.has(session.id)}
              userRegistrationStatus={registrationStatusMap[session.id] || null}
              onRegistrationUpdate={fetchSessions}
            />
          ))}
        </Grid>
      )}

      {selectedSession && (
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          session={selectedSession}
          onSuccess={handleJoinSuccess}
        />
      )}
    </Box>
  );
}
