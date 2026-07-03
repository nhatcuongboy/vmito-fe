import { useEffect, useState } from 'react';
import { IClub, IClubFeeConfig } from '@/types/club';
import { ClubsService } from '@/lib/api/clubs.service';

// Per-session fee of a club for a given gender (falls back to the other
// gender's fee when only one is configured). Null = no fixed fee configured.
export const pickClubFee = (
  config: IClubFeeConfig | null | undefined,
  gender?: string | null
): number | null => {
  if (!config) return null;
  return gender === 'FEMALE'
    ? (config.femaleFeePerSession ?? config.maleFeePerSession ?? null)
    : (config.maleFeePerSession ?? config.femaleFeePerSession ?? null);
};

/**
 * Fetches the fee configs of all clubs for the month the session takes place.
 * Used to (a) filter the club dropdown to clubs with a fixed per-session fee
 * and (b) display that fee to the host (read-only).
 */
export const useClubSessionFees = (
  clubs: IClub[],
  sessionStartTime?: string | Date,
  enabled: boolean = true
) => {
  const [feesByClubId, setFeesByClubId] = useState<{
    [clubId: string]: IClubFeeConfig | null;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const clubIdsKey = clubs
    .map((c) => c.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!enabled || !sessionStartTime || clubs.length === 0) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const date = new Date(sessionStartTime);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const entries = await Promise.all(
        clubs.map(async (club) => {
          try {
            const config = await ClubsService.getClubFeeForMonth(
              club.id,
              year,
              month
            );
            return [club.id, config] as const;
          } catch (error) {
            console.error('Failed to fetch club fee:', error);
            return [club.id, null] as const;
          }
        })
      );
      if (cancelled) return;
      setFeesByClubId(Object.fromEntries(entries));
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // Refetch when the club list or session date changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionStartTime, clubIdsKey]);

  return { feesByClubId, isLoading };
};
