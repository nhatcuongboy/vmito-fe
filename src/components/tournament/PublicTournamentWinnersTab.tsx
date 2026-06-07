'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import { Award, Crown, Medal, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CategoryService } from '@/lib/api/category.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryStandingsResponse,
  Tournament,
} from '@/lib/api/types';
import {
  computePodium,
  type CategoryPodium,
  type PodiumEntry,
  type PodiumRank,
} from '@/lib/tournament/podium';
import { Button, LegacySelect, VStack } from '@/components/ui/chakra-compat';
import { TournamentTableSkeleton } from '@/components/tournament/skeletons';
import PlayerNamesToggle from '@/components/tournament/PlayerNamesToggle';

interface PublicTournamentWinnersTabProps {
  tournament: Tournament;
  categories: Category[];
}

const ALL_CATEGORIES_VALUE = 'all';

const RANK_STYLE: Record<
  PodiumRank,
  {
    bg: string;
    darkBg: string;
    border: string;
    darkBorder: string;
    accent: string;
    iconColor: string;
  }
> = {
  1: {
    bg: 'yellow.50',
    darkBg: 'rgba(245, 158, 11, 0.14)',
    border: 'yellow.300',
    darkBorder: 'rgba(245, 158, 11, 0.36)',
    accent: 'yellow.400',
    iconColor: 'var(--chakra-colors-yellow-500)',
  },
  2: {
    bg: 'gray.50',
    darkBg: 'rgba(148, 163, 184, 0.12)',
    border: 'gray.300',
    darkBorder: 'rgba(203, 213, 225, 0.28)',
    accent: 'gray.400',
    iconColor: 'var(--chakra-colors-gray-500)',
  },
  3: {
    bg: 'orange.50',
    darkBg: 'rgba(249, 115, 22, 0.13)',
    border: 'orange.200',
    darkBorder: 'rgba(251, 146, 60, 0.34)',
    accent: 'orange.300',
    iconColor: 'var(--chakra-colors-orange-500)',
  },
};

function getCategoryLabel(category: Category) {
  return category.name?.trim() || category.type;
}

