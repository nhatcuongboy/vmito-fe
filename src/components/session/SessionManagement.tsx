import { Button } from '@/components/ui/chakra-compat';
import { MatchService } from '@/lib/api/match.service';
import { RealTimeService } from '@/lib/api/real-time.service';
import { ISession, Player } from '@/lib/api/types';
import { WaitTimeService } from '@/lib/api/wait-time.service';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { RefreshCw, RotateCcw, Square, Target } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toaster } from '@/components/ui/toaster';

interface SessionManagementProps {
  sessionId: string;
  session: ISession;
  onSessionUpdate?: (session: ISession) => void;
}

interface RealTimeData {
  session: ISession;
  stats: {
    totalPlayers: number;
    confirmedPlayers: number;
    waitingPlayers: number;
    playingPlayers: number;
    activeMatches: number;
    availableCourts: number;
    activeCourts: number;
  };
  waitStats: {
    averageWaitTime: number;
    maxWaitTime: number;
    minWaitTime: number;
  };
  waitingQueue: (Player & { currentWaitTime: number })[];
  activeMatches: {
    matchId: string;
    courtNumber: number;
    duration: number;
    players: { playerId: string; playerNumber: number; name: string }[];
  }[];
  courts: {
    id: string;
    courtNumber: number;
    status: string;
    currentMatch: {
      id: string;
      startTime: Date;
      duration: number;
      playerCount: number;
    } | null;
  }[];
  lastUpdated: string | Date;
}

