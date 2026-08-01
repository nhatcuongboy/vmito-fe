'use client';

import { Avatar, Box, Flex, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ILeaderboardEntry,
  TLeaderboardPeriod,
} from '@/lib/api/ranking.service';
import TierBadge from './TierBadge';

/** Position medals — deliberately unrelated to the account tier colours. */
const MEDAL_COLORS: Record<number, { bg: string; ring: string }> = {
  1: { bg: '#f5b301', ring: '#fde68a' },
  2: { bg: '#a8adb8', ring: '#e2e5ea' },
  3: { bg: '#c1783c', ring: '#eccaa8' },
};

interface PodiumCardProps {
  entry: ILeaderboardEntry;
  isChampion: boolean;
  period: TLeaderboardPeriod;
  onClick: () => void;
}

export default function PodiumCard({
  entry,
  isChampion,
  period,
  onClick,
}: PodiumCardProps) {
  const t = useTranslations('leaderboard');
  const medal = MEDAL_COLORS[entry.rank] ?? MEDAL_COLORS[3];
  const avatarSize = isChampion ? '72px' : '56px';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isChampion ? 0 : 0.15, type: 'spring' }}
      style={{ flex: 1, minWidth: 0, maxWidth: isChampion ? 176 : 156 }}
    >
      <VStack
        gap={1.5}
        px={{ base: 1.5, sm: 3 }}
        pt={isChampion ? 6 : 5}
        pb={isChampion ? 6 : 5}
        borderWidth={isChampion ? '2px' : '1px'}
        borderColor={isChampion ? medal.bg : 'border.subtle'}
        borderRadius="xl"
        bg="bg.panel"
        cursor="pointer"
        onClick={onClick}
        boxShadow={isChampion ? 'lg' : 'sm'}
        transition="transform 0.2s"
        _hover={{ transform: 'translateY(-2px)' }}
      >
        <Box position="relative">
          <Avatar.Root
            width={avatarSize}
            height={avatarSize}
            borderWidth="3px"
            borderColor={medal.ring}
          >
            <Avatar.Fallback name={entry.user.name ?? ''} />
            {entry.user.image && <Avatar.Image src={entry.user.image} />}
          </Avatar.Root>
          <Flex
            position="absolute"
            bottom="-6px"
            left="50%"
            transform="translateX(-50%)"
            align="center"
            justify="center"
            minW="24px"
            h="24px"
            px={1.5}
            borderRadius="full"
            bg={medal.bg}
            color="white"
            fontSize="xs"
            fontWeight="800"
            borderWidth="2px"
            borderColor="bg.panel"
          >
            {entry.rank}
          </Flex>
        </Box>

        <Text
          fontSize="sm"
          fontWeight="600"
          textAlign="center"
          lineClamp={1}
          maxW="100%"
          pt={1}
        >
          {entry.user.name}
        </Text>

        <Flex align="baseline" gap={1}>
          <Text fontSize={isChampion ? '2xl' : 'xl'} fontWeight="800">
            {entry.points}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {t('pointsUnit')}
          </Text>
        </Flex>

        <TierBadge tier={entry.tier} />
        {period !== 'all' && (
          <Text fontSize="10px" color="fg.subtle">
            {t('totalPointsCaption', { points: entry.totalPoints })}
          </Text>
        )}
      </VStack>
    </motion.div>
  );
}
