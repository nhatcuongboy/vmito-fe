'use client';

import { useTranslations } from 'next-intl';
import { CommonModal } from '@/components/ui/CommonModal';
import { ISession } from '@/lib/api/types';
import JoinSessionForm from './JoinSessionForm';
import { useJoinSession } from './useJoinSession';

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onSuccess?: () => void;
}

export default function JoinSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
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
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('joinSession')}: ${session.name}`}
      primaryActionText={t('submitRegistration')}
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
    </CommonModal>
  );
}
