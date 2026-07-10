import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { useTranslations } from 'next-intl';

import { ISession, Venue } from '@/lib/api/types';
import { IClub } from '@/types/club';
import { VenueService } from '@/lib/api/venue.service';
import { ClubsService } from '@/lib/api/clubs.service';
import { formatVenueName } from '@/utils';

interface UseVenueClubDataParams {
  isEditMode: boolean;
  initialData?: ISession;
  canAccessHostFeatures: boolean;
  t: ReturnType<typeof useTranslations>;
  tVenue: ReturnType<typeof useTranslations>;
}

export function useVenueClubData({
  isEditMode,
  initialData,
  canAccessHostFeatures,
  t,
  tVenue,
}: UseVenueClubDataParams) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [clubs, setClubs] = useState<IClub[]>([]);
  const [isClubsLoading, setIsClubsLoading] = useState(false);
  const [selectedVenueObj, setSelectedVenueObj] = useState<Venue | null>(
    isEditMode && initialData?.venue ? (initialData.venue as Venue) : null
  );
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Venue options: always include the currently selected venue so it shows correctly
  const venueOptions = useMemo(() => {
    const opts = venues.map((v) => ({
      value: v.id,
      label: formatVenueName(v.name, tVenue('nameFormat', { name: '{name}' })),
      sublabel: v.address,
    }));
    if (selectedVenueObj && !venues.find((v) => v.id === selectedVenueObj.id)) {
      opts.unshift({
        value: selectedVenueObj.id,
        label: formatVenueName(
          selectedVenueObj.name,
          tVenue('nameFormat', { name: '{name}' })
        ),
        sublabel: selectedVenueObj.address,
      });
    }
    return opts;
  }, [venues, selectedVenueObj, tVenue]);

  const clubOptions = useMemo(
    () => [
      { value: '', label: t('noDefaultClub') },
      ...clubs.map((club) => ({
        value: club.id,
        label: club.name,
        sublabel: club.host?.name || club.hostName || undefined,
      })),
    ],
    [clubs, t]
  );

  // Debounced venue search handler (server-side)
  const handleVenueSearch = useCallback((keyword: string) => {
    if (venueSearchTimerRef.current) clearTimeout(venueSearchTimerRef.current);
    venueSearchTimerRef.current = setTimeout(async () => {
      setIsVenueLoading(true);
      try {
        const result = await VenueService.searchVenues({
          keyword: keyword.trim() || undefined,
          limit: 100,
          sortBy: keyword.trim() ? 'relevance' : undefined,
        });
        setVenues(result.data || []);
      } catch (error) {
        console.error('Error searching venues:', error);
      } finally {
        setIsVenueLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const result = await VenueService.searchVenues({ limit: 100 });
        setVenues(result.data || []);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    if (!canAccessHostFeatures) return;

    const fetchClubs = async () => {
      try {
        setIsClubsLoading(true);
        const result = await ClubsService.getClubsToManage();
        setClubs(result);
      } catch (error) {
        console.error('Error fetching manageable clubs:', error);
        setClubs([]);
      } finally {
        setIsClubsLoading(false);
      }
    };

    fetchClubs();
  }, [canAccessHostFeatures]);

  return {
    venues,
    setVenues,
    clubs,
    isClubsLoading,
    selectedVenueObj,
    setSelectedVenueObj,
    isVenueLoading,
    venueOptions,
    clubOptions,
    handleVenueSearch,
  };
}
