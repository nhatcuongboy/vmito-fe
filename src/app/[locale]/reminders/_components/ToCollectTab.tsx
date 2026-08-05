'use client';

import { Box, Skeleton, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { PaymentReminderService } from '@/lib/api/payment-reminder.service';
import {
  IPaymentReminder,
  PaymentReminderStatus,
  UserRole,
} from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import ReminderCard from './ReminderCard';
import RejectReminderModal from './RejectReminderModal';
import CreateCustomReminderModal from './CreateCustomReminderModal';

export default function ToCollectTab() {
  const t = useTranslations('paymentReminder');
  const tCommon = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const canCreateReminders =
    user?.role === UserRole.HOST || user?.role === UserRole.ADMIN;

  const [reminders, setReminders] = useState<IPaymentReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectingReminder, setRejectingReminder] =
    useState<IPaymentReminder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PaymentReminderService.getReminders({
        role: 'creator',
      });
      setReminders(
        data.filter((r) => r.status !== PaymentReminderStatus.RESOLVED)
      );
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

  const handleRemindAgain = async (reminder: IPaymentReminder) => {
    setActioningId(reminder.id);
    try {
      await PaymentReminderService.remindAgain(reminder.id);
      await load();
    } catch (error) {
      console.error('Failed to remind again:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('actionFailed'),
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkCollected = async (reminder: IPaymentReminder) => {
    setActioningId(reminder.id);
    try {
      await PaymentReminderService.markCollected(reminder.id);
      await load();
    } catch (error) {
      console.error('Failed to mark reminder collected:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('actionFailed'),
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (hostNotes?: string) => {
    if (!rejectingReminder) return;
    try {
      await PaymentReminderService.reject(rejectingReminder.id, { hostNotes });
      await load();
    } finally {
      setRejectingReminder(null);
    }
  };

  const handleCreateCustom = async (data: {
    recipientUserId: string;
    amount: number;
    note: string;
  }) => {
    await PaymentReminderService.createCustomReminder(data);
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
      {canCreateReminders && (
        <Button
          size="sm"
          variant="outline"
          alignSelf="flex-start"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={14} />
          <Text ml={1}>{t('createReminder')}</Text>
        </Button>
      )}

      {reminders.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Box color="fg.muted" display="inline-block" mb={2}>
            <Bell size={28} />
          </Box>
          <Text color="fg.muted">{t('noToCollect')}</Text>
        </Box>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} role="creator">
            {reminder.status === PaymentReminderStatus.PENDING ? (
              <Box display="flex" gap={2}>
                <Button
                  size="xs"
                  variant="outline"
                  loading={actioningId === reminder.id}
                  onClick={() => handleRemindAgain(reminder)}
                >
                  {t('remindAgain')}
                </Button>
                <Button
                  size="xs"
                  colorPalette="green"
                  loading={actioningId === reminder.id}
                  onClick={() => handleMarkCollected(reminder)}
                >
                  {t('markCollected')}
                </Button>
              </Box>
            ) : (
              <Box display="flex" gap={2}>
                <Button
                  size="xs"
                  colorPalette="green"
                  loading={actioningId === reminder.id}
                  onClick={() => handleMarkCollected(reminder)}
                >
                  {t('approve')}
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="red"
                  onClick={() => setRejectingReminder(reminder)}
                >
                  {t('reject')}
                </Button>
              </Box>
            )}
          </ReminderCard>
        ))
      )}

      {rejectingReminder && (
        <RejectReminderModal
          isOpen={Boolean(rejectingReminder)}
          onClose={() => setRejectingReminder(null)}
          onConfirm={handleReject}
        />
      )}

      <CreateCustomReminderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateCustom}
      />
    </VStack>
  );
}
