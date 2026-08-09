'use client';

import { useTranslations } from 'next-intl';
import { BadgeCheck, LayoutGrid, MapPin, Navigation } from 'lucide-react';
import { PreviewCardBase } from './PreviewCardBase';
import { ROUTES } from '@/constants/routes';
import { formatVenueName } from '@/utils';
import type { Venue } from '@/lib/api/types';

interface IVenuePreviewCardProps {
  venue: Venue;
}

export const VenuePreviewCard = ({ venue }: IVenuePreviewCardProps) => {
  const t = useTranslations('previewCards');
  const tVenue = useTranslations('venue');

  const displayName = formatVenueName(
    venue.name,
    tVenue('nameFormat', { name: '{name}' })
  );

  const addressParts = [
    venue.district ?? venue.newDistrict,
    venue.city ?? venue.newCity,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <PreviewCardBase
      href={ROUTES.VENUES.DETAIL(venue.id, venue.slug)}
      image={venue.coverPhoto || venue.logo}
      title={displayName}
      subtitle={addressParts || venue.address}
      icon={<MapPin size={24} />}
      metadata={
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {venue.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <BadgeCheck size={11} />
              {t('verified')}
            </span>
          )}
          {venue.numberOfCourts && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <LayoutGrid size={12} />
              {t('courtsCount', { count: venue.numberOfCourts })}
            </span>
          )}
          {venue.distance !== undefined && venue.distance !== null && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Navigation size={12} />
              {t('distanceKm', { distance: venue.distance })}
            </span>
          )}
        </div>
      }
    />
  );
};
