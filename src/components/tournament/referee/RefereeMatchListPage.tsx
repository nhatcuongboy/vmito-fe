'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Box, Flex, Text, Badge, Heading, SimpleGrid } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { CalendarDays, Filter, Gavel, List, RotateCcw } from 'lucide-react';

import PageLayout from '@/components/layout/PageLayout';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import TournamentRefereeDesktopLayout from '@/components/tournament/TournamentRefereeDesktopLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import {
  Category,
  CategoryMatch,
  Tournament,
  TournamentCourt,
  UserRole,
} from '@/lib/api/types';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';
import { useTournamentBottomNav } from '@/hooks/useTournamentBottomNav';
import PlayerNamesToggle from '@/components/tournament/PlayerNamesToggle';
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import {
  CATEGORY_COLORS,
  ChipOption,
  EMPTY_FILTERS,
  getActiveFilterCount,
  getCategoryColor,
  matchMatchesFilters,
  ResultFilters,
} from '@/components/tournament/manage/panels/resultsFilters';
import { ResultMatchCard } from '@/components/tournament/manage/panels/ResultMatchCard';
import { ResultsCalendarView } from '@/components/tournament/manage/panels/ResultsCalendarView';
import { ResultsFilterDrawer } from '@/components/tournament/manage/panels/ResultsFilterDrawer';
import { ModeButton } from '@/components/ui/ModeButton';
import { formatCourtLabel } from '@/lib/tournament/court';

const SHOW_PLAYER_NAMES_STORAGE_KEY = 'vmito.schedule.showPlayerNames';
const REFEREE_RETURN_URL_STORAGE_PREFIX = 'vmito.referee.returnUrl.';
const REFEREE_MATCH_CARD_ID_PREFIX = 'referee-match-card-';
const REALTIME_REFRESH_DELAY_MS = 500;
const VIEW_MODE_PARAM = 'view';
const SHOW_PLAYER_NAMES_PARAM = 'players';
const FOCUS_MATCH_PARAM = 'focusMatch';
const FILTER_PARAM_KEYS = {
  categoryIds: 'categories',
  rounds: 'rounds',
  courtIds: 'courts',
  statuses: 'statuses',
  teamIds: 'teams',
  dateFrom: 'from',
  dateTo: 'to',
} as const;

type RefereeViewMode = 'list' | 'calendar';

