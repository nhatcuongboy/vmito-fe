'use client';

import { useEffect, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { Button, Input } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';

import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentUmpire } from '@/lib/api/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  umpire: TournamentUmpire | null;
  onLinked: (u: TournamentUmpire) => void;
}

export default function LinkUmpireAccountModal({
  isOpen,
  onClose,
  umpire,
  onLinked,
}: Props) {
  const t = useTranslations('pages.tournaments.umpires');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setEmail(umpire?.email ?? '');
  }, [isOpen, umpire]);

  const handleLink = async () => {
    if (!umpire || !email) return;
    setSubmitting(true);
    try {
      const updated = await TournamentService.linkUmpireToAccount(
        umpire.id,
        email
      );
      onLinked(updated);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>{t('linkAccount')}</ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody>
        <Text fontSize="sm" color="gray.500" mb={3}>
          {t('linkByEmail')}
        </Text>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          colorPalette="blue"
          onClick={() => void handleLink()}
          loading={submitting}
          disabled={!email}
        >
          {t('linkAccount')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
