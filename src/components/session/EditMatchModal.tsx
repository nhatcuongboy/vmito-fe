import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  VSelect,
  SimpleGrid,
} from '@/components/ui/chakra-compat';
import { Text, Box, Flex } from '@chakra-ui/react';
import React, { useState, useEffect, ChangeEvent } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { toaster } from '@/components/ui/toaster';
import { VSwitch } from '@/components/ui/VSwitch';
import { VModal } from '@/components/ui/VModal';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('SessionDetail.matchs');
  const [pair1Score, setPair1Score] = useState<string>('');
  const [pair2Score, setPair2Score] = useState<string>('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isNoResult, setIsNoResult] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSingles =
    match?.players?.length <= 2 || (match?.playerIds?.length ?? 0) <= 2;

  useEffect(() => {
    if (match && isOpen) {
      // Initialize scores
      const hasScores =
        match.scores &&
        (match.scores.pair1Score !== null || match.scores.pair2Score !== null);

      setIsNoResult(!hasScores);

      if (hasScores) {
        setPair1Score(match.scores.pair1Score?.toString() || '0');
        setPair2Score(match.scores.pair2Score?.toString() || '0');
      } else {
        setPair1Score('0');
        setPair2Score('0');
      }

      setIsExtra(Boolean(match.isExtra));
      setNotes(match.notes || '');

      // Initialize players
      if (match.playerIds && Array.isArray(match.playerIds)) {
        setSelectedPlayerIds([...match.playerIds]);
      } else if (match.players && match.players.length === 4) {
        // match.players is an array of objects which might have player.id or playerId
        const ids = match.players.map(
          (mp: { player?: { id?: string }; playerId?: string }) =>
            mp.player?.id || mp.playerId || ''
        );
        setSelectedPlayerIds(ids);
      }
    }
  }, [match, isOpen]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const s1 = parseInt(pair1Score) || 0;
      const s2 = parseInt(pair2Score) || 0;

      const payload: {
        score: string | null;
        isExtra: boolean;
        notes: string;
        isDraw: boolean;
        winnerIds?: string[];
        playerIds?: string[];
      } = {
        score: isNoResult
          ? null
          : JSON.stringify({
              pair1: s1,
              pair2: s2,
            }),
        isExtra,
        notes,
        isDraw: !isNoResult && s1 === s2,
      };

      if (!isNoResult && s1 !== s2) {
        if (isSingles) {
          // Singles: position 0 = side 1, position 1 = side 2
          payload.winnerIds =
            s1 > s2 ? [selectedPlayerIds[0]] : [selectedPlayerIds[1]];
        } else {
          if (s1 > s2) {
            payload.winnerIds = [selectedPlayerIds[0], selectedPlayerIds[1]];
          } else {
            payload.winnerIds = [selectedPlayerIds[2], selectedPlayerIds[3]];
          }
        }
      } else {
        payload.winnerIds = [];
      }

      if (
        selectedPlayerIds.length >= (isSingles ? 2 : 4) &&
        selectedPlayerIds.every((id) => id)
      ) {
        payload.playerIds = selectedPlayerIds;
      }

      await SessionService.updateMatch(match.id, payload);

      toaster.create({
        title: t('updateMatchSuccess'),
        type: 'success',
        duration: 3000,
        closable: true,
      });

      onUpdate();
      onClose();
    } catch {
      toaster.create({
        title: t('updateMatchError'),
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
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t('editMatchTitle')}
      primaryActionText={t('saveChanges')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      secondaryActionText={t('cancel')}
      primaryColorScheme="brand"
    >
      <VStack spacing={4} align="stretch" pb={2}>
        <FormControl>
          <Flex align="center" justify="space-between" mb={2}>
            <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>
              {t('score')}
            </FormLabel>
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.500">
                {t('noResult')}
              </Text>
              <VSwitch
                checked={isNoResult}
                onCheckedChange={(details) => setIsNoResult(details.checked)}
              />
            </HStack>
          </Flex>
          <SimpleGrid
            columns={2}
            gap={4}
            opacity={isNoResult ? 0.5 : 1}
            transition="opacity 0.2s"
          >
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="green.600" mb={1}>
                {isSingles ? t('player1') : t('pair1')}
              </Text>
              <Input
                value={pair1Score}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPair1Score(e.target.value)
                }
                type="number"
                placeholder="0"
                bg="white"
                _dark={{ bg: 'gray.800' }}
                disabled={isNoResult}
              />
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="red.600" mb={1}>
                {isSingles ? t('player2') : t('pair2')}
              </Text>
              <Input
                value={pair2Score}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPair2Score(e.target.value)
                }
                type="number"
                placeholder="0"
                bg="white"
                _dark={{ bg: 'gray.800' }}
                disabled={isNoResult}
              />
            </Box>
          </SimpleGrid>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
            {t('players')}
          </FormLabel>
          <SimpleGrid columns={2} gap={4}>
            {/* Pair 1 Column */}
            <VStack
              align="stretch"
              spacing={3}
              p={3}
              bg="green.50"
              borderRadius="lg"
              border="1px solid"
              borderColor="green.100"
              _dark={{ bg: 'green.950/20', borderColor: 'green.900/30' }}
            >
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="green.700"
                _dark={{ color: 'green.300' }}
              >
                {isSingles ? t('player1') : t('pair1')}
              </Text>
              <VStack spacing={2} align="stretch">
                <Box>
                  <Text
                    fontSize="2xs"
                    color="gray.500"
                    mb={1}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {t('position1')}
                  </Text>
                  <VSelect
                    value={selectedPlayerIds[0] || ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      handlePlayerChange(0, e.target.value)
                    }
                  >
                    <option value="" disabled>
                      {t('selectPlayer')}
                    </option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.playerNumber} {p.name}
                      </option>
                    ))}
                  </VSelect>
                </Box>
                {!isSingles && (
                  <Box>
                    <Text
                      fontSize="2xs"
                      color="gray.500"
                      mb={1}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('position2')}
                    </Text>
                    <VSelect
                      value={selectedPlayerIds[1] || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handlePlayerChange(1, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        {t('selectPlayer')}
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.playerNumber} {p.name}
                        </option>
                      ))}
                    </VSelect>
                  </Box>
                )}
              </VStack>
            </VStack>

            {/* Pair 2 Column */}
            <VStack
              align="stretch"
              spacing={3}
              p={3}
              bg="red.50"
              borderRadius="lg"
              border="1px solid"
              borderColor="red.100"
              _dark={{ bg: 'red.950/20', borderColor: 'red.900/30' }}
            >
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="red.700"
                _dark={{ color: 'red.300' }}
              >
                {isSingles ? t('player2') : t('pair2')}
              </Text>
              <VStack spacing={2} align="stretch">
                <Box>
                  <Text
                    fontSize="2xs"
                    color="gray.500"
                    mb={1}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {isSingles ? t('position1') : t('position3')}
                  </Text>
                  <VSelect
                    value={selectedPlayerIds[isSingles ? 1 : 2] || ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      handlePlayerChange(isSingles ? 1 : 2, e.target.value)
                    }
                  >
                    <option value="" disabled>
                      {t('selectPlayer')}
                    </option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.playerNumber} {p.name}
                      </option>
                    ))}
                  </VSelect>
                </Box>
                {!isSingles && (
                  <Box>
                    <Text
                      fontSize="2xs"
                      color="gray.500"
                      mb={1}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {t('position4')}
                    </Text>
                    <VSelect
                      value={selectedPlayerIds[3] || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handlePlayerChange(3, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        {t('selectPlayer')}
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.playerNumber} {p.name}
                        </option>
                      ))}
                    </VSelect>
                  </Box>
                )}
              </VStack>
            </VStack>
          </SimpleGrid>
        </FormControl>

        <FormControl>
          <HStack justify="space-between" width="100%">
            <FormLabel mb="0">{t('extraMatch')}</FormLabel>
            <VSwitch
              checked={isExtra}
              onCheckedChange={(e) => setIsExtra(!!e.checked)}
              colorPalette="orange"
            />
          </HStack>
        </FormControl>

        <FormControl>
          <FormLabel>{t('notes')}</FormLabel>
          <Input
            value={notes}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNotes(e.target.value)
            }
            placeholder={t('notesPlaceholder')}
          />
        </FormControl>
      </VStack>
    </VModal>
  );
}
