'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Separator,
  Spinner,
  Link,
} from '@chakra-ui/react';
import { RefreshCw, Clock, Users, Trophy } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/chakra-compat';

interface PlayerStatus {
  id: string;
  playerNumber: number;
  name: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'READY';
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  currentCourtId?: string | number;
  courtName?: string;
  session: {
    id: string;
    name: string;
    status: string;
  };
}

function PlayerStatusContent() {
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const guestToken = searchParams.get('token');

  const fetchPlayerStatus = useCallback(
    async (showRefreshing = false) => {
      if (!guestToken) {
        toaster.error({ title: 'Invalid player token' });
        setLoading(false);
        return;
      }

      if (showRefreshing) setRefreshing(true);

      try {
        const response = await fetch(`/api/player-status?token=${guestToken}`);
        const data = await response.json();

        if (response.ok) {
          setPlayerStatus(data.data);
        } else {
          toaster.error({
            title: data.message || 'Failed to fetch player status',
          });
        }
      } catch (error) {
        toaster.error({ title: 'Failed to fetch player status' });
        console.error('Status fetch error:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [guestToken]
  );

  useEffect(() => {
    fetchPlayerStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPlayerStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPlayerStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'yellow';
      case 'PLAYING':
        return 'green';
      case 'READY':
        return 'blue';
      case 'FINISHED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WAITING':
        return '⏳ Waiting';
      case 'PLAYING':
        return '🏸 Playing';
      case 'READY':
        return '✅ Ready';
      case 'FINISHED':
        return '✅ Finished';
      default:
        return status;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="gray.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap={4}>
          <Spinner size="xl" color="green.500" />
          <Text>Loading player status...</Text>
        </VStack>
      </Box>
    );
  }

  if (!playerStatus) {
    return (
      <Box
        minH="100vh"
        bg="gray.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
      >
        <Box
          maxW="md"
          w="full"
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
          textAlign="center"
        >
          <Text fontSize="xl" color="red.600" mb={4}>
            ❌ Player Not Found
          </Text>
          <Text color="gray.600" mb={6}>
            Invalid player token or session expired
          </Text>
          <Link href="/join-by-code" color="green.600" fontWeight="semibold">
            Join a new session
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8} px={4}>
      <Box maxW="md" mx="auto">
        <Box bg="white" borderRadius="lg" boxShadow="lg" p={6}>
          <VStack gap={6}>
            {/* Header */}
            <Box textAlign="center" w="full">
              <Heading size="lg" color="green.600">
                🏸 Player Status
              </Heading>
              <Text color="gray.600" mt={1}>
                {playerStatus.session.name}
              </Text>
            </Box>

            {/* Player Info */}
            <Box
              bg="blue.50"
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="blue.200"
              w="full"
            >
              <VStack gap={2} align="start">
                <HStack justify="space-between" w="full">
                  <Text fontWeight="bold" color="green.700">
                    {playerStatus.name || `Player ${playerStatus.playerNumber}`}
                  </Text>
                  <Badge colorPalette={getStatusColor(playerStatus.status)}>
                    {getStatusText(playerStatus.status)}
                  </Badge>
                </HStack>
                <Text color="green.600" fontSize="sm">
                  Player #{playerStatus.playerNumber}
                </Text>
              </VStack>
            </Box>

            {/* Stats */}
            <Box w="full">
              <VStack gap={4}>
                <HStack
                  justify="space-between"
                  w="full"
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <HStack gap={2}>
                    <Clock size={20} color="#6B7280" />
                    <Text fontWeight="medium">Wait Time</Text>
                  </HStack>
                  <Text fontWeight="bold">
                    {formatTime(playerStatus.currentWaitTime)}
                  </Text>
                </HStack>

                <HStack
                  justify="space-between"
                  w="full"
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <HStack gap={2}>
                    <Trophy size={20} color="#6B7280" />
                    <Text fontWeight="medium">Matches Played</Text>
                  </HStack>
                  <Text fontWeight="bold">{playerStatus.matchesPlayed}</Text>
                </HStack>

                <HStack
                  justify="space-between"
                  w="full"
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <HStack gap={2}>
                    <Users size={20} color="#6B7280" />
                    <Text fontWeight="medium">Total Wait</Text>
                  </HStack>
                  <Text fontWeight="bold">
                    {formatTime(playerStatus.totalWaitTime)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Current Court */}
            {playerStatus.currentCourtId && (
              <Box
                bg="green.50"
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor="green.200"
                w="full"
              >
                <Text color="green.700" fontWeight="bold" textAlign="center">
                  🏸{' '}
                  {playerStatus.courtName ||
                    `You're on Court #${playerStatus.currentCourtId}`}
                </Text>
              </Box>
            )}

            {/* Actions */}
            <VStack gap={3} w="full">
              <Button
                onClick={() => fetchPlayerStatus(true)}
                variant="outline"
                width="full"
                loading={refreshing}
              >
                <RefreshCw size={16} style={{ marginRight: '8px' }} />
                Refresh Status
              </Button>

              <Separator />

              <HStack gap={2} justify="center">
                <Text color="gray.500" fontSize="sm">
                  Want to link this to your account?
                </Text>
                <Link
                  href="/auth/signin"
                  color="green.600"
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  Sign in
                </Link>
              </HStack>
            </VStack>

            {/* Auto-refresh indicator */}
            <Text color="gray.400" fontSize="xs" textAlign="center">
              Auto-refreshes every 30 seconds
            </Text>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default function PlayerStatusPage() {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          bg="gray.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack gap={4}>
            <Spinner size="xl" color="green.500" />
            <Text>Loading player status...</Text>
          </VStack>
        </Box>
      }
    >
      <PlayerStatusContent />
    </Suspense>
  );
}
