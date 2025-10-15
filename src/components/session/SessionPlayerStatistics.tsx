import { SessionService } from '@/lib/api/session.service';
import { PlayerStatistics } from '@/lib/api/types';
import {
  Box,
  Button,
  Center,
  Flex,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useState } from 'react';

interface SessionPlayerStatisticsProps {
  sessionId: string;
}

const SessionPlayerStatistics: React.FC<SessionPlayerStatisticsProps> = ({
  sessionId,
}) => {
  const t = useTranslations('SessionPlayerStatistics');
  const [stats, setStats] = useState<PlayerStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filter and sort states
  const [sortBy, setSortBy] = useState<string>('playerNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [genderFilter, setGenderFilter] = useState<string>('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await SessionService.getPlayerStatistics(sessionId, {
        sortBy,
        sortOrder,
        gender: genderFilter || undefined,
      });
      setStats(result.playerStats);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      setError(t('errorLoadingStats'));
    } finally {
      setLoading(false);
    }
  }, [sessionId, sortBy, sortOrder, genderFilter, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const sortOptions = [
    { value: 'playerNumber', label: t('columnNo') },
    { value: 'name', label: t('columnName') },
    { value: 'totalMatches', label: t('columnTotalMatches') },
    { value: 'regularMatches', label: t('columnRegularMatches') },
    { value: 'extraMatches', label: t('columnExtraMatches') },
    { value: 'wins', label: t('columnWins') },
    { value: 'losses', label: t('columnLosses') },
    { value: 'winRate', label: t('columnWinRate') },
    { value: 'averageScore', label: t('columnAvgScore') },
    { value: 'totalPlayTime', label: 'Total Play Time' },
    { value: 'totalWaitTime', label: 'Total Wait Time' },
  ];

  return (
    <Box>
      {/* Filter and Sort Controls */}
      <Box mb={4} p={4} borderWidth={1} borderRadius="md" bg="gray.50">
        <Text fontWeight="bold" mb={3}>
          {t('filtersAndSorting')}
        </Text>
        <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="end">
          <Box>
            <Text fontSize="sm" mb={1}>
              {t('sortBy')}
            </Text>
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value)
              }
              style={{
                fontSize: '14px',
                minWidth: '150px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E0',
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Box>

          <Box>
            <Text fontSize="sm" mb={1}>
              {t('sortOrder')}
            </Text>
            <select
              value={sortOrder}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortOrder(e.target.value as 'asc' | 'desc')
              }
              style={{
                fontSize: '14px',
                minWidth: '120px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E0',
              }}
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </select>
          </Box>

          <Box>
            <Text fontSize="sm" mb={1}>
              {t('filterByGender')}
            </Text>
            <select
              value={genderFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setGenderFilter(e.target.value)
              }
              style={{
                fontSize: '14px',
                minWidth: '120px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E0',
              }}
            >
              <option value="">{t('allGenders')}</option>
              <option value="MALE">{t('male')}</option>
              <option value="FEMALE">{t('female')}</option>
              <option value="OTHER">{t('other')}</option>
              <option value="PREFER_NOT_TO_SAY">{t('preferNotToSay')}</option>
            </select>
          </Box>

          <Button
            size="sm"
            onClick={() => {
              setSortBy('playerNumber');
              setSortOrder('asc');
              setGenderFilter('');
            }}
            variant="outline"
          >
            {t('resetFilters')}
          </Button>
        </Flex>
      </Box>

      {loading ? (
        <Center py={8}>
          <Spinner size="lg" />
        </Center>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : stats.length === 0 ? (
        <Text>{t('noDataAvailable')}</Text>
      ) : (
        <Box>
          <Table.Root size="sm" variant="outline" colorScheme="gray">
            <Table.Caption>{t('tableCaption')}</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t('columnNo')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('columnName')}</Table.ColumnHeader>
                <Table.ColumnHeader>
                  {t('columnTotalMatches')}
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  <span
                    title={t('regularMatchesTooltip')}
                    style={{ cursor: 'help' }}
                  >
                    {t('columnRegularMatches')}
                  </span>
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  <span
                    title={t('extraMatchesTooltip')}
                    style={{ cursor: 'help' }}
                  >
                    {t('columnExtraMatches')}
                  </span>
                </Table.ColumnHeader>
                <Table.ColumnHeader>{t('columnWins')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('columnLosses')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('columnWinRate')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('columnAvgScore')}</Table.ColumnHeader>
                <Table.ColumnHeader>Total Play Time</Table.ColumnHeader>
                <Table.ColumnHeader>Total Wait Time</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {stats.map((p, idx) => (
                <Table.Row key={p.playerId}>
                  <Table.Cell>{p.playerNumber}</Table.Cell>
                  <Table.Cell>{p.name || t('unnamed')}</Table.Cell>
                  <Table.Cell>{p.totalMatches}</Table.Cell>
                  <Table.Cell>{p.regularMatches || 0}</Table.Cell>
                  <Table.Cell>{p.extraMatches || 0}</Table.Cell>
                  <Table.Cell>{p.wins}</Table.Cell>
                  <Table.Cell>{p.losses}</Table.Cell>
                  <Table.Cell>{p.winRate}%</Table.Cell>
                  <Table.Cell>{p.averageScore}</Table.Cell>
                  <Table.Cell>{p.totalPlayTime || 0}m</Table.Cell>
                  <Table.Cell>{p.totalWaitTime || 0}m</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
          <Text fontSize="xs" color="gray.500" mt={2}>
            {t('lastUpdated')}: {new Date(lastUpdated).toLocaleString()}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SessionPlayerStatistics;
