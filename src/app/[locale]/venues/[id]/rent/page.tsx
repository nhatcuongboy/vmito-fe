'use client';

import { use, useEffect, useState } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import VenueRentalForm from '@/components/venue-rental/VenueRentalForm';
import { toaster } from '@/components/ui/toaster';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';

export default function VenueRentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('venueRental');
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    VenueService.getVenue(id)
      .then(setVenue)
      .catch(() => toaster.error({ title: t('errors.loadVenue') }))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <PageLayout
      title={t('rentTitle')}
      showBackButton
      backHref={`/venues/${venue?.slug || id}`}
    >
      {loading ? (
        <Center py={20}>
          <Spinner />
        </Center>
      ) : venue ? (
        <VenueRentalForm venue={venue} />
      ) : null}
    </PageLayout>
  );
}
