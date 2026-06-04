'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import {
  BarChart3,
  CalendarDays,
  GitBranch,
  Info,
  ListTree,
  RefreshCw,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CategoryService } from '@/lib/api/category.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryFormat,
  CategoryMatch,
  CategoryStandingsResponse,
  GroupStanding,
  MatchStatus,
  Tournament,
} from '@/lib/api/types';
import PublicTournamentBracket from '@/components/tournament/PublicTournamentBracket';
import PlayerNamesToggle from '@/components/tournament/PlayerNamesToggle';
import { Link, useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import { Button, LegacySelect, VStack } from '@/components/ui/chakra-compat';
import { TournamentTableSkeleton } from '@/components/tournament/skeletons';

interface PublicTournamentStandingsTabProps {
  tournament: Tournament;
  categories: Category[];
  isHost: boolean;
}

interface CategoryStandingsBlock {
  category: Category;
  groups: CategoryStandingsResponse;
}

interface OverallStandingRow extends GroupStanding {
  overallRank: number;
  sourceGroupName: string;
}

const ALL_CATEGORIES_VALUE = 'all';
const SHOW_PLAYER_NAMES_STORAGE_KEY = 'vmito.standings.showPlayerNames';

type StageView = 'pool' | 'playoffs';
type StandingView = 'pools' | 'overall';

function getCategoryLabel(category: Category) {
  return category.name?.trim() || category.type;
}

function getGroupLabel(
  group: CategoryStandingsResponse[number]['group'],
  fallback: string
) {
  return group.name?.trim() || fallback;
}

function getStandingTeamLabel(
  standing: GroupStanding,
  options?: { showPlayerNames?: boolean }
) {
  const registration = standing.registration;

  if (registration.pair?.members && registration.pair.members.length > 0) {
    const memberNames = registration.pair.members
      .map((member) => member.player?.name)
      .filter(Boolean)
      .join(' / ');
    if (options?.showPlayerNames) {
      return memberNames || registration.pair.name || '';
    }
    return registration.pair.name || memberNames;
  }

  return (
    registration.pair?.name ||
    registration.player?.name ||
    registration.id ||
    standing.categoryRegistrationId
  );
}

function compareStandings(
  first: Pick<
    GroupStanding,
    'points' | 'pointDifference' | 'pointsFor' | 'matchesWon' | 'matchesPlayed'
  >,
  second: Pick<
    GroupStanding,
    'points' | 'pointDifference' | 'pointsFor' | 'matchesWon' | 'matchesPlayed'
  >
) {
  return (
    second.points - first.points ||
    second.pointDifference - first.pointDifference ||
    second.pointsFor - first.pointsFor ||
    second.matchesWon - first.matchesWon ||
    second.matchesPlayed - first.matchesPlayed
  );
}

function hasStandingResult(standing: GroupStanding) {
  return (
    standing.matchesPlayed > 0 ||
    standing.matchesWon > 0 ||
    standing.matchesLost > 0 ||
    standing.matchesDrawn > 0 ||
    (standing.matchesForfeited ?? 0) > 0 ||
    (standing.matchesCancelled ?? 0) > 0 ||
    standing.points !== 0 ||
    standing.pointsFor !== 0 ||
    standing.pointsAgainst !== 0 ||
    standing.pointDifference !== 0 ||
    standing.gamesWon !== 0 ||
    standing.gamesLost !== 0 ||
    standing.gameDifference !== 0
  );
}

export default function PublicTournamentStandingsTab({
  tournament,
  categories,
  isHost,
}: PublicTournamentStandingsTabProps) {
  const t = useTranslations('pages.tournaments.detail.standingsTab');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryId =
    searchParams.get('category') || ALL_CATEGORIES_VALUE;
  const [standingsByCategory, setStandingsByCategory] = useState<
    CategoryStandingsBlock[]
  >([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(initialCategoryId);
  const [stageView, setStageView] = useState<StageView>('pool');
  const [standingView, setStandingView] = useState<StandingView>('pools');
  const [showRankingInfo, setShowRankingInfo] = useState(false);
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SHOW_PLAYER_NAMES_STORAGE_KEY) === '1';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recalculatingGroupId, setRecalculatingGroupId] = useState<
    string | null
  >(null);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const loadCategoryStandings = useCallback(
    async (category: Category): Promise<CategoryStandingsBlock> => ({
      category,
      groups: await CategoryService.getAllStandings(category.id),
    }),
    []
  );

  const loadStandings = useCallback(async () => {
    if (categories.length === 0) {
      setStandingsByCategory([]);
      setLoading(false);
      setError(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const [blocks, allMatches] = await Promise.all([
        Promise.all(categories.map(loadCategoryStandings)),
        TournamentService.getAllMatches(tournament.id),
      ]);
      setStandingsByCategory(blocks);
      setMatches(allMatches);
    } catch (loadError) {
      console.error('Error loading tournament standings:', loadError);
      setError(true);
      setStandingsByCategory([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [categories, loadCategoryStandings, tournament.id]);

  useEffect(() => {
    void loadStandings();
  }, [loadStandings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SHOW_PLAYER_NAMES_STORAGE_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

  useEffect(() => {
    if (
      selectedCategoryId !== ALL_CATEGORIES_VALUE &&
      !categoriesById.has(selectedCategoryId)
    ) {
      setSelectedCategoryId(ALL_CATEGORIES_VALUE);
    }
  }, [categoriesById, selectedCategoryId]);

  const visibleBlocks = useMemo(() => {
    if (selectedCategoryId === ALL_CATEGORIES_VALUE) {
      return standingsByCategory;
    }
    return standingsByCategory.filter(
      (block) => block.category.id === selectedCategoryId
    );
  }, [selectedCategoryId, standingsByCategory]);

  const hasAnyStandings = standingsByCategory.some((block) =>
    block.groups.some((group) => group.standings.length > 0)
  );

  const visibleOverallRows = useMemo(() => {
    return visibleBlocks.map((block) => {
      const rows = block.groups.flatMap((groupBlock) => {
        const sourceGroupName = getGroupLabel(
          groupBlock.group,
          t('groupFallback', {
            number: groupBlock.group.groupNumber,
          })
        );

        return groupBlock.standings.map((standing) => ({
          ...standing,
          sourceGroupName,
          overallRank: 0,
        }));
      });

      const rankedRows = [...rows].sort(compareStandings).map((row, index) => ({
        ...row,
        overallRank: index + 1,
      }));

      return {
        category: block.category,
        rows: rankedRows,
      };
    });
  }, [t, visibleBlocks]);

  // A group's 1st-placed team gets a trophy only once the group stage is fully
  // played AND the elimination bracket has been generated ("Sinh lại bracket"),
  // i.e. the standings are final and the winners have advanced.
  const winnerHighlightByCategory = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const category of categories) {
      const categoryMatches = matches.filter(
        (m) => m.categoryId === category.id
      );
      const groupMatches = categoryMatches.filter(
        (m) => (m.round ?? '').toUpperCase() === 'GROUP'
      );
      const groupStageComplete =
        groupMatches.length > 0 &&
        groupMatches.every((m) => m.status === MatchStatus.FINISHED);
      const bracketGenerated = categoryMatches.some(
        (m) => (m.round ?? '').toUpperCase() !== 'GROUP'
      );
      map.set(category.id, groupStageComplete && bracketGenerated);
    }
    return map;
  }, [categories, matches]);

  const visiblePlayoffCategories = useMemo(() => {
    const visible =
      selectedCategoryId === ALL_CATEGORIES_VALUE
        ? categories
        : categories.filter((category) => category.id === selectedCategoryId);

    return visible
      .filter((category) =>
        [
          CategoryFormat.ROUND_ROBIN_TO_SE,
          CategoryFormat.SINGLE_ELIMINATION,
        ].includes(category.format)
      )
      .map((category) => {
        const categoryMatches = matches.filter(
          (match) => match.categoryId === category.id
        );
        return {
          category,
          groupStageMatchCount: categoryMatches.filter(
            (match) => match.groupId || match.round === 'GROUP'
          ).length,
          matches: categoryMatches
            .filter((match) => !match.groupId && match.round !== 'GROUP')
            .sort((first, second) => first.matchNumber - second.matchNumber),
        };
      });
  }, [categories, matches, selectedCategoryId]);

  const reloadCategory = useCallback(
    async (category: Category) => {
      const nextBlock = await loadCategoryStandings(category);
      setStandingsByCategory((current) =>
        current.map((block) =>
          block.category.id === category.id ? nextBlock : block
        )
      );
    },
    [loadCategoryStandings]
  );

  const handleRecalculate = useCallback(
    async (categoryId: string, groupId: string) => {
      const category = categoriesById.get(categoryId);
      if (!category) return;

      try {
        setRecalculatingGroupId(groupId);
        await CategoryService.calculateStandings(categoryId, groupId);
        await reloadCategory(category);
      } catch (recalculateError) {
        console.error('Error recalculating standings:', recalculateError);
      } finally {
        setRecalculatingGroupId(null);
      }
    },
    [categoriesById, reloadCategory]
  );

  if (loading) {
    return <TournamentTableSkeleton rows={6} columns={7} />;
  }

  return (
    <Box>
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 3 }}
        mb={{ base: 3, md: 4 }}
      >
        <Heading size="md">{t('title')}</Heading>

        {categories.length > 1 && (
          <Box
            w={{ base: 'fit-content', md: '260px' }}
            minW={{ base: '180px', md: '260px' }}
            maxW={{ base: '100%', md: '260px' }}
            alignSelf={{ base: 'flex-start', md: 'auto' }}
          >
            <LegacySelect
              aria-label={t('categoryFilter')}
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              size="sm"
            >
              <option value={ALL_CATEGORIES_VALUE}>{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </LegacySelect>
          </Box>
        )}
      </Flex>

      <Flex
        align="center"
        justify="space-between"
        direction="row"
        gap={3}
        mb={{ base: 3, md: 4 }}
      >
        <Flex
          align="center"
          direction="row"
          gap={{ base: 3, md: 2 }}
          minW={0}
          overflowX="auto"
          css={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <HStack
            gap="2px"
            p="2px"
            bg="gray.100"
            borderWidth="1px"
            borderColor="transparent"
            _dark={{
              bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
            }}
            borderRadius="full"
            w="fit-content"
            flexShrink={0}
          >
            <Button
              flex="unset"
              size="xs"
              variant={stageView === 'pool' ? 'solid' : 'ghost'}
              colorPalette={stageView === 'pool' ? 'green' : 'gray'}
              borderRadius="full"
              px={{ base: 3, sm: 3.5 }}
              onClick={() => setStageView('pool')}
            >
              <ListTree size={14} /> {t('poolPlay')}
            </Button>
            <Button
              flex="unset"
              size="xs"
              variant={stageView === 'playoffs' ? 'solid' : 'ghost'}
              colorPalette={stageView === 'playoffs' ? 'green' : 'gray'}
              borderRadius="full"
              px={{ base: 3, sm: 3.5 }}
              onClick={() => setStageView('playoffs')}
            >
              <GitBranch size={14} /> {t('playoffs')}
            </Button>
          </HStack>

          {stageView === 'pool' && (
            <HStack
              gap="2px"
              p="2px"
              bg="gray.100"
              borderWidth="1px"
              borderColor="transparent"
              _dark={{
                bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
              }}
              borderRadius="full"
              w="fit-content"
              flexShrink={0}
            >
              <Button
                flex="unset"
                size="xs"
                variant={standingView === 'pools' ? 'solid' : 'ghost'}
                colorPalette={standingView === 'pools' ? 'green' : 'gray'}
                borderRadius="full"
                px={{ base: 3, sm: 3.5 }}
                onClick={() => setStandingView('pools')}
              >
                {t('pools')}
              </Button>
              <Button
                flex="unset"
                size="xs"
                variant={standingView === 'overall' ? 'solid' : 'ghost'}
                colorPalette={standingView === 'overall' ? 'green' : 'gray'}
                borderRadius="full"
                px={{ base: 3, sm: 3.5 }}
                onClick={() => setStandingView('overall')}
              >
                {t('overall')}
              </Button>
            </HStack>
          )}
        </Flex>

        <PlayerNamesToggle
          active={showPlayerNames}
          onToggle={() => setShowPlayerNames((prev) => !prev)}
          title={t('showPlayerNames')}
        />
      </Flex>

      {error ? (
        <Flex
          direction="column"
          align="center"
          gap={3}
          py={10}
          px={4}
          borderWidth="1px"
          borderRadius="lg"
          borderColor="gray.100"
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Text
            color="gray.500"
            textAlign="center"
            _dark={{ color: 'gray.400' }}
          >
            {t('error')}
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadStandings()}
          >
            <RotateCcw size={14} /> {t('retry')}
          </Button>
        </Flex>
      ) : stageView === 'playoffs' ? (
        visiblePlayoffCategories.length === 0 ? (
          <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
            {t('emptyPlayoffs')}
          </Text>
        ) : (
          <VStack align="stretch" gap={6}>
            {visiblePlayoffCategories.map(
              ({
                category,
                groupStageMatchCount,
                matches: categoryMatches,
              }) => (
                <Box key={category.id}>
                  <Heading
                    size="sm"
                    mb={3}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                  >
                    {getCategoryLabel(category)}
                  </Heading>
                  <PublicTournamentBracket
                    category={category}
                    groupStageMatchCount={groupStageMatchCount}
                    matches={categoryMatches}
                    t={t}
                  />
                </Box>
              )
            )}
          </VStack>
        )
      ) : categories.length === 0 ? (
        <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
          {t('noCategories')}
        </Text>
      ) : !hasAnyStandings ? (
        <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
          {t('empty')}
        </Text>
      ) : standingView === 'overall' ? (
        <VStack align="stretch" gap={6}>
          {visibleOverallRows.map((block) => (
            <Box key={block.category.id}>
              <Heading
                size="sm"
                mb={3}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {getCategoryLabel(block.category)}
              </Heading>

              {block.rows.length === 0 ? (
                <Text
                  color="gray.500"
                  fontSize="sm"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('emptyCategory')}
                </Text>
              ) : (
                <StandingsTable
                  tournament={tournament}
                  rows={block.rows}
                  rankKey="overallRank"
                  showGroup
                  title={getCategoryLabel(block.category)}
                  showPlayerNames={showPlayerNames}
                  t={t}
                />
              )}
            </Box>
          ))}
        </VStack>
      ) : (
        <VStack align="stretch" gap={6}>
          {visibleBlocks.map((block) => (
            <Box key={block.category.id}>
              <Heading
                size="sm"
                mb={3}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {getCategoryLabel(block.category)}
              </Heading>

              {block.groups.length === 0 ? (
                <Text
                  color="gray.500"
                  fontSize="sm"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('emptyCategory')}
                </Text>
              ) : (
                <VStack align="stretch" gap={4}>
                  {block.groups.map((groupBlock) => {
                    const groupLabel = getGroupLabel(
                      groupBlock.group,
                      t('groupFallback', {
                        number: groupBlock.group.groupNumber,
                      })
                    );

                    return (
                      <Box key={groupBlock.group.id}>
                        {groupBlock.standings.length === 0 ? (
                          <Text
                            color="gray.500"
                            fontSize="sm"
                            _dark={{ color: 'gray.400' }}
                          >
                            {t('emptyGroup')}
                          </Text>
                        ) : (
                          <StandingsTable
                            tournament={tournament}
                            rows={groupBlock.standings}
                            title={groupLabel}
                            teamCountLabel={t('teamsCount', {
                              count: groupBlock.standings.length,
                            })}
                            action={
                              isHost ? (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  colorPalette="green"
                                  loading={
                                    recalculatingGroupId === groupBlock.group.id
                                  }
                                  onClick={() =>
                                    void handleRecalculate(
                                      block.category.id,
                                      groupBlock.group.id
                                    )
                                  }
                                >
                                  <RefreshCw size={13} /> {t('recalculate')}
                                </Button>
                              ) : null
                            }
                            showPlayerNames={showPlayerNames}
                            highlightWinner={
                              winnerHighlightByCategory.get(
                                block.category.id
                              ) ?? false
                            }
                            t={t}
                          />
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>
          ))}
        </VStack>
      )}

      {!error && stageView === 'pool' && hasAnyStandings && (
        <VStack align="stretch" gap={3} mt={6}>
          <Button
            variant="outline"
            size="lg"
            colorPalette="gray"
            onClick={() => setShowRankingInfo((current) => !current)}
          >
            <BarChart3 size={18} /> {t('rankingsExplained')}
          </Button>
          {showRankingInfo && (
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              borderColor="gray.100"
              bg="white"
              _dark={{
                bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
                boxShadow: 'var(--tournament-shadow-soft)',
              }}
            >
              <HStack align="flex-start" gap={3}>
                <Info size={18} color="var(--chakra-colors-green-500)" />
                <Text
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: 'gray.300' }}
                >
                  {t('rankingsExplanation')}
                </Text>
              </HStack>
            </Box>
          )}
          <Button
            variant="outline"
            size="lg"
            colorPalette="gray"
            onClick={() =>
              router.push(`/tournament/${tournament.slug}/schedule`)
            }
          >
            <CalendarDays size={18} /> {t('viewGames')}
          </Button>
        </VStack>
      )}
    </Box>
  );
}

function StandingsTable({
  tournament,
  rows,
  rankKey = 'rank',
  showGroup = false,
  title,
  teamCountLabel,
  action,
  showPlayerNames = false,
  highlightWinner = false,
  t,
}: {
  tournament: Tournament;
  rows: Array<GroupStanding | OverallStandingRow>;
  rankKey?: 'rank' | 'overallRank';
  showGroup?: boolean;
  title?: string;
  teamCountLabel?: string;
  action?: ReactNode;
  showPlayerNames?: boolean;
  highlightWinner?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const showForfeits = rows.some((r) => (r.matchesForfeited ?? 0) > 0);
  const showCancelled = rows.some((r) => (r.matchesCancelled ?? 0) > 0);
  const hasResults = rows.some(hasStandingResult);
  const extraColumnsWidth = (showForfeits ? 1 : 0) + (showCancelled ? 1 : 0);
  const metricColumnCount = 6 + extraColumnsWidth;
  const gridTemplate = showGroup
    ? {
        base: `40px minmax(150px, 1fr) 84px repeat(${metricColumnCount}, 48px)`,
        md: `44px minmax(220px, 1fr) 112px repeat(${metricColumnCount}, 64px)`,
      }
    : {
        base: `40px minmax(150px, 1fr) repeat(${metricColumnCount}, 48px)`,
        md: `44px minmax(220px, 1fr) repeat(${metricColumnCount}, 64px)`,
      };
  const minWidth = showGroup
    ? showForfeits || showCancelled
      ? `${700 + extraColumnsWidth * 56}px`
      : '680px'
    : showForfeits || showCancelled
      ? `${600 + extraColumnsWidth * 56}px`
      : '580px';

  return (
    <Box
      overflow="hidden"
      borderWidth="1px"
      borderTopWidth="4px"
      borderColor="gray.100"
      borderTopColor="yellow.300"
      borderRadius="lg"
      bg="white"
      boxShadow="0 10px 24px rgba(15, 23, 42, 0.06)"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-900))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        borderTopColor: 'yellow.400',
        boxShadow: 'var(--tournament-shadow)',
      }}
    >
      {(title || teamCountLabel || action) && (
        <Flex
          align={{ base: 'stretch', sm: 'center' }}
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap={3}
          px={{ base: 4, md: 5 }}
          py={{ base: 3.5, md: 4 }}
          borderBottomWidth="1px"
          borderColor="gray.100"
          _dark={{ borderColor: 'gray.700' }}
        >
          <HStack gap={2} minW={0}>
            {title && (
              <Text
                as="h3"
                fontSize={{ base: 'lg', md: 'xl' }}
                fontWeight="800"
                color="gray.800"
                lineHeight="1.2"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                _dark={{ color: 'gray.100' }}
              >
                {title}
              </Text>
            )}
            {teamCountLabel && (
              <Badge colorPalette="gray" borderRadius="full" px={2} py={0.5}>
                {teamCountLabel}
              </Badge>
            )}
          </HStack>
          {action && <Box flexShrink={0}>{action}</Box>}
        </Flex>
      )}

      <Box overflowX="auto">
        <Box minW={minWidth}>
          <Box
            display="grid"
            gridTemplateColumns={gridTemplate}
            alignItems="center"
            columnGap={{ base: 1, md: 1.5 }}
            px={{ base: 4, md: 5 }}
            py={2.5}
            bg="gray.50"
            borderBottomWidth="1px"
            borderColor="gray.100"
            _dark={{
              bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
            }}
          >
            <StandingHeaderCell label={t('columns.rank')} align="center" />
            <StandingHeaderCell label={t('columns.teamShort')} align="start" />
            {showGroup && (
              <StandingHeaderCell label={t('columns.group')} align="center" />
            )}
            <StandingHeaderCell label={t('columns.pointsShort')} />
            <StandingHeaderCell label={t('columns.playedShort')} />
            <StandingHeaderCell label={t('columns.wonShort')} />
            <StandingHeaderCell label={t('columns.drawnShort')} />
            <StandingHeaderCell label={t('columns.lostShort')} />
            {showForfeits && (
              <StandingHeaderCell label={t('columns.forfeits')} />
            )}
            {showCancelled && (
              <StandingHeaderCell label={t('columns.cancelled')} />
            )}
            <StandingHeaderCell label={t('columns.differenceShort')} />
          </Box>

          <VStack align="stretch" gap={0}>
            {rows.map((standing) => {
              const rank =
                rankKey === 'overallRank' && 'overallRank' in standing
                  ? standing.overallRank
                  : standing.rank;
              const teamHref = getStandingTeamHref(tournament, standing);
              const isGroupWinner =
                highlightWinner &&
                rankKey === 'rank' &&
                hasResults &&
                rank === 1;

              return (
                <Box
                  key={`${standing.categoryRegistrationId}-${rankKey}`}
                  display="grid"
                  gridTemplateColumns={gridTemplate}
                  alignItems="center"
                  columnGap={{ base: 1, md: 1.5 }}
                  minH={{ base: '54px', md: '58px' }}
                  px={{ base: 4, md: 5 }}
                  py={2}
                  borderBottomWidth="1px"
                  borderColor="gray.50"
                  _last={{ borderBottomWidth: 0 }}
                  _hover={{ bg: 'gray.50' }}
                  _dark={{
                    borderColor:
                      'var(--tournament-border, var(--chakra-colors-gray-800))',
                    _hover: {
                      bg: 'var(--tournament-accent-soft, rgba(34, 197, 94, 0.14))',
                    },
                  }}
                >
                  <Flex
                    w={{ base: 8, md: 8 }}
                    h={{ base: 8, md: 8 }}
                    align="center"
                    justify="center"
                    borderRadius="full"
                    bg="gray.100"
                    color="gray.700"
                    fontSize="sm"
                    fontWeight="700"
                    _dark={{
                      bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
                      color: 'gray.50',
                      borderWidth: '1px',
                      borderColor:
                        'var(--tournament-border, var(--chakra-colors-gray-700))',
                    }}
                  >
                    {hasResults ? rank : '-'}
                  </Flex>

                  <Box minW={0}>
                    <HStack gap={1.5} minW={0}>
                      <Link
                        href={teamHref}
                        style={{ minWidth: 0, textDecoration: 'none' }}
                      >
                        <Text
                          as="span"
                          display="block"
                          fontSize={{ base: 'sm', md: 'md' }}
                          fontWeight="700"
                          color="gray.900"
                          lineHeight="1.25"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          _hover={{
                            color: 'green.700',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                          }}
                          _dark={{
                            color: 'gray.50',
                            _hover: { color: 'green.300' },
                          }}
                        >
                          {getStandingTeamLabel(standing, { showPlayerNames })}
                        </Text>
                      </Link>
                      {isGroupWinner && (
                        <Box
                          as="span"
                          flexShrink={0}
                          color="yellow.500"
                          title={t('groupWinner')}
                          aria-label={t('groupWinner')}
                          _dark={{ color: 'yellow.400' }}
                        >
                          <Trophy size={16} fill="currentColor" />
                        </Box>
                      )}
                    </HStack>
                    {showGroup && 'sourceGroupName' in standing && (
                      <Text
                        display={{ base: 'block', md: 'none' }}
                        mt={0.5}
                        fontSize="xs"
                        color="gray.500"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        _dark={{ color: 'gray.400' }}
                      >
                        {standing.sourceGroupName}
                      </Text>
                    )}
                  </Box>

                  {showGroup && (
                    <Text
                      display={{ base: 'none', md: 'block' }}
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.500"
                      textAlign="center"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                      _dark={{ color: 'gray.400' }}
                    >
                      {'sourceGroupName' in standing
                        ? standing.sourceGroupName
                        : ''}
                    </Text>
                  )}

                  <StandingMetric value={standing.points} isStrong />
                  <StandingMetric value={standing.matchesPlayed} />
                  <StandingMetric value={standing.matchesWon} />
                  <StandingMetric value={standing.matchesDrawn} />
                  <StandingMetric value={standing.matchesLost} />
                  {showForfeits && (
                    <StandingMetric value={standing.matchesForfeited ?? 0} />
                  )}
                  {showCancelled && (
                    <StandingMetric value={standing.matchesCancelled ?? 0} />
                  )}
                  <StandingMetric
                    value={
                      standing.pointDifference > 0
                        ? `+${standing.pointDifference}`
                        : standing.pointDifference
                    }
                    tone={
                      standing.pointDifference > 0
                        ? 'positive'
                        : standing.pointDifference < 0
                          ? 'negative'
                          : 'neutral'
                    }
                  />
                </Box>
              );
            })}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

function getStandingTeamHref(tournament: Tournament, standing: GroupStanding) {
  const registrationId =
    standing.registration?.id || standing.categoryRegistrationId;
  return `/t/${tournament.id}/team/${registrationId.toLowerCase()}`;
}

function StandingHeaderCell({
  label,
  align = 'center',
}: {
  label: string;
  align?: 'start' | 'center';
}) {
  return (
    <Text
      textAlign={align}
      fontSize="xs"
      fontWeight="700"
      color="gray.500"
      letterSpacing="0"
      textTransform="uppercase"
      whiteSpace="nowrap"
      _dark={{ color: 'gray.400' }}
    >
      {label}
    </Text>
  );
}

function StandingMetric({
  value,
  isStrong = false,
  tone = 'default',
}: {
  value: number | string;
  isStrong?: boolean;
  tone?: 'default' | 'positive' | 'negative' | 'neutral';
}) {
  const toneColor =
    tone === 'positive'
      ? 'green.600'
      : tone === 'negative'
        ? 'red.500'
        : tone === 'neutral'
          ? 'gray.600'
          : 'gray.950';
  const darkToneColor =
    tone === 'positive'
      ? 'green.300'
      : tone === 'negative'
        ? 'red.300'
        : tone === 'neutral'
          ? 'gray.300'
          : 'gray.50';

  return (
    <Text
      textAlign="center"
      fontSize={{ base: 'sm', md: 'md' }}
      fontWeight={isStrong ? '800' : '700'}
      color={toneColor}
      lineHeight="1.2"
      _dark={{ color: darkToneColor }}
    >
      {value}
    </Text>
  );
}
