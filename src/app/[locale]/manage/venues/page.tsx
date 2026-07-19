'use client';

import { useTranslations } from 'next-intl';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import RentalListPage from '@/components/venue-rental/RentalListPage';

export default function ManagedVenueRentalsPage() {
  const t = useTranslations('venueRental');
  return (
    <ProtectedRouteGuard>
      <PageLayout title={t('manageTitle')}>
        <RentalListPage manage />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
