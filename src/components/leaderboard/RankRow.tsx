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
      gap={{ base: 2, md: 3 }}
      p={3}
      borderWidth="1px"
      borderColor={isMe ? 'brand.400' : 'border.subtle'}
      bg={isMe ? 'brand.50' : 'bg.panel'}
      borderRadius="lg"
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: isMe ? 'brand.100' : 'bg.subtle' }}
    >
      <Text
        w={{ base: '24px', md: '32px' }}
        flexShrink={0}
        textAlign="center"
        fontWeight="700"
        color="fg.muted"
      >
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
        {winRate === null ? (
          <Text fontSize="xs" lineHeight="short" color="fg.muted">
            {t('noMatches')}
          </Text>
        ) : (
          <Box fontSize="xs" lineHeight="short" color="fg.muted">
            <Text>{t('winRate', { rate: winRate })}</Text>
            <Text>
              {t('matchRecord', {
                won: entry.matchesWon,
                played: entry.matchesPlayed,
              })}
            </Text>
          </Box>
        )}
      </Box>
      <TierBadge tier={entry.tier} />
      <Flex
        align="baseline"
        justify="flex-end"
        gap={1}
        minW={{ base: '58px', md: '64px' }}
        flexShrink={0}
      >
        <Text fontWeight="800" fontSize="md" textAlign="right">
          {entry.points}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {t('pointsUnit')}
        </Text>
      </Flex>
    </Flex>
  );
}
