'use client';

import { Avatar, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ILeaderboardEntry } from '@/lib/api/ranking.service';
import TierBadge from './TierBadge';

interface RankRowProps {
  entry: ILeaderboardEntry;
  isMe: boolean;
  onClick: () => void;
}

export default function RankRow({ entry, isMe, onClick }: RankRowProps) {
  const t = useTranslations('leaderboard');
  const winRate = entry.matchesPlayed
    ? Math.round((entry.matchesWon / entry.matchesPlayed) * 100)
    : null;

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
          <Text
            fontWeight="600"
            fontSize="sm"
            lineClamp={1}
            title={entry.user.name ?? ''}
          >
            {entry.user.name}
          </Text>
          {isMe && (
            <Text fontSize="xs" color="brand.600" fontWeight="700">
              {t('you')}
            </Text>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          {winRate === null
            ? t('noMatches')
            : t('winRate', {
                rate: winRate,
                won: entry.matchesWon,
                played: entry.matchesPlayed,
              })}
        </Text>
      </Box>
      <TierBadge tier={entry.tier} />
      <Text fontWeight="800" fontSize="md" minW="48px" textAlign="right">
        {entry.points}
      </Text>
    </Flex>
  );
}
