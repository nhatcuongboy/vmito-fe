'use client';

import { SessionService } from '@/lib/api/session.service';
import { Player, PlayerStatistics } from '@/lib/api/types';
import {
  Badge,
  Box,
  Center,
  Flex,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Trophy } from 'lucide-react';
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useSortable,
  useFilterable,
} from '@/components/ui/VTable';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';

import React, { useCallback, useEffect, useState } from 'react';
import { PlayerDetailModal } from '../player/PlayerDetailModal';
import { PlayerService } from '@/lib/api/player.service';

interface SessionPlayersProps {
  sessionId: string;
}

/** Sortable + filterable statistics table using VTable */
const StatsTable = ({
  stats,
  filters,
  handleFilter,
  onPlayerClick,
  t,
}: {
  stats: PlayerStatistics[];
  filters: Partial<Record<string, string>>;
  handleFilter: (key: string, value: string) => void;
  onPlayerClick: (id: string) => void;
  t: ReturnType<typeof useTranslations<'SessionPlayers'>>;
}) => {
  const { sortedData, sortConfig, handleSort } =
    useSortable<PlayerStatistics>(stats);

  const sortHandler = (key: string) =>
    handleSort(key as keyof PlayerStatistics);

  const genderFilterOptions = [
    { label: t('allGenders'), value: '' },
    { label: t('male'), value: 'MALE' },
    { label: t('female'), value: 'FEMALE' },
  ];

  return (
    <TableContainer borderRadius="none" borderWidth="0" boxShadow="none">
      <Table>
        <Thead>
          <Tr>
            <Th
              sortKey="playerNumber"
              sortConfig={sortConfig}
              onSort={sortHandler}
              w="60px"
            >
              {t('columnNo')}
            </Th>
            <Th
              sortKey="name"
              sortConfig={sortConfig}
              onSort={sortHandler}
              minW="140px"
            >
              {t('columnName')}
            </Th>
            <Th
              sortKey="gender"
              sortConfig={sortConfig}
              onSort={sortHandler}
              filterKey="gender"
              filterOptions={genderFilterOptions}
              filterValue={filters.gender ?? ''}
              onFilter={handleFilter}
              textAlign="center"
            >
              {t('columnGender')}
            </Th>
            <Th
              sortKey="level"
              sortConfig={sortConfig}
              onSort={sortHandler}
              textAlign="center"
            >
              {t('columnLevel')}
            </Th>
            <Th
              sortKey="totalMatches"
              sortConfig={sortConfig}
              onSort={sortHandler}
              textAlign="center"
            >
              {t('columnTotalMatches')}
            </Th>
            <Th
              sortKey="wins"
              sortConfig={sortConfig}
              onSort={sortHandler}
              textAlign="center"
            >
              {t('columnWins')}
            </Th>
            <Th
              sortKey="losses"
              sortConfig={sortConfig}
              onSort={sortHandler}
              textAlign="center"
            >
              {t('columnLosses')}
            </Th>
            <Th
              sortKey="winRate"
              sortConfig={sortConfig}
              onSort={sortHandler}
              textAlign="center"
            >
              <HStack justify="center" gap={1} as="span" display="inline-flex">
                <Icon as={Trophy} boxSize={3} color="yellow.500" />
                <Text as="span">{t('columnWinRate')}</Text>
              </HStack>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.map((p) => (
            <Tr
              key={p.playerId}
              cursor="pointer"
              onClick={() => onPlayerClick(p.playerId)}
              _hover={{ bg: 'green.50', _dark: { bg: 'green.900/10' } }}
            >
              <Td>
                <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                  {p.playerNumber}
                </Text>
              </Td>
              <Td>
                <Text fontWeight="semibold" fontSize="sm" color="fg">
                  {p.name || t('unnamed')}
                </Text>
              </Td>
              <Td textAlign="center">
                <Text fontSize="sm" color="fg.muted">
                  {p.gender ? t(p.gender.toLowerCase()) : '-'}
                </Text>
              </Td>
              <Td textAlign="center">
                <Text fontSize="sm" color="fg.muted">
                  {p.level || '-'}
                </Text>
              </Td>
              <Td textAlign="center">
                <Text fontSize="sm" fontWeight="semibold">
                  {p.totalMatches}
                </Text>
              </Td>
              <Td textAlign="center">
                <Text fontSize="sm" fontWeight="bold" color="green.600">
                  {p.wins}
                </Text>
              </Td>
              <Td textAlign="center">
                <Text fontSize="sm" fontWeight="bold" color="red.500">
                  {p.losses}
                </Text>
              </Td>
              <Td textAlign="center">
                <Badge
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                  colorPalette={p.winRate >= 50 ? 'green' : 'orange'}
                  variant="subtle"
                >
                  {p.winRate}%
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const SessionPlayers: React.FC<SessionPlayersProps> = ({ sessionId }) => {
  const t = useTranslations('SessionPlayers');
  const [stats, setStats] = useState<PlayerStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Player Detail Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Client-side column filter
  const {
    filteredData: filteredStats,
    filters,
    handleFilter,
  } = useFilterable<PlayerStatistics>(stats);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await SessionService.getPlayerStatistics(sessionId, {});
      setStats(result.playerStats);
      setLastUpdated(result.lastUpdated);
    } catch {
      setError(t('errorLoadingStats'));
    } finally {
      setLoading(false);
    }
  }, [sessionId, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePlayerClick = async (playerId: string) => {
    try {
      setIsDetailLoading(true);
      const fullPlayerData = await PlayerService.getPlayer(playerId);
      setSelectedPlayer(fullPlayerData);
    } catch (err) {
      console.error('Error fetching player details:', err);
      toaster.create({
        title: t('errorLoadingPlayerDetail') || 'Error loading player details',
        type: 'error',
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const formatWaitTime = (waitTimeInMinutes: number) => {
    const hours = Math.floor(waitTimeInMinutes / 60);
    const minutes = waitTimeInMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <VStack gap={0} align="stretch">
      {/* Unified card: toolbar + table */}
      <Box
        bg={{ base: 'white', _dark: 'gray.800' }}
        borderRadius="xl"
        shadow="sm"
        border="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
        overflow="hidden"
      >
        {/* Content: loading / error / empty / data */}
        {loading ? (
          <Center py={12}>
            <Spinner size="xl" color="green.500" />
          </Center>
        ) : error ? (
          <Center py={10}>
            <Text color="red.500">{error}</Text>
          </Center>
        ) : stats.length === 0 ? (
          <Center py={10}>
            <Text color="fg.muted">{t('noDataAvailable')}</Text>
          </Center>
        ) : (
          <>
            {/* Stats table */}
            <StatsTable
              stats={filteredStats}
              filters={filters}
              handleFilter={handleFilter}
              onPlayerClick={handlePlayerClick}
              t={t}
            />
          </>
        )}

        {/* Footer with count + last updated */}
        {!loading && !error && stats.length > 0 && (
          <Flex
            px={4}
            py={2.5}
            borderTop="1px solid"
            borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
            bg={{ base: 'gray.50/60', _dark: 'gray.900/50' }}
            justify="space-between"
            align="center"
          >
            <Text fontSize="xs" color="fg.muted">
              {stats.length === 1
                ? t('playerCountSingular', { count: stats.length })
                : t('playerCount', { count: stats.length })}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {t('lastUpdated')}: {new Date(lastUpdated).toLocaleString()}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          player={selectedPlayer as Player}
          sessionId={sessionId}
          formatWaitTime={formatWaitTime}
        />
      )}

      {/* Loading overlay for fetching detail */}
      {isDetailLoading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="green.500" />
        </Box>
      )}
    </VStack>
  );
};

export default SessionPlayers;
