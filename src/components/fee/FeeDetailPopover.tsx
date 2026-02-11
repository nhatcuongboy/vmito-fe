'use client';

import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { CommonModal, useModal } from '@/components/ui/CommonModal';
import { SessionFeeConfig, FeeType } from '@/lib/api/types';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FeeDetailPopoverProps {
  feeConfig: SessionFeeConfig;
}

export default function FeeDetailPopover({ feeConfig }: FeeDetailPopoverProps) {
  const t = useTranslations('fee');
  const { isOpen, onOpen, onClose } = useModal();

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '0 VND';
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  return (
    <>
      <Box
        as="button"
        cursor="pointer"
        color="green.500"
        _hover={{ color: 'blue.600' }}
        display="inline-flex"
        alignItems="center"
        ml={1}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
      >
        <Info size={16} />
      </Box>

      <CommonModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('title')}
        size="sm"
        hideSecondaryAction
        showFooterDivider={false}
      >
        <VStack align="stretch" gap={4}>
          {/* Fee Type */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('feeType')}
            </Text>
            <Text fontSize="sm" fontWeight="semibold">
              {feeConfig.feeType === FeeType.FIXED
                ? t('fixed')
                : t('splitEvenly')}
            </Text>
          </Box>

          {/* Fee Amounts for Fixed Type */}
          {feeConfig.feeType === FeeType.FIXED && (
            <HStack gap={4}>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('maleFee')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="green.600">
                  {formatCurrency(feeConfig.maleFee)}
                </Text>
              </Box>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('femaleFee')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="green.600">
                  {formatCurrency(feeConfig.femaleFee)}
                </Text>
              </Box>
            </HStack>
          )}

          {/* Split Evenly Description */}
          {feeConfig.feeType === FeeType.SPLIT_EVENLY && (
            <Box
              bg="blue.50"
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor="blue.200"
            >
              <Text fontSize="sm" color="green.700">
                {t('splitDescription')}
              </Text>
            </Box>
          )}

          {/* Notes */}
          {feeConfig.notes && (
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('notes')}
              </Text>
              <Text fontSize="sm" lineHeight="tall">
                {feeConfig.notes}
              </Text>
            </Box>
          )}
        </VStack>
      </CommonModal>
    </>
  );
}
