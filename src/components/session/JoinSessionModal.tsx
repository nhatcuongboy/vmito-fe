'use client';

import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { ISession } from '@/lib/api/types';
import JoinSessionForm from './JoinSessionForm';
import { useJoinSession } from './useJoinSession';

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onSuccess?: () => void;
  isAdditionalRegistration?: boolean;
}

export default function JoinSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
  isAdditionalRegistration,
}: JoinSessionModalProps) {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');

  const {
    players,
    loading,
    errors,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleSubmit,
  } = useJoinSession({
    session,
    isOpen,
    isAdditionalRegistration,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const modalTitle = isAdditionalRegistration
    ? `${t('addGuest')}: ${session.name}`
    : `${t('joinSession')}: ${session.name}`;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      primaryActionText={`${t('submitRegistration')} (${players.length})`}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={loading}
      secondaryActionText={tCommon('cancel')}
      size="lg"
    >
      <JoinSessionForm
        session={session}
        players={players}
        errors={errors}
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onUpdatePlayer={handleUpdatePlayer}
      />
    </VModal>
  );
}
