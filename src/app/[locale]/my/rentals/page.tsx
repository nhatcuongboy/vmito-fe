'use client';

import { useTranslations } from 'next-intl';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import RentalListPage from '@/components/venue-rental/RentalListPage';

export default function MyRentalsPage() {
  const t = useTranslations('venueRental');
  return (
    <ProtectedRouteGuard>
      <PageLayout title={t('myTitle')}>
        <RentalListPage />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
