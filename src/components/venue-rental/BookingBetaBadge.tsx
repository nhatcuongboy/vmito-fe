'use client';

import { Badge, type BadgeProps } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

type TBookingBetaBadgeProps = Omit<BadgeProps, 'children'>;

const BookingBetaBadge = (props: TBookingBetaBadgeProps) => {
  const t = useTranslations('common');

  return (
    <Badge
      colorPalette="purple"
      size="sm"
      variant="subtle"
      borderRadius="full"
      px={2}
      fontWeight="bold"
      letterSpacing="0.02em"
      textTransform="none"
      verticalAlign="middle"
      whiteSpace="nowrap"
      data-booking-beta-badge="true"
      {...props}
    >
      {t('beta')}
    </Badge>
  );
};

export default BookingBetaBadge;
