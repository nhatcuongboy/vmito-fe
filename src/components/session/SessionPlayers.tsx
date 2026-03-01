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
  NativeSelectField,
  NativeSelectRoot,
  SimpleGrid,
  Spinner,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  ArrowDownAZ,
  ArrowUpDown,
  ChevronRight,
  RotateCcw,
  Trophy,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';

import React, { useCallback, useEffect, useState } from 'react';
import { PlayerDetailModal } from '../player/PlayerDetailModal';
import { PlayerService } from '@/lib/api/player.service';

interface SessionPlayersProps {
  sessionId: string;
}

/** Compact stat pill for mobile cards */
const StatPill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <Box textAlign="center" flex={1}>
    <Text fontSize="2xs" color="fg.muted" fontWeight="medium">
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="bold" color={color}>
      {value}
    </Text>
  </Box>
);

const SessionPlayers: React.FC<SessionPlayersProps> = ({ sessionId }) => {
  const t = useTranslations('SessionPlayers');
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

  const isFiltered =
    sortBy !== 'playerNumber' || sortOrder !== 'asc' || genderFilter !== '';

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
    } catch {
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

  const handleReset = () => {
    setSortBy('playerNumber');
    setSortOrder('asc');
    setGenderFilter('');
  };

  const sortOptions = [
    { value: 'playerNumber', label: t('columnNo') },
    { value: 'name', label: t('columnName') },
    { value: 'gender', label: t('columnGender') },
    { value: 'level', label: t('columnLevel') },
    { value: 'totalMatches', label: t('columnTotalMatches') },
    { value: 'wins', label: t('columnWins') },
    { value: 'losses', label: t('columnLosses') },
    { value: 'winRate', label: t('columnWinRate') },
  ];

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
        {/* Compact filter toolbar */}
        <Flex
          px={4}
          py={3}
          gap={3}
          align="center"
          flexWrap="wrap"
          borderBottom="1px solid"
          borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
          bg={{ base: 'gray.50/60', _dark: 'gray.800' }}
        >
          <Icon as={ArrowUpDown} boxSize={4} color="fg.muted" flexShrink={0} />

          <NativeSelectRoot size="sm" maxW="160px" flex="1 1 120px">
            <NativeSelectField
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value)
              }
              aria-label={t('sortBy')}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>

          <NativeSelectRoot size="sm" maxW="130px" flex="1 1 100px">
            <NativeSelectField
              value={sortOrder}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortOrder(e.target.value as 'asc' | 'desc')
              }
              aria-label={t('sortOrder')}
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </NativeSelectField>
          </NativeSelectRoot>

          <Box
            w="1px"
            h="20px"
            bg={{ base: 'gray.200', _dark: 'gray.600' }}
            flexShrink={0}
            hideBelow="sm"
          />

          <HStack gap={1} flexShrink={0}>
            <Icon as={Users} boxSize={3.5} color="fg.muted" hideBelow="sm" />
          </HStack>

          <NativeSelectRoot size="sm" maxW="160px" flex="1 1 120px">
            <NativeSelectField
              value={genderFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setGenderFilter(e.target.value)
              }
              aria-label={t('filterByGender')}
            >
              <option value="">{t('allGenders')}</option>
              <option value="MALE">{t('male')}</option>
              <option value="FEMALE">{t('female')}</option>
              <option value="OTHER">{t('other')}</option>
              <option value="PREFER_NOT_TO_SAY">{t('preferNotToSay')}</option>
            </NativeSelectField>
          </NativeSelectRoot>

          {isFiltered && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="gray"
              onClick={handleReset}
              flexShrink={0}
              aria-label={t('resetFilters')}
            >
              <RotateCcw size={14} />
            </Button>
          )}

          {/* Last updated - right aligned */}
          <Text fontSize="2xs" color="fg.muted" ml="auto" whiteSpace="nowrap">
            {lastUpdated && new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        </Flex>

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
            {/* Desktop table view */}
            <Box overflowX="auto" hideBelow="md">
              <Table.Root size="sm" variant="outline" colorPalette="gray">
                <Table.Header
                  bg="gray.50"
                  _dark={{ bg: 'gray.700' }}
                  position="sticky"
                  top={0}
                  zIndex={1}
                >
                  <Table.Row>
                    <Table.ColumnHeader
                      py={3}
                      ps={4}
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      w="60px"
                    >
                      {t('columnNo')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      minW="120px"
                    >
                      {t('columnName')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('columnGender')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('columnLevel')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('columnTotalMatches')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('columnWins')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('columnLosses')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={3}
                      pe={4}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      <HStack justify="center" gap={1}>
                        <Icon as={Trophy} boxSize={3} color="yellow.500" />
                        <Text>{t('columnWinRate')}</Text>
                      </HStack>
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {stats.map((p, idx) => (
                    <Table.Row
                      key={p.playerId}
                      bg={
                        idx % 2 === 1
                          ? { base: 'gray.50/50', _dark: 'gray.800' }
                          : undefined
                      }
                      _hover={{
                        bg: 'green.50/50',
                        _dark: { bg: 'green.900/10' },
                      }}
                      transition="background 0.15s"
                      cursor="pointer"
                      onClick={() => handlePlayerClick(p.playerId)}
                    >
                      <Table.Cell py={3} ps={4}>
                        <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                          {p.playerNumber}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3}>
                        <HStack gap={2}>
                          <Box
                            w="28px"
                            h="28px"
                            borderRadius="full"
                            bg="green.100"
                            _dark={{ bg: 'green.900/40' }}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              color="green.700"
                              _dark={{ color: 'green.300' }}
                            >
                              {(p.name || '?')[0].toUpperCase()}
                            </Text>
                          </Box>
                          <Text
                            fontWeight="semibold"
                            fontSize="sm"
                            color="fg"
                            _hover={{ color: 'green.600' }}
                          >
                            {p.name || t('unnamed')}
                          </Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="center">
                        <Text fontSize="sm" color="fg.muted">
                          {p.gender ? t(p.gender.toLowerCase()) : '-'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="center">
                        <Text fontSize="sm" color="fg.muted">
                          {p.level || '-'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="center">
                        <Text fontSize="sm" fontWeight="semibold">
                          {p.totalMatches}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                          {p.wins}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" color="red.500">
                          {p.losses}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} pe={4} textAlign="center">
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
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Mobile card view */}
            <Box hideFrom="md" px={3} py={2}>
              <VStack gap={2} align="stretch">
                {stats.map((p) => (
                  <Box
                    key={p.playerId}
                    p={3}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
                    bg={{ base: 'white', _dark: 'gray.800' }}
                    _hover={{
                      borderColor: 'green.200',
                      _dark: { borderColor: 'green.700' },
                    }}
                    _active={{
                      bg: { base: 'gray.50', _dark: 'gray.700' },
                      borderColor: 'green.300',
                    }}
                    transition="border-color 0.15s, background 0.15s"
                    cursor="pointer"
                    onClick={() => handlePlayerClick(p.playerId)}
                  >
                    <Flex justify="space-between" align="center" mb={2.5}>
                      <HStack gap={2.5}>
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          bg="green.100"
                          _dark={{ bg: 'green.900/40' }}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="green.700"
                            _dark={{ color: 'green.300' }}
                          >
                            {(p.name || '?')[0].toUpperCase()}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" color="fg">
                            {p.name || t('unnamed')}
                          </Text>
                          <HStack gap={1.5}>
                            <Text fontSize="2xs" color="fg.muted">
                              #{p.playerNumber}
                            </Text>
                            {p.gender && (
                              <Text fontSize="2xs" color="fg.muted">
                                · {t(p.gender.toLowerCase())}
                              </Text>
                            )}
                            {p.level && (
                              <Text fontSize="2xs" color="fg.muted">
                                · {p.level}
                              </Text>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                      <HStack gap={2}>
                        <Badge
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="bold"
                          colorPalette={
                            p.totalMatches === 0
                              ? 'gray'
                              : p.winRate >= 50
                                ? 'green'
                                : 'orange'
                          }
                          variant="subtle"
                        >
                          {p.winRate}%
                        </Badge>
                        <Icon as={ChevronRight} boxSize={4} color="fg.muted" />
                      </HStack>
                    </Flex>

                    <Flex
                      gap={0}
                      bg={{ base: 'gray.50', _dark: 'gray.700/50' }}
                      borderRadius="md"
                      py={2}
                      px={1}
                    >
                      <StatPill
                        label={t('columnTotalMatches')}
                        value={p.totalMatches}
                      />
                      <Box
                        w="1px"
                        bg={{ base: 'gray.200', _dark: 'gray.600' }}
                        my={1}
                      />
                      <StatPill
                        label={t('columnWins')}
                        value={p.wins}
                        color="green.600"
                      />
                      <Box
                        w="1px"
                        bg={{ base: 'gray.200', _dark: 'gray.600' }}
                        my={1}
                      />
                      <StatPill
                        label={t('columnLosses')}
                        value={p.losses}
                        color="red.500"
                      />
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
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
