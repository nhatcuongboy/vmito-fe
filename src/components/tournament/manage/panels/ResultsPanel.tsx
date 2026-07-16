'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import { VModal } from '@/components/ui/VModal';
import { useLocale, useTranslations } from 'next-intl';
import {
  CalendarDays,
  Layers,
  List,
  MonitorPlay,
  RotateCcw,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

import { CategoryService } from '@/lib/api/category.service';
import {
  Category,
  CategoryFormat,
  CategoryMatch,
  MatchStatus,
  Tournament,
  TournamentCourt,
  UserRole,
} from '@/lib/api/types';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { formatCourtLabel, formatCourtWithVenue } from '@/lib/tournament/court';
import { toaster } from '@/components/ui/toaster';
import { getPrimaryVenueDisplay } from '@/utils';
import ManualScoreModal from './ManualScoreModal';
import MatchDetailModal from './MatchDetailModal';
import ResetMatchResultConfirmModal from './ResetMatchResultConfirmModal';
import OverlayLinksModal from './OverlayLinksModal';
import DeleteMatchConfirmModal from './schedule/DeleteMatchConfirmModal';
import EditMatchTimeSheet from './schedule/EditMatchTimeSheet';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import { useAuthStore } from '@/stores/useAuthStore';
import { ModeButton } from '@/components/ui/ModeButton';
import { ResultMatchCard, makeScheduleMatchCardDomId } from './ResultMatchCard';
import { ResultsCalendarView } from './ResultsCalendarView';
import { ResultsFilterDrawer } from './ResultsFilterDrawer';
import {
  CATEGORY_COLORS,
  ChipOption,
  EMPTY_FILTERS,
  ListFilterKey,
  getActiveFilterCount,
  getCategoryColor,
  matchMatchesFilters,
} from './resultsFilters';
import {
  FILTER_PARAM_KEYS,
  buildResultFilterSearchParams,
  useResultsUrlState,
} from './useResultsUrlState';
import { useResultsData } from './useResultsData';
import { useRouter } from '@/i18n/config';
import TournamentManageEmptyState from './TournamentManageEmptyState';

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
  onOpenCategoriesPanel?: () => void;
}

