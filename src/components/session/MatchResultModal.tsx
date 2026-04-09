import { Input } from '@/components/ui/Input';
import { VModal } from '@/components/ui/VModal';
import { CourtDirection } from '@/lib/api/types';
import { Match } from '@/types/session';
import { Box, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import { Trophy, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

interface MatchResultModalProps {
  isOpen: boolean;
  match: Match | null;
  onConfirm: (result: {
    score?: Array<{ playerId: string; score: number }>;
    winnerIds?: string[];
    isDraw?: boolean;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  direction?: CourtDirection; // Layout direction prop
}

const MatchResultModal: React.FC<MatchResultModalProps> = ({
  isOpen,
  match,
  onConfirm,
  onCancel,
  isLoading = false,
  direction = CourtDirection.HORIZONTAL, // Default to horizontal like BadmintonCourt
}) => {
  const t = useTranslations('SessionDetail');

  // Form state
  const [pair1Score, setPair1Score] = useState<string>('');
  const [pair2Score, setPair2Score] = useState<string>('');
  const [selectedWinnerPair, setSelectedWinnerPair] = useState<1 | 2 | null>(
    null
  );
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPair1Score('');
      setPair2Score('');
      setSelectedWinnerPair(null);
      setIsDraw(false);
      setNotes('');
    }
  }, [isOpen]);

  // Auto-determine winner based on scores
  React.useEffect(() => {
    const score1 = parseInt(pair1Score) || 0;
    const score2 = parseInt(pair2Score) || 0;

    // Only auto-determine if at least one score is entered
    if (pair1Score.trim() || pair2Score.trim()) {
      if (score1 > score2) {
        setSelectedWinnerPair(1);
        setIsDraw(false);
      } else if (score2 > score1) {
        setSelectedWinnerPair(2);
        setIsDraw(false);
      } else {
        // Scores are equal - could be a draw
        setSelectedWinnerPair(null);
        if (score1 === score2 && score1 > 0) {
          setIsDraw(true);
        }
      }
    } else {
      // No scores entered
      setSelectedWinnerPair(null);
    }
  }, [pair1Score, pair2Score]);

  if (!isOpen || !match) return null;

  // Group players into pairs using same logic as BadmintonCourt
  // Apply visual mapping based on direction prop, then determine pairs by column

  const playersWithPair = (match.players ?? []).map((matchPlayer) => {
    // Use courtPosition to determine the actual visual position on the court
    // courtPosition 0 = top-left, 1 = top-right (or bottom-left in horizontal), etc.
    const courtPosition =
      matchPlayer.player.courtPosition ?? matchPlayer.position;

    // Determine pair by courtPosition:
    // In horizontal layout: positions 0, 2 are on the left (Pair 1), positions 1, 3 are on the right (Pair 2)
    // This is based on visual columns, not rows
    let pairNumber: 1 | 2;
    if (direction === CourtDirection.HORIZONTAL) {
      // Horizontal: Pair 1 = positions 0, 1 (left side), Pair 2 = positions 2, 3 (right side)
      pairNumber = courtPosition < 2 ? 1 : 2;
    } else {
      // Vertical: Pair 1 = positions 0, 2 (top row), Pair 2 = positions 1, 3 (bottom row)
      pairNumber = courtPosition % 2 === 0 ? 1 : 2;
    }

    return {
      ...matchPlayer,
      pairNumber,
    };
  });

  const pair1 = playersWithPair
    .filter((p) => p.pairNumber === 1)
    .sort((a, b) => {
      // Sort by courtPosition to maintain top/bottom order within each pair
      const posA = a.player.courtPosition ?? a.position;
      const posB = b.player.courtPosition ?? b.position;
      return posA - posB;
    });
  const pair2 = playersWithPair
    .filter((p) => p.pairNumber === 2)
    .sort((a, b) => {
      // Sort by courtPosition to maintain top/bottom order within each pair
      const posA = a.player.courtPosition ?? a.position;
      const posB = b.player.courtPosition ?? b.position;
      return posA - posB;
    });

  const handleConfirm = () => {
    const result: {
      score?: Array<{ playerId: string; score: number }>;
      winnerIds?: string[];
      isDraw?: boolean;
      notes?: string;
    } = {};

    // Add scores if provided
    const scores: Array<{ playerId: string; score: number }> = [];
    if (pair1Score.trim()) {
      pair1.forEach((player) => {
        scores.push({
          playerId: player.player.id,
          score: parseInt(pair1Score) || 0,
        });
      });
    }
    if (pair2Score.trim()) {
      pair2.forEach((player) => {
        scores.push({
          playerId: player.player.id,
          score: parseInt(pair2Score) || 0,
        });
      });
    }
    if (scores.length > 0) {
      result.score = scores;
    }

    // Add winner IDs if not a draw and a winner is selected
    if (!isDraw && selectedWinnerPair) {
      result.winnerIds =
        selectedWinnerPair === 1
          ? pair1.map((p) => p.player.id)
          : pair2.map((p) => p.player.id);
    }

    // Add draw status
    if (isDraw) {
      result.isDraw = true;
    }

    // Add notes if provided
    if (notes.trim()) {
      result.notes = notes.trim();
    }

    onConfirm(result);
  };

  const canSubmit = true;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onCancel}
      title={t('matchResult.title')}
      size="md"
      showCloseButton={true}
      primaryActionText={t('matchResult.submitResult')}
      onPrimaryAction={handleConfirm}
      isPrimaryLoading={isLoading}
      isPrimaryDisabled={!canSubmit}
      secondaryActionText={t('matchResult.cancel')}
    >
      <VStack gap={6} align="stretch" py={2}>
        {/* Players Display */}
        <VStack gap={4} w="full">
          {/* Score Input Row */}
          <VStack gap={3} w="full">
            <Text fontSize="sm" fontWeight="medium">
              {t('matchResult.score')}
            </Text>
            <HStack gap={6} justify="center" w="full">
              {/* Pair 1 Score */}
              <VStack gap={2} align="center">
                <Text fontSize="sm" color="green.600" fontWeight="semibold">
                  {t('matchResult.pair1')}
                </Text>
                <Input
                  type="number"
                  placeholder="0"
                  value={pair1Score}
                  onChange={(e) => setPair1Score(e.target.value)}
                  size="sm"
                  textAlign="center"
                  w="80px"
                />
              </VStack>

              {/* VS */}
              <Text fontSize="lg" fontWeight="bold" color="gray.500" mt={6}>
                VS
              </Text>

              {/* Pair 2 Score */}
              <VStack gap={2} align="center">
                <Text fontSize="sm" color="red.600" fontWeight="semibold">
                  {t('matchResult.pair2')}
                </Text>
                <Input
                  type="number"
                  placeholder="0"
                  value={pair2Score}
                  onChange={(e) => setPair2Score(e.target.value)}
                  size="sm"
                  textAlign="center"
                  w="80px"
                />
              </VStack>
            </HStack>
          </VStack>

          {/* Team Display - Shows winner based on scores */}
          <VStack gap={3} w="full">
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {t('matchResult.teams')}
            </Text>

            <HStack gap={4} w="full">
              {/* Pair 1 */}
              <Box
                flex={1}
                p={3}
                borderWidth={selectedWinnerPair === 1 ? '2px' : '1px'}
                borderStyle="solid"
                borderColor={
                  selectedWinnerPair === 1
                    ? 'green.500'
                    : selectedWinnerPair === 2
                      ? 'red.200'
                      : 'gray.200'
                }
                borderRadius="lg"
                bg={
                  selectedWinnerPair === 1
                    ? 'green.50'
                    : selectedWinnerPair === 2
                      ? 'red.50'
                      : 'gray.50'
                }
                position="relative"
                boxShadow={selectedWinnerPair === 1 ? 'md' : 'sm'}
                transform={selectedWinnerPair === 1 ? 'scale(1.02)' : 'none'}
                transition="all 0.2s"
              >
                {selectedWinnerPair === 1 && (
                  <Box
                    position="absolute"
                    top={2}
                    right={2}
                    as={Trophy}
                    boxSize={4}
                    color="green.600"
                  />
                )}
                <VStack gap={2}>
                  <HStack gap={1} justify="center">
                    <Box
                      as={Users}
                      boxSize={3}
                      color={
                        selectedWinnerPair === 1 ? 'green.600' : 'gray.500'
                      }
                    />
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={
                        selectedWinnerPair === 1 ? 'green.700' : 'gray.600'
                      }
                    >
                      {t('matchResult.pair1')}
                    </Text>
                  </HStack>
                  <VStack gap={1}>
                    {pair1.map((player) => (
                      <VStack key={player.id} gap={0}>
                        <Text
                          fontSize="sm"
                          fontWeight={
                            selectedWinnerPair === 1 ? 'bold' : 'medium'
                          }
                          color={selectedWinnerPair === 1 ? 'green.800' : 'fg'}
                          textAlign="center"
                        >
                          #{player.player.playerNumber} -{' '}
                          {player.player.name ||
                            `Player ${player.player.playerNumber}`}
                        </Text>
                      </VStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Pair 2 */}
              <Box
                flex={1}
                p={3}
                borderWidth={selectedWinnerPair === 2 ? '2px' : '1px'}
                borderStyle="solid"
                borderColor={
                  selectedWinnerPair === 2
                    ? 'green.500'
                    : selectedWinnerPair === 1
                      ? 'red.200'
                      : 'gray.200'
                }
                borderRadius="lg"
                bg={
                  selectedWinnerPair === 2
                    ? 'green.50'
                    : selectedWinnerPair === 1
                      ? 'red.50'
                      : 'gray.50'
                }
                position="relative"
                boxShadow={selectedWinnerPair === 2 ? 'md' : 'sm'}
                transform={selectedWinnerPair === 2 ? 'scale(1.02)' : 'none'}
                transition="all 0.2s"
              >
                {selectedWinnerPair === 2 && (
                  <Box
                    position="absolute"
                    top={2}
                    right={2}
                    as={Trophy}
                    boxSize={4}
                    color="green.600"
                  />
                )}
                <VStack gap={2}>
                  <HStack gap={1} justify="center">
                    <Box
                      as={Users}
                      boxSize={3}
                      color={
                        selectedWinnerPair === 2 ? 'green.600' : 'gray.500'
                      }
                    />
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={
                        selectedWinnerPair === 2 ? 'green.700' : 'gray.600'
                      }
                    >
                      {t('matchResult.pair2')}
                    </Text>
                  </HStack>
                  <VStack gap={1}>
                    {pair2.map((player) => (
                      <VStack key={player.id} gap={0}>
                        <Text
                          fontSize="sm"
                          fontWeight={
                            selectedWinnerPair === 2 ? 'bold' : 'medium'
                          }
                          color={selectedWinnerPair === 2 ? 'green.800' : 'fg'}
                          textAlign="center"
                        >
                          #{player.player.playerNumber} -{' '}
                          {player.player.name ||
                            `Player ${player.player.playerNumber}`}
                        </Text>
                      </VStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </HStack>
          </VStack>
        </VStack>

        {/* Draw Checkbox */}
        <Box w="full">
          <HStack gap={2}>
            <input
              type="checkbox"
              checked={isDraw}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setIsDraw(e.target.checked);
                if (e.target.checked) {
                  setSelectedWinnerPair(null);
                }
              }}
            />
            <Text fontSize="sm">{t('matchResult.isDraw')}</Text>
          </HStack>
        </Box>

        {/* Notes */}
        <Box w="full">
          <Text fontSize="sm" mb={2} fontWeight="medium" color="gray.600">
            {t('matchResult.notes')}
          </Text>
          <Textarea
            placeholder={t('matchResult.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            resize="vertical"
          />
        </Box>
      </VStack>
    </VModal>
  );
};

export default MatchResultModal;
