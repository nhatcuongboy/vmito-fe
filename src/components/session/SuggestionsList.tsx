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
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useViewMode } from '@/hooks/useViewMode';
import { Box, Flex, Grid, Heading, Icon, Text } from '@chakra-ui/react';
import { MapPinOff, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import dynamic from 'next/dynamic';

const AISessionModal = dynamic(
  () => import('./AISessionModal').then((mod) => mod.AISessionModal),
  { ssr: false }
);
const AppHostDetail = dynamic(() => import('./AppHostDetail'), { ssr: false });
const JoinSessionModal = dynamic(() => import('./JoinSessionModal'), {
  ssr: false,
});
const SessionFilterDrawer = dynamic(() => import('./SessionFilterDrawer'), {
  ssr: false,
});

import { SessionCardSkeleton } from './SessionCardSkeleton';
import SessionSearchBar from './SessionSearchBar';
import SuggestionSessionCard from './SuggestionSessionCard';
import ResultsHeader from './ResultsHeader';
import { VModal, useModal } from '@/components/ui/VModal';

const PAGE_SIZE = 12;

type SuggestedSession = ISession & {
  score: number;
  scoreComponents?: {
    level: number;
    distance: number;
    schedule: number;
    venue: number;
    host: number;
    slots: number;
  };
  availableSlots?: number;
  maxPlayers?: number;
  hostAffinity?: number;
  isFavoriteHost?: boolean;
  distance: number | null;
  matchReasons: string[];
};

interface SuggestionsListProps {
  mode: 'browse' | 'auto';
  onModeChange: (mode: 'browse' | 'auto') => void;
}

export default function SuggestionsList({
  mode,
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
  const { useAiForCreation } = usePreferenceStore();

  // Use URL-synced view mode
  const [viewMode, setViewMode] = useViewMode('sessions');

  const loadingMoreRef = useRef(false);

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

  const [refreshKey, setRefreshKey] = useState(0);
  const handleRegistrationUpdate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchSuggestions = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) {
          if (loadingMoreRef.current) return;
          loadingMoreRef.current = true;
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
          setSessions((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newSessions = result.data.filter(
              (s) => !existingIds.has(s.id)
            );
            return [...prev, ...newSessions];
          });
          setPage(currentPage);
        } else {
          setSessions(result.data);
        }

        setTotal(result.pagination.total);
        setHasMore(
          currentPage * PAGE_SIZE < result.pagination.total &&
            result.data.length > 0
        );

        // Fetch user-specific data
        if (user) {
          try {
            const mySessionsResponse = await PlayerService.getMySessions();
            setJoinedSessionIds(
              new Set(mySessionsResponse.data.map((s) => s.id))
            );

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
        if (isLoadMore) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
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
  }, [userLocation, locationDenied, refreshKey]);

  // Infinite scroll
  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !loading &&
      !loadingMore &&
      !loadingMoreRef.current
    ) {
      fetchSuggestions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  const handleJoinClick = useCallback(
    (session: ISession) => {
      if (!user) {
        router.push(ROUTES.AUTH.SIGNIN);
        return;
      }
      setSelectedSession(session);
      setIsJoinModalOpen(true);
    },
    [user, router]
  );

  const handleHostClick = useCallback(
    (session: ISession) => {
      setSelectedSessionForDetail(session);
      onOpenDetailModal();
    },
    [onOpenDetailModal]
  );

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
      sports: [],
      timeRanges: [],
      minFee: 0,
      maxFee: 200000,
      hasSlots: false,
      minAvailableSlots: 0,
      splitEvenly: false,
      sessionType: 'all',
    });
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
    toggleFilters(); // Close drawer after reset
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
        onCreateClick={
          user
            ? () => {
                if (useAiForCreation) {
                  setIsAIModalOpen(true);
                } else {
                  router.push(ROUTES.SESSIONS.NEW);
                }
              }
            : undefined
        }
        hideCreateOnMobile={true}
        topOffset={0}
        fixedOnMobile={true}
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

      {/* Results Header: Count + Mode Toggles + View Toggle + Refresh */}
      <ResultsHeader
        count={total}
        mode={mode}
        onModeChange={onModeChange}
        isLoading={loading}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showViewModeMap={false}
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
            viewMode === 'list'
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
          gap={viewMode === 'list' ? 4 : 6}
        >
          {/* Mobile: 2 skeletons, Tablet: 4 skeletons, Desktop: 6 skeletons */}
          {Array.from({
            length: viewMode === 'list' ? 4 : 6,
          }).map((_, index) => (
            <SessionCardSkeleton
              key={index}
              variant={viewMode}
              isAi={mode === 'auto'}
              display={
                viewMode === 'list'
                  ? {
                      base: index < 2 ? 'flex' : 'none',
                      sm: index < 4 ? 'flex' : 'none',
                      md: 'flex',
                    }
                  : { base: index < 2 ? 'flex' : 'none', md: 'flex' }
              }
            />
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
            w="100%"
            maxW="100%"
            minW={0}
            templateColumns={
              viewMode === 'list'
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
            gap={viewMode === 'list' ? 4 : 6}
          >
            {filteredSessions.map((session) => (
              <Box
                key={session.id}
                w="100%"
                maxW="100%"
                minW={0}
                css={{
                  contentVisibility: 'auto',
                  containIntrinsicSize: 'auto 400px',
                }}
              >
                <SuggestionSessionCard
                  session={session}
                  variant={viewMode}
                  onJoin={handleJoinClick}
                  isJoined={joinedSessionIds.has(session.id)}
                  userRegistrationStatus={
                    registrationStatusMap[session.id] || null
                  }
                  onRegistrationUpdate={handleRegistrationUpdate}
                  onHostClick={handleHostClick}
                />
              </Box>
            ))}
          </Grid>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <Box ref={ref} mt={8} mb={10} width="full">
              <Grid
                templateColumns={
                  viewMode === 'list'
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
                gap={viewMode === 'list' ? 4 : 6}
              >
                {/* Mobile: 1 skeleton, Tablet: 2 skeletons, Desktop: 3 skeletons */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <SessionCardSkeleton
                    key={index}
                    variant={viewMode}
                    isAi={mode === 'auto'}
                    display={
                      viewMode === 'list'
                        ? {
                            base: index < 1 ? 'flex' : 'none',
                            sm: index < 2 ? 'flex' : 'none',
                            md: 'flex',
                          }
                        : {
                            base: index < 1 ? 'flex' : 'none',
                            md: index < 2 ? 'flex' : 'none',
                            lg: 'flex',
                          }
                    }
                  />
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
            router.push(
              ROUTES.SESSIONS.DETAIL(selectedSession.id, selectedSession.slug)
            );
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
        maxBodyHeight={{
          base: 'calc(100vh - 120px)',
          md: 'calc(100vh - 112px)',
        }}
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
            allowZaloContact={selectedSessionForDetail.allowZaloContact}
            onClose={onCloseDetailModal}
          />
        )}
      </VModal>
    </Box>
  );
}
