import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  VSelect,
} from '@/components/ui/chakra-compat';
import { Text } from '@chakra-ui/react';
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

      setIsExtra(Boolean(match.isExtra));
      setNotes(match.notes || '');

      // Initialize players
      if (match.playerIds && Array.isArray(match.playerIds)) {
        setSelectedPlayerIds([...match.playerIds]);
      } else if (match.players && match.players.length === 4) {
        setSelectedPlayerIds(Array(4).fill(''));
      }
    }
  }, [match, isOpen]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload: any = {
        score: JSON.stringify({
          pair1: parseInt(pair1Score) || 0,
          pair2: parseInt(pair2Score) || 0,
        }),
        isExtra,
        notes,
      };

      if (
        selectedPlayerIds.length === 4 &&
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
          <FormLabel>{t('score')}</FormLabel>
          <HStack>
            <VStack>
              <Text fontSize="sm" fontWeight="bold" color="green.600">
                {t('pair1')}
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
                {t('pair2')}
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
          <FormLabel>{t('players')}</FormLabel>
          <VStack spacing={2}>
            <HStack width="100%" spacing={2}>
              <VStack flex={1} spacing={2} align="stretch">
                <Text fontSize="xs" color="gray.500">
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
                <Text fontSize="xs" color="gray.500">
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
              </VStack>

              <VStack flex={1} spacing={2} align="stretch">
                <Text fontSize="xs" color="gray.500">
                  {t('position3')}
                </Text>
                <VSelect
                  value={selectedPlayerIds[2] || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handlePlayerChange(2, e.target.value)
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
                <Text fontSize="xs" color="gray.500">
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
              </VStack>
            </HStack>
          </VStack>
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
