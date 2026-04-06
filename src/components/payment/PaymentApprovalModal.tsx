'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Textarea,
  Avatar,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { VModal } from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { PaymentRecord, PaymentMethod, PaymentStatus } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { Check, X, User } from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';

interface PaymentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRecord: PaymentRecord;
  onApprove: (
    notes?: string,
    amount?: number,
    paymentMethod?: PaymentMethod
  ) => Promise<void>;
  onReject: (notes?: string) => Promise<void>;
}

export default function PaymentApprovalModal({
  isOpen,
  onClose,
  paymentRecord,
  onApprove,
  onReject,
}: PaymentApprovalModalProps) {
  const t = useTranslations('payment');

  const [hostNotes, setHostNotes] = useState('');
  const [customAmount, setCustomAmount] = useState(
    String(paymentRecord.amount)
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethod | ''
  >(paymentRecord.paymentMethod ?? '');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const amount = parseInt(customAmount, 10);
      await onApprove(
        hostNotes.trim() || undefined,
        !isNaN(amount) ? amount : undefined,
        selectedPaymentMethod || undefined
      );
      onClose();
    } catch (error) {
      console.error('Approve failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(hostNotes.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Reject failed:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const player = paymentRecord.player;
  const isLoading = isApproving || isRejecting;
  const canApproveOrReject =
    paymentRecord.status === PaymentStatus.SUBMITTED ||
    paymentRecord.status === PaymentStatus.PENDING;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('reviewPayment')}
      size="md"
      hideSecondaryAction
      footer={
        canApproveOrReject ? (
          <HStack gap={2} w="full" justify="flex-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button
              colorPalette="red"
              variant="outline"
              onClick={handleReject}
              loading={isRejecting}
              disabled={isApproving}
            >
              <X size={16} />
              <Text ml={1}>{t('rejectPayment')}</Text>
            </Button>
            <Button
              colorPalette="green"
              onClick={handleApprove}
              loading={isApproving}
              disabled={isRejecting}
            >
              <Check size={16} />
              <Text ml={1}>{t('approvePayment')}</Text>
            </Button>
          </HStack>
        ) : (
          <Button onClick={onClose}>{t('close')}</Button>
        )
      }
    >
      <VStack gap={4} align="stretch">
        {/* Player Info */}
        <HStack gap={3} p={3} bg="gray.50" borderRadius="lg">
          <Avatar.Root size="md">
            {player?.user?.image ? (
              <Avatar.Image src={player.user.image} />
            ) : (
              <Avatar.Fallback>
                <User size={20} />
              </Avatar.Fallback>
            )}
          </Avatar.Root>
          <Box flex={1}>
            <Text fontWeight="medium">
              {player?.name || player?.user?.name || t('unknownPlayer')}
            </Text>
            {player?.gender && (
              <Text fontSize="sm" color="gray.600">
                {player.gender}
              </Text>
            )}
          </Box>
        </HStack>

        {/* Payment Details */}
        <Box border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
          <HStack justify="space-between" mb={2}>
            <Text color="gray.600">{t('customAmount')}</Text>
            {canApproveOrReject ? (
              <Input
                size="sm"
                type="number"
                value={customAmount}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCustomAmount(e.target.value)
                }
                w="120px"
                textAlign="right"
                disabled={isLoading}
              />
            ) : (
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {FeeService.formatFee(paymentRecord.amount)}
              </Text>
            )}
          </HStack>

          <HStack justify="space-between" mb={2}>
            <Text color="gray.600">{t('status')}</Text>
            <PaymentStatusBadge status={paymentRecord.status} />
          </HStack>

          <HStack
            justify="space-between"
            mb={paymentRecord.submittedAt ? 2 : 0}
          >
            <Text color="gray.600">{t('selectPaymentMethod')}</Text>
            {canApproveOrReject ? (
              <NativeSelectRoot size="sm" w="160px" disabled={isLoading}>
                <NativeSelectField
                  value={selectedPaymentMethod}
                  onChange={(e) =>
                    setSelectedPaymentMethod(
                      e.target.value as PaymentMethod | ''
                    )
                  }
                >
                  <option value="">{t('selectPaymentMethod')}</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>
                    {t('method.bank_transfer')}
                  </option>
                  <option value={PaymentMethod.CASH}>{t('method.cash')}</option>
                </NativeSelectField>
              </NativeSelectRoot>
            ) : (
              <Text fontWeight="medium">
                {paymentRecord.paymentMethod
                  ? t(`method.${paymentRecord.paymentMethod.toLowerCase()}`)
                  : '—'}
              </Text>
            )}
          </HStack>

          {paymentRecord.submittedAt && (
            <HStack justify="space-between">
              <Text color="gray.600">{t('submittedAt')}</Text>
              <Text fontSize="sm">
                {new Date(paymentRecord.submittedAt).toLocaleString()}
              </Text>
            </HStack>
          )}
        </Box>

        {/* Payment Proof */}
        {paymentRecord.proofImageUrl && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {t('paymentProof')}
            </Text>
            <Image
              src={paymentRecord.proofImageUrl}
              alt="Payment proof"
              maxH="200px"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            />
          </Box>
        )}

        {/* Player Notes */}
        {paymentRecord.proofNotes && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('playerNotes')}
            </Text>
            <Box
              p={3}
              bg="gray.50"
              borderRadius="md"
              fontSize="sm"
              color="gray.700"
            >
              {paymentRecord.proofNotes}
            </Box>
          </Box>
        )}

        {/* Host Notes Input */}
        {canApproveOrReject && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('hostNotes')}
            </Text>
            <Textarea
              placeholder={t('hostNotesPlaceholder')}
              value={hostNotes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setHostNotes(e.target.value)
              }
              rows={2}
              resize="none"
              disabled={isLoading}
            />
          </Box>
        )}

        {/* Existing Host Notes (if already processed) */}
        {!canApproveOrReject && paymentRecord.hostNotes && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('hostNotes')}
            </Text>
            <Box
              p={3}
              bg="gray.50"
              borderRadius="md"
              fontSize="sm"
              color="gray.700"
            >
              {paymentRecord.hostNotes}
            </Box>
          </Box>
        )}
      </VStack>
    </VModal>
  );
}
