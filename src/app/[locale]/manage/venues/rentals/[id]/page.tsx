'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import VenueRentalDetail from '@/components/venue-rental/VenueRentalDetail';

export default function ManagedRentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('venueRental');
  return (
    <ProtectedRouteGuard>
      <PageLayout
        title={t('manageDetailTitle')}
        showBackButton
        backHref="/manage/venues"
      >
        <VenueRentalDetail id={id} manage />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
