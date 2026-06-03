'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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
  CalendarDays,
  Check,
  CircleSlash,
  Clock,
  Filter,
  Flag,
  List,
  MapPin,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  MatchStatus,
  Tournament,
  TournamentCourt,
} from '@/lib/api/types';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import ManualScoreModal from './ManualScoreModal';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface Props {
  tournament: Tournament;
  categories: Category[];
  /** When false, results are read-only (no score entry). Defaults to true. */
  canEdit?: boolean;
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
}

export interface ChipOption {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

export const EMPTY_FILTERS: ResultFilters = {
  categoryIds: [],
  rounds: [],
  courtIds: [],
  statuses: [],
  teamIds: [],
  dateFrom: '',
  dateTo: '',
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

const STATUS_COLOR: Record<MatchStatus, string> = {
  [MatchStatus.IN_PROGRESS]: 'green',
  [MatchStatus.SCHEDULED]: 'blue',
  [MatchStatus.FINISHED]: 'gray',
  [MatchStatus.CANCELLED]: 'red',
};

const CALENDAR_ROW_HEIGHT = 152;
const CALENDAR_TIME_COL_WIDTH = 78;

export default function ResultsPanel({
  tournament,
  categories,
  canEdit = true,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const locale = useLocale();

  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CategoryMatch | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ResultFilters>(EMPTY_FILTERS);

  const load = useCallback(async () => {
    const [allMatches, allCourts] = await Promise.all([
      TournamentService.getAllMatches(tournament.id),
      TournamentService.getCourts(tournament.id),
    ]);
    setMatches(allMatches);
    setCourts(allCourts);
  }, [tournament.id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

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
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;
        return a.matchNumber - b.matchNumber;
      });
  }, [matches, filters]);

  const activeFilterCount = getActiveFilterCount(filters);

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

  const openMatch = (match: CategoryMatch) => {
    if (canEdit) setSelected(match);
  };

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
        align={{ base: 'stretch', md: 'flex-start' }}
        justify="space-between"
        gap={4}
        mb={5}
        direction={{ base: 'column', md: 'row' }}
      >
        <Box>
          <Heading size="md" mb={1}>
            {t('panelTitle')}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            {t('panelDescription')}
          </Text>
        </Box>

        <Flex gap={2} wrap="wrap" justify={{ base: 'flex-start', md: 'end' }}>
          <Flex
            p={1}
            gap={1}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            bg="gray.50"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <ModeButton
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              icon={<List size={16} />}
            >
              {t('viewList')}
            </ModeButton>
            <ModeButton
              active={viewMode === 'calendar'}
              onClick={() => setViewMode('calendar')}
              icon={<CalendarDays size={16} />}
            >
              {t('viewCalendar')}
            </ModeButton>
          </Flex>

          <Button
            variant="outline"
            colorPalette="gray"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={16} /> {t('filters.title')}
            {activeFilterCount > 0 && (
              <Badge ml={1} colorPalette="green" borderRadius="full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </Flex>
      </Flex>

      {matches.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          {t('noMatches')}
        </Text>
      ) : filteredMatches.length === 0 ? (
        <EmptyResults onClear={() => setFilters(EMPTY_FILTERS)} />
      ) : viewMode === 'calendar' ? (
        <ResultsCalendarView
          matches={filteredMatches}
          courts={Array.from(courtById.values())}
          categoryById={categoryById}
          canEdit={canEdit}
          onSelect={openMatch}
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

      {canEdit && (
        <ManualScoreModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          match={selected}
          pointsEarning={selectedPointsEarning}
          onSaved={() => void load()}
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
  canEdit,
  onSelect,
  compact = false,
}: {
  match: CategoryMatch;
  categoryName: string;
  canEdit: boolean;
  onSelect: (match: CategoryMatch) => void;
  compact?: boolean;
}) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);
  const score1 = match.player1Score ?? getLastSetScore(match, 1);
  const score2 = match.player2Score ?? getLastSetScore(match, 2);
  const winner = getWinnerLabel(match, t('draw'));
  const timeLabel = formatMatchDateTime(match);
  const accent = getMatchAccent(match);

  return (
    <Box
      as={canEdit ? 'button' : 'div'}
      w="full"
      textAlign="left"
      borderWidth="1px"
      borderColor={accent.border}
      borderRadius="2xl"
      bg={{
        base: accent.bg,
        _dark: accent.darkBg,
      }}
      boxShadow={accent.shadow}
      p={{ base: 4, md: compact ? 3 : 5 }}
      cursor={canEdit ? 'pointer' : 'default'}
      transition="all 0.18s ease"
      _hover={
        canEdit
          ? {
              borderColor: accent.hoverBorder,
              transform: 'translateY(-2px)',
              boxShadow: accent.hoverShadow,
            }
          : undefined
      }
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'green.400',
        outlineOffset: '2px',
      }}
      onClick={() => onSelect(match)}
    >
      <Flex justify="space-between" gap={{ base: 3, md: 5 }} align="flex-start">
        <Box minW={0} flex="1">
          <Flex gap={2} align="center" wrap="wrap" mb={3}>
            <StatusBadge match={match} />
            <MetaItem>{getMatchDisplayCode(match)}</MetaItem>
            <MetaItem>{categoryName}</MetaItem>
            <MetaItem>{getRoundDisplayLabel(match.round, tRounds)}</MetaItem>
            {match.court && (
              <MetaItem icon={<MapPin size={13} />}>
                {formatCourtLabel(match.court, t('court'))}
              </MetaItem>
            )}
          </Flex>

          {timeLabel && (
            <Flex align="center" gap={1.5} color="gray.500" mb={3}>
              <Clock size={15} />
              <Text fontSize="sm" fontWeight="medium">
                {timeLabel}
              </Text>
            </Flex>
          )}

          <Flex align="center" gap={3}>
            <Box minW={0} flex="1">
              <TeamLine
                label={team1}
                score={score1}
                highlight={match.winnerId === getRegistrationId(match, 1)}
              />
              <TeamLine
                label={team2}
                score={score2}
                highlight={match.winnerId === getRegistrationId(match, 2)}
              />
            </Box>
          </Flex>
        </Box>

        {match.score && (
          <Box
            textAlign="right"
            flexShrink={0}
            display={{ base: 'none', sm: 'block' }}
            minW="72px"
          >
            <Text fontWeight="black" fontSize={{ base: 'xl', md: '2xl' }}>
              {match.score}
            </Text>
            {winner && (
              <Flex align="center" gap={1} justify="flex-end" color="green.600">
                <Trophy size={14} />
                <Text fontSize="xs" fontWeight="semibold" maxW="180px" truncate>
                  {winner}
                </Text>
              </Flex>
            )}
          </Box>
        )}
      </Flex>
    </Box>
  );
}

function ResultsCalendarView({
  matches,
  courts,
  categoryById,
  canEdit,
  onSelect,
}: {
  matches: CategoryMatch[];
  courts: TournamentCourt[];
  categoryById: Map<string, Category>;
  canEdit: boolean;
  onSelect: (match: CategoryMatch) => void;
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
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
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
            _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
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
                    >
                      <VStack align="stretch" gap={2}>
                        {cellMatches.map((match) => (
                          <ResultMatchCard
                            key={match.id}
                            match={match}
                            categoryName={
                              categoryById.get(match.categoryId)?.name ?? ''
                            }
                            canEdit={canEdit}
                            onSelect={onSelect}
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
    <Drawer isOpen={isOpen} onClose={onClose}>
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
                <Text color="gray.500">→</Text>
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
    return <Text color="gray.400">—</Text>;
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

function ModeButton({
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

function StatusBadge({ match }: { match: CategoryMatch }) {
  const t = useTranslations('pages.tournaments.manualScore');
  if (match.isForfeit) {
    return <Badge colorPalette="orange">{t('filters.statusForfeited')}</Badge>;
  }
  return (
    <Badge colorPalette={STATUS_COLOR[match.status] ?? 'gray'}>
      {t(`status.${match.status}`)}
    </Badge>
  );
}

function MetaItem({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Flex
      as="span"
      align="center"
      gap={1}
      color="gray.500"
      fontSize="xs"
      fontWeight="medium"
      minW={0}
    >
      {icon}
      <Text as="span" truncate>
        {children}
      </Text>
    </Flex>
  );
}

function TeamLine({
  label,
  score,
  highlight,
}: {
  label: string;
  score?: number;
  highlight: boolean;
}) {
  return (
    <Flex align="center" justify="space-between" gap={3} minW={0}>
      <Flex align="center" gap={2} minW={0}>
        {highlight && (
          <Trophy size={16} color="var(--chakra-colors-green-500)" />
        )}
        <Text
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight={highlight ? 'bold' : 'semibold'}
          lineClamp={1}
        >
          {label}
        </Text>
      </Flex>
      {score !== undefined && (
        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">
          {score}
        </Text>
      )}
    </Flex>
  );
}

function CalendarHeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      p={3}
      borderLeftWidth="1px"
      borderColor="gray.100"
      bg="gray.50"
      _dark={{ bg: 'gray.800' }}
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
    (filters.dateTo ? 1 : 0)
  );
}

export function formatCourtLabel(court: TournamentCourt, courtPrefix: string) {
  return court.courtName || `${courtPrefix} ${court.courtNumber}`;
}

function formatMatchDateTime(match: CategoryMatch) {
  if (!match.startTime) return '';
  const start = new Date(match.startTime);
  const date = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${date} · ${formatTimeByDevicePreference(start)}`;
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

function getWinnerLabel(match: CategoryMatch, drawLabel: string) {
  if (!match.winnerId) return match.isDraw ? drawLabel : '';
  if (match.winnerId === getRegistrationId(match, 1))
    return getTeamLabel(match, 1);
  if (match.winnerId === getRegistrationId(match, 2))
    return getTeamLabel(match, 2);
  return '';
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
  if (match.isForfeit) {
    return {
      border: 'orange.200',
      hoverBorder: 'orange.300',
      bg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(255,247,237,0.92) 100%)',
      darkBg:
        'linear-gradient(180deg, rgba(31,41,55,0.98) 0%, rgba(124,45,18,0.26) 100%)',
      shadow: '0 14px 34px rgba(194, 65, 12, 0.10)',
      hoverShadow: '0 18px 42px rgba(194, 65, 12, 0.16)',
    };
  }

  if (match.status === MatchStatus.IN_PROGRESS) {
    return {
      border: 'green.200',
      hoverBorder: 'green.400',
      bg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(236,253,245,0.95) 100%)',
      darkBg:
        'linear-gradient(180deg, rgba(31,41,55,0.98) 0%, rgba(6,95,70,0.30) 100%)',
      shadow: '0 16px 40px rgba(22, 163, 74, 0.12)',
      hoverShadow: '0 20px 48px rgba(22, 163, 74, 0.18)',
    };
  }

  if (match.status === MatchStatus.FINISHED) {
    return {
      border: 'gray.200',
      hoverBorder: 'gray.300',
      bg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.96) 100%)',
      darkBg:
        'linear-gradient(180deg, rgba(31,41,55,0.98) 0%, rgba(15,23,42,0.35) 100%)',
      shadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
      hoverShadow: '0 18px 42px rgba(15, 23, 42, 0.13)',
    };
  }

  if (match.status === MatchStatus.CANCELLED) {
    return {
      border: 'red.200',
      hoverBorder: 'red.300',
      bg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(254,242,242,0.92) 100%)',
      darkBg:
        'linear-gradient(180deg, rgba(31,41,55,0.98) 0%, rgba(127,29,29,0.24) 100%)',
      shadow: '0 14px 34px rgba(185, 28, 28, 0.09)',
      hoverShadow: '0 18px 42px rgba(185, 28, 28, 0.14)',
    };
  }

  return {
    border: 'blue.100',
    hoverBorder: 'blue.300',
    bg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(239,246,255,0.88) 100%)',
    darkBg:
      'linear-gradient(180deg, rgba(31,41,55,0.98) 0%, rgba(30,64,175,0.22) 100%)',
    shadow: '0 14px 34px rgba(37, 99, 235, 0.08)',
    hoverShadow: '0 18px 42px rgba(37, 99, 235, 0.13)',
  };
}
