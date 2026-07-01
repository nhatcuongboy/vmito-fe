'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { Badge, Box, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { Button, Input, VStack } from '@/components/ui/chakra-compat';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/ChakraDrawer';
import { VModal } from '@/components/ui/VModal';
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
  MonitorPlay,
  RotateCcw,
  Search,
  ShieldCheck,
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
  UserRole,
} from '@/lib/api/types';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';
import {
  formatTimeByDevicePreference,
  formatTimeRangeByDevicePreference,
} from '@/utils/time-helpers';
import { toaster } from '@/components/ui/toaster';
import ManualScoreModal from './ManualScoreModal';
import MatchDetailModal from './MatchDetailModal';
import ResetMatchResultConfirmModal from './ResetMatchResultConfirmModal';
import OverlayLinksModal from './OverlayLinksModal';
import DeleteMatchConfirmModal from './schedule/DeleteMatchConfirmModal';
import EditMatchTimeSheet from './schedule/EditMatchTimeSheet';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';
import { useAuthStore } from '@/stores/useAuthStore';

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
  refereeOnly: boolean;
}

export interface ChipOption {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

const SHOW_PLAYER_NAMES_STORAGE_KEY = 'vmito.schedule.showPlayerNames';
const SCHEDULE_MATCH_CARD_ID_PREFIX = 'schedule-match-card-';

export const EMPTY_FILTERS: ResultFilters = {
  categoryIds: [],
  rounds: [],
  courtIds: [],
  statuses: [],
  teamIds: [],
  dateFrom: '',
  dateTo: '',
  query: '',
  refereeOnly: false,
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
  viewMode: 'view',
  showPlayerNames: 'players',
  refereeOnly: 'referee',
  focusMatch: 'focusMatch',
} as const;

export default function ResultsPanel({
  tournament,
  categories,
  canEdit = true,
  heading,
  hideHeadingOnMobile = false,
  description,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tManage = useTranslations('pages.tournaments.detail.manage');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const tOverlay = useTranslations('pages.tournaments.scoreboard.overlay');
  const locale = useLocale();
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

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
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    parseViewMode(searchParams.get(FILTER_PARAM_KEYS.viewMode))
  );
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() => {
    return parseShowPlayerNamesParam(
      searchParams.get(FILTER_PARAM_KEYS.showPlayerNames)
    );
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isOverlayLinksOpen, setIsOverlayLinksOpen] = useState(false);
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
  const [bracketCategoryToGenerate, setBracketCategoryToGenerate] =
    useState<Category | null>(null);
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);
  const lastScrolledMatchIdRef = useRef<string | null>(null);
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
    const params = new URLSearchParams(currentQuery);
    const nextViewMode = parseViewMode(params.get(FILTER_PARAM_KEYS.viewMode));
    const nextShowPlayerNames = parseShowPlayerNamesParam(
      params.get(FILTER_PARAM_KEYS.showPlayerNames)
    );
    const nextFilters = parseFiltersFromSearchParams(params);
    setViewMode((prev) => (prev === nextViewMode ? prev : nextViewMode));
    setShowPlayerNames((prev) =>
      prev === nextShowPlayerNames ? prev : nextShowPlayerNames
    );
    setFilters((prev) =>
      areResultFiltersEqual(prev, nextFilters) ? prev : nextFilters
    );
  }, [currentQuery]);

  useEffect(() => {
    const nextParams = buildResultFilterSearchParams(
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

  // Referee-filter context. The referee scoring page is role-gated (a host,
  // admin, or REFEREE can open ANY match's scoring page — there is no per-match
  // referee scoping), so "matches I can referee" prefers the matches explicitly
  // assigned to me, and falls back to every match I'm allowed to referee when I
  // have no assignments yet.
  const refereeAccess = useMemo(() => {
    const canRefereeAny =
      !!user &&
      (user.id === tournament.hostId ||
        user.role === UserRole.ADMIN ||
        user.role === UserRole.REFEREE);
    const hasOwnAssignments =
      !!user && matches.some((match) => match.referee?.userId === user.id);
    return { canRefereeAny, hasOwnAssignments };
  }, [user, tournament.hostId, matches]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) =>
        matchMatchesFilters(match, filters, user?.id, refereeAccess)
      )
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
  }, [matches, filters, user?.id, refereeAccess]);

  const activeFilterCount = getActiveFilterCount(filters);
  const bracketReadyCategories = useMemo(() => {
    if (!canEdit) return [];

    return categories.reduce<
      { category: Category; finished: number; total: number }[]
    >((acc, category) => {
      if (category.format !== CategoryFormat.ROUND_ROBIN_TO_SE) {
        return acc;
      }

      const categoryMatches = matches.filter(
        (match) => match.categoryId === category.id
      );
      const groupMatches = categoryMatches.filter(
        (match) => match.groupId || match.round === 'GROUP'
      );
      if (groupMatches.length === 0) return acc;

      const allGroupFinished = groupMatches.every(
        (match) => match.status === MatchStatus.FINISHED
      );
      if (!allGroupFinished) return acc;

      // Empty playoff shells (created ahead of time via "Phát sinh trận vòng
      // loại" so they can be scheduled) must NOT count as "already generated".
      // Only a bracket that has been filled with participants means the
      // advancing teams are locked in — until then, keep offering to finalize.
      const bracketFilled = categoryMatches.some(
        (match) =>
          !match.groupId &&
          match.round !== 'GROUP' &&
          (match.participants?.length ?? 0) > 0
      );
      if (bracketFilled) return acc;

      acc.push({
        category,
        finished: groupMatches.length,
        total: groupMatches.length,
      });
      return acc;
    }, []);
  }, [canEdit, categories, matches]);

  const handleConfirmGenerateBracket = useCallback(async () => {
    if (!bracketCategoryToGenerate) return;
    try {
      setIsGeneratingBracket(true);
      await CategoryService.completeGroupStage(bracketCategoryToGenerate.id, {
        showToast: false,
      });
      await load();
      setBracketCategoryToGenerate(null);
      toaster.success({ title: tManage('panels.rounds.bracketGenerated') });
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const raw = apiError?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : raw ||
          (error instanceof Error
            ? error.message
            : tManage('panels.rounds.generateBracketFailed'));
      toaster.error({
        title: tManage('panels.rounds.generateBracketFailed'),
        description: message,
      });
    } finally {
      setIsGeneratingBracket(false);
    }
  }, [bracketCategoryToGenerate, load, tManage]);

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

  const focusedMatchId = searchParams.get(FILTER_PARAM_KEYS.focusMatch);
  const getMatchCardDomId = useCallback(
    (match: CategoryMatch) => makeScheduleMatchCardDomId(match.id),
    []
  );

  useEffect(() => {
    if (loading || !focusedMatchId) return;
    if (lastScrolledMatchIdRef.current === focusedMatchId) return;

    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(
        makeScheduleMatchCardDomId(focusedMatchId)
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

  // Any viewer can open the read-only detail modal; editing is gated inside it.
  const openMatch = (match: CategoryMatch) => {
    if (filters.refereeOnly) {
      const nextParams = buildResultFilterSearchParams(
        currentQuery,
        filters,
        viewMode,
        showPlayerNames
      );
      nextParams.set(FILTER_PARAM_KEYS.refereeOnly, '1');
      nextParams.set(FILTER_PARAM_KEYS.showPlayerNames, '1');
      nextParams.set(FILTER_PARAM_KEYS.focusMatch, match.id);
      const query = nextParams.toString();
      const returnUrl = `/tournament/${tournament.slug}/schedule${
        query ? `?${query}` : ''
      }`;

      if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', returnUrl);
      }

      router.push(`/tournament/${tournament.slug}/referee/${match.id}`);
      return;
    }
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
            align="center"
            gap={2}
            w="full"
          >
            <Box flex={1} minW={0}>
              <SearchInput
                value={filters.query}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, query: value }))
                }
                placeholder={t('filters.searchPlaceholder')}
              />
            </Box>
            {(refereeAccess.canRefereeAny ||
              refereeAccess.hasOwnAssignments) && (
              <Button
                size="sm"
                variant="outline"
                colorPalette={filters.refereeOnly ? 'green' : 'gray'}
                bg={filters.refereeOnly ? 'green.500' : 'transparent'}
                color={filters.refereeOnly ? 'white' : undefined}
                borderColor={filters.refereeOnly ? 'green.400' : 'gray.200'}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    refereeOnly: !prev.refereeOnly,
                  }))
                }
                aria-label={t('filters.referee')}
                flexShrink={0}
                h={9}
                w={9}
                px={0}
                transition="all 0.15s ease"
                _hover={{
                  bg: filters.refereeOnly ? 'green.600' : 'gray.100',
                  borderColor: filters.refereeOnly ? 'green.500' : 'gray.300',
                }}
              >
                <ShieldCheck size={15} />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              colorPalette="gray"
              onClick={() => setIsFilterOpen(true)}
              aria-label={t('filters.title')}
              flexShrink={0}
              h={9}
              w={9}
              px={0}
              position="relative"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  colorPalette="green"
                  borderRadius="full"
                  minW={4}
                  h={4}
                  px={1}
                  fontSize="2xs"
                  lineHeight="1"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </Flex>
        </Flex>

        <Flex
          align="center"
          gap={3}
          justify="flex-end"
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
            w={{ base: 'auto', md: 'auto' }}
            p={{ base: 0, md: 1 }}
            borderWidth={{ base: 0, md: '1px' }}
            borderColor={{ md: 'gray.200' }}
            borderRadius={{ base: 'md', md: 'lg' }}
            bg={{ base: 'transparent', md: 'white' }}
            boxShadow={{ base: 'none', md: 'sm' }}
            _dark={{
              bg: {
                base: 'transparent',
                md: 'var(--tournament-surface, var(--chakra-colors-gray-900))',
              },
              borderColor: {
                md: 'var(--tournament-border, var(--chakra-colors-gray-700))',
              },
              boxShadow: { base: 'none', md: 'var(--tournament-shadow-soft)' },
            }}
          >
            <Flex
              flex={{ base: 1, sm: '0 1 auto' }}
              minW={0}
              p={{ base: 0.5, md: 0.5 }}
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
                ariaLabel={t('viewList')}
              />
              <ModeButton
                active={viewMode === 'calendar'}
                onClick={() => setViewMode('calendar')}
                icon={<CalendarDays size={15} />}
                ariaLabel={t('viewCalendar')}
              />
            </Flex>
          </Flex>

          <Button
            display={{
              base: 'none',
              md:
                refereeAccess.canRefereeAny || refereeAccess.hasOwnAssignments
                  ? 'inline-flex'
                  : 'none',
            }}
            size="sm"
            variant="outline"
            colorPalette={filters.refereeOnly ? 'green' : 'gray'}
            bg={filters.refereeOnly ? 'green.500' : 'transparent'}
            color={filters.refereeOnly ? 'white' : undefined}
            borderColor={filters.refereeOnly ? 'green.400' : 'gray.200'}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                refereeOnly: !prev.refereeOnly,
              }))
            }
            aria-label={t('filters.referee')}
            flexShrink={0}
            h={9}
            w={9}
            px={0}
            transition="all 0.15s ease"
            _hover={{
              bg: filters.refereeOnly ? 'green.600' : 'gray.100',
              borderColor: filters.refereeOnly ? 'green.500' : 'gray.300',
            }}
          >
            <ShieldCheck size={15} />
          </Button>

          <Button
            display={{ base: 'none', md: 'inline-flex' }}
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={() => setIsFilterOpen(true)}
            aria-label={t('filters.title')}
            flexShrink={0}
            h={9}
            w={9}
            px={0}
            position="relative"
          >
            <Filter size={15} />
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorPalette="green"
                borderRadius="full"
                minW={4}
                h={4}
                px={1}
                fontSize="2xs"
                lineHeight="1"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {canEdit && (
            <Button
              display={{ base: 'none', md: 'inline-flex' }}
              size="sm"
              variant="outline"
              colorPalette="gray"
              onClick={() => setIsOverlayLinksOpen(true)}
              aria-label={tOverlay('title')}
              flexShrink={0}
              h={9}
              w={9}
              px={0}
            >
              <MonitorPlay size={15} />
            </Button>
          )}
        </Flex>
      </Flex>

      {bracketReadyCategories.map(({ category, finished, total }) => (
        <Box
          key={category.id}
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
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="green.700"
                mb={1}
                _dark={{ color: 'green.300' }}
              >
                {category.name} ·{' '}
                {tManage('panels.rounds.groupProgress', { finished, total })}
              </Text>
              <Text
                fontWeight="bold"
                color="green.800"
                _dark={{ color: 'green.200' }}
              >
                {tManage('panels.rounds.bracketReadyGenerateTitle')}
              </Text>
              <Text
                fontSize="sm"
                color="gray.700"
                mt={1}
                _dark={{ color: 'gray.200' }}
              >
                {tManage('panels.rounds.bracketReadyGenerateDescription')}
              </Text>
            </Box>
            <Button
              size="sm"
              colorPalette="green"
              onClick={() => setBracketCategoryToGenerate(category)}
              flexShrink={0}
            >
              <Trophy size={14} />
              {tManage('panels.rounds.finalizeAdvancing')}
            </Button>
          </Flex>
        </Box>
      ))}

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
          getMatchCardDomId={getMatchCardDomId}
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
              <SimpleGrid columns={{ base: 1, lg: 2 }} gap={3}>
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
                    domId={getMatchCardDomId(match)}
                  />
                ))}
              </SimpleGrid>
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
        showPlayerNames={showPlayerNames}
        onTogglePlayerNames={() => setShowPlayerNames((prev) => !prev)}
      />

      <OverlayLinksModal
        isOpen={isOverlayLinksOpen}
        onClose={() => setIsOverlayLinksOpen(false)}
        tournamentId={tournament.id}
        courts={courts}
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
        sportType={tournament.sportType}
        showPlayerNames={showPlayerNames}
        tournamentId={tournament.id}
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
          sportType={tournament.sportType}
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

      {canEdit && (
        <VModal
          isOpen={!!bracketCategoryToGenerate}
          onClose={() => setBracketCategoryToGenerate(null)}
          title={tManage('panels.rounds.confirmGenerateTitle')}
          zIndex={1600}
          primaryActionText={tManage('panels.rounds.generatePlayoffs')}
          onPrimaryAction={handleConfirmGenerateBracket}
          isPrimaryLoading={isGeneratingBracket}
          primaryColorScheme="green"
          secondaryActionText={tManage('panels.rounds.cancel')}
        >
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {tManage('panels.rounds.confirmGenerateMessage')}
          </Text>
        </VModal>
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
  const locale = useLocale();
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
  const isInProgress = match.status === MatchStatus.IN_PROGRESS;
  const now = useMinuteTicker(isInProgress && !!match.startTime);
  const timeLabel = getMatchTimeLabel(match);
  const elapsedLabel =
    isInProgress && match.startTime
      ? formatCompactElapsedTime(match.startTime, now, locale)
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
        <Flex
          direction="column"
          align="flex-end"
          justify="flex-start"
          gap={1.5}
          flexShrink={0}
        >
          <Badge
            colorPalette={statusTone.colorPalette}
            variant={statusTone.variant}
            borderRadius="full"
            px={{ base: 2, md: 2.5 }}
            py={0.5}
            fontSize="xs"
            fontWeight="semibold"
            whiteSpace="nowrap"
            flexShrink={0}
          >
            <Flex align="center" gap={1.5}>
              <StatusIcon size={14} aria-hidden="true" />
              <Text as="span">{statusTone.label}</Text>
            </Flex>
          </Badge>
          {isInProgress && elapsedLabel && (
            <Badge
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              px={{ base: 2, md: 2.5 }}
              py={0.5}
              fontSize="2xs"
              fontWeight="semibold"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {elapsedLabel}
            </Badge>
          )}
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

function getMatchTimeLabel(match: CategoryMatch) {
  if (!match.startTime) return '';

  if (match.status === MatchStatus.FINISHED && match.endTime) {
    return formatTimeRangeByDevicePreference(match.startTime, match.endTime);
  }

  return formatTimeByDevicePreference(match.startTime);
}

function useMinuteTicker(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return now;
}

function formatCompactElapsedTime(
  startTime: string | Date,
  now: number,
  locale: string
) {
  const start = new Date(startTime).getTime();
  if (!Number.isFinite(start)) return '';

  const elapsedMinutes = Math.max(0, Math.floor((now - start) / 60_000));
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  if (locale.startsWith('vi')) {
    if (hours > 0) return `${hours}g ${String(minutes).padStart(2, '0')}p`;
    return elapsedMinutes > 0 ? `${elapsedMinutes}p` : '<1p';
  }

  if (locale.startsWith('zh') || locale.startsWith('cn')) {
    if (hours > 0) return `${hours}时${String(minutes).padStart(2, '0')}分`;
    return elapsedMinutes > 0 ? `${elapsedMinutes}分` : '<1分';
  }

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return elapsedMinutes > 0 ? `${elapsedMinutes}m` : '<1m';
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
  const scoreColumnCount = Math.max(setScores.length, 1);
  const scoreGridWidth = {
    base: `${scoreColumnCount * 26}px`,
    md: `${scoreColumnCount * 34}px`,
  };

  return (
    <Box
      display="grid"
      gridTemplateColumns={
        multiSet ? 'minmax(0, 1fr) auto' : 'minmax(0, 1fr) 32px'
      }
      alignItems="center"
      columnGap={{ base: 2.5, md: 3 }}
      py={1}
      minW={0}
    >
      <Text
        fontSize={{ base: 'sm', md: 'md' }}
        fontWeight={highlight ? 'bold' : 'medium'}
        lineClamp={1}
        minW={0}
        pr={1}
      >
        {label}
      </Text>
      {multiSet ? (
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${scoreColumnCount}, minmax(0, 1fr))`}
          w={scoreGridWidth}
          flexShrink={0}
        >
          {setScores.map((score, index) => (
            <Text
              key={index}
              textAlign="center"
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={setWins[index] ? 'bold' : 'normal'}
              color={setWins[index] ? 'fg' : 'gray.400'}
              fontVariantNumeric="tabular-nums"
              lineHeight="1.15"
              whiteSpace="nowrap"
              minW={0}
            >
              {score}
            </Text>
          ))}
        </Box>
      ) : (
        total !== undefined && (
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={highlight ? 'bold' : 'medium'}
            textAlign="center"
            fontVariantNumeric="tabular-nums"
            lineHeight="1.15"
            whiteSpace="nowrap"
          >
            {total}
          </Text>
        )
      )}
    </Box>
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
  showPlayerNames,
  onTogglePlayerNames,
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
  showPlayerNames: boolean;
  onTogglePlayerNames: () => void;
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
            <FilterSection title={t('showPlayerNamesBadge')}>
              <Button
                size="md"
                variant={showPlayerNames ? 'solid' : 'outline'}
                colorPalette={showPlayerNames ? 'green' : 'gray'}
                borderRadius="full"
                onClick={onTogglePlayerNames}
              >
                {showPlayerNames
                  ? t('showPlayerNamesBadge')
                  : t('showPlayerNames')}
              </Button>
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
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const isIconOnly = children == null;

  return (
    <Button
      size="sm"
      variant={active ? 'solid' : 'ghost'}
      colorPalette={active ? 'green' : 'gray'}
      onClick={onClick}
      aria-label={ariaLabel}
      leftIcon={isIconOnly ? undefined : icon}
      flex={isIconOnly ? '0 0 auto' : 1}
      h={8}
      minW={isIconOnly ? 8 : { base: 0, sm: 24 }}
      w={isIconOnly ? 8 : undefined}
      px={isIconOnly ? 0 : 3}
      fontSize="sm"
      fontWeight="semibold"
    >
      {isIconOnly ? icon : children}
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
  filters: ResultFilters,
  currentUserId?: string,
  refereeAccess?: { canRefereeAny: boolean; hasOwnAssignments: boolean }
) {
  const query = normalizeSearchText(filters.query);
  if (query && !getMatchSearchText(match).includes(query)) {
    return false;
  }

  if (filters.refereeOnly) {
    const isMine = !!currentUserId && match.referee?.userId === currentUserId;
    // Prefer explicitly-assigned matches; if I have none but I'm allowed to
    // referee (host / admin / REFEREE), fall back to every match I can referee.
    if (refereeAccess?.hasOwnAssignments) {
      if (!isMine) return false;
    } else if (!refereeAccess?.canRefereeAny && !isMine) {
      return false;
    }
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
    (filters.query.trim() ? 1 : 0) +
    (filters.refereeOnly ? 1 : 0)
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

function parseViewMode(raw: string | null): ViewMode {
  return raw === 'calendar' ? 'calendar' : 'list';
}

function parseShowPlayerNamesParam(raw: string | null) {
  if (raw != null) return raw === '1';
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SHOW_PLAYER_NAMES_STORAGE_KEY) === '1';
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
    refereeOnly: searchParams.get(FILTER_PARAM_KEYS.refereeOnly) === '1',
  };
}

function buildResultFilterSearchParams(
  currentQuery: string,
  filters: ResultFilters,
  viewMode: ViewMode,
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
  setStringParam(params, FILTER_PARAM_KEYS.query, filters.query.trim());
  setStringParam(
    params,
    FILTER_PARAM_KEYS.refereeOnly,
    filters.refereeOnly ? '1' : ''
  );
  setStringParam(
    params,
    FILTER_PARAM_KEYS.viewMode,
    viewMode === 'calendar' ? viewMode : ''
  );
  setStringParam(
    params,
    FILTER_PARAM_KEYS.showPlayerNames,
    showPlayerNames ? '1' : ''
  );

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
    a.query === b.query &&
    a.refereeOnly === b.refereeOnly
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

function makeScheduleMatchCardDomId(matchId: string) {
  return `${SCHEDULE_MATCH_CARD_ID_PREFIX}${matchId}`;
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
