'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { ChevronRight, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CategoryService } from '@/lib/api/category.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryStandingsResponse,
} from '@/lib/api/types';
import { computePodium } from '@/lib/tournament/podium';
import { useRouter } from '@/i18n/config';

interface TournamentFinishedSummaryProps {
  tournamentId: string;
  slug: string;
}

function getCategoryLabel(category: Category) {
  return category.name?.trim() || category.type;
}

// Champions banner shown at the top of the Home tab once a tournament is
// finished. Self-contained: loads categories, matches and standings, then
// reuses the shared podium logic to surface the champion of each category.
export default function TournamentFinishedSummary({
  tournamentId,
  slug,
}: TournamentFinishedSummaryProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab.champions');
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [standingsByCategory, setStandingsByCategory] = useState<
    Map<string, CategoryStandingsResponse>
  >(new Map());

  const load = useCallback(async () => {
    try {
      const loadedCategories =
        await CategoryService.getCategories(tournamentId);
      const [allMatches, standingsList] = await Promise.all([
        TournamentService.getAllMatches(tournamentId),
        Promise.all(
          loadedCategories.map(async (category) => ({
            categoryId: category.id,
            standings: await CategoryService.getAllStandings(category.id),
          }))
        ),
      ]);
      setCategories(loadedCategories);
      setMatches(allMatches);
      setStandingsByCategory(
        new Map(standingsList.map((item) => [item.categoryId, item.standings]))
      );
    } catch (error) {
      console.error('Error loading tournament champions:', error);
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const champions = useMemo(
    () =>
      categories
        .map((category) =>
          computePodium(
            category,
            matches,
            standingsByCategory.get(category.id) ?? []
          )
        )
        .filter((podium) => podium.state === 'decided' && podium.entries[0]),
    [categories, matches, standingsByCategory]
  );

  // Nothing to celebrate yet (no decided champion) — stay out of the way.
  if (champions.length === 0) return null;

  return (
    <Box
      borderWidth="1px"
      borderColor="yellow.300"
      borderTopWidth="6px"
      borderTopColor="yellow.400"
      borderRadius="2xl"
      bgGradient="linear(to-b, yellow.50, white)"
      bg="yellow.50"
      boxShadow="0 12px 30px rgba(202, 138, 4, 0.12)"
      p={{ base: 4, md: 6 }}
      _dark={{ bg: 'gray.900', borderColor: 'yellow.500' }}
    >
      <Flex align="center" justify="space-between" gap={3} mb={4}>
        <HStack gap={2.5}>
          <Flex
            w="40px"
            h="40px"
            align="center"
            justify="center"
            borderRadius="full"
            bg="yellow.100"
            _dark={{ bg: 'yellow.900' }}
          >
            <Trophy size={22} color="var(--chakra-colors-yellow-600)" />
          </Flex>
          <Box>
            <Text fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
              {t('title')}
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              {t('subtitle')}
            </Text>
          </Box>
        </HStack>
      </Flex>

      <VStack align="stretch" gap={2}>
        {champions.map((podium) => (
          <Flex
            key={podium.category.id}
            align="center"
            justify="space-between"
            gap={3}
            px={3}
            py={2.5}
            borderRadius="lg"
            bg="white"
            borderWidth="1px"
            borderColor="yellow.100"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Text
              fontSize="sm"
              color="gray.500"
              minW={0}
              flexShrink={0}
              maxW="40%"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              _dark={{ color: 'gray.400' }}
            >
              {getCategoryLabel(podium.category)}
            </Text>
            <HStack gap={1.5} minW={0} flex="1" justify="flex-end">
              <Trophy size={14} color="var(--chakra-colors-yellow-500)" />
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="800"
                color="gray.900"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                _dark={{ color: 'gray.50' }}
              >
                {podium.entries[0].label}
              </Text>
            </HStack>
          </Flex>
        ))}
      </VStack>

      <Flex
        as="button"
        mt={4}
        align="center"
        justify="center"
        gap={1}
        w="full"
        py={2.5}
        borderRadius="lg"
        bg="yellow.400"
        color="gray.900"
        fontWeight="700"
        fontSize="sm"
        cursor="pointer"
        _hover={{ bg: 'yellow.500' }}
        transition="background 0.15s"
        onClick={() => router.push(`/tournament/${slug}/winners`)}
      >
        {t('viewAll')}
        <ChevronRight size={16} />
      </Flex>
    </Box>
  );
}
