'use client';

import { useEffect, useState } from 'react';
import { Box, Field, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import {
  buildSingleDayDateTime,
  buildSingleDayEndDateTime,
  formatDateOnly,
  formatTimeOnly,
} from '@/components/session/session-form/sessionFormUtils';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { VModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';

interface ICloneSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onCloned?: () => void | Promise<void>;
}

export const CloneSessionModal = ({
  isOpen,
  onClose,
  session,
  onCloned,
}: ICloneSessionModalProps) => {
  const t = useTranslations('session.cloneModal');
  const tSession = useTranslations('session');
  const tCommon = useTranslations('common');
  const [sessionDate, setSessionDate] = useState(() =>
    formatDateOnly(new Date())
  );
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSessionDate(formatDateOnly(new Date()));
      setStartHour('');
      setEndHour('');
    }
  }, [isOpen]);

  const handleStartTimeChange = (value: string) => {
    setStartHour(value);
    if (!value) {
      setEndHour('');
      return;
    }

    const startTime = buildSingleDayDateTime(sessionDate, value);
    const suggestedEndTime = new Date(startTime);
    suggestedEndTime.setMinutes(
      suggestedEndTime.getMinutes() + (session.sessionDuration || 120)
    );
    setEndHour(formatTimeOnly(suggestedEndTime));
  };

  const getValidationError = () => {
    if (!sessionDate || !startHour || !endHour) return t('errors.required');

    const start = new Date(buildSingleDayDateTime(sessionDate, startHour));
    const end = new Date(buildSingleDayEndDateTime(sessionDate, endHour));
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
        startTime: new Date(
          buildSingleDayDateTime(sessionDate, startHour)
        ).toISOString(),
        endTime: new Date(
          buildSingleDayEndDateTime(sessionDate, endHour)
        ).toISOString(),
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
      size="lg"
      primaryActionText={t('confirm')}
      secondaryActionText={tCommon('cancel')}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!sessionDate || !startHour || !endHour}
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

        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex={1}>
            <Field.Root required>
              <Field.Label>{tSession('date')}</Field.Label>
              <VDateTimeInput
                type="date"
                value={sessionDate}
                min={formatDateOnly(new Date())}
                color="fg"
                bg="bg"
                _dark={{ color: 'white', bg: 'gray.700' }}
                placeholder={tSession('date')}
                onChange={(event) => setSessionDate(event.target.value)}
              />
            </Field.Root>
          </Box>

          <Stack direction="row" gap={4} flex={2}>
            <Box flex={1}>
              <Field.Root required>
                <Field.Label>{tSession('start')}</Field.Label>
                <VDateTimeInput
                  type="time"
                  value={startHour}
                  color="fg"
                  bg="bg"
                  _dark={{ color: 'white', bg: 'gray.700' }}
                  placeholder={tSession('start')}
                  onChange={(event) =>
                    handleStartTimeChange(event.target.value)
                  }
                />
              </Field.Root>
            </Box>

            <Box flex={1}>
              <Field.Root required>
                <Field.Label>{tSession('end')}</Field.Label>
                <VDateTimeInput
                  type="time"
                  value={endHour}
                  color="fg"
                  bg="bg"
                  _dark={{ color: 'white', bg: 'gray.700' }}
                  placeholder={tSession('end')}
                  onChange={(event) => setEndHour(event.target.value)}
                />
              </Field.Root>
            </Box>
          </Stack>
        </Stack>
      </VStack>
    </VModal>
  );
};
