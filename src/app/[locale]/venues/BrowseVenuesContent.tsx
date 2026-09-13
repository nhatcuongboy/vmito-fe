'use client';

import React, { Suspense } from 'react';
import VenueSearchList from '@/components/venue/VenueSearchList';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import type { VenueBrowseSeed } from '@/lib/venue-browse';
import type { ViewMode } from '@/lib/view-mode';

interface BrowseVenuesContentProps {
  seed?: VenueBrowseSeed | null;
  serverViewMode?: ViewMode;
}

export default function BrowseVenuesContent({
  seed,
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
        <VenueSearchList seed={seed} serverViewMode={serverViewMode} />
      </Suspense>
    </PageLayout>
  );
}
