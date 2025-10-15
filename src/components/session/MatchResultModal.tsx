import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { CourtDirection } from '@/lib/api/types';
import { Match } from '@/types/session';
import {
  Box,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Trophy, Users, X } from 'lucide-react';
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

  if (!isOpen || !match) return null;

  // Group players into pairs using same logic as BadmintonCourt
  // Apply visual mapping based on direction prop, then determine pairs by column

  const playersWithPair = match.players.map((matchPlayer) => {
    // Apply same visual mapping as BadmintonCourt
    let visualMapping: number[];
    if (direction === CourtDirection.HORIZONTAL) {
      // Horizontal layout: API position 0→0, 1→2, 2→1, 3→3
      visualMapping = [0, 2, 1, 3];
    } else {
      // Vertical layout: API position 0→0, 1→1, 2→2, 3→3
      visualMapping = [0, 1, 2, 3];
    }

    // Use courtPosition instead of position
    const courtPosition =
      matchPlayer.player.courtPosition ?? matchPlayer.position;
    const visualIndex = visualMapping[courtPosition] ?? courtPosition;

    // Determine pair by column: left column (0,2) = pair 1, right column (1,3) = pair 2
    const pairNumber = visualIndex % 2 === 0 ? 1 : 2;

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
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        maxW="lg"
        w="full"
        maxH="90vh"
        overflow="auto"
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          p={4}
          borderBottom="1px"
          borderColor="gray.200"
        >
          <Heading size="md">{t('matchResult.title')}</Heading>
          <Box
            as="button"
            onClick={onCancel}
            p={1}
            borderRadius="md"
            _hover={{ bg: 'gray.100' }}
          >
            <Box as={X} boxSize={5} />
          </Box>
        </Flex>

        {/* Body */}
        <VStack gap={6} p={6} pt={0}>
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
                  <Text fontSize="sm" color="blue.600" fontWeight="semibold">
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

            {/* Winner Selection */}
            <VStack gap={3} w="full">
              <Text fontSize="sm" color="gray.600" textAlign="center">
                {t('matchResult.selectWinnerInstruction')}
              </Text>

              <HStack gap={4} w="full">
                {/* Pair 1 */}
                <Box
                  flex={1}
                  p={3}
                  border="2px"
                  borderColor={
                    selectedWinnerPair === 1 ? 'green.400' : 'gray.300'
                  }
                  borderRadius="lg"
                  bg={selectedWinnerPair === 1 ? 'green.50' : 'gray.50'}
                  position="relative"
                  cursor={isDraw ? 'not-allowed' : 'pointer'}
                  boxShadow={selectedWinnerPair === 1 ? 'md' : 'sm'}
                  onClick={() => {
                    if (!isDraw) {
                      setSelectedWinnerPair(
                        selectedWinnerPair === 1 ? null : 1
                      );
                    }
                  }}
                  transition="all 0.2s"
                  _hover={
                    !isDraw
                      ? {
                          borderColor: 'green.400',
                          bg: 'green.100',
                          boxShadow: 'lg',
                          transform: 'scale(1.03)',
                        }
                      : {}
                  }
                  style={{
                    outline: !isDraw ? '2px dashed #38a169' : undefined,
                    outlineOffset: selectedWinnerPair === 1 ? '2px' : undefined,
                  }}
                >
                  {selectedWinnerPair === 1 && (
                    <Box
                      position="absolute"
                      top={2}
                      right={2}
                      as={Trophy}
                      boxSize={4}
                      color="green.500"
                    />
                  )}
                  <VStack gap={2}>
                    <HStack gap={1} justify="center">
                      <Box as={Users} boxSize={3} color="blue.500" />
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="blue.600"
                      >
                        {t('matchResult.pair1')}
                      </Text>
                    </HStack>
                    <VStack gap={1}>
                      {pair1.map((player) => (
                        <VStack key={player.id} gap={0}>
                          <Text fontSize="xs" fontWeight="medium">
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
                  border="2px"
                  borderColor={
                    selectedWinnerPair === 2 ? 'green.400' : 'gray.300'
                  }
                  borderRadius="lg"
                  bg={selectedWinnerPair === 2 ? 'green.50' : 'gray.50'}
                  position="relative"
                  cursor={isDraw ? 'not-allowed' : 'pointer'}
                  boxShadow={selectedWinnerPair === 2 ? 'md' : 'sm'}
                  onClick={() => {
                    if (!isDraw) {
                      setSelectedWinnerPair(
                        selectedWinnerPair === 2 ? null : 2
                      );
                    }
                  }}
                  transition="all 0.2s"
                  _hover={
                    !isDraw
                      ? {
                          borderColor: 'green.400',
                          bg: 'green.100',
                          boxShadow: 'lg',
                          transform: 'scale(1.03)',
                        }
                      : {}
                  }
                  style={{
                    outline: !isDraw ? '2px dashed #38a169' : undefined,
                    outlineOffset: selectedWinnerPair === 2 ? '2px' : undefined,
                  }}
                >
                  {selectedWinnerPair === 2 && (
                    <Box
                      position="absolute"
                      top={2}
                      right={2}
                      as={Trophy}
                      boxSize={4}
                      color="green.500"
                    />
                  )}
                  <VStack gap={2}>
                    <HStack gap={1} justify="center">
                      <Box as={Users} boxSize={3} color="red.500" />
                      <Text fontSize="sm" fontWeight="semibold" color="red.600">
                        {t('matchResult.pair2')}
                      </Text>
                    </HStack>
                    <VStack gap={1}>
                      {pair2.map((player) => (
                        <VStack key={player.id} gap={0}>
                          <Text fontSize="xs" fontWeight="medium">
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
                onChange={(e: any) => {
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
            <Text fontSize="sm" mb={2} fontWeight="medium">
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

        {/* Footer */}
        <Flex
          justify="flex-end"
          gap={3}
          p={4}
          borderTop="1px"
          borderColor="gray.200"
        >
          <CompatButton
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('matchResult.cancel')}
          </CompatButton>
          <CompatButton
            colorScheme="blue"
            onClick={handleConfirm}
            loading={isLoading}
            disabled={!canSubmit}
          >
            {t('matchResult.submitResult')}
          </CompatButton>
        </Flex>
      </Box>
    </Box>
  );
};

export default MatchResultModal;