export default function RefereeMatchListPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const t = useTranslations('pages.tournaments.scoreEntry');
  const tManual = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const tGuard = useTranslations('auth.guard');
  const locale = useLocale();
  const { user } = useAuthStore();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ResultFilters>(() =>
    parseFiltersFromSearchParams(searchParams)
  );
  const [viewMode, setViewMode] = useState<RefereeViewMode>(() =>
    parseViewMode(searchParams.get(VIEW_MODE_PARAM))
  );
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() => {
    const urlValue = parseShowPlayerNames(
      searchParams.get(SHOW_PLAYER_NAMES_PARAM)
    );
    if (urlValue !== null) return urlValue;
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SHOW_PLAYER_NAMES_STORAGE_KEY) === '1';
  });
  const lastScrolledMatchIdRef = useRef<string | null>(null);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SHOW_PLAYER_NAMES_STORAGE_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const nextFilters = parseFiltersFromSearchParams(params);
    setFilters((prev) =>
      areResultFiltersEqual(prev, nextFilters) ? prev : nextFilters
    );

    const nextViewMode = parseViewMode(params.get(VIEW_MODE_PARAM));
    setViewMode((prev) => (prev === nextViewMode ? prev : nextViewMode));

    const nextShowPlayerNames = parseShowPlayerNames(
      params.get(SHOW_PLAYER_NAMES_PARAM)
    );
    if (nextShowPlayerNames !== null) {
      setShowPlayerNames((prev) =>
        prev === nextShowPlayerNames ? prev : nextShowPlayerNames
      );
    }
  }, [currentQuery]);

  useEffect(() => {
    const nextParams = buildRefereeListSearchParams(
      currentQuery,
      filters,
      viewMode,
      showPlayerNames
    );
    const nextQuery = nextParams.toString();
    const canonicalCurrentQuery = new URLSearchParams(currentQuery).toString();
    if (nextQuery === canonicalCurrentQuery) return;
    if (typeof window === 'undefined') return;

    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    );
  }, [currentQuery, filters, pathname, showPlayerNames, viewMode]);

  const load = useCallback(async () => {
    try {
      const tour = await TournamentService.getTournament(tournamentParam);
      setTournament(tour);
      const canManageTournament =
        user?.id === tour.hostId || user?.role === UserRole.ADMIN;
      const canAccessRefereeArea =
        canManageTournament || user?.role === UserRole.REFEREE;
      setCanAccess(canAccessRefereeArea);
      if (!canAccessRefereeArea) {
        setMatches([]);
        setCategories([]);
        setCourts([]);
        return;
      }
      const [refereeMatches, tournamentCategories, tournamentCourts] =
        await Promise.all([
          canManageTournament
            ? TournamentService.getAllMatches(tour.id)
            : CategoryService.getMyAssignments(tour.id),
          CategoryService.getCategories(tour.id),
          TournamentService.getCourts(tour.id),
        ]);
      setMatches(refereeMatches);
      setCategories(tournamentCategories);
      setCourts(tournamentCourts);
    } finally {
      setLoading(false);
    }
  }, [tournamentParam, user?.id, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      realtimeRefreshTimeoutRef.current = null;
      void load();
    }, REALTIME_REFRESH_DELAY_MS);
  }, [load]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Reflect live match changes without a manual refresh.
  useTournamentSocket(tournament?.id, {
    onScoreUpdated: scheduleRealtimeRefresh,
    onMatchStarted: scheduleRealtimeRefresh,
    onMatchEnded: scheduleRealtimeRefresh,
    onRefereeAssigned: scheduleRealtimeRefresh,
    onReconnect: () => void load(),
  });

  const isHost = user?.id === tournament?.hostId;
  const isAdmin = user?.role === UserRole.ADMIN;

  const {
    tabs: bottomNavTabs,
    activeTab: bottomNavActiveTab,
    handleTabChange: handleBottomNavTabChange,
  } = useTournamentBottomNav({
    slug: tournamentParam,
    activeTabId: 2,
    canManage: isHost || isAdmin,
    isHostOrAdmin: isHost || isAdmin,
  });

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      category.groups?.forEach((group) => {
        if (group.name) {
          // Format group name: if name is just a letter (A, B, C...), prepend with translated "Bảng"
          const formattedName =
            group.name.length === 1 || /^[A-Z]$/.test(group.name)
              ? `${t('panels.rounds.poolLabel')} ${group.name}`
              : group.name;
          map.set(group.id, formattedName);
        }
      });
    });
    return map;
  }, [categories, t]);

  const resolveRoundOrGroupLabel = useCallback(
    (match: CategoryMatch) => {
      if (match.groupId) {
        const name = groupNameById.get(match.groupId);
        if (name) return name;
      }
      return getRoundDisplayLabel(match.round, tRounds);
    },
    [groupNameById, tRounds]
  );

  const courtAbbreviation =
    tournament?.venue?.acronym ?? tournament?.venue?.name ?? undefined;

  const courtById = useMemo(() => {
    const map = new Map<string, TournamentCourt>();
    courts.forEach((court) => map.set(court.id, court));
    matches.forEach((match) => {
      if (match.court) map.set(match.court.id, match.court);
    });
    return map;
  }, [courts, matches]);

  const categoryOptions = useMemo<ChipOption[]>(() => {
    const matchCategoryIds = new Set(matches.map((match) => match.categoryId));
    return categories
      .filter((category) => matchCategoryIds.has(category.id))
      .map((category, index) => ({
        id: category.id,
        label: category.name,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));
  }, [categories, matches]);

  const roundOptions = useMemo<ChipOption[]>(() => {
    const rounds = Array.from(new Set(matches.map((match) => match.round)));
    return rounds.map((round) => ({
      id: round,
      label: getRoundDisplayLabel(round, tRounds),
    }));
  }, [matches, tRounds]);

  const courtOptions = useMemo<ChipOption[]>(() => {
    const usedCourtIds = new Set(
      matches.map((match) => match.courtId).filter(Boolean) as string[]
    );
    return Array.from(courtById.values())
      .filter((court) => usedCourtIds.has(court.id))
      .sort((a, b) => a.courtNumber - b.courtNumber)
      .map((court) => ({
        id: court.id,
        label: formatCourtLabel(court, t('court')),
        description: court.courtName || undefined,
      }));
  }, [courtById, matches, t]);

  const teamOptions = useMemo<ChipOption[]>(() => {
    const options = new Map<string, string>();
    matches.forEach((match) => {
      ([1, 2] as const).forEach((position) => {
        const participant = match.participants?.find(
          (item) => item.position === position
        );
        if (!participant?.categoryRegistrationId) return;
        options.set(
          participant.categoryRegistrationId,
          getTeamLabel(match, position)
        );
      });
    });
    return Array.from(options.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [matches, locale]);

  const statusOptions = useMemo<ChipOption[]>(
    () => [
      { id: 'upcoming', label: tManual('filters.statusUpcoming') },
      { id: 'finished', label: tManual('filters.statusFinished') },
      { id: 'cancelled', label: tManual('filters.statusCancelled') },
      { id: 'forfeited', label: tManual('filters.statusForfeited') },
    ],
    [tManual]
  );

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => matchMatchesFilters(match, filters))
      .sort((a, b) => {
        // Match the Schedule page ordering: scheduled matches first in
        // chronological order, unscheduled matches at the bottom by number.
        const aTime = a.startTime ? new Date(a.startTime).getTime() : null;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : null;
        if (aTime !== null && bTime !== null) {
          if (aTime !== bTime) return aTime - bTime;
          return a.matchNumber - b.matchNumber;
        }
        if (aTime !== null) return -1;
        if (bTime !== null) return 1;
        return a.matchNumber - b.matchNumber;
      });
  }, [matches, filters]);

  const groups = useMemo(() => {
    const byCat = new Map<string, CategoryMatch[]>();
    for (const match of filteredMatches) {
      if (!byCat.has(match.categoryId)) byCat.set(match.categoryId, []);
      byCat.get(match.categoryId)!.push(match);
    }
    return Array.from(byCat.entries()).map(([categoryId, items]) => ({
      categoryId,
      name: categoryById.get(categoryId)?.name ?? '',
      items,
    }));
  }, [filteredMatches, categoryById]);

  const activeFilterCount = getActiveFilterCount(filters);
  const tournamentHomeHref = `/tournament/${tournamentParam}`;
  const focusedMatchId = searchParams.get(FOCUS_MATCH_PARAM);

  const getMatchCardDomId = useCallback(
    (match: CategoryMatch) => makeMatchCardDomId(match.id),
    []
  );

  useEffect(() => {
    if (loading || !focusedMatchId) return;
    if (lastScrolledMatchIdRef.current === focusedMatchId) return;

    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(
        makeMatchCardDomId(focusedMatchId)
      );
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (element instanceof HTMLElement) {
        element.focus({ preventScroll: true });
      }
      lastScrolledMatchIdRef.current = focusedMatchId;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [filteredMatches, focusedMatchId, loading, viewMode]);

  const openMatch = useCallback(
    (match: CategoryMatch) => {
      const nextParams = buildRefereeListSearchParams(
        currentQuery,
        filters,
        viewMode,
        showPlayerNames
      );
      nextParams.set(FOCUS_MATCH_PARAM, match.id);
      const query = nextParams.toString();
      const returnUrl = query ? `${pathname}?${query}` : pathname;

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          `${REFEREE_RETURN_URL_STORAGE_PREFIX}${tournamentParam}`,
          returnUrl
        );
      }

      if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', returnUrl);
      }
      router.push(`/tournament/${tournamentParam}/referee/${match.id}`);
    },
    [
      currentQuery,
      filters,
      pathname,
      router,
      showPlayerNames,
      tournamentParam,
      viewMode,
    ]
  );

  const updateFilterList = <K extends ListFilterKey>(
    key: K,
    value: ResultFilters[K][number]
  ) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next } as ResultFilters;
    });
  };

  return (
    <>
      <PageLayout
        title={t('title')}
        backHref={tournamentHomeHref}
        showTopBarMenuButton={false}
        showTopBarAiAssistantButton={false}
        disableSidebarOffset
        rootClassName="tournament-shell"
        topBarClassName="tournament-topbar"
        bg="var(--tournament-bg)"
        maxW="full"
        px={{ base: '24px', md: 0 }}
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: '24px',
        }}
      >
        <TournamentRefereeDesktopLayout tournament={tournament} activeTab={2}>
          {loading ? (
            <TournamentMatchListSkeleton count={6} />
          ) : !canAccess ? (
            <Flex direction="column" align="center" py={16} gap={3}>
              <Gavel size={40} opacity={0.4} />
              <Text fontWeight="semibold">{tGuard('accessDenied')}</Text>
              <Text color="gray.500">{tGuard('permissionDenied')}</Text>
            </Flex>
          ) : matches.length === 0 ? (
            <Flex direction="column" align="center" py={16} gap={3}>
              <Gavel size={40} opacity={0.4} />
              <Text color="gray.500">{t('noAssignedMatches')}</Text>
            </Flex>
          ) : (
            <VStack align="stretch" gap={6}>
              <Flex
                justify="space-between"
                align={{ base: 'stretch', md: 'center' }}
                gap={3}
                direction={{ base: 'column', md: 'row' }}
              >
                <Flex
                  align={{ base: 'stretch', md: 'center' }}
                  gap={3}
                  direction={{ base: 'column', md: 'row' }}
                  minW={0}
                >
                  <Box>
                    <Heading size="md" mb={1}>
                      {t('title')}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">
                      {filteredMatches.length}/{matches.length}{' '}
                      {tManual('panelTitle')}
                    </Text>
                  </Box>

                  <Flex
                    display={{ base: 'flex', md: 'none' }}
                    align="center"
                    justify="space-between"
                    gap={3}
                    w="full"
                  >
                    <PlayerNamesToggle
                      active={showPlayerNames}
                      onToggle={() => setShowPlayerNames((prev) => !prev)}
                      title={tManual('showPlayerNames')}
                      label={tManual('showPlayerNamesBadge')}
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="gray"
                      onClick={() => setIsFilterOpen(true)}
                      flexShrink={0}
                      h={9}
                      px={3}
                    >
                      <Filter size={15} /> {tManual('filters.title')}
                      {activeFilterCount > 0 && (
                        <Badge ml={1} colorPalette="green" borderRadius="full">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </Flex>

                  <Box display={{ base: 'none', md: 'block' }} flexShrink={0}>
                    <PlayerNamesToggle
                      active={showPlayerNames}
                      onToggle={() => setShowPlayerNames((prev) => !prev)}
                      title={tManual('showPlayerNames')}
                      label={tManual('showPlayerNamesBadge')}
                    />
                  </Box>
                </Flex>

                <Flex
                  align="center"
                  gap={3}
                  justify={{ base: 'stretch', md: 'flex-end' }}
                  w={{ base: 'full', md: 'auto' }}
                >
                  <Flex
                    align="center"
                    gap={2}
                    justify="space-between"
                    w={{ base: 'full', md: 'auto' }}
                    p={1}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="white"
                    boxShadow="sm"
                    _dark={{
                      bg: 'var(--tournament-surface, var(--chakra-colors-gray-900))',
                      borderColor:
                        'var(--tournament-border, var(--chakra-colors-gray-700))',
                      boxShadow: 'var(--tournament-shadow-soft)',
                    }}
                  >
                    <Flex
                      flex={{ base: 1, sm: '0 1 auto' }}
                      minW={0}
                      p={0.5}
                      gap={1}
                      borderRadius="md"
                      bg="gray.100"
                      _dark={{
                        bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
                      }}
                    >
                      <ModeButton
                        active={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        icon={<List size={15} />}
                      >
                        {tManual('viewList')}
                      </ModeButton>
                      <ModeButton
                        active={viewMode === 'calendar'}
                        onClick={() => setViewMode('calendar')}
                        icon={<CalendarDays size={15} />}
                      >
                        {tManual('viewCalendar')}
                      </ModeButton>
                    </Flex>
                  </Flex>

                  <Button
                    display={{ base: 'none', md: 'inline-flex' }}
                    size="sm"
                    variant="outline"
                    colorPalette="gray"
                    onClick={() => setIsFilterOpen(true)}
                    flexShrink={0}
                    h={9}
                    px={3}
                  >
                    <Filter size={15} /> {tManual('filters.title')}
                    {activeFilterCount > 0 && (
                      <Badge ml={1} colorPalette="green" borderRadius="full">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </Flex>
              </Flex>

              {filteredMatches.length === 0 ? (
                <EmptyRefereeResults
                  onClear={() => setFilters(EMPTY_FILTERS)}
                />
              ) : viewMode === 'calendar' ? (
                <ResultsCalendarView
                  matches={filteredMatches}
                  courts={Array.from(courtById.values())}
                  categoryById={categoryById}
                  onSelect={openMatch}
                  resolveRoundOrGroupLabel={resolveRoundOrGroupLabel}
                  courtAbbreviation={courtAbbreviation}
                  allMatches={matches}
                  showPlayerNames={showPlayerNames}
                  getMatchCardDomId={getMatchCardDomId}
                />
              ) : (
                groups.map((group) => (
                  <Box key={group.categoryId}>
                    <Flex align="center" gap={2} mb={3}>
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={getCategoryColor(categoryOptions, group.categoryId)}
                      />
                      <Heading
                        size="sm"
                        color="gray.700"
                        _dark={{ color: 'gray.200' }}
                      >
                        {group.name}
                      </Heading>
                      <Badge colorPalette="gray">{group.items.length}</Badge>
                    </Flex>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={3}>
                      {group.items.map((match) => (
                        <ResultMatchCard
                          key={match.id}
                          match={match}
                          categoryName={group.name}
                          canEdit
                          onSelect={openMatch}
                          roundOrGroupLabel={resolveRoundOrGroupLabel(match)}
                          courtAbbreviation={courtAbbreviation}
                          allMatches={matches}
                          category={categoryById.get(match.categoryId)}
                          showPlayerNames={showPlayerNames}
                          domId={getMatchCardDomId(match)}
                        />
                      ))}
                    </SimpleGrid>
                  </Box>
                ))
              )}

              <ResultsFilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                categoryOptions={categoryOptions}
                roundOptions={roundOptions}
                courtOptions={courtOptions}
                statusOptions={statusOptions}
                teamOptions={teamOptions}
                onToggle={updateFilterList}
                showPlayerNames={showPlayerNames}
                onTogglePlayerNames={() => setShowPlayerNames((prev) => !prev)}
                showRefereeFilter={false}
              />
            </VStack>
          )}
        </TournamentRefereeDesktopLayout>
      </PageLayout>

      <BottomNavigationBar
        tabs={bottomNavTabs}
        activeTab={bottomNavActiveTab}
        onTabChange={handleBottomNavTabChange}
      />
    </>
  );
}

type ListFilterKey =
  | 'categoryIds'
  | 'rounds'
  | 'courtIds'
  | 'statuses'
  | 'teamIds';

function makeMatchCardDomId(matchId: string) {
  return `${REFEREE_MATCH_CARD_ID_PREFIX}${matchId}`;
}

function parseViewMode(raw: string | null): RefereeViewMode {
  return raw === 'calendar' ? 'calendar' : 'list';
}

function parseShowPlayerNames(raw: string | null) {
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return null;
}

function parseCsv(raw: string | null) {
  return raw
    ? raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function parseStatuses(raw: string | null): ResultFilters['statuses'] {
  return parseCsv(raw).filter(
    (status): status is ResultFilters['statuses'][number] =>
      status === 'upcoming' ||
      status === 'finished' ||
      status === 'cancelled' ||
      status === 'forfeited'
  );
}

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike
): ResultFilters {
  return {
    categoryIds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.categoryIds)),
    rounds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.rounds)),
    courtIds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.courtIds)),
    statuses: parseStatuses(searchParams.get(FILTER_PARAM_KEYS.statuses)),
    teamIds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.teamIds)),
    dateFrom: searchParams.get(FILTER_PARAM_KEYS.dateFrom) ?? '',
    dateTo: searchParams.get(FILTER_PARAM_KEYS.dateTo) ?? '',
    query: '',
    // The referee area already scopes matches to the current user, so the
    // "my matches" referee filter isn't surfaced here.
    refereeOnly: false,
  };
}

