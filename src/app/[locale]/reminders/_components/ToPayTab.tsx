'use client';

import { Badge, Box, Skeleton, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { PaymentReminderService } from '@/lib/api/payment-reminder.service';
import {
  IPaymentReminder,
  PaymentMethod,
  PaymentReminderStatus,
} from '@/lib/api/types';
import ReminderCard from './ReminderCard';
import MarkPaidModal from './MarkPaidModal';

export default function ToPayTab() {
  const t = useTranslations('paymentReminder');
  const tCommon = useTranslations('common');

  const [reminders, setReminders] = useState<IPaymentReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingReminder, setPayingReminder] = useState<IPaymentReminder | null>(
    null
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PaymentReminderService.getReminders({
        role: 'recipient',
      });
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      toaster.error({ title: tCommon('error'), description: t('loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkPaid = async (data: {
    paymentMethod: PaymentMethod;
    proofImageUrl?: string;
    proofNotes?: string;
  }) => {
    if (!payingReminder) return;
    await PaymentReminderService.markPaid(payingReminder.id, data);
    await load();
  };

  if (isLoading) {
    return (
      <Stack gap={3}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="100px" borderRadius="lg" />
        ))}
      </Stack>
    );
  }

  return (
    <VStack align="stretch" gap={3}>
      {reminders.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Box color="fg.muted" display="inline-block" mb={2}>
            <Bell size={28} />
          </Box>
          <Text color="fg.muted">{t('noToPay')}</Text>
        </Box>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} role="recipient">
            {reminder.status === PaymentReminderStatus.PENDING ? (
              <Button
                size="xs"
                colorPalette="green"
                alignSelf="flex-start"
                onClick={() => setPayingReminder(reminder)}
              >
                {t('markPaid')}
              </Button>
            ) : reminder.status ===
              PaymentReminderStatus.AWAITING_CONFIRMATION ? (
              <Badge colorPalette="orange" alignSelf="flex-start" fontSize="xs">
                {t('awaitingConfirmation')}
              </Badge>
            ) : null}
          </ReminderCard>
        ))
      )}

      {payingReminder && (
        <MarkPaidModal
          isOpen={Boolean(payingReminder)}
          onClose={() => setPayingReminder(null)}
          reminder={payingReminder}
          onSubmit={handleMarkPaid}
        />
      )}
    </VStack>
  );
}
