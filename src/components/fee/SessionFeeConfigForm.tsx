'use client';

import { Box, Flex, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import { Input } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { FeeType } from '@/lib/api/types';
import { DollarSign } from 'lucide-react';
import { ChangeEvent } from 'react';

interface SessionFeeConfigFormProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  feeType: FeeType;
  onFeeTypeChange: (type: FeeType) => void;
  maleFee: number | undefined;
  onMaleFeeChange: (fee: number | undefined) => void;
  femaleFee: number | undefined;
  onFemaleFeeChange: (fee: number | undefined) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

const CustomCheckbox = ({
  isChecked,
  onChange,
  disabled,
}: {
  isChecked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) => {
  const boxSize = '24px';
  const iconSize = 16;

  return (
    <Box
      as="label"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      display="inline-flex"
      alignItems="center"
      opacity={disabled ? 0.6 : 1}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <Box
        w={boxSize}
        h={boxSize}
        border="2px solid"
        borderColor={isChecked ? 'green.500' : 'border'}
        bg={isChecked ? 'green.500' : 'transparent'}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="all 0.2s"
        _hover={{ borderColor: disabled ? undefined : 'green.600' }}
      >
        {isChecked && (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </Box>
    </Box>
  );
};

export default function SessionFeeConfigForm({
  enabled,
  onEnabledChange,
  feeType,
  onFeeTypeChange,
  maleFee,
  onMaleFeeChange,
  femaleFee,
  onFemaleFeeChange,
  notes,
  onNotesChange,
  disabled = false,
}: SessionFeeConfigFormProps) {
  const t = useTranslations('fee');

  const handleFeeChange = (
    value: string,
    setter: (fee: number | undefined) => void
  ) => {
    if (value === '') {
      setter(undefined);
      return;
    }
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numValue)) {
      setter(numValue);
    }
  };

  const formatFeeValue = (value: number | null | undefined): string => {
    if (value === undefined || value === null || value === 0) return '';
    return value.toLocaleString('vi-VN');
  };

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      p={4}
      bg={{ base: 'white', _dark: 'gray.800' }}
    >
      {/* Header with toggle */}
      <Flex justify="space-between" align="center" mb={enabled ? 4 : 0}>
        <HStack gap={2}>
          <DollarSign size={20} color="#38a169" />
          <Text fontWeight="semibold" fontSize="md">
            {t('title')}
          </Text>
        </HStack>
        <HStack gap={2}>
          <CustomCheckbox
            isChecked={enabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onEnabledChange(e.target.checked)
            }
            disabled={disabled}
          />
          <Text fontSize="sm" color="fg.muted">
            {enabled ? t('disableFee') : t('enableFee')}
          </Text>
        </HStack>
      </Flex>

      {enabled && (
        <VStack gap={4} align="stretch">
          {/* Fee Type Toggle */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {t('feeType')}
            </Text>
            <HStack gap={2}>
              <button
                type="button"
                onClick={() => !disabled && onFeeTypeChange(FeeType.FIXED)}
                disabled={disabled}
                style={{ all: 'unset' }}
              >
                <Box
                  px={4}
                  py={2}
                  borderRadius="md"
                  border="2px solid"
                  borderColor={
                    feeType === FeeType.FIXED ? 'green.500' : 'border'
                  }
                  bg={
                    feeType === FeeType.FIXED
                      ? { base: 'green.50', _dark: 'green.900/40' }
                      : 'transparent'
                  }
                  color={
                    feeType === FeeType.FIXED
                      ? { base: 'green.700', _dark: 'green.300' }
                      : 'fg'
                  }
                  fontWeight={feeType === FeeType.FIXED ? 'semibold' : 'normal'}
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  opacity={disabled ? 0.6 : 1}
                  transition="all 0.2s"
                  _hover={{ borderColor: disabled ? undefined : 'green.400' }}
                >
                  {t('fixed')}
                </Box>
              </button>
              <button
                type="button"
                onClick={() =>
                  !disabled && onFeeTypeChange(FeeType.SPLIT_EVENLY)
                }
                disabled={disabled}
                style={{ all: 'unset' }}
              >
                <Box
                  px={4}
                  py={2}
                  borderRadius="md"
                  border="2px solid"
                  borderColor={
                    feeType === FeeType.SPLIT_EVENLY ? 'green.500' : 'border'
                  }
                  bg={
                    feeType === FeeType.SPLIT_EVENLY
                      ? { base: 'green.50', _dark: 'green.900/40' }
                      : 'transparent'
                  }
                  color={
                    feeType === FeeType.SPLIT_EVENLY
                      ? { base: 'green.700', _dark: 'green.300' }
                      : 'fg'
                  }
                  fontWeight={
                    feeType === FeeType.SPLIT_EVENLY ? 'semibold' : 'normal'
                  }
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                  opacity={disabled ? 0.6 : 1}
                  transition="all 0.2s"
                  _hover={{ borderColor: disabled ? undefined : 'green.400' }}
                >
                  {t('splitEvenly')}
                </Box>
              </button>
            </HStack>
          </Box>

          {/* Fixed Price Inputs */}
          {feeType === FeeType.FIXED && (
            <HStack gap={4}>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {t('maleFee')}
                </Text>
                <HStack>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatFeeValue(maleFee)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleFeeChange(e.target.value, onMaleFeeChange)
                    }
                    disabled={disabled}
                  />
                  <Text fontSize="sm" color="fg.muted">
                    VND
                  </Text>
                </HStack>
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {t('femaleFee')}
                </Text>
                <HStack>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatFeeValue(femaleFee)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleFeeChange(e.target.value, onFemaleFeeChange)
                    }
                    disabled={disabled}
                  />
                  <Text fontSize="sm" color="fg.muted">
                    VND
                  </Text>
                </HStack>
              </Box>
            </HStack>
          )}

          {/* Split Evenly Description */}
          {feeType === FeeType.SPLIT_EVENLY && (
            <Box
              bg={{ base: 'green.50', _dark: 'green.900/30' }}
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor={{ base: 'green.200', _dark: 'green.800' }}
            >
              <Text
                fontSize="sm"
                color={{ base: 'green.700', _dark: 'green.300' }}
              >
                {t('splitDescription')}
              </Text>
            </Box>
          )}

          {/* Notes */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {t('notes')}
            </Text>
            <Textarea
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onNotesChange(e.target.value)
              }
              disabled={disabled}
              rows={2}
              resize="none"
            />
          </Box>
        </VStack>
      )}
    </Box>
  );
}
