'use client';

import { SessionService } from '@/lib/api/session.service';
import { Player, PlayerStatistics } from '@/lib/api/types';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
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

import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { VButton } from '@/components/ui/VButton';
import { VSwitch } from '@/components/ui/VSwitch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Columns3, Download } from 'lucide-react';
import { ISession } from '@/lib/api/types';
import { getLevelRank } from '@/constants/levels';
import QRCode from 'qrcode';

interface SessionPlayersProps {
  sessionId: string;
  session?: ISession;
}

type MvpGroup = {
  players: PlayerStatistics[];
  minMatches: number;
};

type MvpGroups = {
  overall: MvpGroup;
  male: MvpGroup;
  female: MvpGroup;
};

type StatsColumnKey =
  | 'no'
  | 'name'
  | 'gender'
  | 'level'
  | 'totalMatches'
  | 'wins'
  | 'losses'
  | 'winRate'
  | 'shuttlecock';

const ALL_STATS_COLUMNS: StatsColumnKey[] = [
  'no',
  'name',
  'gender',
  'level',
  'totalMatches',
  'wins',
  'losses',
  'winRate',
  'shuttlecock',
];

const DEFAULT_EXPORT_COLUMNS: StatsColumnKey[] = [
  'no',
  'name',
  'gender',
  'totalMatches',
  'wins',
  'losses',
  'winRate',
];

const getMvpMinMatches = (players: PlayerStatistics[]) => {
  const maxMatches = players.reduce(
    (max, player) => Math.max(max, player.totalMatches),
    0
  );

  if (maxMatches <= 0) return 1;

  return Math.max(1, Math.min(3, Math.ceil(maxMatches * 0.5)));
};

const comparePlayerRanking = (a: PlayerStatistics, b: PlayerStatistics) => {
  if (b.winRate !== a.winRate) return b.winRate - a.winRate;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.totalMatches !== a.totalMatches) {
    return b.totalMatches - a.totalMatches;
  }
  return (a.name || '').localeCompare(b.name || '');
};

const getMvpGroup = (
  players: PlayerStatistics[],
  gender?: PlayerStatistics['gender']
): MvpGroup => {
  const minMatches = getMvpMinMatches(players);
  const eligiblePlayers = players.filter(
    (player) =>
      player.totalMatches >= minMatches &&
      player.wins > 0 &&
      player.winRate > 0 &&
      (!gender || player.gender === gender)
  );

  if (eligiblePlayers.length === 0) {
    return { players: [], minMatches };
  }

  const sorted = [...eligiblePlayers].sort(comparePlayerRanking);

  const leader = sorted[0];
  const tiedPlayers = sorted.filter(
    (player) =>
      player.winRate === leader.winRate &&
      player.wins === leader.wins &&
      player.totalMatches === leader.totalMatches
  );

  return { players: tiedPlayers, minMatches };
};

const getMvpGroups = (players: PlayerStatistics[]): MvpGroups => ({
  overall: getMvpGroup(players),
  male: getMvpGroup(players, 'MALE'),
  female: getMvpGroup(players, 'FEMALE'),
});

