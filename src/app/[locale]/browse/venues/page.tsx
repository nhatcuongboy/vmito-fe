'use client';

import React from 'react';
import VenueSearchList from '@/components/venue/VenueSearchList';
import PageLayout from '@/components/layout/PageLayout';

import { useTranslations } from 'next-intl';

export default function BrowseVenuesPage() {
  const t = useTranslations('navigation');
  return (
    <PageLayout
      title={t('browseVenues')}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
    >
      <VenueSearchList />
    </PageLayout>
  );
}
