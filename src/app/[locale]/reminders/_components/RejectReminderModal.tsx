'use client';

import { Text, Textarea, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { VModal } from '@/components/ui/VModal';

interface RejectReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hostNotes?: string) => Promise<void>;
}

export default function RejectReminderModal({
  isOpen,
  onClose,
  onConfirm,
}: RejectReminderModalProps) {
  const t = useTranslations('paymentReminder');
  const [hostNotes, setHostNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setHostNotes('');
    onClose();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(hostNotes.trim() || undefined);
      handleClose();
    } catch (error) {
      console.error('Reject reminder failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('rejectReminder')}
      size="md"
      primaryActionText={t('reject')}
      onPrimaryAction={handleConfirm}
      isPrimaryLoading={isSubmitting}
      secondaryActionText={t('cancel')}
    >
      <VStack align="stretch" gap={2}>
        <Text fontSize="sm" color="fg.muted">
          {t('rejectReminderDescription')}
        </Text>
        <Textarea
          value={hostNotes}
          onChange={(e) => setHostNotes(e.target.value)}
          placeholder={t('rejectReasonPlaceholder')}
          rows={3}
        />
      </VStack>
    </VModal>
  );
}
