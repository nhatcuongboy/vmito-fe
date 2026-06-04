'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
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

interface PublicTournamentWinnersTabProps {
  tournament: Tournament;
  categories: Category[];
}

const ALL_CATEGORIES_VALUE = 'all';

const RANK_STYLE: Record<
  PodiumRank,
  { bg: string; border: string; accent: string; iconColor: string }
> = {
  1: {
    bg: 'yellow.50',
    border: 'yellow.300',
    accent: 'yellow.400',
    iconColor: 'var(--chakra-colors-yellow-500)',
  },
  2: {
    bg: 'gray.50',
    border: 'gray.300',
    accent: 'gray.400',
    iconColor: 'var(--chakra-colors-gray-500)',
  },
  3: {
    bg: 'orange.50',
    border: 'orange.200',
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
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
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
  t,
}: {
  podium: CategoryPodium<Category>;
  t: ReturnType<typeof useTranslations>;
}) {
  const { category, state, entries } = podium;
  // Reveal each category's podium as soon as it has a result, independent of
  // the other categories: decided (champion confirmed) or provisional (the
  // round-robin leader while it is still running).
  const shouldShowResults =
    entries.length > 0 && (state === 'decided' || state === 'provisional');

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="lg"
      bg="white"
      px={4}
      py={4}
      _dark={{
        bg: 'gray.900',
        borderColor: 'gray.700',
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
        <VStack align="stretch" gap={3}>
          {entries.map((entry) => (
            <PodiumRow key={entry.rank} entry={entry} t={t} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function PodiumRow({
  entry,
  t,
}: {
  entry: PodiumEntry;
  t: ReturnType<typeof useTranslations>;
}) {
  const style = RANK_STYLE[entry.rank];
  const Icon = entry.rank === 1 ? Crown : entry.rank === 2 ? Medal : Award;
  const rankLabel =
    entry.rank === 1
      ? t('champion')
      : entry.rank === 2
        ? t('runnerUp')
        : t('thirdPlace');

  return (
    <Flex
      align="flex-start"
      gap={3}
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 3.5 }}
      borderWidth="1px"
      borderColor={style.border}
      borderLeftWidth="4px"
      borderLeftColor={style.accent}
      borderRadius="lg"
      bg={style.bg}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Flex
        w={{ base: 9, md: 10 }}
        h={{ base: 9, md: 10 }}
        align="center"
        justify="center"
        borderRadius="full"
        bg="white"
        borderWidth="1px"
        borderColor={style.border}
        flexShrink={0}
        _dark={{ bg: 'gray.900' }}
      >
        <Icon size={entry.rank === 1 ? 22 : 19} color={style.iconColor} />
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
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="800"
          color="gray.900"
          lineHeight="1.15"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          _dark={{ color: 'gray.50' }}
        >
          {entry.label}
        </Text>
        {entry.playerNames && (
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
            {entry.playerNames}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
