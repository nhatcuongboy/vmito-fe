'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Textarea,
  VStack,
  Icon,
  Collapsible,
  Button,
} from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { VSwitch } from '@/components/ui/VSwitch';
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
  const [isOpen, setIsOpen] = useState(enabled);

  useEffect(() => {
    if (enabled) setIsOpen(true);
  }, [enabled]);

  const handleEnabledChange = (newEnabled: boolean) => {
    onEnabledChange(newEnabled);
    if (newEnabled) {
      setIsOpen(true);
    }
  };

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

  const feeSummary = (() => {
    if (!enabled) return t('disabledSummary');
    if (feeType === FeeType.SPLIT_EVENLY) return t('splitEvenly');

    const male = formatFeeValue(maleFee);
    const female = formatFeeValue(femaleFee);
    if (male && female) {
      return t('fixedSummaryBoth', { male, female });
    }
    if (male) return t('fixedSummaryMale', { male });
    if (female) return t('fixedSummaryFemale', { female });
    return t('enabledSummary');
  })();

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
        open={enabled && isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
        disabled={disabled}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={3}
          p={4}
          opacity={disabled ? 0.6 : 1}
        >
          <HStack gap={2} minW={0}>
            <Icon asChild boxSize={5} color="green.500" flexShrink={0}>
              <DollarSign />
            </Icon>
            <Box minW={0}>
              <Text fontWeight="semibold" fontSize="md">
                {t('title')}
              </Text>
              <Text fontSize="xs" color="fg.muted" truncate>
                {feeSummary}
              </Text>
            </Box>
          </HStack>

          <HStack gap={3} flexShrink={0}>
            <VSwitch
              checked={enabled}
              onCheckedChange={(details) =>
                handleEnabledChange(!!details.checked)
              }
              disabled={disabled}
              colorPalette="green"
              size="sm"
              aria-label={enabled ? t('disableFee') : t('enableFee')}
            />
            <Collapsible.Trigger asChild>
              <Button
                type="button"
                boxSize={9}
                minW={9}
                p={0}
                variant="ghost"
                borderRadius="md"
                color="fg.muted"
                disabled={disabled || !enabled}
                opacity={enabled ? 1 : 0.45}
                cursor={disabled || !enabled ? 'not-allowed' : 'pointer'}
                _hover={!disabled && enabled ? { bg: 'bg.muted' } : undefined}
              >
                <Icon asChild boxSize={5}>
                  {enabled && isOpen ? <ChevronUp /> : <ChevronDown />}
                </Icon>
              </Button>
            </Collapsible.Trigger>
          </HStack>
        </Flex>

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
