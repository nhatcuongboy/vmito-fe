'use client';

import React, { Suspense } from 'react';
import VenueSearchList from '@/components/venue/VenueSearchList';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import type { Venue } from '@/lib/api/types';
import type { ViewMode } from '@/lib/view-mode';

interface BrowseVenuesContentProps {
  initialVenues?: Venue[];
  initialSeedKey?: string | null;
  serverViewMode?: ViewMode;
}

export default function BrowseVenuesContent({
  initialVenues,
  initialSeedKey,
  serverViewMode,
}: BrowseVenuesContentProps) {
  const t = useTranslations('navigation');
  return (
    <PageLayout
      title={t('browseVenues')}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
    >
      <Suspense>
        <VenueSearchList
          initialVenues={initialVenues}
          initialSeedKey={initialSeedKey}
          serverViewMode={serverViewMode}
        />
      </Suspense>
    </PageLayout>
  );
}
