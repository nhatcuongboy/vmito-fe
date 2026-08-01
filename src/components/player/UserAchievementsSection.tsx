'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Grid, Spinner, Text, VStack } from '@chakra-ui/react';
import { motion, animate } from 'framer-motion';
import { useTranslations } from 'next-intl';
import TierBadge, {
  TIER_COLORS,
  TIER_ICONS,
} from '@/components/leaderboard/TierBadge';
import PointsRulesModal from '@/components/leaderboard/PointsRulesModal';
import {
  IUserAchievements,
  RankingService,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';
import { Link } from '@/i18n/config';

const PERIODS: TLeaderboardPeriod[] = ['week', 'month', 'year', 'all'];

interface UserAchievementsSectionProps {
  userId: string;
}

export default function UserAchievementsSection({
  userId,
}: UserAchievementsSectionProps) {
  const t = useTranslations('leaderboard.achievements');
  const tLb = useTranslations('leaderboard');
  const [data, setData] = useState<IUserAchievements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    RankingService.getUserAchievements(userId)
      .then((result) => {
        if (!cancelled) setData(result);
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
          gap={2}
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={tierColor.solid}
          bg="bg.panel"
          position="relative"
        >
          <Box
            as="button"
            position="absolute"
            top={2}
            right={2}
            fontSize="lg"
            lineHeight={1}
            opacity={0.7}
            aria-label={tLb('rules.title')}
            onClick={() => setIsRulesOpen(true)}
            _hover={{ opacity: 1 }}
          >
            ℹ️
          </Box>
          <Text fontSize="4xl" lineHeight={1}>
            {TIER_ICONS[data.tier]}
          </Text>
          <TierBadge tier={data.tier} size="lg" showIcon={false} />
          <Text fontSize="3xl" fontWeight="900" lineHeight={1.1}>
            {displayPoints}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {tLb('pointsUnit')}
          </Text>

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
      <Grid templateColumns="repeat(4, 1fr)" gap={2}>
        {PERIODS.map((period) => {
          const rank = data.ranks.find((r) => r.period === period);
          return (
            <VStack
              key={period}
              gap={0.5}
              p={2.5}
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              bg="bg.panel"
            >
              <Text fontSize="xs" color="fg.muted">
                {tLb(`periods.${period}`)}
              </Text>
              <Text fontSize="lg" fontWeight="800">
                {rank?.rank ? `#${rank.rank}` : '—'}
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
        <StatCard
          label={t('sessionsHosted')}
          value={data.stats.sessionsHosted}
        />
        <StatCard
          label={t('tournamentTitles')}
          value={data.stats.tournamentTitles}
        />
        <StatCard
          label={t('tournamentRunnerUps')}
          value={data.stats.tournamentRunnerUps}
        />
      </Grid>

      {/* Recent point history */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="700" fontSize="sm">
            {t('recentPoints')}
          </Text>
          <Link href="/leaderboard">
            <Text fontSize="xs" color="brand.600" fontWeight="600">
              {t('viewLeaderboard')}
            </Text>
          </Link>
        </Flex>
        {data.recentTransactions.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" textAlign="center" py={6}>
            {t('noPointsYet')}
          </Text>
        ) : (
          <VStack align="stretch" gap={1.5}>
            {data.recentTransactions.map((tx) => (
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
          </VStack>
        )}
      </Box>
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
