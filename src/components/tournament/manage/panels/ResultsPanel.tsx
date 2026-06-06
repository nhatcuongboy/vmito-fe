'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  usePathname,
  useRouter as useNextRouter,
  useSearchParams,
} from 'next/navigation';
import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, Input, VStack } from '@/components/ui/chakra-compat';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/ChakraDrawer';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  CalendarDays,
  Check,
  CircleSlash,
  Clock,
  Filter,
  Flag,
  List,
  RotateCcw,
  Search,
  Trophy,
  X,
} from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import {
  Category,
  CategoryFormat,
  CategoryMatch,
  MatchStatus,
  Tournament,
  TournamentCourt,
  TournamentUmpire,
} from '@/lib/api/types';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { toaster } from '@/components/ui/toaster';
import ManualScoreModal from './ManualScoreModal';
import MatchDetailModal from './MatchDetailModal';
import ResetMatchResultConfirmModal from './ResetMatchResultConfirmModal';
import DeleteMatchConfirmModal from './schedule/DeleteMatchConfirmModal';
import EditMatchTimeSheet from './schedule/EditMatchTimeSheet';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import PlayerNamesToggle from '@/components/tournament/PlayerNamesToggle';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';

interface Props {
  tournament: Tournament;
  categories: Category[];
  /** When false, results are read-only (no score entry). Defaults to true. */
  canEdit?: boolean;
  /** Optional heading override (e.g. the "Schedule" tab reuses this panel). */
  heading?: string;
  /** Hide the local content heading on mobile when the top bar already provides context. */
  hideHeadingOnMobile?: boolean;
  /** Optional sub-heading override. */
  description?: string;
  /** Optional navigation hook to the Rounds setup panel. */
  onOpenRoundsPanel?: (categoryId: string) => void;
}

type ViewMode = 'list' | 'calendar';
export type ResultStatusFilter =
  | 'upcoming'
  | 'finished'
  | 'cancelled'
  | 'forfeited';

export interface ResultFilters {
  categoryIds: string[];
  rounds: string[];
  courtIds: string[];
  statuses: ResultStatusFilter[];
  teamIds: string[];
  dateFrom: string;
  dateTo: string;
  query: string;
}

export interface ChipOption {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

const SHOW_PLAYER_NAMES_STORAGE_KEY = 'vmito.schedule.showPlayerNames';

export const EMPTY_FILTERS: ResultFilters = {
  categoryIds: [],
  rounds: [],
  courtIds: [],
  statuses: [],
  teamIds: [],
  dateFrom: '',
  dateTo: '',
  query: '',
};

export const CATEGORY_COLORS = [
  '#F6D365',
  '#9BDBF5',
  '#8EE3B2',
  '#C4A5FD',
  '#F8B4D9',
  '#FDBA74',
  '#7DD3FC',
  '#FCA5A5',
];

const CALENDAR_ROW_HEIGHT = 152;
const CALENDAR_TIME_COL_WIDTH = 78;
const REALTIME_REFRESH_DELAY_MS = 500;
const FILTER_PARAM_KEYS = {
  categoryIds: 'categories',
  rounds: 'rounds',
  courtIds: 'courts',
  statuses: 'statuses',
  teamIds: 'teams',
  dateFrom: 'from',
  dateTo: 'to',
  query: 'q',
} as const;

export default function ResultsPanel({
  tournament,
  categories,
  canEdit = true,
  heading,
  hideHeadingOnMobile = false,
  description,
  onOpenRoundsPanel,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tManage = useTranslations('pages.tournaments.detail.manage');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const locale = useLocale();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CategoryMatch | null>(null);
  const [detailMatch, setDetailMatch] = useState<CategoryMatch | null>(null);
  const [schedulingMatch, setSchedulingMatch] = useState<CategoryMatch | null>(
    null
  );
  const [editFromDetail, setEditFromDetail] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SHOW_PLAYER_NAMES_STORAGE_KEY) === '1';
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ResultFilters>(() =>
    parseFiltersFromSearchParams(searchParams)
  );
  const [deletingMatch, setDeletingMatch] = useState<CategoryMatch | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [resettingMatch, setResettingMatch] = useState<CategoryMatch | null>(
    null
  );
  const [isResetting, setIsResetting] = useState(false);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const courtAbbreviation =
    tournament.venue?.acronym ?? tournament.venue?.name ?? undefined;

  const load = useCallback(async () => {
    const [allMatches, allCourts, allUmpires] = await Promise.all([
      TournamentService.getAllMatches(tournament.id),
      TournamentService.getCourts(tournament.id),
      canEdit
        ? TournamentService.getUmpires(tournament.id)
        : Promise.resolve<TournamentUmpire[]>([]),
    ]);
    setMatches(allMatches);
    setCourts(allCourts);
    setUmpires(allUmpires);
  }, [tournament.id, canEdit]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const nextFilters = parseFiltersFromSearchParams(searchParams);
    setFilters((prev) =>
      areResultFiltersEqual(prev, nextFilters) ? prev : nextFilters
    );
  }, [searchParams]);

