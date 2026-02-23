'use client';

import React from 'react';
import VenueSearchList from '@/components/venue/VenueSearchList';
import PageLayout from '@/components/layout/PageLayout';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function BrowseVenuesPage() {
  const t = useTranslations('navigation');
  return (
    <PageLayout
      title={t('browseVenues')}
      icon={<MapPin size={24} />}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
    >
      <VenueSearchList />
    </PageLayout>
  );
}