export default function ResultsPanel({
  tournament,
  categories,
  canEdit = true,
  heading,
  hideHeadingOnMobile = false,
  description,
  onOpenCategoriesPanel,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tManage = useTranslations('pages.tournaments.detail.manage');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const tOverlay = useTranslations('pages.tournaments.scoreboard.overlay');
  const locale = useLocale();
  const { user } = useAuthStore();
  const router = useRouter();

  const { matches, setMatches, courts, umpires, loading, load } =
    useResultsData(tournament.id, canEdit);

  const {
    searchParams,
    currentQuery,
    viewMode,
    setViewMode,
    showPlayerNames,
    setShowPlayerNames,
    filters,
    setFilters,
  } = useResultsUrlState();

  const [selected, setSelected] = useState<CategoryMatch | null>(null);
  const [detailMatch, setDetailMatch] = useState<CategoryMatch | null>(null);
  const [schedulingMatch, setSchedulingMatch] = useState<CategoryMatch | null>(
    null
  );
  const [editFromDetail, setEditFromDetail] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isOverlayLinksOpen, setIsOverlayLinksOpen] = useState(false);
  const pageSize = useBreakpointValue({ base: 50, md: 100 }) ?? 50;
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, filters]);
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

  const primaryVenue = getPrimaryVenueDisplay(tournament);
  const courtAbbreviation =
    primaryVenue?.acronym ?? primaryVenue?.name ?? undefined;

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

  // Score events replace only the live match, but the matches array itself is
  // necessarily new. This fingerprint changes only when data used to resolve
  // team/playoff labels changes, allowing unchanged cards to stay memoized.
  const matchLabelContextVersion = useMemo(
    () => getMatchLabelContextVersion(matches),
    [matches]
  );

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

  const visibleMatches = useMemo(() => {
    return filteredMatches.slice(0, visibleCount);
  }, [filteredMatches, visibleCount]);

  const groups = useMemo(() => {
    const byCat = new Map<string, CategoryMatch[]>();
    for (const match of visibleMatches) {
      if (!byCat.has(match.categoryId)) byCat.set(match.categoryId, []);
      byCat.get(match.categoryId)!.push(match);
    }
    return Array.from(byCat.entries()).map(([categoryId, items]) => ({
      categoryId,
      name: categoryById.get(categoryId)?.name ?? '',
      items,
    }));
  }, [visibleMatches, categoryById]);

  const totalCountPerCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of filteredMatches) {
      counts.set(match.categoryId, (counts.get(match.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [filteredMatches]);

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
  const openMatch = useCallback(
    (match: CategoryMatch) => {
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
    },
    [currentQuery, filters, router, showPlayerNames, tournament.slug, viewMode]
  );

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
  }, [deletingMatch, t, setMatches]);

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
  }, [resettingMatch, t, load, setMatches]);

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
    [matches, umpires, courtById, t, load, setMatches]
  );

  const updateFilterList = (key: ListFilterKey, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next } as typeof prev;
    });
  };

  if (loading) {
    return <TournamentMatchListSkeleton count={6} />;
  }

  if (categories.length === 0) {
    return (
      <Box>
        <Flex direction="column" gap={3} mb={5}>
          <Heading
            size="md"
            display={
              hideHeadingOnMobile ? { base: 'none', md: 'block' } : undefined
            }
          >
            {heading ?? t('panelTitle')}
          </Heading>
          {description && (
            <Text fontSize="sm" color="gray.500">
              {description}
            </Text>
          )}
        </Flex>

        <TournamentManageEmptyState
          icon={<Layers size={24} />}
          title={tManage('panels.categoryRequired.emptyTitle')}
          description={tManage('panels.categoryRequired.emptyDescription')}
          actionLabel={
            onOpenCategoriesPanel
              ? tManage('panels.categoryRequired.action')
              : undefined
          }
          onAction={onOpenCategoriesPanel}
        />
      </Box>
    );
  }

  const canShowRefereeFilter =
    refereeAccess.canRefereeAny || refereeAccess.hasOwnAssignments;

  return (
    <Box>
      <Flex direction="column" gap={3} mb={5}>
        <Flex
          align={{ base: 'stretch', md: 'center' }}
          gap={3}
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          w="full"
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

          <Box w={{ base: 'full', md: '360px' }} minW={0}>
            <AppSearchBar
              value={filters.query}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, query: value }))
              }
              placeholder={t('filters.searchPlaceholder')}
              onFilterClick={() => setIsFilterOpen(true)}
              activeFilterCount={activeFilterCount}
              showFilter={true}
              showCitySelector={false}
            />
          </Box>
        </Flex>

        <Flex align="center" justify="space-between" gap={3} w="full">
          <Flex align="center" gap={2}>
            {canShowRefereeFilter && (
              <Button
                size="sm"
                variant="outline"
                colorPalette={filters.refereeOnly ? 'green' : 'gray'}
                bg={filters.refereeOnly ? 'green.500' : 'transparent'}
                color={filters.refereeOnly ? 'white' : undefined}
                borderWidth="2px"
                borderColor={filters.refereeOnly ? 'green.500' : 'green.200'}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    refereeOnly: !prev.refereeOnly,
                  }))
                }
                aria-label={t('filters.referee')}
                flexShrink={0}
                w="auto"
                minW="fit-content"
                h={9}
                px={3}
                gap={1.5}
                borderRadius="full"
                transition="all 0.15s ease"
                _hover={{
                  bg: filters.refereeOnly ? 'green.600' : 'gray.100',
                  borderColor: filters.refereeOnly ? 'green.600' : 'green.300',
                }}
              >
                <ShieldCheck size={15} />
                <Text fontSize="sm" fontWeight="semibold">
                  {t('filters.referee')}
                </Text>
              </Button>
            )}

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

          <Flex
            align="center"
            gap={2}
            justify="space-between"
            w={{ base: 'auto', md: 'auto' }}
            p={0}
          >
            <Flex
              p={0.5}
              gap={0.5}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              bg="white"
              ml="auto"
              shadow="sm"
              h="fit-content"
              _dark={{
                bg: 'var(--tournament-surface, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
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
          labelContextVersion={matchLabelContextVersion}
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
                <Badge colorPalette="gray">
                  {group.items.length ===
                  (totalCountPerCategory.get(group.categoryId) ?? 0)
                    ? group.items.length
                    : `${group.items.length} / ${totalCountPerCategory.get(group.categoryId) ?? 0}`}
                </Badge>
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
                    labelContextVersion={matchLabelContextVersion}
                    category={categoryById.get(match.categoryId)}
                    showPlayerNames={showPlayerNames}
                    domId={getMatchCardDomId(match)}
                  />
                ))}
              </SimpleGrid>
            </Box>
          ))}
          {filteredMatches.length > visibleCount && (
            <VStack py={4} gap={2} align="center">
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('showingMatches', {
                  count: visibleCount,
                  total: filteredMatches.length,
                })}
              </Text>
              <Button
                variant="subtle"
                colorPalette="green"
                size="sm"
                borderRadius="full"
                onClick={() => setVisibleCount((prev) => prev + pageSize)}
              >
                {t('loadMore')}
              </Button>
            </VStack>
          )}
        </VStack>
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
        showRefereeFilter={canShowRefereeFilter}
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

function getMatchLabelContextVersion(matches: CategoryMatch[]) {
  return JSON.stringify(
    matches.map((match) => [
      match.id,
      match.categoryId,
      match.groupId,
      match.round,
      match.matchNumber,
      match.participants?.map((participant) => {
        const registration = participant.categoryRegistration;
        return [
          participant.position,
          participant.categoryRegistrationId,
          registration?.player?.name,
          registration?.pair?.name,
          registration?.pair?.members?.map((member) => member.player?.name),
        ];
      }),
    ])
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
