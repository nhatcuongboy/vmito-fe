'use client';

import { useTranslations } from 'next-intl';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import BookingBetaBadge from '@/components/venue-rental/BookingBetaBadge';
import RentalListPage from '@/components/venue-rental/RentalListPage';

export default function MyRentalsPage() {
  const t = useTranslations('venueRental');
  return (
    <ProtectedRouteGuard>
      <PageLayout
        title={
          <>
            {t('myTitle')}
            <BookingBetaBadge ml={2} />
          </>
        }
      >
        <RentalListPage />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
