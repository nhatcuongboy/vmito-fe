import { SessionService } from '@/lib/api/session.service';
import { PlayerStatistics } from '@/lib/api/types';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Table,
  Text,
  VStack,
  chakra,
} from '@chakra-ui/react';
import { Archive, Filter, RotateCcw, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import React, { useCallback, useEffect, useState } from 'react';
import { PlayerDetailModal } from '../player/PlayerDetailModal';
import { PlayerService } from '@/lib/api/player.service';
import { Player } from '@/lib/api/types';

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
  
  // Player Detail Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

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
    { value: 'totalPlayTime', label: t('columnTotalPlayTime') },
    { value: 'totalWaitTime', label: t('columnTotalWaitTime') },
  ];

  const selectStyles = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: 'gray.200',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    outline: 'none',
    _dark: {
      backgroundColor: 'gray.800',
      borderColor: 'gray.600',
    }
  };

  return (
    <VStack gap={6} align="stretch">
      {/* Filter and Sort Controls */}
      <Box
        p={5}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <Flex align="center" mb={4}>
          <Icon as={Filter} boxSize={5} mr={2} color="blue.500" />
          <Heading size="sm" fontWeight="bold">
            {t('filtersAndSorting')}
          </Heading>
        </Flex>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1.5} textTransform="uppercase">
              {t('sortBy')}
            </Text>
            <chakra.select 
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              {...selectStyles}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </chakra.select>
          </Box>

          <Box>
             <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1.5} textTransform="uppercase">
              {t('sortOrder')}
            </Text>
            <chakra.select 
              value={sortOrder}
              onChange={(e: any) => setSortOrder(e.target.value as 'asc' | 'desc')}
              {...selectStyles}
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </chakra.select>
          </Box>

          <Box>
             <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1.5} textTransform="uppercase">
              {t('filterByGender')}
            </Text>
            <chakra.select 
              value={genderFilter}
              onChange={(e: any) => setGenderFilter(e.target.value)}
              {...selectStyles}
            >
              <option value="">{t('allGenders')}</option>
              <option value="MALE">{t('male')}</option>
              <option value="FEMALE">{t('female')}</option>
              <option value="OTHER">{t('other')}</option>
              <option value="PREFER_NOT_TO_SAY">{t('preferNotToSay')}</option>
            </chakra.select>
          </Box>

          <Box display="flex" alignItems="flex-end">
            <Button
              size="sm"
              width="full"
              onClick={() => {
                setSortBy('playerNumber');
                setSortOrder('asc');
                setGenderFilter('');
              }}
              variant="outline"
              colorScheme="gray"
            >
              <Icon as={RotateCcw} mr={2} boxSize={4} />
              {t('resetFilters')}
            </Button>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Stats Table */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
        overflow="hidden"
      >
        {loading ? (
          <Center py={12}>
            <Spinner size="xl" color="blue.500" />
          </Center>
        ) : error ? (
          <Center py={10}>
             <Text color="red.500">{error}</Text>
          </Center>
        ) : stats.length === 0 ? (
          <Center py={10}>
            <Text color="gray.500">{t('noDataAvailable')}</Text>
          </Center>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline" colorScheme="gray">
              <Table.Header bg="gray.50" _dark={{ bg: 'gray.700' }}>
                <Table.Row>
                  <Table.ColumnHeader py={3} ps={4}>{t('columnNo')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3}>{t('columnName')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">{t('columnTotalMatches')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">
                    <HStack justify="center" gap={1}>
                       <Text>{t('columnRegularMatches')}</Text>
                       <Icon as={Archive} boxSize={3} color="gray.400" />
                    </HStack>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">{t('columnExtraMatches')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">{t('columnWins')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">{t('columnLosses')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">
                      <HStack justify="center" gap={1}>
                         <Icon as={Trophy} boxSize={3} color="yellow.500" />
                         <Text>{t('columnWinRate')}</Text>
                      </HStack>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">{t('columnAvgScore')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center">{t('columnTotalPlayTime')}</Table.ColumnHeader>
                  <Table.ColumnHeader py={3} textAlign="center" pe={4}>{t('columnTotalWaitTime')}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {stats.map((p, idx) => (
                  <Table.Row 
                    key={p.playerId} 
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                    transition="background 0.2s"
                  >
                    <Table.Cell py={2.5} ps={4} fontWeight="medium">{p.playerNumber}</Table.Cell>
                    <Table.Cell 
                      py={2.5} 
                      fontWeight="medium" 
                      color="blue.600" 
                      _dark={{ color: 'blue.300' }}
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => handlePlayerClick(p.playerId)}
                    >
                        {p.name || t('unnamed')}
                    </Table.Cell>
                    <Table.Cell py={2.5} textAlign="center">{p.totalMatches}</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center" color="gray.500">{p.regularMatches || 0}</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center" color="gray.500">{p.extraMatches || 0}</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center" color="green.600" fontWeight="bold">{p.wins}</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center" color="red.500">{p.losses}</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center" fontWeight="bold">
                        <Text 
                            as="span" 
                            px={2} 
                            py={0.5} 
                            borderRadius="full" 
                            bg={p.winRate >= 50 ? "green.50" : "orange.50"} 
                            color={p.winRate >= 50 ? "green.700" : "orange.700"}
                            fontSize="xs"
                        >
                            {p.winRate}%
                        </Text>
                    </Table.Cell>
                    <Table.Cell py={2.5} textAlign="center">{p.averageScore}</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center">{p.totalPlayTime || 0}m</Table.Cell>
                    <Table.Cell py={2.5} textAlign="center" pe={4}>{p.totalWaitTime || 0}m</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
        <Box bg="gray.50" _dark={{ bg: 'gray.900' }} p={3} borderTop="1px solid" borderColor="gray.100">
             <Text fontSize="xs" color="gray.500" textAlign="right">
                {t('lastUpdated')}: {new Date(lastUpdated).toLocaleString()}
             </Text>
        </Box>
      </Box>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          player={selectedPlayer as any}
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
          <Spinner size="xl" color="blue.500" />
        </Box>
      )}
    </VStack>
  );
};

export default SessionPlayerStatistics;


