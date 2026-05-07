'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Spinner } from '@chakra-ui/react';
import {
  Button,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/chakra-compat';
import { PlayerService } from '@/lib/api/player.service';
import { BulkPlayerData } from '@/lib/api/types';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';

interface BulkPlayersFormProps {
  sessionId: string;
  onSuccess?: () => void;
}

export default function BulkPlayersForm({
  sessionId,
  onSuccess,
}: BulkPlayersFormProps) {
  const { getLevelLabel } = useLevelLabel();
  const [players, setPlayers] = useState<BulkPlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    sessionName: string;
    maxPlayers: number;
    availableSlots: number;
    availablePlayerNumbers: number[];
  } | null>(null);

  // Fetch session info on load
  useEffect(() => {
    async function fetchSessionInfo() {
      try {
        setIsLoading(true);
        const response = await PlayerService.getBulkPlayersInfo(sessionId);
        setSessionInfo({
          sessionName: response.sessionName,
          maxPlayers: response.maxPlayers,
          availableSlots: response.availableSlots,
          availablePlayerNumbers: response.availablePlayerNumbers,
        });

        // Initialize with one empty player
        if (response.availablePlayerNumbers.length > 0) {
          setPlayers([{ playerNumber: response.availablePlayerNumbers[0] }]);
        }
      } catch (error) {
        console.error('Error fetching session info:', error);
        setErrorMessage('Error fetching session info');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessionInfo();
  }, [sessionId]);

  // Add new player to the list
  const addPlayer = () => {
    if (!sessionInfo) return;

    const usedNumbers = players.map((p) => p.playerNumber);
    const availableNumber = sessionInfo.availablePlayerNumbers.find(
      (num) => !usedNumbers.includes(num)
    );

    if (availableNumber) {
      setPlayers([...players, { playerNumber: availableNumber }]);
    } else {
      setErrorMessage('No available player numbers');
    }
  };

  // Remove player from the list
  const removePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  // Update player data
  const updatePlayer = (
    index: number,
    field: keyof BulkPlayerData,
    value: string | number | boolean
  ) => {
    const newPlayers = [...players];
    let nextValue = value;

    if (field === 'playerNumber') {
      if (typeof value !== 'string') {
        return;
      }

      const rawValue = value.trim();
      const parsed = Number(rawValue);

      if (!rawValue || Number.isNaN(parsed)) {
        return;
      }

      nextValue = parsed;

      // Validate number is available
      if (
        sessionInfo &&
        !sessionInfo.availablePlayerNumbers.includes(nextValue as number)
      ) {
        setErrorMessage(
          `Player number ${nextValue} is already taken or out of range`
        );
        return;
      }
    }

    setErrorMessage(null);
    newPlayers[index] = {
      ...newPlayers[index],
      [field]: nextValue,
    };

    setPlayers(newPlayers);
  };

  // Submit bulk players
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Basic validation
      const invalidPlayers = players.filter((p) => !p.playerNumber);
      if (invalidPlayers.length > 0) {
        setErrorMessage('All players must have a player number');
        setIsLoading(false);
        return;
      }

      // Check for duplicates
      const playerNumbers = players.map((p) => p.playerNumber);
      const uniqueNumbers = new Set(playerNumbers);
      if (playerNumbers.length !== uniqueNumbers.size) {
        setErrorMessage('Each player must have a unique player number');
        setIsLoading(false);
        return;
      }

      // Validate gender and level values
      const invalidGender = players.some(
        (p) =>
          p.gender &&
          !['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].includes(p.gender)
      );
      if (invalidGender) {
        setErrorMessage(
          'Gender must be one of: Male, Female, Other, or Prefer not to say'
        );
        setIsLoading(false);
        return;
      }

      const invalidLevel = players.some(
        (p) => p.level && !VALID_LEVELS.includes(p.level as number)
      );
      if (invalidLevel) {
        setErrorMessage('Invalid player level detected');
        setIsLoading(false);
        return;
      }

      // Submit to API
      const result = await PlayerService.createBulkPlayers(sessionId, players);

      setSuccessMessage(
        `Created ${result.createdPlayers.length} players successfully`
      );

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }

      // Refresh session info
      const updatedInfo = await PlayerService.getBulkPlayersInfo(sessionId);
      setSessionInfo({
        sessionName: updatedInfo.sessionName,
        maxPlayers: updatedInfo.maxPlayers,
        availableSlots: updatedInfo.availableSlots,
        availablePlayerNumbers: updatedInfo.availablePlayerNumbers,
      });

      // Reset form
      if (updatedInfo.availablePlayerNumbers.length > 0) {
        setPlayers([{ playerNumber: updatedInfo.availablePlayerNumbers[0] }]);
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error creating players:', error);
      setErrorMessage('Error creating players');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the form
  const clearForm = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Reset players to initial state with just one empty player
    if (sessionInfo && sessionInfo.availablePlayerNumbers.length > 0) {
      setPlayers([{ playerNumber: sessionInfo.availablePlayerNumbers[0] }]);
    } else {
      setPlayers([]);
    }
  };

  if (isLoading && !sessionInfo) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="xl" />
        <Text mt={2}>Loading session information...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        Add Multiple Players
      </Heading>

      {errorMessage && (
        <Box mb={4} p={4} bg="red.50" color="red.600" borderRadius="md">
          <Text>{errorMessage}</Text>
        </Box>
      )}

      {successMessage && (
        <Box mb={4} p={4} bg="green.50" color="green.600" borderRadius="md">
          <Text>{successMessage}</Text>
        </Box>
      )}

      {sessionInfo && (
        <Box mb={4} p={4} borderWidth="1px" borderRadius="md">
          <Text>
            <strong>Session:</strong> {sessionInfo.sessionName}
          </Text>
          <Text>
            <strong>Max Players:</strong> {sessionInfo.maxPlayers}
          </Text>
          <Text>
            <strong>Available Slots:</strong> {sessionInfo.availableSlots}
          </Text>
          <Text>
            <strong>Available Player Numbers:</strong>{' '}
            {sessionInfo.availablePlayerNumbers.slice(0, 10).join(', ')}
            {sessionInfo.availablePlayerNumbers.length > 10 ? '...' : ''}
          </Text>
        </Box>
      )}

      <Heading size="sm" mb={2}>
        Manual Entry
      </Heading>
      <Box
        overflowX="auto"
        borderWidth="1px"
        borderRadius="md"
        style={{
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            minWidth: '750px',
          }}
        >
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th width="120px">Player Number</Th>
                <Th>Name</Th>
                <Th width="120px">Gender</Th>
                <Th width="120px">Level</Th>
                <Th>Level Description</Th>
                <Th width="140px">Phone</Th>
                <Th width="120px">Confirm Info</Th>
                <Th width="100px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {players.map((player, index) => (
                <Tr key={index}>
                  <Td>
                    <input
                      type="number"
                      min={1}
                      max={sessionInfo?.maxPlayers || 100}
                      value={player.playerNumber || ''}
                      onChange={(e) =>
                        updatePlayer(index, 'playerNumber', e.target.value)
                      }
                      style={{
                        width: '70px',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      value={player.name || ''}
                      onChange={(e) =>
                        updatePlayer(index, 'name', e.target.value)
                      }
                      placeholder="Name"
                      style={{
                        width: '100%',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </Td>
                  <Td>
                    <select
                      value={player.gender || ''}
                      onChange={(e) =>
                        updatePlayer(index, 'gender', e.target.value)
                      }
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        width: '100%',
                      }}
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </Td>
                  <Td>
                    <select
                      value={player.level || ''}
                      onChange={(e) =>
                        updatePlayer(index, 'level', parseInt(e.target.value))
                      }
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        width: '100%',
                      }}
                    >
                      <option value="">Select</option>
                      {VALID_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {getLevelLabel(level)}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <textarea
                      value={player.levelDescription || ''}
                      onChange={(e) =>
                        updatePlayer(index, 'levelDescription', e.target.value)
                      }
                      placeholder="Skill description..."
                      style={{
                        width: '100%',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        height: '36px',
                        resize: 'vertical',
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      value={player.phone || ''}
                      onChange={(e) =>
                        updatePlayer(index, 'phone', e.target.value)
                      }
                      placeholder="Phone"
                      style={{
                        width: '100%',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={player.requireConfirmInfo || false}
                        onChange={(e) =>
                          updatePlayer(
                            index,
                            'requireConfirmInfo',
                            e.target.checked
                          )
                        }
                        style={{
                          width: '16px',
                          height: '16px',
                          marginRight: '8px',
                        }}
                      />
                      <span>Required</span>
                    </div>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => removePlayer(index)}
                      disabled={players.length === 1}
                    >
                      Remove
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </Box>

      <Flex mt={4} gap={4} wrap="wrap">
        <Button
          onClick={addPlayer}
          colorPalette="green"
          disabled={!sessionInfo || sessionInfo.availableSlots === 0}
          size="md"
        >
          Add Another Player
        </Button>
        <Button
          onClick={handleSubmit}
          colorPalette="green"
          disabled={players.length === 0 || isLoading}
          size="md"
        >
          {isLoading ? 'Submitting...' : 'Submit All Players'}
        </Button>
        <Button onClick={clearForm} variant="outline" size="md">
          Reset Form
        </Button>
      </Flex>
    </Box>
  );
}
