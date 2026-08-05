'use client';

import { useEffect, useState } from 'react';
import { Box, Field, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { VModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';

interface ICloneSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onCloned?: () => void | Promise<void>;
}

const toLocalDateTimeValue = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const CloneSessionModal = ({
  isOpen,
  onClose,
  session,
  onCloned,
}: ICloneSessionModalProps) => {
  const t = useTranslations('session.cloneModal');
  const tCommon = useTranslations('common');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStartTime('');
      setEndTime('');
    }
  }, [isOpen]);

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!value) {
      setEndTime('');
      return;
    }

    const suggestedEndTime = new Date(value);
    suggestedEndTime.setMinutes(
      suggestedEndTime.getMinutes() + (session.sessionDuration || 120)
    );
    setEndTime(toLocalDateTimeValue(suggestedEndTime));
  };

  const getValidationError = () => {
    if (!startTime || !endTime) return t('errors.required');

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start <= new Date()) return t('errors.future');
    if (end <= start) return t('errors.endAfterStart');
    return null;
  };

  const handleClone = async () => {
    const validationError = getValidationError();
    if (validationError) {
      toaster.error({ title: validationError });
      return;
    }

    try {
      setIsSubmitting(true);
      await SessionService.cloneSession(session.id, {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      toaster.success({ title: t('success') });
      onClose();
      await onCloned?.();
    } catch (error) {
      console.error('Error cloning session:', error);
      toaster.error({ title: t('errors.failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description', { name: session.name })}
      primaryActionText={t('confirm')}
      secondaryActionText={tCommon('cancel')}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!startTime || !endTime}
      onPrimaryAction={handleClone}
      onSecondaryAction={onClose}
      closeOnOverlayClick={!isSubmitting}
    >
      <VStack align="stretch" gap={4}>
        <Box bg="blue.50" borderWidth="1px" borderColor="blue.200" p={3}>
          <Text fontSize="sm" color="blue.800">
            {t('excludedData')}
          </Text>
        </Box>

        <Field.Root required>
          <Field.Label>{t('startTime')}</Field.Label>
          <VDateTimeInput
            type="datetime-local"
            value={startTime}
            min={toLocalDateTimeValue(new Date())}
            onChange={(event) => handleStartTimeChange(event.target.value)}
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>{t('endTime')}</Field.Label>
          <VDateTimeInput
            type="datetime-local"
            value={endTime}
            min={startTime || toLocalDateTimeValue(new Date())}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </Field.Root>
      </VStack>
    </VModal>
  );
};
