'use client';

import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Grid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { motion, animate } from 'framer-motion';
import { Award, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import TierBadge, {
  TIER_COLORS,
  TIER_ICONS,
} from '@/components/leaderboard/TierBadge';
import PointsRulesModal from '@/components/leaderboard/PointsRulesModal';
import AchievementShareCard from '@/components/player/AchievementShareCard';
import { ROUTES } from '@/constants';
import { useDownloadElementImage } from '@/hooks/useDownloadElementImage';
import {
  IUserAchievements,
  IPointTransaction,
  RankingService,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';
import { Link } from '@/i18n/config';

const PERIODS: TLeaderboardPeriod[] = ['week', 'month', 'year', 'all'];
const POINT_TRANSACTIONS_LIMIT = 10;

interface UserAchievementsSectionProps {
  userId: string;
  /** Only the profile owner can download their own achievement card. */
  isOwner?: boolean;
  userName?: string;
  userImage?: string | null;
}

export default function UserAchievementsSection({
  userId,
  isOwner = false,
  userName,
  userImage,
}: UserAchievementsSectionProps) {
  const t = useTranslations('leaderboard.achievements');
  const tLb = useTranslations('leaderboard');
  const [data, setData] = useState<IUserAchievements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<
    IPointTransaction[]
  >([]);
  const [recentTransactionsCursor, setRecentTransactionsCursor] = useState<
    string | null
  >(null);
  const [hasMoreRecentTransactions, setHasMoreRecentTransactions] =
    useState(false);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] =
    useState(false);
  const { downloadElementImage, isDownloading } = useDownloadElementImage();
  const shareCardElementId = `achievement-share-card-${userId}`;

  const handleDownloadCard = () => {
    downloadElementImage(
      shareCardElementId,
      `ThanhTich-${userId.slice(0, 8)}.png`,
      {
        success: t('imageDownloadSuccess'),
        error: t('imageDownloadError'),
      }
    );
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setRecentTransactions([]);
    setRecentTransactionsCursor(null);
    setHasMoreRecentTransactions(false);
    RankingService.getUserAchievements(userId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setRecentTransactions(result.recentTransactions);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleLoadMoreTransactions = async () => {
    if (isLoadingMoreTransactions || !hasMoreRecentTransactions) return;

    setIsLoadingMoreTransactions(true);
    try {
      const transactionsPage = await RankingService.getUserPointTransactions(
        userId,
        {
          limit: POINT_TRANSACTIONS_LIMIT,
          cursor: recentTransactionsCursor,
        }
      );
      setRecentTransactions((current) => [
        ...current,
        ...transactionsPage.items.filter(
          (nextTx) => !current.some((tx) => tx.id === nextTx.id)
        ),
      ]);
      setRecentTransactionsCursor(transactionsPage.nextCursor);
      setHasMoreRecentTransactions(transactionsPage.hasMore);
    } catch {
      setHasMoreRecentTransactions(false);
    } finally {
      setIsLoadingMoreTransactions(false);
    }
  };

  // Count-up animation for total points
  useEffect(() => {
    if (!data) return;
    const controls = animate(0, data.totalPoints, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayPoints(Math.round(v)),
    });
    return () => controls.stop();
  }, [data]);

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="brand.500" />
      </Flex>
    );
  }

  if (!data) {
    return (
      <Text color="fg.muted" textAlign="center" py={12}>
        {t('loadError')}
      </Text>
    );
  }

  const tierColor = TIER_COLORS[data.tier];
  const progress = data.nextTier
    ? Math.min(
        100,
        Math.round(
          (data.totalPoints / (data.totalPoints + data.nextTier.pointsToNext)) *
            100
        )
      )
    : 100;

  return (
    <VStack align="stretch" gap={4} pb={8}>
      <PointsRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
      {/* Tier + total points hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <VStack
          gap={3}
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={tierColor.solid}
          bg="bg.panel"
        >
          <Box position="relative">
            <Avatar.Root
              w="86px"
              h="86px"
              border="4px solid"
              borderColor={tierColor.bg}
              bg="bg.muted"
            >
              {userImage && (
                <Avatar.Image
                  src={userImage}
                  objectFit="cover"
                  crossOrigin="anonymous"
                />
              )}
              <Avatar.Fallback name={userName || ''} />
            </Avatar.Root>
          </Box>

          {userName && (
            <Text
              fontSize="lg"
              fontWeight="800"
              color="fg"
              lineHeight={1.2}
              textAlign="center"
              lineClamp={1}
              maxW="100%"
            >
              {userName}
            </Text>
          )}

          {!userName && (
            <Text fontSize="4xl" lineHeight={1}>
              {TIER_ICONS[data.tier]}
            </Text>
          )}

          <Flex align="baseline" justify="center" gap={2}>
            <Text fontSize="4xl" fontWeight="900" lineHeight={1}>
              {displayPoints}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {tLb('pointsUnit')}
            </Text>
          </Flex>

          <TierBadge tier={data.tier} size="lg" />

          {/* Progress to next tier */}
          <Box w="100%" pt={1}>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="xs" color="fg.muted">
                {data.nextTier
                  ? t('toNextTier', {
                      points: data.nextTier.pointsToNext,
                      tier: tLb(`tiers.${data.nextTier.nextTier}`),
                    })
                  : t('maxTier')}
              </Text>
              <Text fontSize="xs" fontWeight="600">
                {progress}%
              </Text>
            </Flex>
            <Box h="8px" bg="bg.muted" borderRadius="full" overflow="hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 'inherit',
                  backgroundColor: tierColor.solid,
                }}
              />
            </Box>
          </Box>
        </VStack>
      </motion.div>

      {/* Ranks per period */}
      <Grid
        templateColumns={{
          base: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(4, minmax(0, 1fr))',
        }}
        gap={2}
      >
        {PERIODS.map((period) => {
          const rank = data.ranks.find((r) => r.period === period);
          return (
            <VStack
              key={period}
              gap={0.5}
              p={{ base: 2, sm: 2.5 }}
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              bg="bg.panel"
              minW={0}
            >
              <Text fontSize="xs" color="fg.muted">
                {tLb(`periods.${period}`)}
              </Text>
              <Text
                fontSize={{ base: 'md', sm: 'lg' }}
                fontWeight="800"
                lineHeight={1.15}
                textAlign="center"
                whiteSpace="nowrap"
              >
                {rank?.rank ? t('rank', { rank: rank.rank }) : '—'}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {rank?.points ?? 0} {tLb('pointsUnit')}
              </Text>
            </VStack>
          );
        })}
      </Grid>

      {/* Match stats */}
      <Grid templateColumns="repeat(3, 1fr)" gap={2}>
        <StatCard label={t('wins')} value={data.stats.wins} color="#16a34a" />
        <StatCard label={t('draws')} value={data.stats.draws} color="#ca8a04" />
        <StatCard
          label={t('losses')}
          value={data.stats.losses}
          color="#dc2626"
        />
        <StatCard label={t('matchesPlayed')} value={data.stats.matchesPlayed} />
        {/* <StatCard
          label={t('sessionsHosted')}
          value={data.stats.sessionsHosted}
        /> */}
        <StatCard
          label={t('tournamentTitles')}
          value={data.stats.tournamentTitles}
        />
        <StatCard
          label={t('tournamentRunnerUps')}
          value={data.stats.tournamentRunnerUps}
        />
      </Grid>

      <VStack gap={2} align="center">
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="green"
            borderRadius="full"
            px={5}
            shadow="sm"
            loading={isDownloading}
            onClick={handleDownloadCard}
          >
            <Download size={16} />
            {t('downloadCard')}
          </Button>
        )}
        <Link href={ROUTES.LEADERBOARD}>
          <Button
            size="sm"
            variant="outline"
            colorPalette="green"
            borderRadius="full"
            px={5}
            shadow="sm"
          >
            <Award size={16} />
            {t('viewLeaderboard')}
          </Button>
        </Link>
      </VStack>

      {/* Recent point history */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="700" fontSize="sm">
            {t('recentPoints')}
          </Text>
          <Box
            as="button"
            fontSize="md"
            lineHeight={1}
            opacity={0.7}
            aria-label={tLb('rules.title')}
            onClick={() => setIsRulesOpen(true)}
            _hover={{ opacity: 1 }}
            cursor="pointer"
          >
            ℹ️
          </Box>
        </Flex>
        {recentTransactions.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" textAlign="center" py={6}>
            {t('noPointsYet')}
          </Text>
        ) : (
          <VStack align="stretch" gap={1.5}>
            {recentTransactions.map((tx) => (
              <Flex
                key={tx.id}
                align="center"
                justify="space-between"
                p={2.5}
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="md"
                bg="bg.panel"
              >
                <Box>
                  <Text fontSize="sm" fontWeight="500">
                    {t(`reasons.${tx.reason}`)}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {new Date(tx.occurredAt).toLocaleDateString()}
                  </Text>
                </Box>
                <Text
                  fontWeight="800"
                  fontSize="sm"
                  color={tx.points >= 0 ? 'green.600' : 'red.600'}
                >
                  {tx.points >= 0 ? `+${tx.points}` : tx.points}
                </Text>
              </Flex>
            ))}
            {hasMoreRecentTransactions && (
              <Button
                size="sm"
                variant="ghost"
                colorPalette="green"
                alignSelf="center"
                mt={1}
                loading={isLoadingMoreTransactions}
                onClick={handleLoadMoreTransactions}
              >
                {t('loadMorePoints')}
              </Button>
            )}
          </VStack>
        )}
      </Box>

      {isOwner && (
        <Box
          position="fixed"
          left="-10000px"
          top={0}
          pointerEvents="none"
          aria-hidden="true"
          css={{
            contain: 'layout style paint',
          }}
        >
          <AchievementShareCard
            elementId={shareCardElementId}
            userName={userName || ''}
            userImage={userImage}
            achievements={data}
          />
        </Box>
      )}
    </VStack>
  );
}

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <VStack
    gap={0.5}
    p={2.5}
    borderWidth="1px"
    borderColor="border.subtle"
    borderRadius="lg"
    bg="bg.panel"
  >
    <Text fontSize="lg" fontWeight="800" style={color ? { color } : undefined}>
      {value}
    </Text>
    <Text fontSize="xs" color="fg.muted" textAlign="center">
      {label}
    </Text>
  </VStack>
);
