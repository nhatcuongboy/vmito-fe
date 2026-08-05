'use client';

import { Box, Text, VStack, HStack, Textarea } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { VModal } from '@/components/ui/VModal';
import { Button, Image } from '@/components/ui/chakra-compat';
import { PaymentMethod, IPaymentReminder } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { PaymentService } from '@/lib/api/payment.service';
import { Banknote, CreditCard, Upload } from 'lucide-react';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: IPaymentReminder;
  onSubmit: (data: {
    paymentMethod: PaymentMethod;
    proofImageUrl?: string;
    proofNotes?: string;
  }) => Promise<void>;
}

export default function MarkPaidModal({
  isOpen,
  onClose,
  reminder,
  onSubmit,
}: MarkPaidModalProps) {
  const t = useTranslations('paymentReminder');
  const tPayment = useTranslations('payment');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.BANK_TRANSFER
  );
  const [proofImageUrl, setProofImageUrl] = useState<string | undefined>();
  const [proofNotes, setProofNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setProofImageUrl(undefined);
    setProofNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await PaymentService.uploadPaymentProof(file);
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
      handleClose();
    } catch (error) {
      console.error('Mark paid failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('markPaid')}
      size="md"
      primaryActionText={t('submit')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={isUploading}
      secondaryActionText={t('cancel')}
    >
      <VStack gap={4} align="stretch">
        <Box
          bg="green.50"
          _dark={{ bg: 'green.950' }}
          p={4}
          borderRadius="lg"
          border="1px solid"
          borderColor="green.200"
        >
          <HStack justify="space-between">
            <Text fontWeight="medium">{t('amount')}</Text>
            <Text fontSize="xl" fontWeight="bold" color="green.600">
              {FeeService.formatPaymentAmount(reminder.amount)}
            </Text>
          </HStack>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {tPayment('paymentMethod')}
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
                paymentMethod === PaymentMethod.BANK_TRANSFER ? 'green' : 'gray'
              }
              onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
            >
              <CreditCard size={16} />
              <Text ml={1}>{tPayment('method.bankTransfer')}</Text>
            </Button>
            <Button
              flex={1}
              variant={
                paymentMethod === PaymentMethod.CASH ? 'solid' : 'outline'
              }
              colorPalette={
                paymentMethod === PaymentMethod.CASH ? 'green' : 'gray'
              }
              onClick={() => setPaymentMethod(PaymentMethod.CASH)}
            >
              <Banknote size={16} />
              <Text ml={1}>{tPayment('method.cash')}</Text>
            </Button>
          </HStack>
        </Box>

        {paymentMethod === PaymentMethod.BANK_TRANSFER && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {tPayment('uploadProof')}
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
                  {tPayment('remove')}
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
                _hover={{ borderColor: 'green.400' }}
              >
                <Upload size={24} />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {isUploading
                    ? tPayment('uploading')
                    : tPayment('clickToUploadProof')}
                </Text>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Box>
            )}
          </Box>
        )}

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {t('proofNotes')}
          </Text>
          <Textarea
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            placeholder={t('proofNotesPlaceholder')}
            rows={2}
          />
        </Box>
      </VStack>
    </VModal>
  );
}
