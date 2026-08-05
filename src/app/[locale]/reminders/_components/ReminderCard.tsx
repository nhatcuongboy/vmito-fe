'use client';

import { Avatar, Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import dayjs from '@/lib/dayjs';
import { FeeService } from '@/lib/api/fee.service';
import {
  IPaymentReminder,
  PaymentReminderStatus,
  PaymentReminderType,
} from '@/lib/api/types';
import { getAvatarBgColor } from '@/lib/utils/avatarColor';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';

interface ReminderCardProps {
  reminder: IPaymentReminder;
  role: 'creator' | 'recipient';
  children?: React.ReactNode;
}

export default function ReminderCard({
  reminder,
  role,
  children,
}: ReminderCardProps) {
  const t = useTranslations('paymentReminder');

  const counterparty =
    role === 'creator' ? reminder.recipient : reminder.creator;
  const counterpartyImage = counterparty?.image;

  const typeLabel =
    reminder.type === PaymentReminderType.SINGLE_PAYMENT
      ? t('typeSingle')
      : reminder.type === PaymentReminderType.AGGREGATE
        ? t('typeAggregate')
        : t('typeCustom');

  const statusBadge = (() => {
    switch (reminder.status) {
      case PaymentReminderStatus.AWAITING_CONFIRMATION:
        return (
          <Badge colorPalette="orange" fontSize="xs">
            {t('awaitingConfirmation')}
          </Badge>
        );
      case PaymentReminderStatus.RESOLVED:
        return (
          <Badge colorPalette="green" fontSize="xs">
            {t('resolved')}
          </Badge>
        );
      default:
        return (
          <Badge colorPalette="yellow" fontSize="xs">
            {t('pending')}
          </Badge>
        );
    }
  })();

  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      border="1px solid"
      borderColor="gray.200"
      borderLeft="4px solid"
      borderLeftColor={
        reminder.status === PaymentReminderStatus.RESOLVED
          ? 'green.400'
          : reminder.status === PaymentReminderStatus.AWAITING_CONFIRMATION
            ? 'orange.400'
            : 'yellow.400'
      }
      borderRadius="lg"
      p={4}
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="flex-start">
          <HStack gap={3} align="flex-start">
            <Avatar.Root
              size="sm"
              bg={getAvatarBgColor(counterparty?.name ?? '')}
            >
              {counterpartyImage ? (
                <Avatar.Image src={normalizeImageUrl(counterpartyImage)} />
              ) : (
                <Avatar.Fallback name={counterparty?.name} color="white" />
              )}
            </Avatar.Root>
            <Box>
              <Text fontWeight="medium" fontSize="sm">
                {counterparty?.name || t('unknownUser')}
              </Text>
              <HStack gap={1.5} mt={0.5}>
                <Badge variant="subtle" fontSize="2xs">
                  {typeLabel}
                </Badge>
                {reminder.session?.name && (
                  <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                    {reminder.session.name}
                  </Text>
                )}
              </HStack>
            </Box>
          </HStack>
          {statusBadge}
        </HStack>

        <HStack justify="space-between" align="flex-end">
          <VStack align="flex-start" gap={0.5}>
            {reminder.note && (
              <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                {reminder.note}
              </Text>
            )}
            <Text fontSize="2xs" color="fg.muted">
              {t('lastRemindedAt')}:{' '}
              {dayjs(reminder.lastRemindedAt).format('DD/MM/YYYY HH:mm')}
              {reminder.reminderCount > 1 &&
                ` · ${t('reminderCount', { count: reminder.reminderCount })}`}
            </Text>
          </VStack>
          <Text fontWeight="bold" fontSize="lg">
            {FeeService.formatPaymentAmount(reminder.amount)}
          </Text>
        </HStack>

        {reminder.status === PaymentReminderStatus.AWAITING_CONFIRMATION &&
          (reminder.proofImageUrl || reminder.proofNotes) && (
            <Box
              bg="orange.50"
              _dark={{ bg: 'orange.950' }}
              borderRadius="md"
              p={2}
            >
              {reminder.proofNotes && (
                <Text fontSize="xs">{reminder.proofNotes}</Text>
              )}
              {reminder.proofImageUrl && (
                <Text
                  asChild
                  fontSize="xs"
                  color="blue.500"
                  textDecoration="underline"
                >
                  <a
                    href={reminder.proofImageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('viewProof')}
                  </a>
                </Text>
              )}
            </Box>
          )}

        {children}
      </VStack>
    </Box>
  );
}
