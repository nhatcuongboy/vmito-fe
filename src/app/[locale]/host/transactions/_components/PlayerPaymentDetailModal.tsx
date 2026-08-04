'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  HStack,
  IconButton,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Banknote,
  Calendar,
  Check,
  CheckCheck,
  Landmark,
  Receipt,
} from 'lucide-react';
import { PaymentApprovalModal, PaymentStatusBadge } from '@/components/payment';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import dayjs, { getDayjsLocale } from '@/lib/dayjs';
import { FeeService } from '@/lib/api/fee.service';
import { PaymentService } from '@/lib/api/payment.service';
import {
  HostTransactionSummary,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
} from '@/lib/api/types';

interface PlayerPaymentDetailModalProps {
  summary: HostTransactionSummary | null;
  payments: PaymentRecord[];
  isLoading: boolean;
  onClose: () => void;
  onRefresh: (summary: HostTransactionSummary) => Promise<void>;
}

const paymentDate = (payment: PaymentRecord): Date =>
  new Date(payment.session?.startTime ?? payment.createdAt);

const capitalizeFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const paymentAccentColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.SUBMITTED:
      return 'orange.400';
    case PaymentStatus.PENDING:
      return 'yellow.300';
    case PaymentStatus.APPROVED:
      return 'green.300';
    case PaymentStatus.REJECTED:
      return 'red.300';
    default:
      return 'gray.200';
  }
};