export default function SessionManagement({
  sessionId,
}: SessionManagementProps) {
  const { getLevelShortLabel } = useLevelLabel();
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(60000); // milliseconds
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<
    'fairness' | 'speed' | 'level_balance'
  >('fairness');

  // Fetch real-time data
  const fetchRealTimeData = useCallback(async () => {
    try {
      if (!loading) setLoading(true);
      const data = await RealTimeService.getSessionStatus(sessionId);
      setRealTimeData(data);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      toaster.error({ title: 'Failed to fetch session status' });
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading]);

  // Auto-refresh effect
  useEffect(() => {
    fetchRealTimeData();
  }, [fetchRealTimeData, sessionId]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRealTimeData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchRealTimeData]);

  // Auto-assign players
  const handleAutoAssign = async () => {
    try {
      setActionLoading('auto-assign');
      await MatchService.autoAssignPlayers(sessionId, {
        strategy: autoAssignStrategy,
        maxPlayersPerCourt: 4,
      });
      // toaster.success({ title: result.message });
      await fetchRealTimeData();
    } catch (error) {
      console.error('Error auto-assigning players:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // End match
  const handleEndMatch = async (matchId: string) => {
    try {
      setActionLoading(`end-match-${matchId}`);
      await MatchService.endMatch(sessionId, matchId);
      await fetchRealTimeData();
    } catch (error) {
      console.error('Error ending match:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Reset wait times for all waiting players
  const handleResetWaitTimes = async () => {
    if (!realTimeData?.waitingQueue?.length) return;

    try {
      setActionLoading('reset-wait-times');
      const playerIds = realTimeData.waitingQueue.map((p) => p.id);
      await WaitTimeService.resetWaitTimes(sessionId, playerIds, 'current');
      // toaster.success({ title: `Reset wait times for ${result.updatedCount} players` });
      await fetchRealTimeData();
    } catch (error) {
      console.error('Error resetting wait times:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !realTimeData) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="green.500" />
        <Text mt={4}>Loading session management...</Text>
      </Box>
    );
  }

  if (!realTimeData) {
    return (
      <Box
        p={6}
        bg="red.50"
        borderRadius="md"
        borderWidth="1px"
        borderColor="red.200"
      >
        <Text color="red.600" fontWeight="bold">
          Error!
        </Text>
        <Text color="red.500">Failed to load session data</Text>
      </Box>
    );
  }

  const { stats, waitStats, waitingQueue, activeMatches, courts } =
    realTimeData;

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Session Management</Heading>
        <Flex gap={2} align="center">
          <Text fontSize="sm" color="gray.500">
            Auto-refresh: {autoRefresh ? `${refreshInterval / 1000}s` : 'Off'}
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            {autoRefresh ? 'Disable' : 'Enable'}
          </Button>
          <Button size="sm" onClick={fetchRealTimeData} loading={loading}>
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            Refresh
          </Button>
        </Flex>
      </Flex>

      {/* Statistics Overview */}
      <Grid
        templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
        gap={6}
        mb={6}
      >
        <Box p={4} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" color="gray.500">
            Total Players
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {stats.totalPlayers}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {stats.confirmedPlayers} confirmed
          </Text>
        </Box>
        <Box p={4} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" color="gray.500">
            Waiting Players
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {stats.waitingPlayers}
          </Text>
          <Text fontSize="sm" color="orange.500">
            Avg: {waitStats.averageWaitTime}min
          </Text>
        </Box>
        <Box p={4} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" color="gray.500">
            Playing Players
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {stats.playingPlayers}
          </Text>
          <Text fontSize="sm" color="green.500">
            {stats.activeMatches} active matches
          </Text>
        </Box>
        <Box p={4} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" color="gray.500">
            Available Courts
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {stats.availableCourts}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {stats.activeCourts} in use
          </Text>
        </Box>
      </Grid>

      {/* Quick Actions */}
      <Box mb={6} p={4} bg="gray.50" borderRadius="md">
        <Heading size="md" mb={4}>
          Quick Actions
        </Heading>
        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
          {/* Auto-assign section */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Auto-assign Strategy
            </Text>
            <select
              value={autoAssignStrategy}
              onChange={(e) =>
                setAutoAssignStrategy(
                  e.target.value as 'fairness' | 'speed' | 'level_balance'
                )
              }
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                borderWidth: '1px',
                borderColor: '#CBD5E0',
                marginBottom: '8px',
              }}
            >
              <option value="fairness">Fairness (longest wait first)</option>
              <option value="speed">Speed (first available)</option>
              <option value="level_balance">Level Balance</option>
            </select>
            <Button
              onClick={handleAutoAssign}
              loading={actionLoading === 'auto-assign'}
              disabled={stats.availableCourts === 0 || stats.waitingPlayers < 4}
              colorPalette="green"
              size="sm"
              width="full"
            >
              <Target size={16} style={{ marginRight: '8px' }} />
              Auto-assign Players
            </Button>
          </Box>

          {/* Reset wait times */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Wait Time Management
            </Text>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Wait times are now calculated automatically
            </Text>
            <Button
              onClick={handleResetWaitTimes}
              loading={actionLoading === 'reset-wait-times'}
              disabled={stats.waitingPlayers === 0}
              variant="outline"
              size="sm"
              width="full"
            >
              <RotateCcw size={16} style={{ marginRight: '8px' }} />
              Reset Wait Times
            </Button>
          </Box>
        </Grid>
      </Box>

      <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
        {/* Waiting Queue */}
        <Box>
          <Heading size="md" mb={4}>
            Waiting Queue ({waitingQueue.length})
          </Heading>
          <Box maxH="400px" overflowY="auto">
            {waitingQueue.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No players waiting
              </Text>
            ) : (
              <Stack gap={2}>
                {waitingQueue.map((player) => (
                  <Box
                    key={player.id}
                    p={3}
                    bg="white"
                    borderRadius="md"
                    borderWidth="1px"
                    borderLeftWidth="4px"
                    borderLeftColor={
                      player.currentWaitTime > 15
                        ? 'red.400'
                        : player.currentWaitTime > 10
                          ? 'orange.400'
                          : 'green.400'
                    }
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">
                          #{player.playerNumber} {player.name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {player.gender} • {getLevelShortLabel(player.level)}
                        </Text>
                      </Box>
                      <Box textAlign="right">
                        <Text fontSize="sm" color="gray.600">
                          {player.currentWaitTime}min
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Box>

        {/* Active Matches */}
        <Box>
          <Heading size="md" mb={4}>
            Active Matches ({activeMatches.length})
          </Heading>
          <Box maxH="400px" overflowY="auto">
            {activeMatches.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No active matches
              </Text>
            ) : (
              <Stack gap={3}>
                {activeMatches.map((match) => (
                  <Box
                    key={match.matchId}
                    p={4}
                    bg="white"
                    borderRadius="md"
                    borderWidth="1px"
                    borderLeftWidth="4px"
                    borderLeftColor="green.400"
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="medium">Court {match.courtNumber}</Text>
                      <Flex gap={2} align="center">
                        <Badge colorPalette="green">{match.duration}min</Badge>
                        <Button
                          size="xs"
                          colorPalette="red"
                          onClick={() => handleEndMatch(match.matchId)}
                          loading={
                            actionLoading === `end-match-${match.matchId}`
                          }
                        >
                          <Square size={12} style={{ marginRight: '4px' }} />
                          End
                        </Button>
                      </Flex>
                    </Flex>
                    <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                      {match.players.map((player) => (
                        <Text key={player.playerId} fontSize="sm">
                          #{player.playerNumber} {player.name}
                        </Text>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Grid>

      {/* Court Status */}
      <Box mt={6}>
        <Heading size="md" mb={4}>
          Court Status
        </Heading>
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          {courts.map((court) => (
            <Box
              key={court.id}
              p={4}
              bg="white"
              borderRadius="md"
              borderWidth="1px"
              borderLeftWidth="4px"
              borderLeftColor={
                court.status === 'IN_USE' ? 'green.400' : 'gray.400'
              }
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="medium">Court {court.courtNumber}</Text>
                <Badge
                  colorPalette={court.status === 'IN_USE' ? 'green' : 'gray'}
                >
                  {court.status === 'IN_USE' ? 'In Use' : 'Available'}
                </Badge>
              </Flex>
              {court.currentMatch && (
                <Text fontSize="sm" color="gray.600">
                  Match duration: {court.currentMatch.duration}min
                </Text>
              )}
            </Box>
          ))}
        </Grid>
      </Box>

      <Box
        mt={4}
        p={2}
        bg="gray.50"
        borderRadius="md"
        fontSize="sm"
        color="gray.500"
      >
        Last updated: {new Date(realTimeData.lastUpdated).toLocaleTimeString()}
      </Box>
    </Box>
  );
}
