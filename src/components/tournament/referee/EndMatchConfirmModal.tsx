'use client';

import { useEffect, useState } from 'react';
import { Box, Text, Flex, Textarea, VStack } from '@chakra-ui/react';
import { Button, Input } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { Field } from '@/components/ui/Field';
import { useTranslations } from 'next-intl';

import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch, MatchSet } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import {
  BadmintonRules,
  buildScoreString,
  isMatchComplete,
} from '@/lib/scoring/badminton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch;
  sets: MatchSet[];
  rules: BadmintonRules;
  isDoubles: boolean;
  onEnded: (m: CategoryMatch) => void;
}

export default function EndMatchConfirmModal({
  isOpen,
  onClose,
  match,
  sets,
  rules,
  isDoubles,
  onEnded,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreEntry');
  const [submitting, setSubmitting] = useState(false);
  const [refereeName, setRefereeName] = useState('');
  const [notes, setNotes] = useState('');

  const { complete, winnerSide } = isMatchComplete(sets, rules);
  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);
  const winnerName = winnerSide === 1 ? team1 : winnerSide === 2 ? team2 : null;

  useEffect(() => {
    if (!isOpen) return;
    setRefereeName(match.refereeName ?? '');
    setNotes(match.notes ?? '');
  }, [isOpen, match.id, match.notes, match.refereeName]);

  const regIdOfPosition = (pos: number) =>
    match.participants?.find((p) => p.position === pos)?.categoryRegistrationId;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const total1 = sets.reduce((s, x) => s + x.player1Score, 0);
      const total2 = sets.reduce((s, x) => s + x.player2Score, 0);
      const winnerId =
        winnerSide === 1
          ? regIdOfPosition(1)
          : winnerSide === 2
            ? regIdOfPosition(2)
            : undefined;
      const trimmedRefereeName = refereeName.trim();
      const trimmedNotes = notes.trim();

      const resp = await CategoryService.endMatch(match.id, {
        score: buildScoreString(sets),
        sets,
        winnerId,
        player1Score: total1,
        player2Score: total2,
        ...(isDoubles && { player3Score: total1, player4Score: total2 }),
        ...(trimmedRefereeName && { refereeName: trimmedRefereeName }),
        ...(trimmedNotes && { notes: trimmedNotes }),
      });
      onEnded(resp);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>{t('confirmEndMatch')}</ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody>
        <Text mb={3} color="gray.600" _dark={{ color: 'gray.300' }}>
          {complete ? t('endMatchSummary') : t('endMatchIncompleteWarning')}
        </Text>
        <Box
          p={3}
          borderRadius="lg"
          bg="gray.50"
          _dark={{ bg: 'gray.700' }}
          textAlign="center"
        >
          <Text fontWeight="semibold">{buildScoreString(sets)}</Text>
          {winnerName && (
            <Flex justify="center" align="center" gap={2} mt={2}>
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('winner')}:
              </Text>
              <Text fontWeight="bold" color="green.500">
                {winnerName}
              </Text>
            </Flex>
          )}
        </Box>
        <VStack align="stretch" gap={3} mt={4}>
          <Field label={t('refereeName')}>
            <Input
              value={refereeName}
              onChange={(event) => setRefereeName(event.target.value)}
              placeholder={t('refereeNamePlaceholder')}
              disabled={submitting}
            />
          </Field>
          <Field label={t('notes')}>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('matchNotesPlaceholder')}
              disabled={submitting}
              rows={3}
              resize="vertical"
            />
          </Field>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          colorPalette="green"
          onClick={() => void handleConfirm()}
          loading={submitting}
        >
          {t('endMatch')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
