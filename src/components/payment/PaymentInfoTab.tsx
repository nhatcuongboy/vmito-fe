'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import {
  PaymentRecord,
  PaymentStatus,
  HostPaymentSettings,
  ISession,
  FeeType,
} from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import {
  CreditCard,
  QrCode,
  Building2,
  User,
  Send,
  Download,
} from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';
import SubmitPaymentModal from './SubmitPaymentModal';
import FastTransferModal from './FastTransferModal';
import { PaymentMethod } from '@/lib/api/types';
import { getVietQRImageUrl, getVietnamBanks, Bank } from '@/lib/banks';
import { useEffect } from 'react';

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

const normalizeTransferMessage = (message: string) =>
  message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25);

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
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

  // Bank list state
  const [banks, setBanks] = useState<Bank[]>([]);
  useEffect(() => {
    getVietnamBanks().then(setBanks);
  }, []);

  const totalAmount = paymentRecords.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = paymentRecords
    .filter((p) => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  const canSubmit = (payment: PaymentRecord) =>
    payment.status === PaymentStatus.PENDING;

  // Construct a default message for transfer: "Name - Date - PlayerName"
  const defaultMessage = useMemo(() => {
    // Session name (max 10 chars to avoid overflow in bank apps)
    const sName = session.name?.substring(0, 15).trim() || '';

    // Short date: DD/MM
    let sDate = '';
    if (session.startTime) {
      const d = new Date(session.startTime);
      sDate = `${d.getDate()}/${d.getMonth() + 1}`;
    }

    // Player name (assuming current user is the first record)
    const pName = paymentRecords[0]?.player?.name?.split(' ').pop() || ''; // Take last name only for brevity

    return normalizeTransferMessage(`${sName} ${sDate} ${pName}`);
  }, [session.name, session.startTime, paymentRecords]);

  const paymentQrUrl = useMemo(() => {
    const generatedQrUrl = getVietQRImageUrl(
      hostPaymentSettings?.bankName ?? '',
      hostPaymentSettings?.bankAccountNumber ?? '',
      {
        accountName: hostPaymentSettings?.accountHolderName,
        amount: pendingAmount > 0 ? pendingAmount : undefined,
        addInfo: defaultMessage || undefined,
        bankList: banks,
      }
    );

    return generatedQrUrl || hostPaymentSettings?.qrCodeUrl || null;
  }, [hostPaymentSettings, pendingAmount, defaultMessage, banks]);

  const handleDownloadPaymentQr = async () => {
    if (!paymentQrUrl) return;

    setIsDownloadingQr(true);
    try {
      const response = await fetch(paymentQrUrl);
      if (!response.ok) throw new Error('Failed to download QR code');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `vmito-payment-qr-${session.id}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      toaster.success({ title: t('downloadQrCodeSuccess') });
    } catch {
      window.open(paymentQrUrl, '_blank', 'noopener,noreferrer');
      toaster.error({ title: t('downloadQrCodeFailed') });
    } finally {
      setIsDownloadingQr(false);
    }
  };

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
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* Payment Summary */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
          display="flex"
          flexDirection="column"
        >
          <Text fontWeight="semibold" mb={3}>
            {t('yourPaymentSummary')}
          </Text>

          {/* Fee Type Info moved here */}
          {session.feeConfig && (
            <Box
              bg="green.50"
              _dark={{ bg: 'green.900' }}
              border="1px solid"
              borderColor="green.200"
              borderRadius="md"
              p={3}
              mb={4}
            >
              <HStack justify="space-between" mb={1}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="green.700"
                  _dark={{ color: 'green.200' }}
                >
                  {session.feeConfig.feeType === FeeType.FIXED
                    ? t('fixedFee')
                    : t('splitEvenly')}
                </Text>
                {session.feeConfig.feeType === FeeType.SPLIT_EVENLY && (
                  <Badge colorPalette="purple" size="xs">
                    {t('calculatedAfterSession')}
                  </Badge>
                )}
              </HStack>
              <Text
                fontSize="xs"
                color="green.600"
                _dark={{ color: 'green.300' }}
              >
                {session.feeConfig.feeType === FeeType.FIXED
                  ? t('fixedFeeDescription')
                  : t('splitEvenlyDescription')}
              </Text>
            </Box>
          )}

          <VStack gap={2} align="stretch" flex={1} justify="center">
            <HStack justify="space-between">
              <Text color="gray.600" fontSize="sm">
                {t('totalFee')}
              </Text>
              <Text fontWeight="bold" fontSize="lg">
                {FeeService.formatPaymentAmount(totalAmount)}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text color="gray.600" fontSize="sm">
                {t('paidAmount')}
              </Text>
              <Text fontWeight="bold" color="green.600" fontSize="lg">
                {FeeService.formatPaymentAmount(paidAmount)}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text color="gray.600" fontSize="sm">
                {t('pendingAmount')}
              </Text>
              <Text fontWeight="bold" color="yellow.600" fontSize="lg">
                {FeeService.formatPaymentAmount(pendingAmount)}
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
                <CreditCard size={18} color="#179a3b" />
                <Text fontWeight="semibold">{t('hostPaymentInfo')}</Text>
              </HStack>
              {hostPaymentSettings.bankName &&
                hostPaymentSettings.bankAccountNumber && (
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={() => setIsFastTransferOpen(true)}
                  >
                    {t('transfer')}
                  </Button>
                )}
            </HStack>

            {/* QR Code */}
            {(() => {
              if (!paymentQrUrl) return null;
              return (
                <Box mb={4} textAlign="center">
                  <HStack justify="center" mb={2}>
                    <QrCode size={16} color="#718096" />
                    <Text fontSize="xs" color="gray.600">
                      {t('scanQrCode')}
                    </Text>
                  </HStack>
                  <Image
                    src={paymentQrUrl}
                    alt="QR Code"
                    maxH="160px"
                    mx="auto"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  />
                  <Button
                    mt={3}
                    size="sm"
                    variant="outline"
                    colorPalette="green"
                    loading={isDownloadingQr}
                    onClick={handleDownloadPaymentQr}
                  >
                    <Download size={14} />
                    <Text ml={1}>{t('downloadQrCode')}</Text>
                  </Button>
                </Box>
              );
            })()}

            <VStack gap={2} align="stretch">
              {hostPaymentSettings.bankName && (
                <HStack>
                  <Building2 size={16} color="#718096" />
                  <Text fontSize="xs" color="gray.600" minW="100px">
                    {t('bankName')}
                  </Text>
                  <Text fontSize="xs" fontWeight="medium" truncate>
                    {hostPaymentSettings.bankName}
                  </Text>
                </HStack>
              )}

              {hostPaymentSettings.bankAccountNumber && (
                <HStack>
                  <CreditCard size={16} color="#718096" />
                  <Text fontSize="xs" color="gray.600" minW="100px">
                    {t('accountNumber')}
                  </Text>
                  <Text fontSize="xs" fontWeight="medium" fontFamily="mono">
                    {hostPaymentSettings.bankAccountNumber}
                  </Text>
                </HStack>
              )}

              {hostPaymentSettings.accountHolderName && (
                <HStack>
                  <User size={16} color="#718096" />
                  <Text fontSize="xs" color="gray.600" minW="100px">
                    {t('accountHolderName')}
                  </Text>
                  <Text fontSize="xs" fontWeight="medium" truncate>
                    {hostPaymentSettings.accountHolderName}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>
        )}
      </SimpleGrid>

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
                  {FeeService.formatPaymentAmount(payment.amount)}
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
          defaultMessage={defaultMessage}
        />
      )}
    </VStack>
  );
}
