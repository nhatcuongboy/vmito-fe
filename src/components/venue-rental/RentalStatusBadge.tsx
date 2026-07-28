'use client';

import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { VenueRentalStatus } from '@/lib/api/types';

const PALETTE: Record<VenueRentalStatus, string> = {
  PENDING: 'orange',
  COUNTER_OFFERED: 'blue',
  AWAITING_DEPOSIT: 'orange',
  CONFIRMED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  COMPLETED: 'purple',
};

export default function RentalStatusBadge({
  status,
}: {
  status: VenueRentalStatus;
}) {
  const t = useTranslations('venueRental.status');
  return <Badge colorPalette={PALETTE[status]}>{t(status)}</Badge>;
}
