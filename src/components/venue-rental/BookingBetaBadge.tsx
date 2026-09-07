'use client';

import { Badge, type BadgeProps } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

type TBookingBetaBadgeProps = Omit<BadgeProps, 'children'>;

const BookingBetaBadge = (props: TBookingBetaBadgeProps) => {
  const t = useTranslations('common');

  return (
    <Badge
      colorPalette="purple"
      size="xs"
      variant="subtle"
      borderRadius="full"
      px={1.5}
      py={0.5}
      fontSize="xs"
      lineHeight="1"
      fontWeight="bold"
      letterSpacing="0.01em"
      textTransform="none"
      verticalAlign="middle"
      whiteSpace="nowrap"
      flexShrink={0}
      data-booking-beta-badge="true"
      {...props}
    >
      {t('beta')}
    </Badge>
  );
};

export default BookingBetaBadge;
