'use client';

import { Box, Card, Heading, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { Activity } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { IPointsAdminOverview } from '@/lib/api/ranking.service';

interface PointsStatsCardProps {
  stats: IPointsAdminOverview['stats'];
}

export function PointsStatsCard({ stats }: PointsStatsCardProps) {
  const t = useTranslations('admin.points');
  const format = useFormatter();

  const lastAwarded = stats.lastAwardedAt
    ? format.dateTime(new Date(stats.lastAwardedAt), {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : t('stats.never');

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="md"
            bg="purple.100"
            _dark={{ bg: 'purple.900/30' }}
            color="purple.600"
          >
            <Activity size={18} />
          </Box>
          <Box>
            <Heading size="md">{t('stats.title')}</Heading>
            <Text fontSize="sm" color="gray.500">
              {t('stats.description')}
            </Text>
          </Box>
        </HStack>
      </Card.Header>
      <Card.Body>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Stat
            label={t('stats.rankedUsers')}
            value={String(stats.rankedUsers)}
          />
          <Stat
            label={t('stats.totalTransactions')}
            value={String(stats.totalTransactions)}
          />
          <Stat
            label={t('stats.totalPoints')}
            value={String(stats.totalPoints)}
          />
          <Stat label={t('stats.lastAwardedAt')} value={lastAwarded} />
          <Stat
            label={t('stats.finishedSessions')}
            value={String(stats.finishedSessions)}
          />
          <Stat
            label={t('stats.finishedMatches')}
            value={String(stats.finishedMatches)}
          />
          <Stat
            label={t('stats.finishedTournaments')}
            value={String(stats.finishedTournaments)}
          />
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Text fontSize="xs" color="gray.500">
      {label}
    </Text>
    <Text fontSize="xl" fontWeight="bold" lineHeight="1.3">
      {value}
    </Text>
  </Box>
);
