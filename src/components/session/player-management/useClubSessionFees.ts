import { useEffect, useMemo, useState } from 'react';
import { IClub, IClubFeeConfig } from '@/types/club';
import { ClubsService } from '@/lib/api/clubs.service';

const feeConfigCache = new Map<string, IClubFeeConfig | null>();
const pendingFeeConfigRequests = new Map<
  string,
  Promise<IClubFeeConfig | null>
>();

const getFeeCacheKey = (clubId: string, year: number, month: number) =>
  `${clubId}:${year}:${month}`;

const getClubFeeForMonth = (clubId: string, year: number, month: number) => {
  const cacheKey = getFeeCacheKey(clubId, year, month);

  if (feeConfigCache.has(cacheKey)) {
    return Promise.resolve(feeConfigCache.get(cacheKey) ?? null);
  }

  const pendingRequest = pendingFeeConfigRequests.get(cacheKey);
  if (pendingRequest) return pendingRequest;

  const request = ClubsService.getClubFeeForMonth(clubId, year, month)
    .then((config) => {
      feeConfigCache.set(cacheKey, config);
      return config;
    })
    .catch((error) => {
      console.error('Failed to fetch club fee:', error);
      feeConfigCache.set(cacheKey, null);
      return null;
    })
    .finally(() => {
      pendingFeeConfigRequests.delete(cacheKey);
    });

  pendingFeeConfigRequests.set(cacheKey, request);
  return request;
};

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

  const clubIdsKey = useMemo(
    () =>
      clubs
        .map((c) => c.id)
        .sort()
        .join(','),
    [clubs]
  );

  const sessionMonthKey = useMemo(() => {
    if (!sessionStartTime) return null;

    const date = new Date(sessionStartTime);
    if (Number.isNaN(date.getTime())) return null;

    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }, [sessionStartTime]);

  useEffect(() => {
    if (!enabled || !sessionMonthKey || !clubIdsKey) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const clubIds = clubIdsKey.split(',');
      const [year, month] = sessionMonthKey.split('-').map(Number);
      const entries = await Promise.all(
        clubIds.map(async (clubId) => [
          clubId,
          await getClubFeeForMonth(clubId, year, month),
        ])
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
  }, [enabled, sessionMonthKey, clubIdsKey]);

  return { feesByClubId, isLoading };
};
