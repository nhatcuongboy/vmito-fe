'use client';

import { Box, Text, VStack, HStack, Image, Textarea } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { VModal } from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import {
  PaymentMethod,
  PaymentRecord,
  HostPaymentSettings,
} from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { Banknote, CreditCard, Upload, QrCode } from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';

interface SubmitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRecord: PaymentRecord;
  hostPaymentSettings?: HostPaymentSettings | null;
  onSubmit: (data: {
    paymentMethod: PaymentMethod;
    proofImageUrl?: string;
    proofNotes?: string;
  }) => Promise<void>;
  onUploadProof: (file: File) => Promise<string>;
}

export default function SubmitPaymentModal({
  isOpen,
  onClose,
  paymentRecord,
  hostPaymentSettings,
  onSubmit,
  onUploadProof,
}: SubmitPaymentModalProps) {
  const t = useTranslations('payment');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.BANK_TRANSFER
  );
  const [proofImageUrl, setProofImageUrl] = useState<string | undefined>();
  const [proofNotes, setProofNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await onUploadProof(file);
      setProofImageUrl(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        paymentMethod,
        proofImageUrl,
        proofNotes: proofNotes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setProofImageUrl(undefined);
    setProofNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('submitPayment')}
      size="md"
      primaryActionText={t('submit')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={isUploading}
      secondaryActionText={t('cancel')}
    >
      <VStack gap={4} align="stretch">
        {/* Payment Amount */}
        <Box
          bg="blue.50"
          p={4}
          borderRadius="lg"
          border="1px solid"
          borderColor="blue.200"
        >
          <HStack justify="space-between">
            <Text fontWeight="medium">{t('yourFee')}</Text>
            <Text fontSize="xl" fontWeight="bold" color="green.600">
              {FeeService.formatFee(paymentRecord.amount)}
            </Text>
          </HStack>
          <HStack justify="space-between" mt={2}>
            <Text fontSize="sm" color="gray.600">
              {t('currentStatus')}
            </Text>
            <PaymentStatusBadge status={paymentRecord.status} />
          </HStack>
        </Box>

        {/* Host Payment Info */}
        {hostPaymentSettings && (
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            p={4}
          >
            <Text fontWeight="medium" mb={3}>
              {t('paymentInfo')}
            </Text>

            {hostPaymentSettings.qrCodeUrl && (
              <Box mb={3} textAlign="center">
                <HStack justify="center" mb={2}>
                  <QrCode size={16} />
                  <Text fontSize="sm" color="gray.600">
                    {t('scanQrCode')}
                  </Text>
                </HStack>
                <Image
                  src={hostPaymentSettings.qrCodeUrl}
                  alt="QR Code"
                  maxH="150px"
                  mx="auto"
                  borderRadius="md"
                />
              </Box>
            )}

            {hostPaymentSettings.bankName && (
              <HStack justify="space-between" py={1}>
                <Text fontSize="sm" color="gray.600">
                  {t('bankName')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {hostPaymentSettings.bankName}
                </Text>
              </HStack>
            )}

            {hostPaymentSettings.bankAccountNumber && (
              <HStack justify="space-between" py={1}>
                <Text fontSize="sm" color="gray.600">
                  {t('accountNumber')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" fontFamily="mono">
                  {hostPaymentSettings.bankAccountNumber}
                </Text>
              </HStack>
            )}

            {hostPaymentSettings.accountHolderName && (
              <HStack justify="space-between" py={1}>
                <Text fontSize="sm" color="gray.600">
                  {t('accountHolderName')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {hostPaymentSettings.accountHolderName}
                </Text>
              </HStack>
            )}
          </Box>
        )}

        {/* Payment Method */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {t('paymentMethod')}
          </Text>
          <HStack gap={2}>
            <Button
              flex={1}
              variant={
                paymentMethod === PaymentMethod.BANK_TRANSFER
                  ? 'solid'
                  : 'outline'
              }
              colorPalette={
                paymentMethod === PaymentMethod.BANK_TRANSFER ? 'blue' : 'gray'
              }
              onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
            >
              <CreditCard size={16} />
              <Text ml={1}>{t('method.bankTransfer')}</Text>
            </Button>
            <Button
              flex={1}
              variant={
                paymentMethod === PaymentMethod.CASH ? 'solid' : 'outline'
              }
              colorPalette={
                paymentMethod === PaymentMethod.CASH ? 'blue' : 'gray'
              }
              onClick={() => setPaymentMethod(PaymentMethod.CASH)}
            >
              <Banknote size={16} />
              <Text ml={1}>{t('method.cash')}</Text>
            </Button>
          </HStack>
        </Box>

        {/* Proof Upload (for bank transfer) */}
        {paymentMethod === PaymentMethod.BANK_TRANSFER && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {t('uploadProof')}
            </Text>
            {proofImageUrl ? (
              <Box position="relative">
                <Image
                  src={proofImageUrl}
                  alt="Payment proof"
                  maxH="150px"
                  borderRadius="md"
                />
                <Button
                  size="sm"
                  colorPalette="red"
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => setProofImageUrl(undefined)}
                >
                  {t('remove')}
                </Button>
              </Box>
            ) : (
              <Box
                as="label"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p={6}
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="lg"
                cursor="pointer"
                _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                transition="all 0.2s"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Text fontSize="sm" color="gray.600">
                    {t('uploading')}
                  </Text>
                ) : (
                  <>
                    <Upload size={24} color="#718096" />
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      {t('clickToUploadProof')}
                    </Text>
                  </>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Notes */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            {t('notes')}
          </Text>
          <Textarea
            placeholder={t('paymentNotesPlaceholder')}
            value={proofNotes}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setProofNotes(e.target.value)
            }
            rows={2}
            resize="none"
          />
        </Box>
      </VStack>
    </VModal>
  );
}
