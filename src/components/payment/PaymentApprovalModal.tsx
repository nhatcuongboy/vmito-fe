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
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { VModal } from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { VSelect } from '@/components/ui/VSelect';
import AppLightbox from '@/components/ui/AppLightbox';
import dayjs, { getDayjsLocale } from '@/lib/dayjs';
import {
  PaymentRecord,
  PaymentMethod,
  PaymentStatus,
  IPaymentReminder,
} from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { Check, X, User, ZoomIn, BellRing } from 'lucide-react';
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
  onRemind?: (paymentId: string) => Promise<void>;
  reminderInfo?: IPaymentReminder | null;
  slotInfo?: string;
}

export default function PaymentApprovalModal({
  isOpen,
  onClose,
  paymentRecord,
  onApprove,
  onReject,
  onRemind,
  reminderInfo,
  slotInfo,
}: PaymentApprovalModalProps) {
  const t = useTranslations('payment');
  const tReminder = useTranslations('paymentReminder');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dayjsLocale = getDayjsLocale(locale);

  const [hostNotes, setHostNotes] = useState(paymentRecord.hostNotes || '');
  const [customAmount, setCustomAmount] = useState(
    String(paymentRecord.amount)
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethod | ''
  >(paymentRecord.paymentMethod ?? '');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const [isProofLightboxOpen, setIsProofLightboxOpen] = useState(false);

  const isAmountModified =
    Number(customAmount || 0) !== Number(paymentRecord.amount);

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

  const handleRemind = async () => {
    if (!onRemind) return;
    setIsReminding(true);
    try {
      await onRemind(paymentRecord.id);
    } finally {
      setIsReminding(false);
    }
  };

  const player = paymentRecord.player;
  const isLoading = isApproving || isRejecting || isReminding;
  const canRemind =
    Boolean(onRemind) &&
    paymentRecord.status === PaymentStatus.PENDING &&
    Boolean(player?.user?.id);

  const sessionContext = [
    paymentRecord.session?.name,
    paymentRecord.session?.startTime
      ? dayjs(paymentRecord.session.startTime)
          .locale(dayjsLocale)
          .format('DD/MM/YYYY')
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

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
      description={sessionContext || undefined}
      size="md"
      hideSecondaryAction
      footer={
        <HStack gap={2} w="full">
          <Button
            colorPalette="red"
            variant="outline"
            flex={1}
            onClick={handleReject}
            loading={isRejecting}
            disabled={isApproving || isReminding}
          >
            <X size={16} />
            <Text ml={1}>{t('rejectPayment')}</Text>
          </Button>
          <Button
            colorPalette="green"
            flex={2}
            onClick={handleApprove}
            loading={isApproving}
            disabled={isRejecting || isReminding}
          >
            <Check size={16} />
            <Text ml={1}>{t('approvePayment')}</Text>
          </Button>
        </HStack>
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
                <HStack justify="space-between" mb={1.5}>
                  <Text
                    fontSize="sm"
                    color="green.700"
                    _dark={{ color: 'green.200' }}
                    fontWeight="semibold"
                  >
                    {t('customAmount')}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t('originalAmount')}:{' '}
                    {FeeService.formatPaymentAmount(paymentRecord.amount)}
                  </Text>
                </HStack>
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
                  borderColor={isAmountModified ? 'orange.400' : undefined}
                  disabled={isLoading}
                />
                <Text
                  fontSize="xs"
                  color={isAmountModified ? 'orange.500' : 'fg.muted'}
                  mt={1}
                >
                  {t('customAmountHint')}
                </Text>
              </Box>
            </Flex>

            <Box>
              <Text fontSize="xs" color="gray.600" mb={1.5}>
                {t('receiveMethod')}
              </Text>
              <VSelect
                size="sm"
                value={selectedPaymentMethod}
                onChange={(e) =>
                  setSelectedPaymentMethod(e.target.value as PaymentMethod | '')
                }
                disabled={isLoading}
                placeholder={t('selectPlaceholder')}
                width="100%"
              >
                <option value="">{t('selectPlaceholder')}</option>
                <option value={PaymentMethod.BANK_TRANSFER}>
                  {t('method.bankTransfer')}
                </option>
                <option value={PaymentMethod.CASH}>{t('method.cash')}</option>
              </VSelect>
            </Box>

            {canRemind && (
              <Button
                colorPalette="orange"
                variant="outline"
                size="sm"
                onClick={handleRemind}
                loading={isReminding}
                disabled={isApproving || isRejecting}
              >
                <BellRing size={14} />
                <Text ml={1}>{t('remindPayment')}</Text>
              </Button>
            )}

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
                  {dayjs(paymentRecord.submittedAt)
                    .locale(dayjsLocale)
                    .format('DD/MM/YYYY HH:mm')}
                </Text>
              </Flex>
            )}

            {reminderInfo && (
              <Flex
                justify="space-between"
                align="center"
                gap={3}
                pt={2}
                borderTop="1px solid"
                borderColor="green.100"
                _dark={{ borderColor: 'green.800' }}
              >
                <Text
                  fontSize="xs"
                  color="orange.600"
                  _dark={{ color: 'orange.300' }}
                >
                  {tReminder('lastRemindedAt')}
                </Text>
                <Text fontSize="xs" fontWeight="medium" textAlign="right">
                  {dayjs(reminderInfo.lastRemindedAt)
                    .locale(dayjsLocale)
                    .format('DD/MM/YYYY HH:mm')}{' '}
                  ·{' '}
                  {tReminder('reminderCount', {
                    count: reminderInfo.reminderCount,
                  })}
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
                <Box
                  position="relative"
                  display="inline-block"
                  cursor="zoom-in"
                  onClick={() => setIsProofLightboxOpen(true)}
                  _hover={{ opacity: 0.9 }}
                >
                  <Image
                    src={paymentRecord.proofImageUrl}
                    alt="Payment proof"
                    maxH="220px"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  />
                  <Flex
                    position="absolute"
                    bottom={2}
                    right={2}
                    align="center"
                    justify="center"
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg="blackAlpha.600"
                    color="white"
                  >
                    <ZoomIn size={14} />
                  </Flex>
                </Box>
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
          {paymentRecord.status === PaymentStatus.REJECTED &&
            paymentRecord.hostNotes && (
              <Box
                mb={2}
                p={2}
                bg="red.50"
                _dark={{ bg: 'red.950' }}
                borderRadius="md"
              >
                <Text
                  fontSize="xs"
                  color="red.600"
                  _dark={{ color: 'red.300' }}
                >
                  {t('previousHostNote')}: “{paymentRecord.hostNotes}”
                </Text>
              </Box>
            )}
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

      {isProofLightboxOpen && paymentRecord.proofImageUrl && (
        <AppLightbox
          images={[paymentRecord.proofImageUrl]}
          onClose={() => setIsProofLightboxOpen(false)}
          alt="Payment proof"
        />
      )}
    </VModal>
  );
}