/** Sortable + filterable statistics table using VTable */
const StatsTable = ({
  stats,
  filters: externalFilters,
  onPlayerClick,
  t,
  exportMode = false,
  showGenderMvp = false,
  visibleColumns,
  sortConfig: externalSortConfig = null,
  onSort,
}: {
  stats: PlayerStatistics[];
  filters: Partial<Record<string, string>>;
  handleFilter: (key: string, value: string) => void;
  onPlayerClick: (id: string) => void;
  t: ReturnType<typeof useTranslations<'SessionPlayers'>>;
  exportMode?: boolean;
  showGenderMvp?: boolean;
  visibleColumns?: StatsColumnKey[];
  sortConfig?: ISortConfig<keyof PlayerStatistics> | null;
  onSort?: (config: ISortConfig<keyof PlayerStatistics> | null) => void;
}) => {
  const { getLevelShortLabel } = useLevelLabel();
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

  const mvpGroups = useMemo(() => getMvpGroups(displayedData), [displayedData]);

  const overallMvpIds = useMemo(
    () => new Set(mvpGroups.overall.players.map((player) => player.playerId)),
    [mvpGroups.overall.players]
  );
  const maleMvpIds = useMemo(
    () =>
      showGenderMvp
        ? new Set(mvpGroups.male.players.map((player) => player.playerId))
        : new Set<string>(),
    [mvpGroups.male.players, showGenderMvp]
  );
  const femaleMvpIds = useMemo(
    () =>
      showGenderMvp
        ? new Set(mvpGroups.female.players.map((player) => player.playerId))
        : new Set<string>(),
    [mvpGroups.female.players, showGenderMvp]
  );

  const isSharedOverallMvp = mvpGroups.overall.players.length > 1;
  const isSharedMaleMvp = mvpGroups.male.players.length > 1;
  const isSharedFemaleMvp = mvpGroups.female.players.length > 1;

  const [sortConfig, setSortConfig] = useState<ISortConfig<
    keyof PlayerStatistics
  > | null>(externalSortConfig);

  // Sync internal sort state with external if external changes (e.g. for export)
  useEffect(() => {
    setSortConfig(externalSortConfig);
  }, [externalSortConfig]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return [...displayedData].sort(comparePlayerRanking);

    return [...displayedData].sort((a, b) => {
      // Level IDs are stable identifiers, not skill order (e.g. Yếu- = 9 but
      // ranks below TB- = 3), so sort by their canonical rank instead.
      if (sortConfig.key === 'level') {
        const aVal = a.level;
        const bVal = b.level;

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const aRank = getLevelRank(Number(aVal)) ?? Number.MAX_SAFE_INTEGER;
        const bRank = getLevelRank(Number(bVal)) ?? Number.MAX_SAFE_INTEGER;
        return sortConfig.direction === 'asc' ? aRank - bRank : bRank - aRank;
      }

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

  const sortHandler = (key: string) =>
    handleSort(key as keyof PlayerStatistics);

  const visibleColumnSet = useMemo(
    () => new Set(visibleColumns || ALL_STATS_COLUMNS),
    [visibleColumns]
  );

  // Helper properties to reduce spacing on table cells
  const thProps = exportMode
    ? { px: 1, py: 1, fontSize: 'xs' }
    : { px: { base: 2, md: 3 }, py: 2 };
  const tdProps = exportMode
    ? { px: 1, py: 1, fontSize: 'sm' }
    : { px: { base: 2, md: 3 }, py: 2 };

  return (
    <TableContainer
      borderRadius="none"
      borderWidth="0"
      boxShadow="none"
      // overflowX="auto" (the default) forces overflow-y to a scrollable
      // "auto" too per the CSS spec, which WebKit renders as a scrollbar
      // baked into the exported PNG even with nothing to actually scroll.
      // Export mode never needs horizontal scroll either (fixed 700px
      // off-screen canvas), so go fully visible on both axes there.
      overflowX={exportMode ? 'visible' : 'auto'}
    >
      <Table>
        <Thead>
          <Tr>
            {visibleColumnSet.has('no') && (
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
            )}
            {visibleColumnSet.has('name') && (
              <Th
                sortKey={exportMode ? undefined : 'name'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                minW={exportMode ? '120px' : { base: '144px', md: '120px' }}
                {...thProps}
              >
                {t('columnName')}
              </Th>
            )}
            {visibleColumnSet.has('gender') && (
              <Th
                sortKey={exportMode ? undefined : 'gender'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnGender')}
              </Th>
            )}
            {visibleColumnSet.has('level') && (
              <Th
                sortKey={exportMode ? undefined : 'level'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnLevel')}
              </Th>
            )}
            {visibleColumnSet.has('totalMatches') && (
              <Th
                sortKey={exportMode ? undefined : 'totalMatches'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnTotalMatches')}
              </Th>
            )}
            {visibleColumnSet.has('wins') && (
              <Th
                sortKey={exportMode ? undefined : 'wins'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnWins')}
              </Th>
            )}
            {visibleColumnSet.has('losses') && (
              <Th
                sortKey={exportMode ? undefined : 'losses'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnLosses')}
              </Th>
            )}
            {visibleColumnSet.has('winRate') && (
              <Th
                sortKey={exportMode ? undefined : 'winRate'}
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                <HStack
                  justify="center"
                  gap={1}
                  as="span"
                  display="inline-flex"
                >
                  <Text as="span">{t('columnWinRate')}</Text>
                </HStack>
              </Th>
            )}
            {visibleColumnSet.has('shuttlecock') && (
              <Th
                sortKey="totalShuttlecocks"
                sortConfig={exportMode ? undefined : sortConfig}
                onSort={exportMode ? undefined : sortHandler}
                textAlign="center"
                {...thProps}
              >
                {t('columnShuttlecock')}
              </Th>
            )}
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.map((p, index) => {
            const isNA = p.wins === 0 && p.losses === 0;
            const isOverallMvp =
              !showGenderMvp && overallMvpIds.has(p.playerId);
            const isMaleMvp = maleMvpIds.has(p.playerId);
            const isFemaleMvp = femaleMvpIds.has(p.playerId);

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
                {visibleColumnSet.has('no') && (
                  <Td textAlign="center" {...tdProps}>
                    <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                      {index + 1}
                    </Text>
                  </Td>
                )}
                {visibleColumnSet.has('name') && (
                  <Td {...tdProps}>
                    <HStack gap={1.5} align="center" wrap="wrap">
                      <Text fontWeight="semibold" fontSize="sm" color="fg">
                        {p.name || t('unnamed')}
                      </Text>
                      {isOverallMvp && (
                        <Badge
                          colorPalette="yellow"
                          variant="solid"
                          size="xs"
                          fontSize="9px"
                          px={1}
                          borderRadius="sm"
                          whiteSpace="nowrap"
                        >
                          {isSharedOverallMvp ? t('sharedMvp') : t('mvp')}
                        </Badge>
                      )}
                      {isMaleMvp && (
                        <Badge
                          colorPalette="blue"
                          variant="subtle"
                          size="xs"
                          fontSize="9px"
                          px={1}
                          borderRadius="sm"
                          whiteSpace="nowrap"
                        >
                          {isSharedMaleMvp ? t('sharedMaleMvp') : t('maleMvp')}
                        </Badge>
                      )}
                      {isFemaleMvp && (
                        <Badge
                          colorPalette="pink"
                          variant="subtle"
                          size="xs"
                          fontSize="9px"
                          px={1}
                          borderRadius="sm"
                          whiteSpace="nowrap"
                        >
                          {isSharedFemaleMvp
                            ? t('sharedFemaleMvp')
                            : t('femaleMvp')}
                        </Badge>
                      )}
                    </HStack>
                  </Td>
                )}
                {visibleColumnSet.has('gender') && (
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
                        {'—'}
                      </Text>
                    )}
                  </Td>
                )}
                {visibleColumnSet.has('level') && (
                  <Td textAlign="center" {...tdProps}>
                    {p.level ? (
                      <Badge
                        colorPalette="purple"
                        variant="subtle"
                        size="sm"
                        px={2}
                        borderRadius="md"
                        whiteSpace="nowrap"
                      >
                        {getLevelShortLabel(p.level)}
                      </Badge>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        {'—'}
                      </Text>
                    )}
                  </Td>
                )}
                {visibleColumnSet.has('totalMatches') && (
                  <Td textAlign="center" {...tdProps}>
                    <Text fontSize="sm" fontWeight="semibold">
                      {p.totalMatches}
                    </Text>
                  </Td>
                )}
                {visibleColumnSet.has('wins') && (
                  <Td textAlign="center" {...tdProps}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={isNA ? 'fg.muted' : 'green.600'}
                    >
                      {isNA ? '—' : p.wins}
                    </Text>
                  </Td>
                )}
                {visibleColumnSet.has('losses') && (
                  <Td textAlign="center" {...tdProps}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={isNA ? 'fg.muted' : 'red.500'}
                    >
                      {isNA ? '—' : p.losses}
                    </Text>
                  </Td>
                )}
                {visibleColumnSet.has('winRate') && (
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
                      {isNA ? '—' : `${p.winRate}%`}
                    </Badge>
                  </Td>
                )}
                {visibleColumnSet.has('shuttlecock') && (
                  <Td textAlign="center" {...tdProps}>
                    <Text fontSize="sm" fontWeight="semibold">
                      {p.totalShuttlecocks != null ? p.totalShuttlecocks : '—'}
                    </Text>
                  </Td>
                )}
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
  const sessionDetailT = useTranslations('SessionDetail');
  const [stats, setStats] = useState<PlayerStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [showGenderMvp, setShowGenderMvp] = useState(false);
  const [exportColumns, setExportColumns] = useState<StatsColumnKey[]>(
    DEFAULT_EXPORT_COLUMNS
  );

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await SessionService.getPlayerStatistics(sessionId, {});
      setStats(result.playerStats);
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
      return sessionDetailT('waitTimeBadgeHoursMinutes', {
        hours,
        minutes,
      });
    }
    return sessionDetailT('waitTimeBadgeMinutes', { minutes });
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadSessionImage(
      session || ({ id: sessionId } as ISession),
      'session-stats-export-area',
      'ThongKeTranDau'
    );
  };

  const getColumnLabel = (column: StatsColumnKey) => {
    const labelMap: Record<StatsColumnKey, string> = {
      no: t('columnNo'),
      name: t('columnName'),
      gender: t('columnGender'),
      level: t('columnLevel'),
      totalMatches: t('columnTotalMatches'),
      wins: t('columnWins'),
      losses: t('columnLosses'),
      winRate: t('columnWinRate'),
      shuttlecock: t('columnShuttlecock'),
    };

    return labelMap[column];
  };

  const toggleExportColumn = (column: StatsColumnKey) => {
    setExportColumns((current) => {
      if (current.includes(column)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== column);
      }

      return ALL_STATS_COLUMNS.filter(
        (candidate) => current.includes(candidate) || candidate === column
      );
    });
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
          pb={5}
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
                      {formatTimeRangeByDevicePreference(
                        session.startTime,
                        new Date(
                          new Date(session.startTime).getTime() +
                            (session.sessionDuration || 120) * 60 * 1000
                        )
                      )}
                      {', '}
                      {new Date(session.startTime).toLocaleDateString('vi-VN', {
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
                pb={2}
              >
                <StatsTable
                  stats={filteredStats}
                  filters={filters}
                  handleFilter={() => {}}
                  onPlayerClick={() => {}}
                  t={t}
                  exportMode={true}
                  showGenderMvp={showGenderMvp}
                  visibleColumns={exportColumns}
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

      {!loading && !error && stats.length > 0 && (
        <Flex justify="flex-end" align="center" mb={2}>
          <HStack gap={2}>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
              {t('showGenderMvp')}
            </Text>
            <VSwitch
              checked={showGenderMvp}
              onCheckedChange={(details) => setShowGenderMvp(!!details.checked)}
              colorPalette="green"
              size="sm"
              aria-label={t('showGenderMvp')}
            />
          </HStack>
        </Flex>
      )}

      {/* Unified card: table */}
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
          <StatsTable
            stats={filteredStats}
            filters={filters}
            handleFilter={handleFilter}
            onPlayerClick={handlePlayerClick}
            t={t}
            showGenderMvp={showGenderMvp}
            sortConfig={sortConfig}
            onSort={setSortConfig}
          />
        )}

        {/* Footer with count + export action */}
        {!loading && !error && stats.length > 0 && (
          <Flex
            px={4}
            py={2.5}
            borderTop="1px solid"
            borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
            bg={{ base: 'gray.50/60', _dark: 'gray.900/50' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
            direction={{ base: 'column', md: 'row' }}
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
            </Flex>
            <HStack gap={2} justify={{ base: 'space-between', md: 'flex-end' }}>
              <PopoverRoot positioning={{ placement: 'top-end' }}>
                <PopoverTrigger asChild>
                  <VButton
                    size="xs"
                    variant="outline"
                    colorPalette="gray"
                    aria-label={t('exportColumns')}
                  >
                    <Icon as={Columns3} boxSize={3} mr={1} />
                    {t('exportColumns')}
                  </VButton>
                </PopoverTrigger>
                <PopoverContent w="240px">
                  <PopoverBody p={3}>
                    <VStack align="stretch" gap={2}>
                      <Text fontSize="xs" color="fg.muted">
                        {t('exportColumnsDescription')}
                      </Text>
                      {ALL_STATS_COLUMNS.map((column) => (
                        <Checkbox
                          key={column}
                          checked={exportColumns.includes(column)}
                          onCheckedChange={() => toggleExportColumn(column)}
                          colorPalette="green"
                          size="sm"
                        >
                          {getColumnLabel(column)}
                        </Checkbox>
                      ))}
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </PopoverRoot>
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
            </HStack>
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
