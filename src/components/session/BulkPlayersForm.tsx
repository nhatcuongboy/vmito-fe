'use client';

import { useState } from 'react';
import { Box, Input, Text } from '@chakra-ui/react';
import {
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
} from '@/components/ui/chakra-compat';
import { PlayerService } from '@/lib/api/player.service';
import {
  type BulkPlayerData,
  type BulkPlayersInfoResponse,
} from '@/lib/api/types';

interface BulkPlayersFormProps {
  sessionId: string;
  onSuccess?: () => void;
}

export default function BulkPlayersForm({
  sessionId,
  onSuccess,
}: BulkPlayersFormProps) {
  const [players, setPlayers] = useState<BulkPlayerData[]>([
    { playerNumber: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] =
    useState<BulkPlayersInfoResponse | null>(null);

  // Load session info
  const loadSessionInfo = async () => {
    try {
      setLoading(true);
      const info = await PlayerService.getBulkPlayersInfo(sessionId);
      setSessionInfo(info);
      setLoading(false);
    } catch {
      setError('Failed to load session info');
      setLoading(false);
    }
  };

  // Add new player row
  const addPlayer = () => {
    const nextPlayerNumber =
      Math.max(...players.map((p) => p.playerNumber || 0), 0) + 1;
    setPlayers([...players, { playerNumber: nextPlayerNumber }]);
  };

  // Remove player row
  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  // Update player data
  const updatePlayer = (
    index: number,
    field: keyof BulkPlayerData,
    value: string | number | undefined
  ) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  // Submit bulk players
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const playersToSubmit = players.map(({ ...rest }) => ({
        ...rest,
        // We omit playerNumber so backend assigns it
      }));

      const response = await PlayerService.createBulkPlayers(
        sessionId,
        playersToSubmit
      );
      setSuccess(
        `${response.createdPlayers.length} players created successfully`
      );
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create players';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <HStack justifyContent="space-between">
          <Text fontSize="lg" fontWeight="bold">
            Bulk Create Players
          </Text>
          <Button size="sm" onClick={loadSessionInfo}>
            Load Session Info
          </Button>
        </HStack>
      </CardHeader>

      <CardBody>
        <VStack gap={4}>
          {sessionInfo && (
            <Box p={3} bg="blue.50" borderRadius="md" width="100%">
              <Text fontSize="sm">
                Session: {sessionInfo.sessionName} | Max Players:{' '}
                {sessionInfo.maxPlayers} | Current:{' '}
                {sessionInfo.currentPlayersCount} | Available:{' '}
                {sessionInfo.availableSlots}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Available Numbers:{' '}
                {sessionInfo.availablePlayerNumbers.join(', ')}
              </Text>
            </Box>
          )}

          {error && (
            <Box
              p={3}
              bg="red.50"
              color="red.600"
              borderRadius="md"
              width="100%"
            >
              <Text>{error}</Text>
            </Box>
          )}

          {success && (
            <Box
              p={3}
              bg="green.50"
              color="green.600"
              borderRadius="md"
              width="100%"
            >
              <Text>{success}</Text>
            </Box>
          )}

          <VStack gap={3} width="100%">
            {players.map((player, index) => (
              <HStack key={index} gap={2} width="100%">
                <Input
                  type="number"
                  placeholder="Player #"
                  value={player.playerNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(
                      index,
                      'playerNumber',
                      parseInt(e.target.value) || 1
                    )
                  }
                  width="80px"
                />
                <Input
                  placeholder="Name"
                  value={player.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(index, 'name', e.target.value || undefined)
                  }
                />
                <select
                  value={player.gender || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updatePlayer(index, 'gender', e.target.value || undefined)
                  }
                  style={{
                    padding: '8px',
                    borderWidth: '1px',
                    borderRadius: '6px',
                    width: '120px',
                  }}
                >
                  <option value="">Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
                <select
                  value={player.level || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updatePlayer(index, 'level', e.target.value || undefined)
                  }
                  style={{
                    padding: '8px',
                    borderWidth: '1px',
                    borderRadius: '6px',
                    width: '120px',
                  }}
                >
                  <option value="">Level</option>
                  <option value="Y">Y</option>
                  <option value="Y_PLUS">Y+</option>
                  <option value="TBY">TBY</option>
                  <option value="TB_MINUS">TB-</option>
                  <option value="TB">TB</option>
                  <option value="TB_PLUS">TB+</option>
                </select>
                <Input
                  placeholder="Phone"
                  value={player.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(index, 'phone', e.target.value || undefined)
                  }
                  width="150px"
                />
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={() => removePlayer(index)}
                  disabled={players.length === 1}
                >
                  Remove
                </Button>
              </HStack>
            ))}
          </VStack>

          <HStack gap={2}>
            <Button onClick={addPlayer}>Add Player</Button>
            <Button
              colorPalette="blue"
              onClick={handleSubmit}
              loading={loading}
            >
              {loading ? 'Creating...' : 'Create Players'}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
}
