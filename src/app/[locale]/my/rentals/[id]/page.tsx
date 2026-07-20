'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import VenueRentalDetail from '@/components/venue-rental/VenueRentalDetail';

export default function MyRentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('venueRental');
  return (
    <ProtectedRouteGuard>
      <PageLayout
        title={t('detailTitle')}
        showBackButton
        backHref="/my/rentals"
      >
        <VenueRentalDetail id={id} />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
