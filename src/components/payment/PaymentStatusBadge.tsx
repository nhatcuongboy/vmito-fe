'use client';

import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { PaymentStatus } from '@/lib/api/types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  PaymentStatus,
  { colorPalette: string; labelKey: string }
> = {
  [PaymentStatus.PENDING]: { colorPalette: 'yellow', labelKey: 'pending' },
  [PaymentStatus.SUBMITTED]: { colorPalette: 'blue', labelKey: 'submitted' },
  [PaymentStatus.APPROVED]: { colorPalette: 'green', labelKey: 'approved' },
  [PaymentStatus.REJECTED]: { colorPalette: 'red', labelKey: 'rejected' },
};

export default function PaymentStatusBadge({
  status,
  size = 'md',
}: PaymentStatusBadgeProps) {
  const t = useTranslations('payment.status');

  const config = statusConfig[status] || statusConfig[PaymentStatus.PENDING];

  const fontSizeMap = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  };

  return (
    <Badge
      colorPalette={config.colorPalette}
      fontSize={fontSizeMap[size]}
      px={2}
      py={0.5}
      borderRadius="md"
    >
      {t(config.labelKey)}
    </Badge>
  );
}