function buildRefereeListSearchParams(
  currentQuery: string,
  filters: ResultFilters,
  viewMode: RefereeViewMode,
  showPlayerNames: boolean
) {
  const params = new URLSearchParams(currentQuery);

  setCsvParam(params, FILTER_PARAM_KEYS.categoryIds, filters.categoryIds);
  setCsvParam(params, FILTER_PARAM_KEYS.rounds, filters.rounds);
  setCsvParam(params, FILTER_PARAM_KEYS.courtIds, filters.courtIds);
  setCsvParam(params, FILTER_PARAM_KEYS.statuses, filters.statuses);
  setCsvParam(params, FILTER_PARAM_KEYS.teamIds, filters.teamIds);
  setStringParam(params, FILTER_PARAM_KEYS.dateFrom, filters.dateFrom);
  setStringParam(params, FILTER_PARAM_KEYS.dateTo, filters.dateTo);
  params.set(VIEW_MODE_PARAM, viewMode);
  params.set(SHOW_PLAYER_NAMES_PARAM, showPlayerNames ? '1' : '0');

  return params;
}

function setCsvParam(
  params: URLSearchParams,
  key: string,
  values: readonly string[]
) {
  if (values.length > 0) {
    params.set(key, values.join(','));
  } else {
    params.delete(key);
  }
}

function setStringParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function areResultFiltersEqual(a: ResultFilters, b: ResultFilters) {
  return (
    areStringArraysEqual(a.categoryIds, b.categoryIds) &&
    areStringArraysEqual(a.rounds, b.rounds) &&
    areStringArraysEqual(a.courtIds, b.courtIds) &&
    areStringArraysEqual(a.statuses, b.statuses) &&
    areStringArraysEqual(a.teamIds, b.teamIds) &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo
  );
}

function areStringArraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

type ReadonlyURLSearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>;

function EmptyRefereeResults({ onClear }: { onClear: () => void }) {
  const t = useTranslations('pages.tournaments.manualScore');

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={8}
      textAlign="center"
      bg="white"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        boxShadow: 'var(--tournament-shadow-soft)',
      }}
    >
      <Text fontWeight="semibold" mb={3}>
        {t('filters.empty')}
      </Text>
      <Button variant="outline" colorPalette="gray" onClick={onClear}>
        <RotateCcw size={16} /> {t('filters.clear')}
      </Button>
    </Box>
  );
}
