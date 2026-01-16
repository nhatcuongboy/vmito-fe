'use client';

import { PlayerService } from '@/lib/api/player.service';
import { Player } from '@/lib/api/types';
import {
  Box,
  Badge,
  Flex,
  Heading,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { Button, Card, CardBody } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import dayjs from '@/lib/dayjs';

interface PendingRequest extends Player {
  session: {
    name: string;
    startTime: string;
  };
}

export default function PendingRequestsList() {
  const t = useTranslations('common');
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await PlayerService.getPendingRequests();
      setRequests(data as unknown as PendingRequest[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (
    playerId: string,
    sessionId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      setActionLoading(playerId);
      await PlayerService.updatePlayerStatus(sessionId, playerId, status);
      // Remove from list
      setRequests((prev) => prev.filter((p) => p.id !== playerId));
      toaster.success({
        title: status === 'APPROVED' ? 'Approved' : 'Rejected',
      });
    } catch (error) {
      console.error(error);
      toaster.error({ title: 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <Center p={4}>
        <Spinner />
      </Center>
    );

  if (requests.length === 0) return null;

  return (
    <Box mb={8}>
      <Heading size="md" mb={4}>
        Pending Join Requests
      </Heading>
      <Flex direction="column" gap={4}>
        {requests.map((request) => (
          <Card key={request.id}>
            <CardBody>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {request.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Session: {request.session.name} -{' '}
                    {dayjs(request.session.startTime).format('MMM D, HH:mm')}
                  </Text>
                  <Flex gap={2} mt={1}>
                    <Badge colorScheme="purple">Level {request.level}</Badge>
                    <Badge>Player #{request.playerNumber}</Badge>
                  </Flex>
                </Box>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() =>
                      handleAction(request.id, request.sessionId, 'REJECTED')
                    }
                    disabled={actionLoading === request.id}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() =>
                      handleAction(request.id, request.sessionId, 'APPROVED')
                    }
                    loading={actionLoading === request.id}
                  >
                    Approve
                  </Button>
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Flex>
    </Box>
  );
}
