'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { ISession } from '@/lib/api/types';
import { Box, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { CommonModal, useModal } from '@/components/ui/CommonModal';
import BaseSessionCard from './BaseSessionCard';

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

  const { isOpen, onOpen, onClose } = useModal();

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

  // Action buttons (unique to SessionCard)
  const actions = (
    <>
      {mode === 'manage' ? (
        <NextLinkButton
          href={`/host/sessions/${session.id}`}
          colorScheme="blue"
        >
          {t('host')}
        </NextLinkButton>
      ) : (
        <NextLinkButton
          href={`/player/sessions/${session.id}`}
          colorScheme="blue"
        >
          {t('viewSession')}
        </NextLinkButton>
      )}
      {mode === 'manage' && onDelete && (
        <button
          style={{
            background: '#fff',
            color: '#e53e3e',
            border: '1px solid #e53e3e',
            borderRadius: 6,
            padding: '8px 16px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onClick={onOpen}
        >
          {t('deleteSession')}
        </button>
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
