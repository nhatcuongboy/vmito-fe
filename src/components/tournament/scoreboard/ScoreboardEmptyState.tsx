'use client';

import { Flex, Text } from '@chakra-ui/react';
import { MonitorPlay } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ScoreboardEmptyState() {
  const t = useTranslations('pages.tournaments.scoreboard');
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      flex="1"
      gap={4}
      color="gray.500"
      py={20}
      _dark={{ color: 'gray.400' }}
    >
      <MonitorPlay size={56} opacity={0.4} />
      <Text fontSize="lg">{t('noLiveMatches')}</Text>
    </Flex>
  );
}
