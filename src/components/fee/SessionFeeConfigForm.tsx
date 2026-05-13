'use client';

import {
  Box,
  Flex,
  HStack,
  Text,
  Textarea,
  VStack,
  Icon,
  Collapsible,
} from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';
import { FeeType } from '@/lib/api/types';
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

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
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
      overflow="hidden"
    >
      <Collapsible.Root
        open={enabled}
        onOpenChange={(e) => onEnabledChange(e.open)}
        disabled={disabled}
      >
        <Collapsible.Trigger asChild>
          <Box
            as="button"
            w="full"
            p={4}
            cursor={disabled ? 'not-allowed' : 'pointer'}
            opacity={disabled ? 0.6 : 1}
            _hover={{
              bg: disabled ? undefined : { base: 'gray.50', _dark: 'gray.750' },
            }}
            transition="background 0.2s"
          >
            <Flex align="center" justify="space-between">
              <HStack gap={2}>
                <Icon asChild boxSize={5} color="green.500">
                  <DollarSign />
                </Icon>
                <Text fontWeight="semibold" fontSize="md">
                  {t('title')}
                </Text>
              </HStack>
              <Icon asChild boxSize={5} color="fg.muted">
                {enabled ? <ChevronUp /> : <ChevronDown />}
              </Icon>
            </Flex>
          </Box>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <VStack gap={4} align="stretch" p={6} pt={0}>
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
                    fontWeight={
                      feeType === FeeType.FIXED ? 'semibold' : 'normal'
                    }
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
                      onChange={(e) =>
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
                      onChange={(e) =>
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
                onChange={(e) => onNotesChange(e.target.value)}
                disabled={disabled}
                rows={2}
                resize="none"
              />
            </Box>
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}
