'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Textarea,
  Avatar,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { VModal } from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { VSelect } from '@/components/ui/VSelect';
import { PaymentRecord, PaymentMethod } from '@/lib/api/types';
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
  slotInfo?: string;
}

export default function PaymentApprovalModal({
  isOpen,
  onClose,
  paymentRecord,
  onApprove,
  onReject,
  slotInfo,
}: PaymentApprovalModalProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const [hostNotes, setHostNotes] = useState(paymentRecord.hostNotes || '');
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

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return tCommon('male');
      case 'FEMALE':
        return tCommon('female');
      case 'OTHER':
        return tCommon('other');
      case 'PREFER_NOT_TO_SAY':
        return tCommon('preferNotToSay');
      default:
        return gender || '';
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('reviewPayment')}
      size="md"
      hideSecondaryAction
      footer={
        <VStack gap={2} w="full" align="stretch">
          <SimpleGrid columns={2} gap={2}>
            <Button
              colorPalette="green"
              onClick={handleApprove}
              loading={isApproving}
              disabled={isRejecting}
            >
              <Check size={16} />
              <Text ml={1}>{t('approvePayment')}</Text>
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
          </SimpleGrid>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('cancel')}
          </Button>
        </VStack>
      }
    >
      <VStack gap={3.5} align="stretch">
        {/* Player Info */}
        <Box
          p={3.5}
          bg="gray.50"
          _dark={{ bg: 'gray.800' }}
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" justify="space-between" gap={3}>
            <HStack gap={3} flex={1} minW={0}>
              <Avatar.Root size="lg">
                {player?.user?.image ? (
                  <Avatar.Image src={player.user.image} />
                ) : (
                  <Avatar.Fallback>
                    <User size={22} />
                  </Avatar.Fallback>
                )}
              </Avatar.Root>
              <Box flex={1} minW={0}>
                <Text fontWeight="bold" fontSize="lg" lineClamp={2}>
                  {player?.name || player?.user?.name || t('unknownPlayer')}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {[getGenderText(player?.gender), slotInfo]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </Box>
            </HStack>
            <Box flexShrink={0}>
              <PaymentStatusBadge status={paymentRecord.status} />
            </Box>
          </Flex>
        </Box>

        {/* Payment Review */}
        <Box
          p={4}
          border="1px solid"
          borderColor="green.200"
          borderRadius="xl"
          bg="green.50"
          _dark={{ bg: 'green.950', borderColor: 'green.800' }}
        >
          <VStack align="stretch" gap={3}>
            <Flex
              align={{ base: 'stretch', sm: 'center' }}
              direction={{ base: 'column', sm: 'row' }}
              gap={2.5}
            >
              <Box flex={1}>
                <Text
                  fontSize="sm"
                  color="green.700"
                  _dark={{ color: 'green.200' }}
                  fontWeight="semibold"
                  mb={1.5}
                >
                  {t('customAmount')}
                </Text>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={Number(customAmount || 0).toLocaleString('vi-VN')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCustomAmount(e.target.value.replace(/[^\d]/g, ''))
                  }
                  h="44px"
                  fontSize="xl"
                  fontWeight="bold"
                  textAlign="right"
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  disabled={isLoading}
                />
              </Box>
            </Flex>

            <Box>
              <Text fontSize="xs" color="gray.600" mb={1.5}>
                {t('selectPaymentMethod')}
              </Text>
              <VSelect
                size="sm"
                value={selectedPaymentMethod}
                onChange={(e) =>
                  setSelectedPaymentMethod(e.target.value as PaymentMethod | '')
                }
                disabled={isLoading}
                placeholder={t('selectPaymentMethod')}
                width="100%"
              >
                <option value="">{t('selectPaymentMethod')}</option>
                <option value={PaymentMethod.BANK_TRANSFER}>
                  {t('method.bankTransfer')}
                </option>
                <option value={PaymentMethod.CASH}>{t('method.cash')}</option>
              </VSelect>
            </Box>

            {paymentRecord.submittedAt && (
              <Flex
                justify="space-between"
                align="center"
                gap={3}
                pt={2}
                borderTop="1px solid"
                borderColor="green.100"
                _dark={{ borderColor: 'green.800' }}
              >
                <Text fontSize="xs" color="gray.600">
                  {t('submittedAt')}
                </Text>
                <Text fontSize="xs" fontWeight="medium" textAlign="right">
                  {new Date(paymentRecord.submittedAt).toLocaleString()}
                </Text>
              </Flex>
            )}
          </VStack>
        </Box>

        {(paymentRecord.proofNotes || paymentRecord.proofImageUrl) && (
          <Box
            p={3}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            _dark={{ borderColor: 'gray.700' }}
          >
            {paymentRecord.proofNotes && (
              <Box mb={paymentRecord.proofImageUrl ? 3 : 0}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {t('playerNotes')}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                >
                  {paymentRecord.proofNotes}
                </Text>
              </Box>
            )}

            {paymentRecord.proofImageUrl && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {t('paymentProof')}
                </Text>
                <Image
                  src={paymentRecord.proofImageUrl}
                  alt="Payment proof"
                  maxH="220px"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                />
              </Box>
            )}
          </Box>
        )}

        <Box
          p={3}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          _dark={{ borderColor: 'gray.700' }}
        >
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
      </VStack>
    </VModal>
  );
}
