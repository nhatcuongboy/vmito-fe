'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Flex, Text, Badge, Heading } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import {
  CalendarDays,
  Filter,
  Gavel,
  List,
  RotateCcw,
  Users,
} from 'lucide-react';

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
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import {
  CATEGORY_COLORS,
  ChipOption,
  EMPTY_FILTERS,
  FilterDrawer,
  getActiveFilterCount,
  getCategoryColor,
  matchMatchesFilters,
  ModeButton,
  ResultFilters,
  ResultMatchCard,
  ResultsCalendarView,
  formatCourtLabel,
} from '@/components/tournament/manage/panels/ResultsPanel';

const SHOW_PLAYER_NAMES_STORAGE_KEY = 'vmito.schedule.showPlayerNames';

export default function RefereeMatchListPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const router = useRouter();
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
  const [filters, setFilters] = useState<ResultFilters>(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SHOW_PLAYER_NAMES_STORAGE_KEY) === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SHOW_PLAYER_NAMES_STORAGE_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

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

  // Reflect matches starting/ending live without a manual refresh.
  useTournamentSocket(tournament?.id, {
    onMatchStarted: () => void load(),
    onMatchEnded: () => void load(),
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
        if (group.name) map.set(group.id, group.name);
      });
    });
    return map;
  }, [categories]);

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
                  align="center"
                  gap={2}
                  wrap="wrap"
                  justify={{ base: 'stretch', md: 'end' }}
                  w={{ base: 'full', md: 'auto' }}
                  p={1}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="white"
                  boxShadow="sm"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                >
                  <Flex
                    flex={{ base: '1 1 100%', sm: '0 0 auto' }}
                    p={0.5}
                    gap={1}
                    borderRadius="md"
                    bg="gray.100"
                    _dark={{ bg: 'gray.800' }}
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

                  <Button
                    size="sm"
                    variant={showPlayerNames ? 'solid' : 'outline'}
                    colorPalette={showPlayerNames ? 'green' : 'gray'}
                    onClick={() => setShowPlayerNames((prev) => !prev)}
                    aria-pressed={showPlayerNames}
                    title={tManual('showPlayerNames')}
                    flex={{ base: 1, sm: '0 0 auto' }}
                    minW={{ base: 0, sm: 'auto' }}
                    h={9}
                    px={3}
                  >
                    <Users size={15} /> {tManual('showPlayerNames')}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="gray"
                    onClick={() => setIsFilterOpen(true)}
                    flex={{ base: 1, sm: '0 0 auto' }}
                    minW={{ base: 0, sm: 'auto' }}
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
                  onSelect={(match) =>
                    router.push(
                      `/tournament/${tournamentParam}/referee/${match.id}`
                    )
                  }
                  resolveRoundOrGroupLabel={resolveRoundOrGroupLabel}
                  courtAbbreviation={courtAbbreviation}
                  allMatches={matches}
                  showPlayerNames={showPlayerNames}
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
                    <VStack align="stretch" gap={3}>
                      {group.items.map((match) => (
                        <ResultMatchCard
                          key={match.id}
                          match={match}
                          categoryName={group.name}
                          canEdit
                          onSelect={() =>
                            router.push(
                              `/tournament/${tournamentParam}/referee/${match.id}`
                            )
                          }
                          roundOrGroupLabel={resolveRoundOrGroupLabel(match)}
                          courtAbbreviation={courtAbbreviation}
                          allMatches={matches}
                          category={categoryById.get(match.categoryId)}
                          showPlayerNames={showPlayerNames}
                        />
                      ))}
                    </VStack>
                  </Box>
                ))
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
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
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