  useEffect(() => {
    const nextParams = buildResultFilterSearchParams(searchParams, filters);
    const nextQuery = nextParams.toString();
    if (nextQuery === searchParams.toString()) return;

    nextRouter.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [filters, nextRouter, pathname, searchParams]);

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

  useTournamentSocket(tournament.id, {
    onScoreUpdated: scheduleRealtimeRefresh,
    onMatchStarted: scheduleRealtimeRefresh,
    onMatchEnded: scheduleRealtimeRefresh,
    onRefereeAssigned: scheduleRealtimeRefresh,
    onReconnect: () => void load(),
  });

  useEffect(() => {
    setSelected((current) => {
      if (!current) return current;
      return matches.find((match) => match.id === current.id) ?? current;
    });
    setDetailMatch((current) => {
      if (!current) return current;
      return matches.find((match) => match.id === current.id) ?? current;
    });
    setSchedulingMatch((current) => {
      if (!current) return current;
      return matches.find((match) => match.id === current.id) ?? current;
    });
  }, [matches]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SHOW_PLAYER_NAMES_STORAGE_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      category.groups?.forEach((group) => {
        if (group.name) map.set(group.id, group.name);
      });
    });
    return map;
  }, [categories]);

  // Group name for pool matches (e.g. "Pool A"); round label otherwise.
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

  const courtById = useMemo(() => {
    const map = new Map<string, TournamentCourt>();
    courts.forEach((court) => map.set(court.id, court));
    matches.forEach((match) => {
      if (match.court) map.set(match.court.id, match.court);
    });
    return map;
  }, [courts, matches]);

  // Points mode of the selected match's category (drives the manual-points tab).
  const selectedPointsEarning = useMemo(() => {
    if (!selected) return undefined;
    const cfg = categoryById.get(selected.categoryId)?.formatConfig as
      | { pointsEarning?: string; roundRobin?: { pointsEarning?: string } }
      | undefined;
    const value = cfg?.roundRobin?.pointsEarning ?? cfg?.pointsEarning;
    return value as 'match_results' | 'manual' | 'tiebreakers_only' | undefined;
  }, [selected, categoryById]);

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
      .map((court) => {
        const label = formatCourtLabel(court, t('court'));
        const description =
          court.courtName && court.courtName !== label
            ? court.courtName
            : undefined;

        return {
          id: court.id,
          label,
          description,
        };
      });
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
      { id: 'upcoming', label: t('filters.statusUpcoming') },
      { id: 'finished', label: t('filters.statusFinished') },
      { id: 'cancelled', label: t('filters.statusCancelled') },
      { id: 'forfeited', label: t('filters.statusForfeited') },
    ],
    [t]
  );

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => matchMatchesFilters(match, filters))
      .sort((a, b) => {
        // Matches with a scheduled time come first, ordered chronologically.
        // Unscheduled matches go to the bottom, ordered by match number.
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

  const activeFilterCount = getActiveFilterCount(filters);
  const bracketReadyCategories = useMemo(() => {
    if (!canEdit || !onOpenRoundsPanel) return [];

    return categories.filter((category) => {
      if (category.format !== CategoryFormat.ROUND_ROBIN_TO_SE) {
        return false;
      }

      const categoryMatches = matches.filter(
        (match) => match.categoryId === category.id
      );
      const groupMatches = categoryMatches.filter(
        (match) => match.groupId || match.round === 'GROUP'
      );
      if (groupMatches.length === 0) return false;

      return groupMatches.every(
        (match) => match.status === MatchStatus.FINISHED
      );
    });
  }, [canEdit, categories, matches, onOpenRoundsPanel]);

  const primaryBracketReadyCategory = bracketReadyCategories[0];

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

  // Any viewer can open the read-only detail modal; editing is gated inside it.
  const openMatch = (match: CategoryMatch) => {
    setDetailMatch(match);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingMatch) return;
    const matchId = deletingMatch.id;
    setIsDeleting(true);
    try {
      await CategoryService.deleteMatch(matchId);
      setMatches((prev) => prev.filter((match) => match.id !== matchId));
      setSelected((prev) => (prev?.id === matchId ? null : prev));
      setDetailMatch((prev) => (prev?.id === matchId ? null : prev));
      setDeletingMatch(null);
    } catch (error) {
      console.error('Error deleting match:', error);
      toaster.error({ title: t('deleteFailed') });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingMatch, t]);

  const handleConfirmResetResult = useCallback(async () => {
    if (!resettingMatch) return;
    const matchId = resettingMatch.id;
    setIsResetting(true);
    try {
      const updated = await CategoryService.resetMatchResult(matchId, {
        showToast: false,
      });
      setMatches((prev) =>
        prev.map((match) => (match.id === matchId ? updated : match))
      );
      setSelected((prev) => (prev?.id === matchId ? null : prev));
      setDetailMatch((prev) => (prev?.id === matchId ? updated : prev));
      setResettingMatch(null);
      toaster.success({ title: t('resetResultSuccess') });
      void load();
    } catch (error) {
      console.error('Error resetting match result:', error);
      toaster.error({ title: t('resetResultFailed') });
    } finally {
      setIsResetting(false);
    }
  }, [resettingMatch, t, load]);

  const handleScheduleUpdate = useCallback(
    async (
      matchId: string,
      courtId: string | null,
      startTime: string | null,
      endTime: string | null,
      matchCode: string,
      refereeId: string | null
    ) => {
      const previous = matches.find((m) => m.id === matchId);
      const referee = refereeId
        ? (umpires.find((u) => u.id === refereeId) ?? null)
        : null;

      // Optimistically reflect the new schedule in the list/calendar.
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                courtId: courtId ?? undefined,
                court: courtId
                  ? (courtById.get(courtId) ?? m.court)
                  : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                estimatedEndTime: endTime ? new Date(endTime) : undefined,
                matchCode,
                refereeId: refereeId ?? undefined,
                referee,
              }
            : m
        )
      );

      try {
        const tasks: Promise<unknown>[] = [
          CategoryService.updateMatch(
            matchId,
            { matchCode },
            { showToast: false }
          ),
          CategoryService.bulkUpdateSchedule([
            { matchId, courtId, startTime, endTime },
          ]),
        ];
        if (refereeId) {
          tasks.push(
            CategoryService.assignReferee(matchId, refereeId, {
              showToast: false,
            })
          );
        } else if (previous?.refereeId) {
          tasks.push(
            CategoryService.unassignReferee(matchId, { showToast: false })
          );
        }
        await Promise.all(tasks);
        toaster.success({ title: t('scheduleUpdated') });
      } catch (error) {
        console.error('Error updating match schedule:', error);
        toaster.error({ title: t('scheduleUpdateFailed') });
        void load();
      }
    },
    [matches, umpires, courtById, t, load]
  );

  const updateFilterList = (key: ListFilterKey, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next } as ResultFilters;
    });
  };

  if (loading) {
    return <TournamentMatchListSkeleton count={6} />;
  }

  return (
    <Box>
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={3}
        mb={5}
        direction={{ base: 'column', md: 'row' }}
      >
        <Flex
          align={{ base: 'stretch', md: 'center' }}
          gap={3}
          direction={{ base: 'column', md: 'row' }}
          minW={0}
        >
          <Box flex={1} minW={0}>
            <Heading
              size="md"
              display={
                hideHeadingOnMobile ? { base: 'none', md: 'block' } : undefined
              }
            >
              {heading ?? t('panelTitle')}
            </Heading>
            {description && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {description}
              </Text>
            )}
          </Box>

          <Flex
            display={{ base: 'flex', md: 'none' }}
            align="stretch"
            justify="space-between"
            gap={3}
            w="full"
            direction={{ base: 'column', sm: 'row' }}
          >
            <SearchInput
              value={filters.query}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, query: value }))
              }
              placeholder={t('filters.searchPlaceholder')}
            />
            <PlayerNamesToggle
              active={showPlayerNames}
              onToggle={() => setShowPlayerNames((prev) => !prev)}
              title={t('showPlayerNames')}
              label={t('showPlayerNamesBadge')}
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
              <Filter size={15} /> {t('filters.title')}
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
              title={t('showPlayerNames')}
              label={t('showPlayerNamesBadge')}
            />
          </Box>
        </Flex>

        <Flex
          align="center"
          gap={3}
          justify={{ base: 'stretch', md: 'flex-end' }}
          w={{ base: 'full', md: 'auto' }}
        >
          <Box display={{ base: 'none', md: 'block' }} w="280px">
            <SearchInput
              value={filters.query}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, query: value }))
              }
              placeholder={t('filters.searchPlaceholder')}
            />
          </Box>

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
                {t('viewList')}
              </ModeButton>
              <ModeButton
                active={viewMode === 'calendar'}
                onClick={() => setViewMode('calendar')}
                icon={<CalendarDays size={15} />}
              >
                {t('viewCalendar')}
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
            <Filter size={15} /> {t('filters.title')}
            {activeFilterCount > 0 && (
              <Badge ml={1} colorPalette="green" borderRadius="full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </Flex>
      </Flex>

      {bracketReadyCategories.length > 0 && (
        <Box
          mb={5}
          borderWidth="1px"
          borderColor="green.200"
          borderRadius="xl"
          bg="green.50"
          px={{ base: 4, md: 5 }}
          py={4}
          _dark={{ bg: 'green.950', borderColor: 'green.800' }}
        >
          <Flex
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            gap={3}
            direction={{ base: 'column', md: 'row' }}
          >
            <Box minW={0}>
              <Flex align="center" gap={2} wrap="wrap" mb={2}>
                {bracketReadyCategories.map((category) => (
                  <Badge
                    key={category.id}
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="full"
                    px={2.5}
                    py={0.5}
                  >
                    {category.name}
                  </Badge>
                ))}
              </Flex>
              <Text
                fontWeight="bold"
                color="green.800"
                _dark={{ color: 'green.200' }}
              >
                {tManage('panels.rounds.scheduleBracketReadyTitle')}
              </Text>
              <Text
                fontSize="sm"
                color="gray.700"
                mt={1}
                _dark={{ color: 'gray.200' }}
              >
                {tManage('panels.rounds.scheduleBracketReadyDescription')}
              </Text>
            </Box>
            <Button
              size="sm"
              colorPalette="green"
              variant="outline"
              onClick={() =>
                onOpenRoundsPanel?.(primaryBracketReadyCategory.id)
              }
              flexShrink={0}
            >
              <Trophy size={14} />
              {tManage('panels.rounds.goToRounds')}
            </Button>
          </Flex>
        </Box>
      )}

      {matches.length === 0 ? (
        <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
          {t('noMatches')}
        </Text>
      ) : filteredMatches.length === 0 ? (
        <EmptyResults onClear={() => setFilters(EMPTY_FILTERS)} />
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
        />
      ) : (
        <VStack align="stretch" gap={6}>
          {groups.map((group) => (
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
              <VStack align="stretch" gap={3}>
                {group.items.map((match) => (
                  <ResultMatchCard
                    key={match.id}
                    match={match}
                    categoryName={group.name}
                    canEdit={canEdit}
                    onSelect={openMatch}
                    roundOrGroupLabel={resolveRoundOrGroupLabel(match)}
                    courtAbbreviation={courtAbbreviation}
                    allMatches={matches}
                    category={categoryById.get(match.categoryId)}
                    showPlayerNames={showPlayerNames}
                  />
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}

      <FilterDrawer
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
      />

      <MatchDetailModal
        isOpen={!!detailMatch}
        onClose={() => setDetailMatch(null)}
        match={detailMatch}
        categoryName={
          detailMatch
            ? (categoryById.get(detailMatch.categoryId)?.name ?? '')
            : ''
        }
        roundOrGroupLabel={
          detailMatch ? resolveRoundOrGroupLabel(detailMatch) : ''
        }
        courtLabel={
          detailMatch?.court
            ? formatCourtWithVenue(
                detailMatch.court,
                t('court'),
                courtAbbreviation
              )
            : undefined
        }
        allMatches={matches}
        category={
          detailMatch ? categoryById.get(detailMatch.categoryId) : undefined
        }
        showPlayerNames={showPlayerNames}
        canEdit={canEdit}
        onEditResult={(m) => {
          setDetailMatch(null);
          setEditFromDetail(true);
          setSelected(m);
        }}
        onDeleteMatch={(m) => {
          setDetailMatch(null);
          setDeletingMatch(m);
        }}
        onResetResult={(m) => {
          setDetailMatch(null);
          setResettingMatch(m);
        }}
        onSchedule={
          canEdit
            ? (m) => {
                setDetailMatch(null);
                setSchedulingMatch(m);
              }
            : undefined
        }
      />

      {canEdit && (
        <EditMatchTimeSheet
          isOpen={!!schedulingMatch}
          onClose={() => setSchedulingMatch(null)}
          match={schedulingMatch}
          courts={courts}
          tournamentStartDate={tournament.startDate}
          umpires={umpires}
          onUpdate={handleScheduleUpdate}
        />
      )}

      {canEdit && (
        <ManualScoreModal
          isOpen={!!selected}
          onClose={() => {
            setSelected(null);
            setEditFromDetail(false);
          }}
          match={selected}
          pointsEarning={selectedPointsEarning}
          onSaved={() => void load()}
          onBack={
            editFromDetail && selected
              ? () => {
                  const m = selected;
                  setSelected(null);
                  setEditFromDetail(false);
                  setDetailMatch(m);
                }
              : undefined
          }
        />
      )}

      {canEdit && (
        <ResetMatchResultConfirmModal
          isOpen={!!resettingMatch}
          onClose={() => setResettingMatch(null)}
          match={resettingMatch}
          onConfirm={handleConfirmResetResult}
          isResetting={isResetting}
        />
      )}

      {canEdit && (
        <DeleteMatchConfirmModal
          isOpen={!!deletingMatch}
          onClose={() => setDeletingMatch(null)}
          match={deletingMatch}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </Box>
  );
}

export type ListFilterKey =
  | 'categoryIds'
  | 'rounds'
  | 'courtIds'
  | 'statuses'
  | 'teamIds';

export function ResultMatchCard({
  match,
  categoryName,
  onSelect,
  compact = false,
  roundOrGroupLabel,
  courtAbbreviation,
  allMatches,
  category,
  showPlayerNames = false,
  domId,
}: {
  match: CategoryMatch;
  /** Category name shown as a badge on the card. */
  categoryName?: string;
  /** Kept for call-site compatibility; clickability is gated on onSelect. */
  canEdit?: boolean;
  onSelect: (match: CategoryMatch) => void;
  compact?: boolean;
  /** Pre-resolved group name or round label; falls back to the round label. */
  roundOrGroupLabel?: string;
  /** Venue acronym prefixed to the court (e.g. "R · Court 1"). */
  courtAbbreviation?: string;
  /** All category matches, used to resolve empty elimination slots to feeders. */
  allMatches?: CategoryMatch[];
  /** The match's category, used to resolve first-round seed labels. */
  category?: Category;
  /** When true, render the joined player full names instead of pair/team name. */
  showPlayerNames?: boolean;
  /** Optional DOM id for restoring scroll/focus from another route. */
  domId?: string;
}) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const slotLabels = usePlayoffSlotLabels();
  const accent = getMatchAccent(match);

  const ctx = {
    allMatches: allMatches ?? [],
    category,
    labels: slotLabels,
    showPlayerNames,
  };
  const team1 = resolveMatchSideLabel(match, 1, ctx);
  const team2 = resolveMatchSideLabel(match, 2, ctx);
  const win1 = match.winnerId === getRegistrationId(match, 1);
  const win2 = match.winnerId === getRegistrationId(match, 2);
  const topLabel =
    roundOrGroupLabel ?? getRoundDisplayLabel(match.round, tRounds);
  const timeLabel = match.startTime
    ? formatTimeByDevicePreference(new Date(match.startTime))
    : '';
  const courtLabel = match.court
    ? formatCourtWithVenue(match.court, t('court'), courtAbbreviation)
    : '';
  const sets = match.sets ?? [];
  const multiSet = sets.length > 1;
  const score1 = match.player1Score ?? getLastSetScore(match, 1);
  const score2 = match.player2Score ?? getLastSetScore(match, 2);
  const statusTone = getMatchStatusTone(match, t);
  const StatusIcon = statusTone.icon;

  return (
    <Box
      id={domId}
      w="full"
      textAlign="left"
      borderWidth="1px"
      borderColor={accent.border}
      _dark={{
        borderColor:
          match.status === MatchStatus.IN_PROGRESS
            ? 'rgba(45, 212, 191, 0.36)'
            : 'var(--tournament-border, var(--chakra-colors-gray-700))',
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        boxShadow:
          match.status === MatchStatus.IN_PROGRESS
            ? '0 0 0 1px rgba(45, 212, 191, 0.14), 0 18px 42px rgba(20, 184, 166, 0.14)'
            : 'var(--tournament-shadow-soft)',
        _hover: {
          borderColor:
            match.status === MatchStatus.IN_PROGRESS
              ? 'rgba(94, 234, 212, 0.52)'
              : 'rgba(148, 163, 184, 0.32)',
          boxShadow:
            match.status === MatchStatus.IN_PROGRESS
              ? '0 0 0 1px rgba(45, 212, 191, 0.2), 0 22px 48px rgba(20, 184, 166, 0.18)'
              : '0 18px 42px rgba(0, 0, 0, 0.3)',
        },
      }}
      borderTopWidth="4px"
      borderTopColor={accent.stripe}
      borderRadius="xl"
      bg="white"
      boxShadow={accent.shadow}
      p={{ base: 4, md: compact ? 3 : 5 }}
      cursor="pointer"
      transition="border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease"
      _hover={{
        borderColor: accent.hoverBorder,
        transform: 'translateY(-2px)',
        boxShadow: accent.hoverShadow,
      }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'green.400',
        outlineOffset: '2px',
      }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(match)}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(match);
        }
      }}
    >
      <Flex justify="space-between" align="start" gap={3} mb={compact ? 2 : 3}>
        <Flex direction="column" gap={1} minW={0} flex={1}>
          {(categoryName || topLabel) && (
            <Flex align="center" gap={1.5} wrap="wrap">
              {categoryName && (
                <Badge
                  colorPalette="green"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  {categoryName}
                </Badge>
              )}
              {topLabel && (
                <Badge
                  colorPalette="gray"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  {topLabel}
                </Badge>
              )}
            </Flex>
          )}
          <Text
            fontSize="sm"
            color="gray.600"
            _dark={{
              color:
                'var(--tournament-text-muted, var(--chakra-colors-gray-300))',
            }}
            lineClamp={1}
            minW={0}
          >
            {getMatchDisplayCode(match)}
            {courtLabel ? ` · ${courtLabel}` : ''}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
        </Flex>
        <Flex align="center" justify="flex-end" gap={2} flexShrink={0}>
          <Badge
            colorPalette={statusTone.colorPalette}
            variant={statusTone.variant}
            borderRadius="full"
            px={{ base: 2.5, md: 3 }}
            py={1}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="semibold"
            whiteSpace="nowrap"
            flexShrink={0}
          >
            <Flex align="center" gap={1.5}>
              <StatusIcon size={14} aria-hidden="true" />
              <Text as="span">{statusTone.label}</Text>
            </Flex>
          </Badge>
        </Flex>
      </Flex>

      <Box>
        <CardTeamRow
          label={team1}
          highlight={win1}
          total={score1}
          setScores={sets.map((s) => s.player1Score)}
          setWins={sets.map((s) => s.player1Score > s.player2Score)}
          multiSet={multiSet}
        />
        <CardTeamRow
          label={team2}
          highlight={win2}
          total={score2}
          setScores={sets.map((s) => s.player2Score)}
          setWins={sets.map((s) => s.player2Score > s.player1Score)}
          multiSet={multiSet}
        />
      </Box>
    </Box>
  );
}

function CardTeamRow({
  label,
  highlight,
  total,
  setScores,
  setWins,
  multiSet,
}: {
  label: string;
  highlight: boolean;
  total?: number;
  setScores: number[];
  setWins: boolean[];
  multiSet: boolean;
}) {
  return (
    <Flex align="center" justify="space-between" gap={3} py={1} minW={0}>
      <Text
        fontSize={{ base: 'md', md: 'lg' }}
        fontWeight={highlight ? 'bold' : 'medium'}
        lineClamp={1}
        flex="1"
        minW={0}
      >
        {label}
      </Text>
      {multiSet ? (
        <Flex gap={{ base: 2.5, md: 4 }} flexShrink={0}>
          {setScores.map((score, index) => (
            <Text
              key={index}
              w={{ base: '18px', md: '22px' }}
              textAlign="center"
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight={setWins[index] ? 'bold' : 'normal'}
              color={setWins[index] ? 'fg' : 'gray.400'}
            >
              {score}
            </Text>
          ))}
        </Flex>
      ) : (
        total !== undefined && (
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight={highlight ? 'bold' : 'medium'}
            flexShrink={0}
          >
            {total}
          </Text>
        )
      )}
    </Flex>
  );
}

export function ResultsCalendarView({
  matches,
  courts,
  categoryById,
  onSelect,
  resolveRoundOrGroupLabel,
  courtAbbreviation,
  allMatches,
  showPlayerNames,
  getMatchCardDomId,
}: {
  matches: CategoryMatch[];
  courts: TournamentCourt[];
  categoryById: Map<string, Category>;
  onSelect: (match: CategoryMatch) => void;
  resolveRoundOrGroupLabel: (match: CategoryMatch) => string;
  courtAbbreviation?: string;
  allMatches: CategoryMatch[];
  showPlayerNames?: boolean;
  getMatchCardDomId?: (match: CategoryMatch) => string;
}) {
  const t = useTranslations('pages.tournaments.manualScore');
  const locale = useLocale();
  const scheduledMatches = matches.filter(
    (match) => match.startTime && match.courtId
  );

  const days = useMemo(() => {
    const daySet = new Set<string>();
    scheduledMatches.forEach((match) => {
      if (!match.startTime) return;
      daySet.add(toDateInputValue(match.startTime));
    });
    return Array.from(daySet).sort();
  }, [scheduledMatches]);

  const visibleCourts = useMemo(() => {
    const used = new Set(scheduledMatches.map((match) => match.courtId));
    return courts
      .filter((court) => used.has(court.id))
      .sort((a, b) => a.courtNumber - b.courtNumber);
  }, [courts, scheduledMatches]);

  const hours = useMemo(() => {
    const rawHours = scheduledMatches.map((match) =>
      match.startTime ? new Date(match.startTime).getHours() : 0
    );
    if (rawHours.length === 0) return [];
    const min = Math.max(0, Math.min(...rawHours) - 1);
    const max = Math.min(23, Math.max(...rawHours) + 1);
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [scheduledMatches]);

  const grid = useMemo(() => {
    const map = new Map<string, CategoryMatch[]>();
    scheduledMatches.forEach((match) => {
      if (!match.startTime || !match.courtId) return;
      const day = toDateInputValue(match.startTime);
      const hour = new Date(match.startTime).getHours();
      const key = `${day}-${match.courtId}-${hour}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(match);
    });
    map.forEach((items) =>
      items.sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return aTime - bTime;
      })
    );
    return map;
  }, [scheduledMatches]);

  if (scheduledMatches.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={8}
        textAlign="center"
        color="gray.500"
        bg="white"
        _dark={{
          bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
          borderColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
          color: 'var(--tournament-text-muted, var(--chakra-colors-gray-400))',
          boxShadow: 'var(--tournament-shadow-soft)',
        }}
      >
        {t('calendar.empty')}
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {days.map((day) => (
        <Box key={day} overflowX="auto">
          <Box
            mx="auto"
            mb={3}
            px={6}
            py={2}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="full"
            bg="white"
            _dark={{
              bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
              boxShadow: 'var(--tournament-shadow-soft)',
            }}
            w="fit-content"
            boxShadow="0 4px 16px rgba(15, 23, 42, 0.08)"
          >
            <Text fontWeight="semibold">
              {new Date(`${day}T00:00:00`).toLocaleDateString(locale, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={`${CALENDAR_TIME_COL_WIDTH}px repeat(${visibleCourts.length}, minmax(260px, 1fr))`}
            minW={`${CALENDAR_TIME_COL_WIDTH + visibleCourts.length * 260}px`}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            bg="white"
            _dark={{
              bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-900))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
            }}
          >
            <CalendarHeaderCell>{t('calendar.time')}</CalendarHeaderCell>
            {visibleCourts.map((court) => (
              <CalendarHeaderCell key={court.id}>
                {formatCourtLabel(court, t('court'))}
              </CalendarHeaderCell>
            ))}

            {hours.map((hour) => (
              <Fragment key={`${day}-${hour}`}>
                <Box
                  minH={`${CALENDAR_ROW_HEIGHT}px`}
                  borderTopWidth="1px"
                  borderColor="gray.100"
                  p={3}
                  color="gray.500"
                  _dark={{ borderColor: 'gray.800', color: 'gray.400' }}
                >
                  <Text fontSize="sm">{formatHourLabel(hour)}</Text>
                </Box>
                {visibleCourts.map((court) => {
                  const key = `${day}-${court.id}-${hour}`;
                  const cellMatches = grid.get(key) ?? [];
                  return (
                    <Box
                      key={key}
                      minH={`${CALENDAR_ROW_HEIGHT}px`}
                      borderTopWidth="1px"
                      borderLeftWidth="1px"
                      borderColor="gray.100"
                      p={2}
                      _dark={{ borderColor: 'gray.800' }}
                    >
                      <VStack align="stretch" gap={2}>
                        {cellMatches.map((match) => (
                          <ResultMatchCard
                            key={match.id}
                            match={match}
                            categoryName={
                              categoryById.get(match.categoryId)?.name ?? ''
                            }
                            onSelect={onSelect}
                            roundOrGroupLabel={resolveRoundOrGroupLabel(match)}
                            courtAbbreviation={courtAbbreviation}
                            allMatches={allMatches}
                            category={categoryById.get(match.categoryId)}
                            showPlayerNames={showPlayerNames}
                            domId={getMatchCardDomId?.(match)}
                            compact
                          />
                        ))}
                      </VStack>
                    </Box>
                  );
                })}
              </Fragment>
            ))}
          </Box>
        </Box>
      ))}
    </VStack>
  );
}

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  categoryOptions,
  roundOptions,
  courtOptions,
  statusOptions,
  teamOptions,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: ResultFilters;
  setFilters: React.Dispatch<React.SetStateAction<ResultFilters>>;
  categoryOptions: ChipOption[];
  roundOptions: ChipOption[];
  courtOptions: ChipOption[];
  statusOptions: ChipOption[];
  teamOptions: ChipOption[];
  onToggle: <K extends ListFilterKey>(
    key: K,
    value: ResultFilters[K][number]
  ) => void;
}) {
  const t = useTranslations('pages.tournaments.manualScore');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width={{ base: 'calc(100vw - 48px)', sm: '420px', md: '500px' }}
      maxWidth={{ base: '420px', md: '500px' }}
    >
      <DrawerContent>
        <DrawerHeader>
          <Flex align="center" justify="space-between" gap={3}>
            <Text>{t('filters.title')}</Text>
            <Button
              variant="ghost"
              size="sm"
              colorPalette="gray"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" gap={6}>
            <FilterSection title={t('filters.search')}>
              <SearchInput
                value={filters.query}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, query: value }))
                }
                placeholder={t('filters.searchPlaceholder')}
              />
            </FilterSection>

            <FilterSection title={t('filters.categories')}>
              <ChipGroup
                options={categoryOptions}
                selected={filters.categoryIds}
                onToggle={(id) => onToggle('categoryIds', id)}
              />
            </FilterSection>

            <FilterSection title={t('filters.rounds')}>
              <ChipGroup
                options={roundOptions}
                selected={filters.rounds}
                onToggle={(id) => onToggle('rounds', id)}
              />
            </FilterSection>

            <FilterSection title={t('filters.courts')}>
              <ChipGroup
                options={courtOptions}
                selected={filters.courtIds}
                onToggle={(id) => onToggle('courtIds', id)}
              />
            </FilterSection>

            <FilterSection title={t('filters.status')}>
              <ChipGroup
                options={statusOptions}
                selected={filters.statuses}
                onToggle={(id) =>
                  onToggle('statuses', id as ResultStatusFilter)
                }
                iconFor={(id) => statusIcon(id as ResultStatusFilter)}
              />
            </FilterSection>

            <FilterSection title={t('filters.dates')}>
              <Flex
                gap={2}
                align="center"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="full"
                px={4}
                py={3}
                _dark={{ borderColor: 'gray.700' }}
              >
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: event.target.value,
                    }))
                  }
                  border="0"
                  px={0}
                />
                <Text color="gray.500" _dark={{ color: 'gray.400' }}>
                  →
                </Text>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateTo: event.target.value,
                    }))
                  }
                  border="0"
                  px={0}
                />
              </Flex>
            </FilterSection>

            <FilterSection title={t('filters.teams')}>
              <ChipGroup
                options={teamOptions}
                selected={filters.teamIds}
                onToggle={(id) => onToggle('teamIds', id)}
              />
            </FilterSection>
          </VStack>
        </DrawerBody>
        <DrawerFooter>
          <Flex gap={3}>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <RotateCcw size={16} /> {t('filters.clear')}
            </Button>
            <Button flex="1" onClick={onClose}>
              {t('filters.apply')}
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Heading size="sm" mb={3}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  iconFor,
}: {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
  iconFor?: (id: string) => React.ReactNode;
}) {
  if (options.length === 0) {
    return (
      <Text color="gray.400" _dark={{ color: 'gray.500' }}>
        —
      </Text>
    );
  }

  return (
    <Flex gap={2} wrap="wrap">
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <Button
            key={option.id}
            size="md"
            variant={active ? 'solid' : 'outline'}
            colorPalette={active ? 'green' : 'gray'}
            borderRadius="full"
            onClick={() => onToggle(option.id)}
            leftIcon={
              option.color ? (
                <Box w="10px" h="10px" borderRadius="full" bg={option.color} />
              ) : (
                iconFor?.(option.id)
              )
            }
          >
            <Box textAlign="left">
              <Text as="span">{option.label}</Text>
              {option.description && (
                <Text display="block" fontSize="xs" opacity={0.72}>
                  {option.description}
                </Text>
              )}
            </Box>
          </Button>
        );
      })}
    </Flex>
  );
}

export function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={active ? 'solid' : 'ghost'}
      colorPalette={active ? 'green' : 'gray'}
      onClick={onClick}
      leftIcon={icon}
      flex={1}
      h={8}
      minW={{ base: 0, sm: 24 }}
      px={3}
      fontSize="sm"
      fontWeight="semibold"
    >
      {children}
    </Button>
  );
}

function EmptyResults({ onClear }: { onClear: () => void }) {
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

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Box position="relative" w="full">
      <Box
        position="absolute"
        left={3}
        top="50%"
        transform="translateY(-50%)"
        color="gray.400"
        pointerEvents="none"
      >
        <Search size={15} />
      </Box>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        pl={9}
        h={9}
        borderRadius="full"
        bg="white"
        _dark={{
          bg: 'var(--tournament-surface, var(--chakra-colors-gray-900))',
        }}
      />
    </Box>
  );
}

function CalendarHeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      p={3}
      borderLeftWidth="1px"
      borderColor="gray.100"
      bg="gray.50"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        boxShadow: 'var(--tournament-shadow-soft)',
      }}
      textAlign="center"
    >
      <Text fontWeight="bold">{children}</Text>
    </Box>
  );
}

export function matchMatchesFilters(
  match: CategoryMatch,
  filters: ResultFilters
) {
  const query = normalizeSearchText(filters.query);
  if (query && !getMatchSearchText(match).includes(query)) {
    return false;
  }

  if (
    filters.categoryIds.length > 0 &&
    !filters.categoryIds.includes(match.categoryId)
  ) {
    return false;
  }
  if (filters.rounds.length > 0 && !filters.rounds.includes(match.round)) {
    return false;
  }
  if (
    filters.courtIds.length > 0 &&
    (!match.courtId || !filters.courtIds.includes(match.courtId))
  ) {
    return false;
  }
  if (
    filters.statuses.length > 0 &&
    !filters.statuses.some((status) => matchesStatusFilter(match, status))
  ) {
    return false;
  }
  if (filters.teamIds.length > 0) {
    const registrationIds =
      match.participants?.map((item) => item.categoryRegistrationId) ?? [];
    if (!registrationIds.some((id) => filters.teamIds.includes(id))) {
      return false;
    }
  }
  if (filters.dateFrom || filters.dateTo) {
    if (!match.startTime) return false;
    const matchDate = toDateInputValue(match.startTime);
    if (filters.dateFrom && matchDate < filters.dateFrom) return false;
    if (filters.dateTo && matchDate > filters.dateTo) return false;
  }
  return true;
}

function matchesStatusFilter(match: CategoryMatch, filter: ResultStatusFilter) {
  if (filter === 'forfeited') return !!match.isForfeit;
  if (filter === 'cancelled') return match.status === MatchStatus.CANCELLED;
  if (filter === 'finished') {
    return match.status === MatchStatus.FINISHED && !match.isForfeit;
  }
  return (
    match.status === MatchStatus.SCHEDULED ||
    match.status === MatchStatus.IN_PROGRESS
  );
}

export function getActiveFilterCount(filters: ResultFilters) {
  return (
    filters.categoryIds.length +
    filters.rounds.length +
    filters.courtIds.length +
    filters.statuses.length +
    filters.teamIds.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.query.trim() ? 1 : 0)
  );
}

function getMatchSearchText(match: CategoryMatch) {
  const values: string[] = [
    match.matchCode ?? '',
    getMatchDisplayCode(match),
    getTeamLabel(match, 1),
    getTeamLabel(match, 2),
  ];

  match.participants?.forEach((participant) => {
    const registration = participant.categoryRegistration;
    if (!registration) return;

    values.push(registration.player?.name ?? '');
    values.push(registration.pair?.name ?? '');
    registration.pair?.members?.forEach((member) => {
      values.push(member.player?.name ?? '');
    });
  });

  return normalizeSearchText(values.join(' '));
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
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
    query: searchParams.get(FILTER_PARAM_KEYS.query) ?? '',
  };
}

function buildResultFilterSearchParams(
  current: URLSearchParams | ReadonlyURLSearchParamsLike,
  filters: ResultFilters
) {
  const params = new URLSearchParams(current.toString());

  setCsvParam(params, FILTER_PARAM_KEYS.categoryIds, filters.categoryIds);
  setCsvParam(params, FILTER_PARAM_KEYS.rounds, filters.rounds);
  setCsvParam(params, FILTER_PARAM_KEYS.courtIds, filters.courtIds);
  setCsvParam(params, FILTER_PARAM_KEYS.statuses, filters.statuses);
  setCsvParam(params, FILTER_PARAM_KEYS.teamIds, filters.teamIds);
  setStringParam(params, FILTER_PARAM_KEYS.dateFrom, filters.dateFrom);
  setStringParam(params, FILTER_PARAM_KEYS.dateTo, filters.dateTo);
  setStringParam(params, FILTER_PARAM_KEYS.query, filters.query.trim());

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
    a.dateTo === b.dateTo &&
    a.query === b.query
  );
}

function areStringArraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

type ReadonlyURLSearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>;

export function formatCourtLabel(
  court: { courtNumber: number; courtName?: string | null },
  courtPrefix: string
) {
  // If courtName is a pure number string (e.g. "6"), treat it as the court
  // number and prefix it — so it displays as "Sân 6" instead of a bare "6".
  const name = court.courtName?.trim();
  if (!name || /^\d+$/.test(name)) {
    const num = name ? Number(name) : court.courtNumber;
    return `${courtPrefix} ${num}`;
  }
  return name;
}

// Court label prefixed with the venue acronym when available (e.g. "R · Court 1").
function formatCourtWithVenue(
  court: TournamentCourt,
  courtPrefix: string,
  abbreviation?: string
) {
  const base = formatCourtLabel(court, courtPrefix);
  return abbreviation ? `${abbreviation} · ${base}` : base;
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return `${normalized}:00${suffix}`;
}

function toDateInputValue(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLastSetScore(match: CategoryMatch, side: 1 | 2) {
  const lastSet = match.sets?.[match.sets.length - 1];
  if (!lastSet) return undefined;
  return side === 1 ? lastSet.player1Score : lastSet.player2Score;
}

function getRegistrationId(match: CategoryMatch, position: 1 | 2) {
  return match.participants?.find((item) => item.position === position)
    ?.categoryRegistrationId;
}

export function getCategoryColor(options: ChipOption[], categoryId: string) {
  return options.find((option) => option.id === categoryId)?.color ?? '#8EE3B2';
}

function statusIcon(status: ResultStatusFilter) {
  if (status === 'upcoming') return <Clock size={16} />;
  if (status === 'finished') return <Check size={16} />;
  if (status === 'cancelled') return <CircleSlash size={16} />;
  return <Flag size={16} />;
}

function getMatchAccent(match: CategoryMatch) {
  // Top-stripe accent — uses the app's primary green by default.
  if (match.isForfeit) {
    return {
      stripe: 'orange.400',
      border: 'orange.200',
      hoverBorder: 'orange.300',
      shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      hoverShadow: '0 10px 24px rgba(194, 65, 12, 0.14)',
    };
  }
  if (match.status === MatchStatus.IN_PROGRESS) {
    return {
      stripe: 'green.500',
      border: 'green.300',
      hoverBorder: 'green.400',
      shadow:
        '0 0 0 1px rgba(34, 197, 94, 0.16), 0 8px 24px rgba(22, 163, 74, 0.12)',
      hoverShadow: '0 12px 28px rgba(22, 163, 74, 0.18)',
    };
  }
  if (match.status === MatchStatus.FINISHED) {
    return {
      stripe: 'gray.400',
      border: 'gray.200',
      hoverBorder: 'gray.300',
      shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      hoverShadow: '0 10px 24px rgba(15, 23, 42, 0.10)',
    };
  }
  if (match.status === MatchStatus.CANCELLED) {
    return {
      stripe: 'red.400',
      border: 'gray.200',
      hoverBorder: 'red.300',
      shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      hoverShadow: '0 10px 24px rgba(185, 28, 28, 0.12)',
    };
  }
  // Scheduled / default.
  return {
    stripe: 'blue.400',
    border: 'blue.100',
    hoverBorder: 'blue.300',
    shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    hoverShadow: '0 12px 28px rgba(37, 99, 235, 0.12)',
  };
}

function getMatchStatusTone(
  match: CategoryMatch,
  t: ReturnType<typeof useTranslations>
) {
  if (match.isForfeit) {
    return {
      label: t('filters.statusForfeited'),
      colorPalette: 'orange',
      variant: 'solid',
      icon: Flag,
    } as const;
  }

  if (match.status === MatchStatus.IN_PROGRESS) {
    return {
      label: t('status.IN_PROGRESS'),
      colorPalette: 'green',
      variant: 'solid',
      icon: Activity,
    } as const;
  }

  if (match.status === MatchStatus.FINISHED) {
    return {
      label: t('status.FINISHED'),
      colorPalette: 'gray',
      variant: 'solid',
      icon: Check,
    } as const;
  }

  if (match.status === MatchStatus.CANCELLED) {
    return {
      label: t('status.CANCELLED'),
      colorPalette: 'red',
      variant: 'solid',
      icon: CircleSlash,
    } as const;
  }

  return {
    label: t(`matchCardStatus.${match.status}`),
    colorPalette: 'blue',
    variant: 'subtle',
    icon: Clock,
  } as const;
}
