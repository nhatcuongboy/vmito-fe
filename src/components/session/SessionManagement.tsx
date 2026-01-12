import { Button } from '@/components/ui/chakra-compat';
import { MatchService } from '@/lib/api/match.service';
import { RealTimeService } from '@/lib/api/real-time.service';
import { ISession } from '@/lib/api/types';
import { WaitTimeService } from '@/lib/api/wait-time.service';
import { getLevelLabel } from '@/utils/level-mapping';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Clock, RefreshCw, RotateCcw, Square, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toaster } from '@/components/ui/toaster';

interface SessionManagementProps {
  sessionId: string;
  session: ISession;
  onSessionUpdate?: (session: ISession) => void;
}

export default function SessionManagement({
  sessionId,
  session,
  onSessionUpdate,
}: SessionManagementProps) {
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60000); // milliseconds
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<
    'fairness' | 'speed' | 'level_balance'
  >('fairness');
  const [waitTimeIncrement, setWaitTimeIncrement] = useState(1);

  // Fetch real-time data
  const fetchRealTimeData = async () => {
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
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchRealTimeData();
  }, [sessionId]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRealTimeData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Auto-assign players
  const handleAutoAssign = async () => {
    try {
      setActionLoading('auto-assign');
      const result = await MatchService.autoAssignPlayers(sessionId, {
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

  // Update wait times
  const handleUpdateWaitTimes = async () => {
    try {
      setActionLoading('wait-times');
      const result = await WaitTimeService.updateSessionWaitTimes(
        sessionId,
        waitTimeIncrement
      );
      // toaster.success({ title: `Updated wait times for ${result.updatedCount} players` });
      await fetchRealTimeData();
    } catch (error) {
      console.error('Error updating wait times:', error);
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
      const playerIds = realTimeData.waitingQueue.map((p: any) => p.id);
      const result = await WaitTimeService.resetWaitTimes(
        sessionId,
        playerIds,
        'current'
      );
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
        <Spinner size="xl" color="blue.500" />
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
              onChange={(e) => setAutoAssignStrategy(e.target.value as any)}
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
              colorScheme="blue"
              size="sm"
              width="full"
            >
              <Target size={16} style={{ marginRight: '8px' }} />
              Auto-assign Players
            </Button>
          </Box>

          {/* Wait time management */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Wait Time Increment (minutes)
            </Text>
            <Input
              type="number"
              value={waitTimeIncrement}
              onChange={(e) => setWaitTimeIncrement(Number(e.target.value))}
              min={1}
              max={10}
              size="sm"
              mb={2}
            />
            <Flex gap={2}>
              <Button
                onClick={handleUpdateWaitTimes}
                loading={actionLoading === 'wait-times'}
                disabled={stats.waitingPlayers === 0}
                colorScheme="orange"
                size="sm"
                flex={1}
              >
                <Clock size={16} style={{ marginRight: '8px' }} />
                Update Wait Times
              </Button>
              <Button
                onClick={handleResetWaitTimes}
                loading={actionLoading === 'reset-wait-times'}
                disabled={stats.waitingPlayers === 0}
                variant="outline"
                size="sm"
              >
                <RotateCcw size={16} style={{ marginRight: '8px' }} />
                Reset
              </Button>
            </Flex>
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
                {waitingQueue.map((player: any, index: number) => (
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
                          {player.gender} • {getLevelLabel(player.level)}
                        </Text>
                      </Box>
                      <Box textAlign="right">
                        <Badge colorScheme="blue" mb={1}>
                          Position {player.queuePosition}
                        </Badge>
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
                {activeMatches.map((match: any) => (
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
                        <Badge colorScheme="green">{match.duration}min</Badge>
                        <Button
                          size="xs"
                          colorScheme="red"
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
                      {match.players.map((player: any) => (
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
          {courts.map((court: any) => (
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
                  colorScheme={court.status === 'IN_USE' ? 'green' : 'gray'}
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
