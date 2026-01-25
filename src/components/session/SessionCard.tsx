'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { ISession } from '@/lib/api/types';
import { Box, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { CommonModal, useModal } from '@/components/ui/CommonModal';
import BaseSessionCard from './BaseSessionCard';
import { useAuthStore } from '@/stores/useAuthStore';

interface SessionCardProps {
  session: ISession;
  onDelete?: (id: string) => void;
  mode?: 'view' | 'manage';
}

const SessionCard = ({
  session,
  onDelete,
  mode = 'view',
}: SessionCardProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const { isOpen, onOpen, onClose } = useModal();

  // Check if current user is the session owner
  const isOwner = session.hostId === user?.id;

  // Registration status warnings (unique to SessionCard)
  const statusWarnings = (
    <>
      {session.players?.[0]?.registrationStatus === 'PENDING' && (
        <Box
          bg="yellow.100"
          color="yellow.800"
          px={3}
          py={2}
          borderRadius="md"
          mb={2}
        >
          <Text fontSize="sm" fontWeight="bold">
            ⏳ {t('registrationPending')}
          </Text>
        </Box>
      )}
      {session.players?.[0]?.registrationStatus === 'REJECTED' && (
        <Box
          bg="red.100"
          color="red.800"
          px={3}
          py={2}
          borderRadius="md"
          mb={2}
        >
          <Text fontSize="sm" fontWeight="bold">
            ❌ {t('registrationRejected')}
          </Text>
        </Box>
      )}
    </>
  );

  // Action buttons - route owners to manage page, others to view page
  const actions = (
    <>
      {mode === 'manage' || (isOwner && user?.role !== 'PLAYER') ? (
        <NextLinkButton
          href={`/host/sessions/${session.id}`}
          colorPalette="blue"
          size="sm"
        >
          {t('host')}
        </NextLinkButton>
      ) : (
        <NextLinkButton
          href={`/player/sessions/${session.id}`}
          colorPalette={isOwner && user?.role === 'PLAYER' ? 'blue' : 'blue'}
          size="sm"
        >
          {isOwner && user?.role === 'PLAYER' ? t('manageSession') : t('viewSession')}
        </NextLinkButton>
      )}
      {mode === 'manage' && onDelete && (
        <Button
          colorPalette="red"
          variant="outline"
          size="sm"
          onClick={onOpen}
        >
          {t('deleteSession')}
        </Button>
      )}
    </>
  );

  // Delete modal (unique to SessionCard)
  const modal = onDelete ? (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('deleteSession')}
      primaryActionText={tCommon('delete')}
      secondaryActionText={tCommon('cancel')}
      onPrimaryAction={() => {
        onDelete(session.id);
        onClose();
      }}
      primaryColorScheme="red"
    >
      <Text>{t('deleteConfirmation')}</Text>
    </CommonModal>
  ) : null;

  return (
    <BaseSessionCard
      session={session}
      afterStatusContent={statusWarnings}
      actionButtons={actions}
      modalContent={modal}
    />
  );
};

export default SessionCard;

