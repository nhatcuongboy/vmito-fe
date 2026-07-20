'use client';

import { useCallback, useEffect, useState } from 'react';
import { Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  Venue,
  VenueCourt,
  VenueCourtBlock,
  VenueOperatingPeriod,
} from '@/lib/api/types';
import CourtBlocksSection from './CourtBlocksSection';
import CourtInventorySection from './CourtInventorySection';
import OperatingHoursSection from './OperatingHoursSection';
import SectionCard from './SectionCard';

/**
 * Loads the court configuration shared by the inventory, weekly hours and
 * blocks sections, and hands each section its slice plus a reload callback.
 * Editing state stays inside the sections so a draft in one never resets
 * another.
 */
export default function VenueCourtManagement({
  venue,
  enabled,
}: {
  venue: Venue;
  enabled: boolean;
}) {
  const t = useTranslations('venueRental.courts');
  const [courts, setCourts] = useState<VenueCourt[]>([]);
  const [periods, setPeriods] = useState<VenueOperatingPeriod[]>([]);
  const [blocks, setBlocks] = useState<VenueCourtBlock[]>([]);
  const [needsReview, setNeedsReview] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [nextCourts, schedule, nextBlocks] = await Promise.all([
        VenueRentalService.getCourts(venue.id),
        VenueRentalService.getOperatingPeriods(venue.id),
        VenueRentalService.getCourtBlocks(venue.id),
      ]);
      setCourts(nextCourts);
      setPeriods(schedule.periods);
      setNeedsReview(schedule.scheduleNeedsReview);
      setBlocks(nextBlocks);
    } catch {
      setLoadError(true);
    }
  }, [venue.id]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  if (!enabled) return null;

  if (loadError) {
    return (
      <SectionCard title={t('inventoryTitle')}>
        <VStack align="stretch" gap={2} py={2}>
          <Text fontSize="sm" color="red.600" role="alert">
            {t('loadError')}
          </Text>
          <Button size="sm" variant="outline" alignSelf="start" onClick={load}>
            {t('retry')}
          </Button>
        </VStack>
      </SectionCard>
    );
  }

  return (
    <>
      <CourtInventorySection
        venueId={venue.id}
        courts={courts}
        onReload={load}
      />
      <OperatingHoursSection
        venueId={venue.id}
        periods={periods}
        needsReview={needsReview}
        onReload={load}
      />
      <CourtBlocksSection
        venueId={venue.id}
        timezone={venue.timezone}
        courts={courts}
        blocks={blocks}
        onReload={load}
      />
    </>
  );
}
