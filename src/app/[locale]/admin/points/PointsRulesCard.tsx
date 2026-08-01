'use client';

import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TIER_COLORS, TIER_ICONS } from '@/components/leaderboard/TierBadge';
import { IPointsAdminOverview } from '@/lib/api/ranking.service';

interface PointsRulesCardProps {
  config: IPointsAdminOverview['config'];
}

export function PointsRulesCard({ config }: PointsRulesCardProps) {
  const t = useTranslations('admin.points');
  const tReason = useTranslations('leaderboard.achievements.reasons');
  const tTier = useTranslations('leaderboard.tiers');

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="md"
            bg="blue.100"
            _dark={{ bg: 'blue.900/30' }}
            color="blue.600"
          >
            <ListChecks size={18} />
          </Box>
          <Box>
            <Heading size="md">{t('rules.title')}</Heading>
            <Text fontSize="sm" color="gray.500">
              {t('rules.description')}
            </Text>
          </Box>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t('rules.reason')}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  {t('rules.points')}
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  {t('rules.transactions')}
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  {t('rules.awardedPoints')}
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {config.pointValues.map((row) => (
                <Table.Row key={row.reason}>
                  <Table.Cell>
                    <Text fontSize="sm">{tReason(row.reason)}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {row.reason}
                    </Text>
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontWeight="700">
                    +{row.points}
                  </Table.Cell>
                  <Table.Cell textAlign="end">{row.transactions}</Table.Cell>
                  <Table.Cell textAlign="end">{row.totalPoints}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Box
            p={3}
            borderRadius="md"
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.muted"
          >
            <Text fontSize="sm" fontWeight="700" mb={1}>
              {t('rules.hostTitle')}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {t('rules.hostRule', { count: config.hostMinActivePlayers })}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="700" mb={2}>
              {t('rules.tierTitle')}
            </Text>
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t('rules.tier')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {t('rules.minPoints')}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {t('rules.users')}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {config.tiers.map((row) => (
                  <Table.Row key={row.tier}>
                    <Table.Cell>
                      <HStack gap={2}>
                        <Text>{TIER_ICONS[row.tier]}</Text>
                        <Badge
                          bg={TIER_COLORS[row.tier].bg}
                          color={TIER_COLORS[row.tier].color}
                          borderRadius="full"
                          px={2}
                        >
                          {tTier(row.tier)}
                        </Badge>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="end">{row.minPoints}</Table.Cell>
                    <Table.Cell textAlign="end">{row.users}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          <Text fontSize="xs" color="gray.500">
            {t('rules.sourceNote')}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
