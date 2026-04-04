'use client';

import { Box, Text, VStack, HStack, Image, Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import {
  PaymentRecord,
  PaymentStatus,
  HostPaymentSettings,
  ISession,
  FeeType,
} from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { CreditCard, QrCode, Building2, User, Send } from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';
import SubmitPaymentModal from './SubmitPaymentModal';
import FastTransferModal from './FastTransferModal';
import { PaymentMethod } from '@/lib/api/types';

interface PaymentInfoTabProps {
  session: ISession;
  paymentRecords: PaymentRecord[]; // Player may have multiple records (multi-slot)
  hostPaymentSettings?: HostPaymentSettings | null;
  onSubmitPayment: (
    paymentId: string,
    data: {
      paymentMethod: PaymentMethod;
      proofImageUrl?: string;
      proofNotes?: string;
    }
  ) => Promise<void>;
  onUploadProof: (file: File) => Promise<string>;
}

export default function PaymentInfoTab({
  session,
  paymentRecords,
  hostPaymentSettings,
  onSubmitPayment,
  onUploadProof,
}: PaymentInfoTabProps) {
  const t = useTranslations('payment');

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );

  const [isFastTransferOpen, setIsFastTransferOpen] = useState(false);

  const totalAmount = paymentRecords.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = paymentRecords
    .filter((p) => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  const canSubmit = (payment: PaymentRecord) =>
    payment.status === PaymentStatus.PENDING;

  const handleSubmit = async (data: {
    paymentMethod: PaymentMethod;
    proofImageUrl?: string;
    proofNotes?: string;
  }) => {
    if (!selectedPayment) return;
    await onSubmitPayment(selectedPayment.id, data);
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Fee Type Info */}
      {session.feeConfig && (
        <Box
          bg="blue.50"
          border="1px solid"
          borderColor="blue.200"
          borderRadius="lg"
          p={4}
        >
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="semibold" color="green.700">
              {session.feeConfig.feeType === FeeType.FIXED
                ? t('fixedFee')
                : t('splitEvenly')}
            </Text>
            {session.feeConfig.feeType === FeeType.SPLIT_EVENLY && (
              <Badge colorPalette="purple">{t('calculatedAfterSession')}</Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="green.600">
            {session.feeConfig.feeType === FeeType.FIXED
              ? t('fixedFeeDescription')
              : t('splitEvenlyDescription')}
          </Text>
        </Box>
      )}

      {/* Payment Summary */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <Text fontWeight="semibold" mb={3}>
          {t('yourPaymentSummary')}
        </Text>

        <VStack gap={2} align="stretch">
          <HStack justify="space-between">
            <Text color="gray.600">{t('totalFee')}</Text>
            <Text fontWeight="bold" fontSize="lg">
              {FeeService.formatFee(totalAmount)}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.600">{t('paidAmount')}</Text>
            <Text fontWeight="bold" color="green.600">
              {paidAmount === 0 ? '0' : FeeService.formatFee(paidAmount)}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.600">{t('pendingAmount')}</Text>
            <Text fontWeight="bold" color="yellow.600">
              {FeeService.formatFee(pendingAmount)}
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Host Payment Info */}
      {hostPaymentSettings && (
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
        >
          <HStack mb={3} justify="space-between">
            <HStack>
              <CreditCard size={18} color="#3182ce" />
              <Text fontWeight="semibold">{t('hostPaymentInfo')}</Text>
            </HStack>
            {hostPaymentSettings.bankName &&
              hostPaymentSettings.bankAccountNumber && (
                <Button
                  size="sm"
                  colorPalette="blue"
                  onClick={() => setIsFastTransferOpen(true)}
                >
                  {t('transfer')}
                </Button>
              )}
          </HStack>

          {hostPaymentSettings.qrCodeUrl && (
            <Box mb={4} textAlign="center">
              <HStack justify="center" mb={2}>
                <QrCode size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600">
                  {t('scanQrCode')}
                </Text>
              </HStack>
              <Image
                src={hostPaymentSettings.qrCodeUrl}
                alt="QR Code"
                maxH="180px"
                mx="auto"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            </Box>
          )}

          <VStack gap={2} align="stretch">
            {hostPaymentSettings.bankName && (
              <HStack>
                <Building2 size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" minW="100px">
                  {t('bankName')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {hostPaymentSettings.bankName}
                </Text>
              </HStack>
            )}

            {hostPaymentSettings.bankAccountNumber && (
              <HStack>
                <CreditCard size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" minW="100px">
                  {t('accountNumber')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" fontFamily="mono">
                  {hostPaymentSettings.bankAccountNumber}
                </Text>
              </HStack>
            )}

            {hostPaymentSettings.accountHolderName && (
              <HStack>
                <User size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" minW="100px">
                  {t('accountHolderName')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {hostPaymentSettings.accountHolderName}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      )}

      {/* Payment Records */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          {t('paymentDetails')}
        </Text>

        <VStack gap={2} align="stretch">
          {paymentRecords.map((payment, index) => (
            <Box
              key={payment.id}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              p={4}
            >
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Text fontWeight="medium">
                    {paymentRecords.length > 1
                      ? `${t('slot')} ${index + 1}`
                      : t('yourSlot')}
                  </Text>
                  {payment.player?.name && (
                    <Text fontSize="sm" color="gray.500">
                      ({payment.player.name})
                    </Text>
                  )}
                </HStack>
                <PaymentStatusBadge status={payment.status} />
              </HStack>

              <HStack justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {FeeService.formatFee(payment.amount)}
                </Text>

                {canSubmit(payment) && (
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Send size={14} />
                    <Text ml={1}>{t('markAsPaid')}</Text>
                  </Button>
                )}
              </HStack>

              {payment.status === PaymentStatus.SUBMITTED && (
                <Text fontSize="sm" color="green.600" mt={2}>
                  {t('waitingForApproval')}
                </Text>
              )}

              {payment.status === PaymentStatus.REJECTED &&
                payment.hostNotes && (
                  <Box mt={2} p={2} bg="red.50" borderRadius="md">
                    <Text fontSize="sm" color="red.600">
                      {t('rejectionReason')}: {payment.hostNotes}
                    </Text>
                  </Box>
                )}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Submit Payment Modal */}
      {selectedPayment && (
        <SubmitPaymentModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          paymentRecord={selectedPayment}
          hostPaymentSettings={hostPaymentSettings}
          onSubmit={handleSubmit}
          onUploadProof={onUploadProof}
        />
      )}

      {/* Fast Transfer Modal */}
      {hostPaymentSettings && (
        <FastTransferModal
          isOpen={isFastTransferOpen}
          onClose={() => setIsFastTransferOpen(false)}
          pendingAmount={pendingAmount}
          hostPaymentSettings={hostPaymentSettings}
        />
      )}
    </VStack>
  );
}
