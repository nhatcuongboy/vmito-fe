'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';

import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch;
  onForfeited: (m: CategoryMatch) => void;
}

// Records a forfeit / walkover from the referee scoring page: the chosen side
// wins, the other is recorded as having forfeited. Mirrors the forfeit payload
// used by the manage ManualScoreModal so both paths produce identical results.
export default function ForfeitMatchModal({
  isOpen,
  onClose,
  match,
  onForfeited,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreEntry');
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the selection whenever the modal (re)opens.
  useEffect(() => {
    if (isOpen) setWinner(null);
  }, [isOpen]);

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);

  const regIdOfPosition = (pos: number) =>
    match.participants?.find((p) => p.position === pos)?.categoryRegistrationId;

  const handleConfirm = async () => {
    if (!winner) return;
    setSubmitting(true);
    try {
      const resp = await CategoryService.endMatch(match.id, {
        score: t('walkover'),
        isForfeit: true,
        winnerId: regIdOfPosition(winner),
        player1Score: 0,
        player2Score: 0,
        sets: [],
      });
      onForfeited(resp);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>{t('forfeitTitle')}</ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody>
        <Text fontSize="sm" color="gray.500" mb={2}>
          {t('forfeitSelectWinner')}
        </Text>
        <Flex gap={2}>
          {([1, 2] as const).map((pos) => (
            <Button
              key={pos}
              flex="1"
              minH="48px"
              variant={winner === pos ? 'solid' : 'outline'}
              colorPalette={winner === pos ? 'green' : 'gray'}
              onClick={() => setWinner(pos)}
            >
              {pos === 1 ? team1 : team2}
            </Button>
          ))}
        </Flex>
        <Box
          mt={3}
          p={3}
          borderRadius="lg"
          bg="orange.50"
          _dark={{ bg: 'orange.900' }}
        >
          <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
            {t('forfeitHint')}
          </Text>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          colorPalette="red"
          onClick={() => void handleConfirm()}
          loading={submitting}
          disabled={winner === null}
        >
          {t('forfeitConfirm')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
