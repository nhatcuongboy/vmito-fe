'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import TierBadge, { TIER_COLORS } from '@/components/leaderboard/TierBadge';
import {
  ILeaderboardEntry,
  ILeaderboardResponse,
  RankingService,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';

const PERIODS: TLeaderboardPeriod[] = ['week', 'month', 'year', 'all'];
const PAGE_SIZE = 20;
const PODIUM_ORDER = [1, 0, 2]; // display 2nd, 1st, 3rd
const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardContent() {
  const t = useTranslations('leaderboard');
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [period, setPeriod] = useState<TLeaderboardPeriod>('week');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ILeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await RankingService.getLeaderboard({
        period,
        page,
        limit: PAGE_SIZE,
      });
      setData(result);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePeriodChange = (id: string) => {
    setPeriod(id as TLeaderboardPeriod);
    setPage(1);
  };

  const goToProfile = (userId: string) => router.push(`/user/${userId}`);

  const entries = data?.entries ?? [];
  const podium = page === 1 ? entries.slice(0, 3) : [];
  const rest = page === 1 ? entries.slice(3) : entries;

  return (
    <PageLayout title={t('title')} maxW="640px">
      <UnderlineTabs
        items={PERIODS.map((p) => ({ id: p, label: t(`periods.${p}`) }))}
        activeId={period}
        onTabClick={handlePeriodChange}
      />

      {isLoading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" color="brand.500" />
        </Flex>
      ) : entries.length === 0 ? (
        <VStack py={16} gap={2}>
          <Text fontSize="3xl">🏸</Text>
          <Text color="fg.muted">{t('empty')}</Text>
        </VStack>
      ) : (
        <VStack align="stretch" gap={4} pt={4} pb={8}>
          {podium.length > 0 && (
            <Flex justify="center" align="flex-end" gap={3} pt={2}>
              {PODIUM_ORDER.filter((i) => podium[i]).map((i) => (
                <PodiumCard
                  key={podium[i].user.id}
                  entry={podium[i]}
                  isChampion={i === 0}
                  onClick={() => goToProfile(podium[i].user.id)}
                />
              ))}
            </Flex>
          )}

          <VStack align="stretch" gap={2}>
            {rest.map((entry) => (
              <RankRow
                key={entry.user.id}
                entry={entry}
                isMe={entry.user.id === currentUser?.id}
                onClick={() => goToProfile(entry.user.id)}
              />
            ))}
          </VStack>

          {(data?.totalPages ?? 1) > 1 && (
            <HStack justify="center" pt={2}>
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('previous')}
              </Button>
              <Text fontSize="sm" color="fg.muted">
                {page} / {data?.totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('next')}
              </Button>
            </HStack>
          )}
        </VStack>
      )}
    </PageLayout>
  );
}

const PodiumCard = ({
  entry,
  isChampion,
  onClick,
}: {
  entry: ILeaderboardEntry;
  isChampion: boolean;
  onClick: () => void;
}) => {
  const t = useTranslations('leaderboard');
  const tierColor = TIER_COLORS[entry.tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isChampion ? 0 : 0.15, type: 'spring' }}
      style={{ flex: 1, maxWidth: 160 }}
    >
      <VStack
        gap={1.5}
        p={3}
        pt={isChampion ? 5 : 3}
        borderWidth="1px"
        borderColor={isChampion ? tierColor.solid : 'border.subtle'}
        borderRadius="xl"
        bg="bg.panel"
        cursor="pointer"
        onClick={onClick}
        transform={isChampion ? 'scale(1.06)' : undefined}
        boxShadow={isChampion ? 'md' : 'sm'}
      >
        <Text fontSize={isChampion ? '2xl' : 'xl'} lineHeight={1}>
          {MEDALS[entry.rank - 1] ?? entry.rank}
        </Text>
        <Avatar.Root size={isChampion ? 'lg' : 'md'}>
          <Avatar.Fallback name={entry.user.name ?? ''} />
          {entry.user.image && <Avatar.Image src={entry.user.image} />}
        </Avatar.Root>
        <Text
          fontSize="sm"
          fontWeight="600"
          textAlign="center"
          lineClamp={1}
          maxW="100%"
        >
          {entry.user.name}
        </Text>
        <Text fontSize="lg" fontWeight="800" style={{ color: tierColor.color }}>
          {entry.points}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {t('pointsUnit')}
        </Text>
        <TierBadge tier={entry.tier} />
      </VStack>
    </motion.div>
  );
};

const RankRow = ({
  entry,
  isMe,
  onClick,
}: {
  entry: ILeaderboardEntry;
  isMe: boolean;
  onClick: () => void;
}) => {
  const t = useTranslations('leaderboard');

  return (
    <Flex
      align="center"
      gap={3}
      p={3}
      borderWidth="1px"
      borderColor={isMe ? 'brand.400' : 'border.subtle'}
      bg={isMe ? 'brand.50' : 'bg.panel'}
      borderRadius="lg"
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: isMe ? 'brand.100' : 'bg.subtle' }}
    >
      <Text w="32px" textAlign="center" fontWeight="700" color="fg.muted">
        {entry.rank}
      </Text>
      <Avatar.Root size="sm">
        <Avatar.Fallback name={entry.user.name ?? ''} />
        {entry.user.image && <Avatar.Image src={entry.user.image} />}
      </Avatar.Root>
      <Box flex={1} minW={0}>
        <HStack gap={2}>
          <Text fontWeight="600" fontSize="sm" lineClamp={1}>
            {entry.user.name}
          </Text>
          {isMe && (
            <Text fontSize="xs" color="brand.600" fontWeight="700">
              {t('you')}
            </Text>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          {t('winStats', {
            won: entry.matchesWon,
            played: entry.matchesPlayed,
          })}
        </Text>
      </Box>
      <TierBadge tier={entry.tier} showIcon={false} />
      <Text fontWeight="800" fontSize="md" minW="48px" textAlign="right">
        {entry.points}
      </Text>
    </Flex>
  );
};
