'use client';

import { SessionService } from '@/lib/api/session.service';
import { Player, PlayerStatistics } from '@/lib/api/types';
import {
  Badge,
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Icon,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';

import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useFilterable,
  ISortConfig,
} from '@/components/ui/VTable';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlayerDetailModal } from '../player/PlayerDetailModal';
import { PlayerService } from '@/lib/api/player.service';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import { VButton } from '@/components/ui/VButton';
import { Download } from 'lucide-react';
import { ISession } from '@/lib/api/types';
import QRCode from 'qrcode';

interface SessionPlayersProps {
  sessionId: string;
  session?: ISession;
}

/** Sortable + filterable statistics table using VTable */
const StatsTable = ({
  stats,
  filters: externalFilters,
  onPlayerClick,
  t,
  exportMode = false,
  sortConfig: externalSortConfig = null,
  onSort,
}: {
  stats: PlayerStatistics[];
  filters: Partial<Record<string, string>>;
  handleFilter: (key: string, value: string) => void;
  onPlayerClick: (id: string) => void;
  t: ReturnType<typeof useTranslations<'SessionPlayers'>>;
  exportMode?: boolean;
  sortConfig?: ISortConfig<keyof PlayerStatistics> | null;
  onSort?: (config: ISortConfig<keyof PlayerStatistics> | null) => void;
}) => {
  // Use filterable with the stats passed. If externalFilters is provided, it should be used.
  const { filteredData } = useFilterable<PlayerStatistics>(stats);

  // Manual filtering for exportMode since we want to reuse the logic
  const displayedData = useMemo(() => {
    if (!exportMode) return filteredData;
    return stats.filter((item) =>
      Object.entries(externalFilters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key as keyof PlayerStatistics];
        return String(itemValue) === value;
      })
    );
  }, [stats, filteredData, exportMode, externalFilters]);

  // Sorting
  const [sortConfig, setSortConfig] = useState<ISortConfig<
    keyof PlayerStatistics
  > | null>(externalSortConfig);

  // Sync internal sort state with external if external changes (e.g. for export)
  useEffect(() => {
    setSortConfig(externalSortConfig);
  }, [externalSortConfig]);

  const maxWinRate = useMemo(() => {
    if (displayedData.length === 0) return 0;
    const rates = displayedData
      .filter((p) => p.totalMatches > 0)
      .map((p) => p.winRate);
    return rates.length > 0 ? Math.max(...rates) : 0;
  }, [displayedData]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return displayedData;

    return [...displayedData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [displayedData, sortConfig]);

  const handleSort = useCallback(
    (key: keyof PlayerStatistics) => {
      let newConfig: ISortConfig<keyof PlayerStatistics> | null = null;
      if (sortConfig?.key === key) {
        if (sortConfig.direction === 'asc') {
          newConfig = { key, direction: 'desc' as const };
        } else {
          newConfig = null;
        }
      } else {
        newConfig = { key, direction: 'asc' as const };
      }
      setSortConfig(newConfig);
      if (onSort) onSort(newConfig);
    },
    [sortConfig, onSort]
  );

  const { getLevelShortLabel } = useLevelLabel();

  const sortHandler = (key: string) =>
    handleSort(key as keyof PlayerStatistics);

  // Helper properties to reduce spacing on table cells
  const thProps = exportMode
    ? { px: 1, py: 1, fontSize: 'xs' }
    : { px: { base: 2, md: 3 }, py: 2 };
  const tdProps = exportMode
    ? { px: 1, py: 1, fontSize: 'sm' }
    : { px: { base: 2, md: 3 }, py: 2 };

  return (
    <TableContainer borderRadius="none" borderWidth="0" boxShadow="none">
      <Table>
        <Thead>
          <Tr>
            <Th
              sortKey={exportMode ? undefined : 'playerNumber'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              w={exportMode ? '40px' : '60px'}
              textAlign="center"
              {...thProps}
            >
              {t('columnNo')}
            </Th>
            <Th
              sortKey={exportMode ? undefined : 'name'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              minW="120px"
              {...thProps}
            >
              {t('columnName')}
            </Th>
            <Th
              sortKey={exportMode ? undefined : 'gender'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              textAlign="center"
              {...thProps}
            >
              {t('columnGender')}
            </Th>
            {!exportMode && (
              <Th
                sortKey="level"
                sortConfig={sortConfig}
                onSort={sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnLevel')}
              </Th>
            )}
            <Th
              sortKey={exportMode ? undefined : 'totalMatches'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              textAlign="center"
              {...thProps}
            >
              {t('columnTotalMatches')}
            </Th>
            <Th
              sortKey={exportMode ? undefined : 'wins'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              textAlign="center"
              {...thProps}
            >
              {t('columnWins')}
            </Th>
            <Th
              sortKey={exportMode ? undefined : 'losses'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              textAlign="center"
              {...thProps}
            >
              {t('columnLosses')}
            </Th>
            <Th
              sortKey={exportMode ? undefined : 'winRate'}
              sortConfig={exportMode ? undefined : sortConfig}
              onSort={exportMode ? undefined : sortHandler}
              textAlign="center"
              {...thProps}
            >
              <HStack justify="center" gap={1} as="span" display="inline-flex">
                <Text as="span">{t('columnWinRate')}</Text>
              </HStack>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.map((p, index) => {
            const isNA = p.wins === 0 && p.losses === 0;
            return (
              <Tr
                key={p.playerId}
                cursor={exportMode ? 'default' : 'pointer'}
                onClick={
                  exportMode ? undefined : () => onPlayerClick(p.playerId)
                }
                _hover={
                  exportMode
                    ? {}
                    : { bg: 'green.50', _dark: { bg: 'green.900/10' } }
                }
              >
                <Td textAlign="center" {...tdProps}>
                  <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                    {index + 1}
                  </Text>
                </Td>
                <Td {...tdProps}>
                  <HStack gap={1.5} align="center">
                    <Text fontWeight="semibold" fontSize="sm" color="fg">
                      {p.name || t('unnamed')}
                    </Text>
                    {p.totalMatches > 0 &&
                      p.winRate > 0 &&
                      p.winRate === maxWinRate && (
                        <Badge
                          colorPalette="yellow"
                          variant="solid"
                          size="xs"
                          fontSize="9px"
                          px={1}
                          borderRadius="sm"
                          whiteSpace="nowrap"
                        >
                          MVP
                        </Badge>
                      )}
                  </HStack>
                </Td>
                <Td textAlign="center" {...tdProps}>
                  {p.gender ? (
                    <Badge
                      colorPalette={p.gender === 'MALE' ? 'blue' : 'pink'}
                      variant="subtle"
                      size="sm"
                      px={2}
                      borderRadius="md"
                    >
                      {t(p.gender.toLowerCase())}
                    </Badge>
                  ) : (
                    <Text fontSize="sm" color="fg.muted">
                      {t('N/A')}
                    </Text>
                  )}
                </Td>
                {!exportMode && (
                  <Td textAlign="center" {...tdProps}>
                    <Text fontSize="sm" color="fg.muted">
                      {p.level ? getLevelShortLabel(p.level) : t('N/A')}
                    </Text>
                  </Td>
                )}
                <Td textAlign="center" {...tdProps}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {p.totalMatches}
                  </Text>
                </Td>
                <Td textAlign="center" {...tdProps}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={isNA ? 'fg.muted' : 'green.600'}
                  >
                    {isNA ? 'N/A' : p.wins}
                  </Text>
                </Td>
                <Td textAlign="center" {...tdProps}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={isNA ? 'fg.muted' : 'red.500'}
                  >
                    {isNA ? 'N/A' : p.losses}
                  </Text>
                </Td>
                <Td textAlign="center" {...tdProps}>
                  <Badge
                    px={2.5}
                    py={0.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    colorPalette={
                      isNA ? 'gray' : p.winRate >= 50 ? 'green' : 'orange'
                    }
                    variant="subtle"
                  >
                    {isNA ? 'N/A' : `${p.winRate}%`}
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const SessionPlayers: React.FC<SessionPlayersProps> = ({
  sessionId,
  session,
}) => {
  const t = useTranslations('SessionPlayers');
  const [stats, setStats] = useState<PlayerStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  // Player Detail Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Client-side column filter
  const {
    filteredData: filteredStats,
    filters,
    handleFilter,
  } = useFilterable<PlayerStatistics>(stats);

  // Sorting state moved to parent
  const [sortConfig, setSortConfig] = useState<ISortConfig<
    keyof PlayerStatistics
  > | null>(null);

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

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && session?.id) {
      const currentLocale = window.location.pathname.split('/')[1] || 'vi';
      QRCode.toDataURL(
        `${window.location.origin}/${currentLocale}/sessions/${session.id}`,
        {
          margin: 0,
          width: 48,
          color: {
            dark: '#179a3b', // green.600
            light: '#FFFFFF',
          },
        }
      )
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [session?.id]);

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

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Small timeout to ensure the DOM is ready if needed, though html-to-image usually waits.
    setTimeout(() => {
      downloadSessionImage(
        session || ({ id: sessionId } as ISession),
        'session-stats-export-area',
        'ThongKeTranDau'
      );
    }, 100);
  };

  return (
    <VStack gap={0} align="stretch" position="relative">
      {/* Hidden container specifically for exporting the image */}
      <Box position="absolute" left="-9999px" top="-9999px">
        <Box
          id="session-stats-export-area"
          w="700px"
          bg="white"
          _dark={{ bg: 'gray.800' }}
          pt={3}
          px={8}
          pb={2}
        >
          <VStack align="stretch" gap={2}>
            <Box borderBottom="2px solid" borderColor="green.100" pb={2}>
              <VStack align="center" gap={1.5}>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color="green.600"
                  textAlign="center"
                >
                  {session?.name || 'Chi tiết phiên giao lưu'}
                </Text>

                <HStack
                  gap={6}
                  color="fg.muted"
                  fontSize="md"
                  justify="center"
                  whiteSpace="nowrap"
                >
                  {session?.startTime && (
                    <Text textAlign="center">
                      🕒{' '}
                      {new Date(session.startTime).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                      {'-'}
                      {new Date(
                        new Date(session.startTime).getTime() +
                          (session.sessionDuration || 120) * 60 * 1000
                      ).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                      {', '}
                      {new Date(session.startTime).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                  {session?.location && (
                    <Text textAlign="center">
                      📍{' '}
                      {session?.venue?.name || session.location.split(',')[0]}
                    </Text>
                  )}
                </HStack>
              </VStack>
            </Box>

            <Box>
              <Heading
                size="sm"
                textAlign="center"
                mb={1}
                color="green.700"
                fontWeight="bold"
              >
                📊 THỐNG KÊ NGƯỜI CHƠI
              </Heading>

              <Box
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
                overflow="hidden"
              >
                <StatsTable
                  stats={filteredStats}
                  filters={filters}
                  handleFilter={() => {}}
                  onPlayerClick={() => {}}
                  t={t}
                  exportMode={true}
                  sortConfig={sortConfig}
                />
              </Box>
            </Box>

            <Flex justify="flex-end" align="center" pt={2} pb={0} w="full">
              <HStack gap={3} align="center">
                <HStack gap={2.5} align="center">
                  <VStack align="flex-end" gap={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="green.600"
                      lineHeight="1"
                    >
                      Vmito App
                    </Text>
                    <Text
                      fontSize="9px"
                      color="fg.muted"
                      fontWeight="medium"
                      lineHeight="1"
                      mt="1px"
                    >
                      Nền tảng quản lý giao lưu cầu lông
                    </Text>
                  </VStack>
                  <Box w="1.2px" h="18px" bg="green.100" />
                  {qrCodeUrl && (
                    <Box borderRadius="none" overflow="hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        width={36}
                        height={36}
                        style={{ display: 'block' }}
                      />
                    </Box>
                  )}
                </HStack>
              </HStack>
            </Flex>
          </VStack>
        </Box>
      </Box>

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
              sortConfig={sortConfig}
              onSort={setSortConfig}
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
            <Flex
              gap={{ base: 2, md: 4 }}
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'flex-start', md: 'center' }}
            >
              <Text fontSize="xs" color="fg.muted">
                {stats.length === 1
                  ? t('playerCountSingular', { count: stats.length })
                  : t('playerCount', { count: stats.length })}
              </Text>
              <Text
                fontSize="xs"
                color="fg.muted"
                display={{ base: 'none', md: 'block' }}
              >
                &bull;
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {t('lastUpdated')}: {new Date(lastUpdated).toLocaleString()}
              </Text>
            </Flex>
            <VButton
              size="xs"
              variant="outline"
              colorPalette="green"
              onClick={handleExport}
              loading={isDownloading}
            >
              <Icon as={Download} boxSize={3} mr={1} />
              {t('exportImage') || 'Xuất ảnh'}
            </VButton>
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
