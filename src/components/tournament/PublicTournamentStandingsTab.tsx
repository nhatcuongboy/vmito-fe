'use client';

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
  CategoryMatch,
  CategoryStandingsResponse,
  GroupStanding,
  Tournament,
} from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { useRouter } from '@/i18n/config';
import {
  Button,
  LegacySelect,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from '@/components/ui/chakra-compat';
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

function getStandingTeamLabel(standing: GroupStanding) {
  const registration = standing.registration;

  if (registration.pair?.members && registration.pair.members.length > 0) {
    return (
      registration.pair.name ||
      registration.pair.members
        .map((member) => member.player?.name)
        .filter(Boolean)
        .join(' / ')
    );
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

function getRoundLabel(round: string, t: ReturnType<typeof useTranslations>) {
  const normalizedRound = round.toUpperCase();
  if (normalizedRound === 'F') return t('playoffsRounds.final');
  if (normalizedRound === 'SF') return t('playoffsRounds.semiFinals');
  if (normalizedRound === 'QF') return t('playoffsRounds.quarterFinals');
  if (normalizedRound === '3RD') return t('playoffsRounds.thirdPlace');
  return round;
}

export default function PublicTournamentStandingsTab({
  tournament,
  categories,
  isHost,
}: PublicTournamentStandingsTabProps) {
  const t = useTranslations('pages.tournaments.detail.standingsTab');
  const router = useRouter();
  const [standingsByCategory, setStandingsByCategory] = useState<
    CategoryStandingsBlock[]
  >([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(ALL_CATEGORIES_VALUE);
  const [stageView, setStageView] = useState<StageView>('pool');
  const [standingView, setStandingView] = useState<StandingView>('pools');
  const [showRankingInfo, setShowRankingInfo] = useState(false);
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

  const visiblePlayoffGroups = useMemo(() => {
    const categoryIds =
      selectedCategoryId === ALL_CATEGORIES_VALUE
        ? new Set(categories.map((category) => category.id))
        : new Set([selectedCategoryId]);

    const playoffMatches = matches
      .filter((match) => categoryIds.has(match.categoryId) && !match.groupId)
      .sort((first, second) => first.matchNumber - second.matchNumber);

    const groups = new Map<string, CategoryMatch[]>();
    for (const match of playoffMatches) {
      if (!groups.has(match.round)) groups.set(match.round, []);
      groups.get(match.round)!.push(match);
    }

    return Array.from(groups.entries()).map(([round, items]) => ({
      round,
      label: getRoundLabel(round, t),
      items,
    }));
  }, [categories, matches, selectedCategoryId, t]);

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
        mb={{ base: 3, md: 5 }}
      >
        <Box>
          <Heading size="md" mb={{ base: 0.5, md: 1 }}>
            {t('title')}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            {t('description', { tournament: tournament.name })}
          </Text>
        </Box>

        {categories.length > 1 && (
          <Box w={{ base: '100%', md: '260px' }}>
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
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 3 }}
        mb={{ base: 4, md: 5 }}
      >
        <HStack
          gap={{ base: 0.5, md: 1 }}
          p={{ base: 0.5, md: 1 }}
          bg="gray.100"
          _dark={{ bg: 'gray.800' }}
          borderRadius="full"
          w={{ base: '100%', sm: 'fit-content' }}
        >
          <Button
            flex={{ base: 1, sm: 'unset' }}
            size="sm"
            variant={stageView === 'pool' ? 'solid' : 'ghost'}
            colorPalette={stageView === 'pool' ? 'green' : 'gray'}
            borderRadius="full"
            minH={{ base: 8, md: 9 }}
            px={{ base: 2, md: 3 }}
            fontSize={{ base: 'xs', md: 'sm' }}
            onClick={() => setStageView('pool')}
          >
            <ListTree size={15} /> {t('poolPlay')}
          </Button>
          <Button
            flex={{ base: 1, sm: 'unset' }}
            size="sm"
            variant={stageView === 'playoffs' ? 'solid' : 'ghost'}
            colorPalette={stageView === 'playoffs' ? 'green' : 'gray'}
            borderRadius="full"
            minH={{ base: 8, md: 9 }}
            px={{ base: 2, md: 3 }}
            fontSize={{ base: 'xs', md: 'sm' }}
            onClick={() => setStageView('playoffs')}
          >
            <GitBranch size={15} /> {t('playoffs')}
          </Button>
        </HStack>

        {stageView === 'pool' && (
          <HStack
            gap={{ base: 0.5, md: 1 }}
            p={{ base: 0.5, md: 1 }}
            bg="gray.100"
            _dark={{ bg: 'gray.800' }}
            borderRadius="full"
            w={{ base: '100%', sm: 'fit-content' }}
          >
            <Button
              flex={{ base: 1, sm: 'unset' }}
              size="sm"
              variant={standingView === 'pools' ? 'solid' : 'ghost'}
              colorPalette={standingView === 'pools' ? 'green' : 'gray'}
              borderRadius="full"
              minH={{ base: 8, md: 9 }}
              px={{ base: 2, md: 3 }}
              fontSize={{ base: 'xs', md: 'sm' }}
              onClick={() => setStandingView('pools')}
            >
              {t('pools')}
            </Button>
            <Button
              flex={{ base: 1, sm: 'unset' }}
              size="sm"
              variant={standingView === 'overall' ? 'solid' : 'ghost'}
              colorPalette={standingView === 'overall' ? 'green' : 'gray'}
              borderRadius="full"
              minH={{ base: 8, md: 9 }}
              px={{ base: 2, md: 3 }}
              fontSize={{ base: 'xs', md: 'sm' }}
              onClick={() => setStandingView('overall')}
            >
              {t('overall')}
            </Button>
          </HStack>
        )}
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
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Text color="gray.500" textAlign="center">
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
        visiblePlayoffGroups.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            {t('emptyPlayoffs')}
          </Text>
        ) : (
          <VStack align="stretch" gap={4}>
            {visiblePlayoffGroups.map((group) => (
              <Box key={group.round}>
                <Heading
                  size="sm"
                  mb={2}
                  color="gray.600"
                  _dark={{ color: 'gray.300' }}
                >
                  {group.label}
                </Heading>
                <VStack align="stretch" gap={2}>
                  {group.items.map((match) => (
                    <Flex
                      key={match.id}
                      align={{ base: 'stretch', sm: 'center' }}
                      justify="space-between"
                      direction={{ base: 'column', sm: 'row' }}
                      gap={3}
                      p={3}
                      borderWidth="1px"
                      borderTopWidth="4px"
                      borderTopColor="yellow.200"
                      borderColor="gray.100"
                      borderRadius="lg"
                      bg="white"
                      _dark={{
                        bg: 'gray.800',
                        borderColor: 'gray.700',
                        borderTopColor: 'yellow.500',
                      }}
                    >
                      <Box minW={0}>
                        <HStack gap={2} mb={1}>
                          <Badge colorPalette="gray">
                            {t('matchNumber', {
                              number: match.matchNumber,
                            })}
                          </Badge>
                          <Badge
                            colorPalette={
                              match.status === 'FINISHED' ? 'green' : 'blue'
                            }
                          >
                            {t(`matchStatus.${match.status}`)}
                          </Badge>
                        </HStack>
                        <Text fontWeight="semibold">
                          {getTeamLabel(match, 1)} {t('versus')}{' '}
                          {getTeamLabel(match, 2)}
                        </Text>
                      </Box>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        whiteSpace="nowrap"
                        color={match.score ? 'fg' : 'gray.500'}
                      >
                        {match.score || t('noScore')}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        )
      ) : categories.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          {t('noCategories')}
        </Text>
      ) : !hasAnyStandings ? (
        <Text color="gray.500" fontSize="sm">
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
                <Text color="gray.500" fontSize="sm">
                  {t('emptyCategory')}
                </Text>
              ) : (
                <StandingsTable
                  rows={block.rows}
                  rankKey="overallRank"
                  showGroup
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
                <Text color="gray.500" fontSize="sm">
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
                        <Flex
                          align={{ base: 'stretch', sm: 'center' }}
                          justify="space-between"
                          direction={{ base: 'column', sm: 'row' }}
                          gap={2}
                          mb={2}
                        >
                          <HStack gap={2}>
                            <Text fontWeight="semibold">{groupLabel}</Text>
                            <Badge colorPalette="gray">
                              {t('teamsCount', {
                                count: groupBlock.standings.length,
                              })}
                            </Badge>
                          </HStack>

                          {isHost && (
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
                          )}
                        </Flex>

                        {groupBlock.standings.length === 0 ? (
                          <Text color="gray.500" fontSize="sm">
                            {t('emptyGroup')}
                          </Text>
                        ) : (
                          <StandingsTable rows={groupBlock.standings} t={t} />
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
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
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
  rows,
  rankKey = 'rank',
  showGroup = false,
  t,
}: {
  rows: Array<GroupStanding | OverallStandingRow>;
  rankKey?: 'rank' | 'overallRank';
  showGroup?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  // Only surface the forfeit / cancelled columns when they actually occurred.
  const showForfeits = rows.some((r) => (r.matchesForfeited ?? 0) > 0);
  const showCancelled = rows.some((r) => (r.matchesCancelled ?? 0) > 0);
  const tableMinWidth = showGroup
    ? showForfeits || showCancelled
      ? '760px'
      : '680px'
    : showForfeits || showCancelled
      ? '680px'
      : '580px';
  const metricColumnWidth = { base: '48px', md: '56px' };

  return (
    <TableContainer borderRadius="lg" boxShadow="none">
      <Table minW={tableMinWidth}>
        <Thead>
          <Tr _hover={{}}>
            <Th textAlign="center" w={{ base: '56px', md: '64px' }}>
              {t('columns.rank')}
            </Th>
            <Th
              w="1%"
              minW={{ base: '88px', md: '112px' }}
              maxW={{ base: '180px', md: '260px' }}
              whiteSpace="nowrap"
            >
              {t('columns.team')}
            </Th>
            {showGroup && (
              <Th minW={{ base: '96px', md: '112px' }}>{t('columns.group')}</Th>
            )}
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.played')}
            </Th>
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.won')}
            </Th>
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.lost')}
            </Th>
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.drawn')}
            </Th>
            {showForfeits && (
              <Th textAlign="center" w={metricColumnWidth}>
                {t('columns.forfeits')}
              </Th>
            )}
            {showCancelled && (
              <Th textAlign="center" w={metricColumnWidth}>
                {t('columns.cancelled')}
              </Th>
            )}
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.points')}
            </Th>
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.pointsFor')}
            </Th>
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.pointsAgainst')}
            </Th>
            <Th textAlign="center" w={metricColumnWidth}>
              {t('columns.difference')}
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((standing) => {
            const rank =
              rankKey === 'overallRank' && 'overallRank' in standing
                ? standing.overallRank
                : standing.rank;
            const isTopRank = rank === 1;

            return (
              <Tr
                key={`${standing.categoryRegistrationId}-${rankKey}`}
                bg={isTopRank ? 'green.50' : 'transparent'}
                _dark={{
                  bg: isTopRank ? 'green.950' : 'transparent',
                }}
              >
                <Td textAlign="center">
                  <HStack justify="center" gap={1}>
                    {isTopRank && (
                      <Trophy
                        size={14}
                        color="var(--chakra-colors-green-500)"
                      />
                    )}
                    <Text fontWeight="bold">{rank}</Text>
                  </HStack>
                </Td>
                <Td
                  fontWeight="medium"
                  maxW={{ base: '180px', md: '260px' }}
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {getStandingTeamLabel(standing)}
                </Td>
                {showGroup && (
                  <Td color="gray.500" _dark={{ color: 'gray.400' }}>
                    {'sourceGroupName' in standing
                      ? standing.sourceGroupName
                      : ''}
                  </Td>
                )}
                <Td textAlign="center">{standing.matchesPlayed}</Td>
                <Td textAlign="center">{standing.matchesWon}</Td>
                <Td textAlign="center">{standing.matchesLost}</Td>
                <Td textAlign="center">{standing.matchesDrawn}</Td>
                {showForfeits && (
                  <Td textAlign="center">{standing.matchesForfeited ?? 0}</Td>
                )}
                {showCancelled && (
                  <Td textAlign="center">{standing.matchesCancelled ?? 0}</Td>
                )}
                <Td textAlign="center" fontWeight="bold">
                  {standing.points}
                </Td>
                <Td textAlign="center">{standing.pointsFor}</Td>
                <Td textAlign="center">{standing.pointsAgainst}</Td>
                <Td
                  textAlign="center"
                  color={
                    standing.pointDifference > 0
                      ? 'green.600'
                      : standing.pointDifference < 0
                        ? 'red.500'
                        : 'gray.600'
                  }
                  _dark={{
                    color:
                      standing.pointDifference > 0
                        ? 'green.300'
                        : standing.pointDifference < 0
                          ? 'red.300'
                          : 'gray.300',
                  }}
                >
                  {standing.pointDifference > 0
                    ? `+${standing.pointDifference}`
                    : standing.pointDifference}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