export default function PublicTournamentWinnersTab({
  tournament,
  categories,
}: PublicTournamentWinnersTabProps) {
  const t = useTranslations('pages.tournaments.detail.winnersTab');
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [standingsByCategory, setStandingsByCategory] = useState<
    Map<string, CategoryStandingsResponse>
  >(new Map());
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(ALL_CATEGORIES_VALUE);
  const [showPlayerNames, setShowPlayerNames] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (categories.length === 0) {
      setMatches([]);
      setStandingsByCategory(new Map());
      setLoading(false);
      setError(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const [allMatches, standingsList] = await Promise.all([
        TournamentService.getAllMatches(tournament.id),
        Promise.all(
          categories.map(async (category) => ({
            categoryId: category.id,
            standings: await CategoryService.getAllStandings(category.id),
          }))
        ),
      ]);
      setMatches(allMatches);
      setStandingsByCategory(
        new Map(standingsList.map((item) => [item.categoryId, item.standings]))
      );
    } catch (loadError) {
      console.error('Error loading tournament winners:', loadError);
      setError(true);
      setMatches([]);
      setStandingsByCategory(new Map());
    } finally {
      setLoading(false);
    }
  }, [categories, tournament.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const allPodiums = useMemo(
    () =>
      categories.map((category) =>
        computePodium(
          category,
          matches,
          standingsByCategory.get(category.id) ?? []
        )
      ),
    [categories, matches, standingsByCategory]
  );
  const podiums = useMemo(() => {
    if (selectedCategoryId === ALL_CATEGORIES_VALUE) return allPodiums;
    return allPodiums.filter(
      (podium) => podium.category.id === selectedCategoryId
    );
  }, [allPodiums, selectedCategoryId]);

  if (loading) {
    return <TournamentTableSkeleton rows={3} columns={3} />;
  }

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      overflow="hidden"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        boxShadow: 'var(--tournament-shadow-soft)',
      }}
    >
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 3 }}
        p={4}
        pb={3}
      >
        <Box>
          <Heading size="md" mb={1}>
            {t('title')}
          </Heading>
        </Box>

        <Flex
          align={{ base: 'stretch', sm: 'center' }}
          justify="flex-end"
          direction={{ base: 'column', sm: 'row' }}
          gap={2}
          w={{ base: '100%', md: 'auto' }}
        >
          {categories.length > 1 && (
            <Box w={{ base: '100%', sm: '260px' }}>
              <LegacySelect
                aria-label={t('categoryFilter')}
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                size="sm"
              >
                <option value={ALL_CATEGORIES_VALUE}>
                  {t('allCategories')}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </LegacySelect>
            </Box>
          )}
          <PlayerNamesToggle
            active={showPlayerNames}
            onToggle={() => setShowPlayerNames((prev) => !prev)}
            title={t('showPlayerNames')}
            label={t('showPlayerNamesBadge')}
            fullWidthOnMobile
          />
        </Flex>
      </Flex>

      {error ? (
        <Flex direction="column" align="center" gap={3} px={4} pt={2} pb={5}>
          <Text
            color="gray.500"
            textAlign="center"
            _dark={{ color: 'gray.400' }}
          >
            {t('error')}
          </Text>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            <RotateCcw size={14} /> {t('retry')}
          </Button>
        </Flex>
      ) : categories.length === 0 ? (
        <Box px={4} pb={4}>
          <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
            {t('noCategories')}
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={4} px={4} pb={4}>
          {podiums.map((podium) => (
            <CategoryPodiumCard
              key={podium.category.id}
              podium={podium}
              showPlayerNames={showPlayerNames}
              t={t}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function CategoryPodiumCard({
  podium,
  showPlayerNames,
  t,
}: {
  podium: CategoryPodium<Category>;
  showPlayerNames: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const { category, state, entries } = podium;
  // Reveal each category's podium as soon as it has a result, independent of
  // the other categories: decided (champion confirmed) or provisional (the
  // round-robin leader while it is still running).
  const shouldShowResults =
    entries.length > 0 && (state === 'decided' || state === 'provisional');
  const champion = entries.find((entry) => entry.rank === 1);
  const podiumRest = entries.filter((entry) => entry.rank !== 1);

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="xl"
      bg="gray.50"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
      _dark={{
        bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-900))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      }}
    >
      <Flex align="center" justify="space-between" gap={2} mb={4}>
        <Heading
          size={{ base: 'sm', md: 'md' }}
          color="gray.800"
          _dark={{ color: 'gray.100' }}
        >
          {getCategoryLabel(category)}
        </Heading>
        {shouldShowResults && (
          <Badge
            colorPalette={state === 'decided' ? 'green' : 'yellow'}
            borderRadius="full"
          >
            {state === 'decided' ? t('final') : t('provisional')}
          </Badge>
        )}
      </Flex>

      {!shouldShowResults ? (
        <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
          {state === 'in_progress' ? t('inProgress') : t('empty')}
        </Text>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            lg: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
          }}
          gap={{ base: 3, md: 2.5 }}
          alignItems="stretch"
        >
          {champion && (
            <PodiumHeroCard
              entry={champion}
              showPlayerNames={showPlayerNames}
              t={t}
            />
          )}
          {podiumRest.length > 0 && (
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: '1fr' }}
              gap={{ base: 3, md: 2.5 }}
            >
              {podiumRest.map((entry) => (
                <PodiumSideCard
                  key={entry.rank}
                  entry={entry}
                  showPlayerNames={showPlayerNames}
                  t={t}
                />
              ))}
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

function PodiumHeroCard({
  entry,
  showPlayerNames,
  t,
}: {
  entry: PodiumEntry;
  showPlayerNames: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const style = RANK_STYLE[entry.rank];
  const rankLabel = getPodiumRankLabel(entry.rank, t);
  const display = getPodiumEntryDisplay(entry, showPlayerNames);

  return (
    <Flex
      align={{ base: 'flex-start', md: 'center' }}
      gap={{ base: 3, md: 3.5 }}
      px={{ base: 3.5, md: 4 }}
      py={{ base: 4, md: 4 }}
      borderWidth="1px"
      borderColor={style.border}
      borderLeftWidth={{ base: '4px', md: '6px' }}
      borderLeftColor={style.accent}
      borderRadius="xl"
      bg={style.bg}
      boxShadow="0 16px 38px rgba(202, 138, 4, 0.12)"
      _dark={{
        bg: style.darkBg,
        borderColor: style.darkBorder,
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 42px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Flex
        w={{ base: 12, md: 13 }}
        h={{ base: 12, md: 13 }}
        align="center"
        justify="center"
        borderRadius="full"
        bg="white"
        borderWidth="1px"
        borderColor={style.border}
        flexShrink={0}
        _dark={{
          bg: 'rgba(7, 17, 29, 0.72)',
          borderColor: style.darkBorder,
        }}
      >
        <Crown size={26} color={style.iconColor} />
      </Flex>

      <Box minW={0} flex="1">
        <Text
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight="700"
          color="gray.500"
          textTransform="uppercase"
          lineHeight="1.2"
          _dark={{ color: 'gray.400' }}
        >
          {rankLabel}
        </Text>
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="900"
          color="gray.900"
          lineHeight="1.15"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          _dark={{ color: 'gray.50' }}
        >
          {display.primary}
        </Text>
        {display.secondary && (
          <Text
            mt={1}
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight="1.35"
            color="gray.600"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            _dark={{ color: 'gray.300' }}
          >
            {display.secondary}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function PodiumSideCard({
  entry,
  showPlayerNames,
  t,
}: {
  entry: PodiumEntry;
  showPlayerNames: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const style = RANK_STYLE[entry.rank];
  const Icon = entry.rank === 2 ? Medal : Award;
  const rankLabel = getPodiumRankLabel(entry.rank, t);
  const display = getPodiumEntryDisplay(entry, showPlayerNames);

  return (
    <Flex
      align="flex-start"
      gap={3}
      px={{ base: 3.5, md: 3.5 }}
      py={{ base: 3.5, md: 3 }}
      borderWidth="1px"
      borderColor={style.border}
      borderTopWidth="4px"
      borderTopColor={style.accent}
      borderRadius="xl"
      bg="white"
      minH={{ md: '104px' }}
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: style.darkBorder,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      }}
    >
      <Flex
        w={{ base: 10, md: 10 }}
        h={{ base: 10, md: 10 }}
        align="center"
        justify="center"
        borderRadius="full"
        bg={style.bg}
        borderWidth="1px"
        borderColor={style.border}
        flexShrink={0}
        _dark={{
          bg: style.darkBg,
          borderColor: style.darkBorder,
        }}
      >
        <Icon size={18} color={style.iconColor} />
      </Flex>

      <Box minW={0} flex="1">
        <Text
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight="700"
          color="gray.500"
          textTransform="uppercase"
          lineHeight="1.2"
          _dark={{ color: 'gray.400' }}
        >
          {rankLabel}
        </Text>
        <Text
          mt={0.5}
          fontSize={{ base: 'xl', md: 'xl' }}
          fontWeight="800"
          color="gray.900"
          lineHeight="1.15"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          _dark={{ color: 'gray.50' }}
        >
          {display.primary}
        </Text>
        {display.secondary && (
          <Text
            mt={1}
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight="1.35"
            color="gray.600"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            _dark={{ color: 'gray.300' }}
          >
            {display.secondary}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function getPodiumEntryDisplay(entry: PodiumEntry, showPlayerNames: boolean) {
  if (!showPlayerNames) {
    return {
      primary: entry.label,
      secondary: entry.playerNames,
    };
  }

  return {
    primary: entry.playerNames || entry.label,
    secondary:
      entry.playerNames && entry.playerNames !== entry.label
        ? entry.label
        : undefined,
  };
}

function getPodiumRankLabel(
  rank: PodiumRank,
  t: ReturnType<typeof useTranslations>
) {
  if (rank === 1) return t('champion');
  if (rank === 2) return t('runnerUp');
  return t('thirdPlace');
}
