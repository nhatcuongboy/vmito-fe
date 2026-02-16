'use client';

import { ROUTES } from '@/constants';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { useRouter } from '@/i18n/config';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';
import { Box, Flex, Grid, Heading, Icon, Text } from '@chakra-ui/react';
import { MapPinOff, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { AISessionModal } from './AISessionModal';
import AppHostDetail from './AppHostDetail';
import JoinSessionModal from './JoinSessionModal';
import { QuickCreateSessionBar } from './QuickCreateSessionBar';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import SessionFilterDrawer from './SessionFilterDrawer';
import SessionSearchBar from './SessionSearchBar';
import SuggestionSessionCard from './SuggestionSessionCard';
import ViewModeToggle from './ViewModeToggle';
import ResultsHeader from './ResultsHeader';
import { VModal, useModal } from '@/components/ui/VModal';

const PAGE_SIZE = 12;

type SuggestedSession = ISession & {
  score: number;
  distance: number | null;
  matchReasons: string[];
};

interface SuggestionsListProps {
  mode?: 'browse' | 'auto';
  onModeChange?: (mode: 'browse' | 'auto') => void;
}

export default function SuggestionsList({
  mode = 'auto',
  onModeChange,
}: SuggestionsListProps) {
  const [sessions, setSessions] = useState<SuggestedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(
    new Set()
  );
  const [registrationStatusMap, setRegistrationStatusMap] = useState<
    Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'>
  >({});

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedSessionForDetail, setSelectedSessionForDetail] =
    useState<ISession | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Pending filters for SessionFilterDrawer
  const {
    filters,
    setFilters,
    clearFilters: clearStoreFilters,
    sortByDistance,
    setSortByDistance,
  } = useSessionFilterStore();
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [pendingSortByDistance, setPendingSortByDistance] =
    useState(sortByDistance);
  const [pendingUserLocation, setPendingUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
      setPendingSortByDistance(sortByDistance);
    }
  }, [showFilters, filters, sortByDistance]);

  const {
    isOpen: isDetailModalOpen,
    onOpen: onOpenDetailModal,
    onClose: onCloseDetailModal,
  } = useModal();

  const router = useRouter();
  const t = useTranslations('suggestions');
  const tSession = useTranslations('session');
  const { user } = useAuthStore();
  const { viewMode } = useSessionFilterStore();

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationDenied(true);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const fetchSuggestions = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setPage(1);
        }
        setError(null);

        const currentPage = isLoadMore ? page + 1 : 1;

        const result = await SessionService.getSuggestedSessions({
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          page: currentPage,
          limit: PAGE_SIZE,
        });

        if (isLoadMore) {
          setSessions((prev) => [...prev, ...result.data]);
          setPage(currentPage);
        } else {
          setSessions(result.data);
        }

        setTotal(result.pagination.total);
        setHasMore(currentPage * PAGE_SIZE < result.pagination.total);

        // Fetch user-specific data
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
        setLoadingMore(false);
      }
    },
    [userLocation, page, user, t]
  );

  // Fetch when location is resolved (or denied)
  useEffect(() => {
    // Wait a bit for location, but fetch even without it
    const timer = setTimeout(
      () => {
        fetchSuggestions();
      },
      userLocation ? 0 : locationDenied ? 0 : 2000
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, locationDenied]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchSuggestions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

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
    onOpenDetailModal();
  };

  const hostIds = useMemo(() => {
    const ids = sessions
      .map((s) => s.hostId)
      .filter((id): id is string => id !== null && id !== undefined);
    return [...new Set(ids)];
  }, [sessions]);

  // Client-side search filtering
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase().trim();
    return sessions.filter((session) => {
      const name = session.name?.toLowerCase() || '';
      const venueName = session.venue?.name?.toLowerCase() || '';
      const location = session.location?.toLowerCase() || '';
      const hostName =
        session.hostName?.toLowerCase() ||
        session.host?.name?.toLowerCase() ||
        '';
      return (
        name.includes(query) ||
        venueName.includes(query) ||
        location.includes(query) ||
        hostName.includes(query)
      );
    });
  }, [sessions, searchQuery]);

  const activeFilterCount = searchQuery ? 1 : 0;

  const handleSearchQueryChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleSubmitFilters = () => {
    setFilters(pendingFilters);
    setSortByDistance(pendingSortByDistance);
    if (pendingUserLocation) {
      setUserLocation(pendingUserLocation);
    }
    toggleFilters();
  };

  const handleResetFilters = () => {
    clearStoreFilters();
    setSortByDistance(false);
    setPendingFilters({
      date: '',
      searchQuery: '',
      cities: [],
      districts: [],
      venueId: '',
      levels: [],
      timeRanges: [],
      minFee: 0,
      maxFee: 200000,
      hasSlots: false,
      minAvailableSlots: 0,
      splitEvenly: false,
    });
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
  };

  const handleAISuccess = (data: ExtractedSessionData) => {
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));
    router.push(ROUTES.SESSIONS.NEW);
  };

  return (
    <Box>
      {/* Search Bar */}
      <SessionSearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        onToggleFilters={toggleFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Filter Drawer */}
      <SessionFilterDrawer
        isOpen={showFilters}
        onClose={toggleFilters}
        filters={pendingFilters}
        setFilters={setPendingFilters}
        sortByDistance={pendingSortByDistance}
        setSortByDistance={setPendingSortByDistance}
        onSubmit={handleSubmitFilters}
        onReset={handleResetFilters}
        activeFilterCount={activeFilterCount}
        userLocation={pendingUserLocation}
        setUserLocation={setPendingUserLocation}
      />

      {/* Quick Create Bar */}
      {user && (
        <Box mb={4}>
          <QuickCreateSessionBar onInputClick={() => setIsAIModalOpen(true)} />
        </Box>
      )}

      {/* Results Header: Count + Mode Toggles + View Toggle + Refresh */}
      <ResultsHeader
        count={total}
        mode={mode}
        onModeChange={(newMode) => onModeChange?.(newMode)}
        onRefresh={() => fetchSuggestions()}
        isLoading={loading}
      />

      {/* Location denied info */}
      {locationDenied && (
        <Flex
          align="center"
          gap={2}
          p={3}
          mb={4}
          bg="yellow.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="yellow.200"
        >
          <Icon as={MapPinOff} boxSize={5} color="yellow.600" />
          <Text fontSize="sm" color="yellow.700">
            {t('locationDenied')}
          </Text>
        </Flex>
      )}

      {/* Results */}
      {loading ? (
        <Grid
          templateColumns={
            viewMode === 'compact'
              ? {
                  base: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                }
              : {
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }
          }
          gap={viewMode === 'compact' ? 4 : 6}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <SessionCardSkeleton key={index} variant={viewMode} />
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
          <Icon as={Sparkles} boxSize={10} color="gray.300" mb={4} />
          <Heading size="md" mb={2}>
            {searchQuery ? tSession('noSessionsFound') : t('noSuggestions')}
          </Heading>
          <Text color="gray.500">
            {searchQuery
              ? tSession('tryAdjustingFilters')
              : t('noSuggestionsDesc')}
          </Text>
          {searchQuery ? (
            <Button
              mt={4}
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
            >
              {tSession('filters.clearFilters')}
            </Button>
          ) : (
            <Button
              mt={4}
              onClick={() => router.push(ROUTES.HOME)}
              variant="outline"
              size="sm"
            >
              {t('browseAll')}
            </Button>
          )}
        </Box>
      ) : (
        <RatingStatsProvider userIds={hostIds}>
          <Grid
            templateColumns={
              viewMode === 'compact'
                ? {
                    base: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }
                : {
                    base: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  }
            }
            gap={viewMode === 'compact' ? 4 : 6}
          >
            {filteredSessions.map((session) => (
              <SuggestionSessionCard
                key={session.id}
                session={session}
                variant={viewMode}
                onJoin={() => handleJoinClick(session)}
                isJoined={joinedSessionIds.has(session.id)}
                userRegistrationStatus={
                  registrationStatusMap[session.id] || null
                }
                onRegistrationUpdate={() => fetchSuggestions()}
                onHostClick={() => handleHostClick(session)}
              />
            ))}
          </Grid>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <Box ref={ref} mt={8} mb={10} width="full">
              <Grid
                templateColumns={
                  viewMode === 'compact'
                    ? {
                        base: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                      }
                    : {
                        base: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      }
                }
                gap={viewMode === 'compact' ? 4 : 6}
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <SessionCardSkeleton key={index} variant={viewMode} />
                ))}
              </Grid>
              <Flex justify="center" mt={4}>
                <Text color="gray.500" fontSize="sm">
                  {tSession('loadingMore')}
                </Text>
              </Flex>
            </Box>
          )}
        </RatingStatsProvider>
      )}

      {/* Join Session Modal */}
      {selectedSession && (
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          session={selectedSession}
          onSuccess={() => {
            fetchSuggestions();
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

      {/* Host Detail Modal */}
      <VModal
        isOpen={isDetailModalOpen}
        onClose={onCloseDetailModal}
        title={tSession('hostInfo')}
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
      </VModal>
    </Box>
  );
}
