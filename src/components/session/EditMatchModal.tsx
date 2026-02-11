import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
} from '@/components/ui/chakra-compat';
import { Text } from '@chakra-ui/react';
import React, { useState, useEffect, ChangeEvent } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { toaster } from '@/components/ui/toaster';

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any; // Using any for now to avoid strict type issues with history match vs full match
  sessionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  players: any[]; // List of available players
  onUpdate: () => void;
}

export function EditMatchModal({
  isOpen,
  onClose,
  match,
  players,
  onUpdate,
}: EditMatchModalProps) {
  const [pair1Score, setPair1Score] = useState<string>('');
  const [pair2Score, setPair2Score] = useState<string>('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (match && isOpen) {
      // Initialize scores
      if (match.scores) {
        setPair1Score(match.scores.pair1Score?.toString() || '0');
        setPair2Score(match.scores.pair2Score?.toString() || '0');
      } else {
        // Try to parse legacy score if needed, or default to empty/0
        setPair1Score('0');
        setPair2Score('0');
      }

      // Initialize players
      // match.players is likely an array of objects or strings depending on where it came from
      // In SessionHistoryList, match.players is string[] of names, we need IDs.
      // BUT, checking SessionHistoryList usage, `match` prop passed to card is `HistoryMatch`.
      // We might need to fetch the full match or assume we get full objects if we change the parent.
      // For now, let's assume the parent passes us the raw match object or we can find players by name (risky).
      // Better: Parent should pass the full match object with player IDs.

      // Let's look at what we'll actually pass. In SessionHistoryList, we have `matches` state which has formatted data.
      // We should probably stash the raw match data or ensuring `HistoryMatch` has IDs.
      // Let's assume we update `HistoryMatch` to include player IDs.
      if (match.playerIds && Array.isArray(match.playerIds)) {
        setSelectedPlayerIds([...match.playerIds]);
      } else if (match.players && match.players.length === 4) {
        // If we only have names, we can't easily map back if names aren't unique.
        // We need to update SessionHistoryList to include IDs in the `HistoryMatch` object.
        // Accessing directly for now safely.
        setSelectedPlayerIds(Array(4).fill(''));
      }
    }
  }, [match, isOpen]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        score: JSON.stringify({
          pair1: parseInt(pair1Score) || 0,
          pair2: parseInt(pair2Score) || 0,
        }),
      };

      // Only sending playerIds if we have valid ones selected
      if (
        selectedPlayerIds.length === 4 &&
        selectedPlayerIds.every((id) => id)
      ) {
        payload.playerIds = selectedPlayerIds;
      }

      await SessionService.updateMatch(match.id, payload);

      toaster.create({
        title: 'Match updated',
        type: 'success',
        duration: 3000,
        closable: true,
      });

      onUpdate();
      onClose();
    } catch {
      toaster.create({
        title: 'Error updating match',
        description: 'Failed to update match details',
        type: 'error',
        duration: 3000,
        closable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayerChange = (index: number, playerId: string) => {
    const newIds = [...selectedPlayerIds];
    newIds[index] = playerId;
    setSelectedPlayerIds(newIds);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Match</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Score</FormLabel>
              <HStack>
                <VStack>
                  <Text fontSize="sm" fontWeight="bold" color="green.600">
                    Pair 1
                  </Text>
                  <Input
                    value={pair1Score}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPair1Score(e.target.value)
                    }
                    type="number"
                  />
                </VStack>
                <Text fontWeight="bold">-</Text>
                <VStack>
                  <Text fontSize="sm" fontWeight="bold" color="red.600">
                    Pair 2
                  </Text>
                  <Input
                    value={pair2Score}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPair2Score(e.target.value)
                    }
                    type="number"
                  />
                </VStack>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Players (Pair 1 vs Pair 2)</FormLabel>
              <VStack spacing={2}>
                <HStack width="100%" spacing={2}>
                  <VStack flex={1} spacing={2}>
                    <Text fontSize="xs" color="gray.500">
                      Pair 1 (Position 1)
                    </Text>
                    <Select
                      value={selectedPlayerIds[0] || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handlePlayerChange(0, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select player
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.playerNumber} {p.name}
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="xs" color="gray.500">
                      Pair 1 (Position 2)
                    </Text>
                    <Select
                      value={selectedPlayerIds[1] || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handlePlayerChange(1, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select player
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.playerNumber} {p.name}
                        </option>
                      ))}
                    </Select>
                  </VStack>

                  <VStack flex={1} spacing={2}>
                    <Text fontSize="xs" color="gray.500">
                      Pair 2 (Position 3)
                    </Text>
                    <Select
                      value={selectedPlayerIds[2] || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handlePlayerChange(2, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select player
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.playerNumber} {p.name}
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="xs" color="gray.500">
                      Pair 2 (Position 4)
                    </Text>
                    <Select
                      value={selectedPlayerIds[3] || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handlePlayerChange(3, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select player
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.playerNumber} {p.name}
                        </option>
                      ))}
                    </Select>
                  </VStack>
                </HStack>
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="green"
            onClick={handleSubmit}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...({ isLoading: isSubmitting } as any)}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
