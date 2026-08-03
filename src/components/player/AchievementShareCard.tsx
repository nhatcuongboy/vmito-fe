'use client';

import { Avatar, Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Feather, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import TierBadge, { TIER_COLORS } from '@/components/leaderboard/TierBadge';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import {
  IUserAchievements,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';

const PERIODS: TLeaderboardPeriod[] = ['week', 'month', 'year', 'all'];
const EXPORT_AVATAR_SIZE = 192;
const NEXT_IMAGE_ALLOWED_AVATAR_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'platform-lookaside.fbsbx.com',
  'res.cloudinary.com',
]);

interface AchievementShareCardProps {
  elementId: string;
  userName: string;
  userImage?: string | null;
  achievements: IUserAchievements;
}

const getExportAvatarSrc = (src?: string | null) => {
  const normalizedSrc =
    normalizeImageUrl(src, {
      cloudinaryWidth: EXPORT_AVATAR_SIZE,
      cloudinaryHeight: EXPORT_AVATAR_SIZE,
    }) ?? src;

  if (!normalizedSrc || typeof window === 'undefined') return normalizedSrc;
  if (/^(data|blob):/.test(normalizedSrc)) return normalizedSrc;
  if (normalizedSrc.startsWith('/')) return normalizedSrc;

  try {
    const url = new URL(normalizedSrc);
    if (
      url.protocol === 'https:' &&
      NEXT_IMAGE_ALLOWED_AVATAR_HOSTS.has(url.hostname)
    ) {
      const params = new URLSearchParams({
        url: normalizedSrc,
        w: String(EXPORT_AVATAR_SIZE),
        q: '90',
      });
      return `${window.location.origin}/_next/image?${params.toString()}`;
    }
  } catch {
    return normalizedSrc;
  }

  return normalizedSrc;
};

/** Off-screen, capture-only card — see UserAchievementsSection for the download trigger. */
export default function AchievementShareCard({
  elementId,
  userName,
  userImage,
  achievements,
}: AchievementShareCardProps) {
  const t = useTranslations('leaderboard.achievements');
  const tLb = useTranslations('leaderboard');
  const tierColor = TIER_COLORS[achievements.tier];
  const exportAvatarSrc = getExportAvatarSrc(userImage);

  const stats = [
    { label: t('wins'), value: achievements.stats.wins },
    { label: t('losses'), value: achievements.stats.losses },
    {
      label: t('tournamentTitles'),
      value: achievements.stats.tournamentTitles,
    },
    { label: t('matchesPlayed'), value: achievements.stats.matchesPlayed },
  ];

  return (
    <Box
      id={elementId}
      w="540px"
      bg="white"
      color="gray.900"
      p={5}
      border="1px solid"
      borderColor="gray.100"
    >
      <VStack align="stretch" gap={4}>
        {/* Hero: tier gradient, avatar, name, tier badge */}
        <Flex
          position="relative"
          overflow="hidden"
          borderRadius="2xl"
          bg={`linear-gradient(135deg, ${tierColor.solid} 0%, #15803d 130%)`}
          color="white"
          px={6}
          py={7}
          direction="column"
          align="center"
          gap={2}
          boxShadow="0 18px 36px rgba(21, 128, 61, 0.22)"
        >
          <Box
            as={Feather}
            position="absolute"
            right="-12px"
            bottom="-20px"
            boxSize="150px"
            color="whiteAlpha.200"
            transform="rotate(-16deg)"
          />

          <Flex
            align="center"
            gap={2}
            bg="whiteAlpha.200"
            border="1px solid"
            borderColor="whiteAlpha.300"
            borderRadius="full"
            px={3}
            py={1.5}
            zIndex={1}
          >
            <Box as={Trophy} boxSize={3.5} />
            <Text fontSize="10px" fontWeight="black" textTransform="uppercase">
              {t('cardBadge')}
            </Text>
          </Flex>

          <Avatar.Root
            size="2xl"
            border="3px solid white"
            overflow="hidden"
            zIndex={1}
          >
            {exportAvatarSrc && (
              // eslint-disable-next-line @next/next/no-img-element -- DOM export needs a plain img node for modern-screenshot.
              <img
                src={exportAvatarSrc}
                alt={userName}
                loading="eager"
                decoding="sync"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            <Avatar.Fallback name={userName} />
          </Avatar.Root>

          <Text
            fontSize={userName.length > 18 ? 'xl' : '2xl'}
            fontWeight="black"
            lineClamp={1}
            zIndex={1}
          >
            {userName}
          </Text>

          <TierBadge tier={achievements.tier} size="lg" />

          <Text
            fontSize="4xl"
            fontWeight="black"
            lineHeight={1}
            mt={1}
            zIndex={1}
          >
            {achievements.totalPoints}
          </Text>
          <Text fontSize="sm" opacity={0.9} zIndex={1}>
            {tLb('pointsUnit')}
          </Text>
        </Flex>

        {/* Ranks per period */}
        <SimpleGrid columns={4} gap={2}>
          {PERIODS.map((period) => {
            const rank = achievements.ranks.find((r) => r.period === period);
            return (
              <VStack
                key={period}
                gap={0.5}
                p={2.5}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="gray.50"
              >
                <Text fontSize="xs" color="gray.500">
                  {tLb(`periods.${period}`)}
                </Text>
                <Text fontSize="lg" fontWeight="800">
                  {rank?.rank ? t('rank', { rank: rank.rank }) : '—'}
                </Text>
              </VStack>
            );
          })}
        </SimpleGrid>

        {/* Match stats */}
        <SimpleGrid columns={4} gap={2}>
          {stats.map((stat) => (
            <VStack
              key={stat.label}
              gap={0.5}
              p={2.5}
              borderWidth="1px"
              borderColor="green.100"
              borderRadius="lg"
              bg="green.50"
            >
              <Text fontSize="lg" fontWeight="800" color="green.700">
                {stat.value}
              </Text>
              <Text fontSize="10px" color="gray.600" textAlign="center">
                {stat.label}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>

        {/* Branding footer */}
        <Flex
          align="center"
          justify="center"
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          px={4}
          py={3}
        >
          <Text fontSize="sm" color="gray.600" fontWeight="bold">
            {t('cardFooter')}
          </Text>
        </Flex>
      </VStack>
    </Box>
  );
}
