'use client';

import { HStack, Text, Badge } from '@chakra-ui/react';
import { SessionFeeConfig, FeeType } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FeeDisplayProps {
  feeConfig: SessionFeeConfig | null | undefined;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'text' | 'badge';
}

export default function FeeDisplay({
  feeConfig,
  showIcon = true,
  size = 'md',
  variant = 'text',
}: FeeDisplayProps) {
  const t = useTranslations('fee');

  if (!feeConfig) {
    return null;
  }

  const displayText = FeeService.getFeeDisplayText(feeConfig);

  if (!displayText) {
    return null;
  }

  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;
  const fontSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';

  if (variant === 'badge') {
    const colorScheme =
      feeConfig.feeType === FeeType.SPLIT_EVENLY ? 'purple' : 'green';
    return (
      <Badge colorPalette={colorScheme} fontSize={fontSize}>
        {showIcon && <DollarSign size={iconSize} />}
        {displayText}
      </Badge>
    );
  }

  return (
    <HStack gap={1}>
      {showIcon && <DollarSign size={iconSize} color="#38A169" />}
      <Text fontSize={fontSize} color="green.600" fontWeight="medium">
        {displayText}
      </Text>
      {feeConfig.feeType === FeeType.FIXED && (
        <Text fontSize={fontSize} color="gray.500">
          /{t('perSlot')}
        </Text>
      )}
    </HStack>
  );
}

// Compact version for session card rows
export function FeeDisplayRow({
  feeConfig,
}: {
  feeConfig: SessionFeeConfig | null | undefined;
}) {
  const t = useTranslations('fee');

  if (!feeConfig) {
    return null;
  }

  const displayText = FeeService.getFeeDisplayText(feeConfig);

  if (!displayText) {
    return null;
  }

  return (
    <HStack gap={2}>
      <DollarSign size={16} color="#38A169" />
      <Text fontSize="sm">
        <Text as="span" fontWeight="medium" color="green.600">
          {displayText}
        </Text>
        {feeConfig.feeType === FeeType.FIXED && (
          <Text as="span" color="gray.500">
            {' '}
            /{t('perSlot')}
          </Text>
        )}
      </Text>
    </HStack>
  );
}