export default function PlayerPaymentDetailModal({
  summary,
  payments,
  isLoading,
  onClose,
  onRefresh,
}: PlayerPaymentDetailModalProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dayjsLocale = getDayjsLocale(locale);

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const submittedPayments = useMemo(
    () =>
      payments.filter((payment) => payment.status === PaymentStatus.SUBMITTED),
    [payments]
  );

  const groupedPayments = useMemo(() => {
    const sorted = [...payments].sort(
      (a, b) => paymentDate(b).getTime() - paymentDate(a).getTime()
    );
    const groups: { key: string; label: string; payments: PaymentRecord[] }[] =
      [];
    for (const payment of sorted) {
      const date = dayjs(paymentDate(payment)).locale(dayjsLocale);
      const key = date.format('YYYY-MM');
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key === key) {
        lastGroup.payments.push(payment);
      } else {
        groups.push({
          key,
          label: capitalizeFirst(date.format('MMMM YYYY')),
          payments: [payment],
        });
      }
    }
    return groups;
  }, [payments, dayjsLocale]);

  const handleClose = () => {
    setSelectedPayment(null);
    onClose();
  };

  const handleBulkApprove = async () => {
    if (!summary || submittedPayments.length === 0) return;

    setIsBulkApproving(true);
    try {
      for (const payment of submittedPayments) {
        await PaymentService.approvePayment(payment.id, {});
      }
      await onRefresh(summary);
      toaster.success({
        title: t('approveAllSubmittedSuccess', {
          count: submittedPayments.length,
          name: summary.userName,
        }),
      });
    } catch (error) {
      console.error('Failed to bulk approve payments:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('bulkApprovePaymentsFailed'),
      });
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleApprovePayment = async (
    notes?: string,
    amount?: number,
    paymentMethod?: PaymentMethod
  ) => {
    if (!selectedPayment || !summary) return;

    try {
      await PaymentService.approvePayment(selectedPayment.id, {
        hostNotes: notes,
        amount,
        paymentMethod,
      });
      await onRefresh(summary);
      toaster.success({
        title: t('paymentApprovedToast', {
          amount: FeeService.formatPaymentAmount(
            amount ?? selectedPayment.amount
          ),
          name: summary.userName,
        }),
      });
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('approvePaymentFailed'),
      });
      throw error;
    }
  };

  const handleRejectPayment = async (notes?: string) => {
    if (!selectedPayment || !summary) return;

    try {
      await PaymentService.rejectPayment(selectedPayment.id, {
        hostNotes: notes || t('rejectReason'),
      });
      await onRefresh(summary);
      toaster.success({
        title: t('paymentRejectedToast', { name: summary.userName }),
      });
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to reject payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('rejectPaymentFailed'),
      });
      throw error;
    }
  };

  return (
    <>
      <VModal
        isOpen={Boolean(summary)}
        onClose={handleClose}
        title={summary?.userName || t('paymentDetails')}
        description={
          summary
            ? `${t('total')}: ${FeeService.formatPaymentAmount(
                summary.totalAmount
              )} · ${t('pending')}: ${FeeService.formatPaymentAmount(
                summary.pendingAmount
              )}`
            : t('paymentDetails')
        }
        headerRightContent={
          summary ? (
            <Badge
              colorPalette={summary.pendingAmount > 0 ? 'orange' : 'green'}
              fontSize="xs"
            >
              {summary.pendingAmount > 0
                ? t('filterHasPending')
                : t('fullyPaid')}
            </Badge>
          ) : undefined
        }
        size="lg"
        hideSecondaryAction
        maxBodyHeight={{ base: '70vh', md: '75vh' }}
      >
        {isLoading ? (
          <VStack align="stretch" gap={3}>
            <SimpleGrid columns={{ base: 3 }} gap={2}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="64px" borderRadius="md" />
              ))}
            </SimpleGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="72px" borderRadius="lg" />
            ))}
          </VStack>
        ) : (
          <VStack align="stretch" gap={3}>
            {summary && (
              <SimpleGrid columns={{ base: 3 }} gap={2}>
                <Box
                  p={3}
                  bg="gray.50"
                  _dark={{ bg: 'gray.800' }}
                  borderRadius="md"
                >
                  <Text fontSize="xs" color="fg.muted">
                    {t('total')}
                  </Text>
                  <Text fontWeight="bold">
                    {FeeService.formatPaymentAmount(summary.totalAmount)}
                  </Text>
                </Box>
                <Box
                  p={3}
                  bg="green.50"
                  _dark={{ bg: 'green.950' }}
                  borderRadius="md"
                >
                  <Text
                    fontSize="xs"
                    color="green.700"
                    _dark={{ color: 'green.300' }}
                  >
                    {t('paid')}
                  </Text>
                  <Text
                    fontWeight="bold"
                    color="green.700"
                    _dark={{ color: 'green.300' }}
                  >
                    {FeeService.formatPaymentAmount(summary.paidAmount)}
                  </Text>
                </Box>
                <Box
                  p={3}
                  bg="yellow.50"
                  _dark={{ bg: 'yellow.950' }}
                  borderRadius="md"
                >
                  <Text
                    fontSize="xs"
                    color="yellow.700"
                    _dark={{ color: 'yellow.300' }}
                  >
                    {t('pending')}
                  </Text>
                  <Text
                    fontWeight="bold"
                    color="yellow.700"
                    _dark={{ color: 'yellow.300' }}
                  >
                    {FeeService.formatPaymentAmount(summary.pendingAmount)}
                  </Text>
                </Box>
              </SimpleGrid>
            )}

            {payments.length > 0 && (
              <HStack justify="space-between" wrap="wrap" gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  {t('paymentCount', { count: payments.length })}
                </Text>
                {submittedPayments.length > 0 && (
                  <Button
                    size="xs"
                    colorPalette="green"
                    onClick={handleBulkApprove}
                    loading={isBulkApproving}
                  >
                    <CheckCheck size={14} />
                    <Text ml={1}>
                      {t('approveAllSubmitted', {
                        count: submittedPayments.length,
                      })}
                    </Text>
                  </Button>
                )}
              </HStack>
            )}

            {payments.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Box color="fg.muted" display="inline-block" mb={2}>
                  <Receipt size={28} />
                </Box>
                <Text color="fg.muted">{t('noPayments')}</Text>
              </Box>
            ) : (
              groupedPayments.map((group) => (
                <Box key={group.key}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={2}
                  >
                    {group.label}
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {group.payments.map((payment) => (
                      <Box
                        key={payment.id}
                        p={3}
                        border="1px solid"
                        borderColor="gray.200"
                        borderLeft="3px solid"
                        borderLeftColor={paymentAccentColor(payment.status)}
                        borderRadius="lg"
                        bg="white"
                        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      >
                        <HStack
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                        >
                          <Box flex={1} minW={0}>
                            <HStack gap={2} mb={1} wrap="wrap">
                              <Text fontWeight="semibold" lineClamp={1}>
                                {payment.session?.name || t('transactions')}
                              </Text>
                              <PaymentStatusBadge
                                status={payment.status}
                                size="sm"
                              />
                              {payment.amount === 0 && (
                                <Badge colorPalette="blue" fontSize="xs">
                                  {t('freeLabel')}
                                </Badge>
                              )}
                            </HStack>
                            <HStack
                              gap={2}
                              color="fg.muted"
                              fontSize="sm"
                              wrap="wrap"
                            >
                              <HStack gap={1}>
                                <Calendar size={14} />
                                <Text>
                                  {payment.session?.startTime
                                    ? dayjs(payment.session.startTime)
                                        .locale(dayjsLocale)
                                        .format('DD/MM/YYYY')
                                    : t('sessions')}
                                </Text>
                              </HStack>
                              {payment.paymentMethod && (
                                <HStack
                                  gap={1}
                                  px={2}
                                  py={0.5}
                                  borderRadius="full"
                                  bg="gray.100"
                                  _dark={{ bg: 'gray.700' }}
                                  fontSize="xs"
                                >
                                  {payment.paymentMethod ===
                                  PaymentMethod.CASH ? (
                                    <Banknote size={12} />
                                  ) : (
                                    <Landmark size={12} />
                                  )}
                                  <Text>
                                    {payment.paymentMethod ===
                                    PaymentMethod.CASH
                                      ? t('method.cash')
                                      : t('method.bankTransfer')}
                                  </Text>
                                </HStack>
                              )}
                            </HStack>
                          </Box>
                          <VStack align="flex-end" gap={2}>
                            <Text fontWeight="bold">
                              {FeeService.formatPaymentAmount(payment.amount)}
                            </Text>
                            {payment.status === PaymentStatus.SUBMITTED ? (
                              <Button
                                size="xs"
                                colorPalette="green"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Check size={14} />
                                <Text ml={1}>{t('approveNow')}</Text>
                              </Button>
                            ) : payment.status === PaymentStatus.APPROVED ? (
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorPalette="green"
                                aria-label={t('viewDetails')}
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Check size={14} />
                              </IconButton>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                colorPalette={
                                  payment.status === PaymentStatus.REJECTED
                                    ? 'red'
                                    : 'gray'
                                }
                                onClick={() => setSelectedPayment(payment)}
                              >
                                {t('viewDetails')}
                              </Button>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              ))
            )}
          </VStack>
        )}
      </VModal>

      {selectedPayment && (
        <PaymentApprovalModal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          paymentRecord={selectedPayment}
          onApprove={handleApprovePayment}
          onReject={handleRejectPayment}
        />
      )}
    </>
  );
}
