import { useEffect, useState } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { LocationOption } from '@/lib/vietnam-locations';

interface NewAdminUnit {
  city: string;
  wards: string[];
}

// Module-level cache: the canonical Tỉnh/Thành -> Phường/Xã list is static
// for the lifetime of the app, so every form instance shares one fetch
// instead of re-requesting it on every mount.
let cache: NewAdminUnit[] | null = null;
let inflight: Promise<NewAdminUnit[]> | null = null;

function fetchNewAdminUnits(): Promise<NewAdminUnit[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = VenueService.getNewAdminUnits()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Provides the dropdown options for the new-era (post Nghị quyết 60)
 * Tỉnh/Thành phố + Phường/Xã fields, replacing free-text input so admins
 * can't typo an administrative unit name that doesn't exist.
 */
export function useNewAdminUnits() {
  const [units, setUnits] = useState<NewAdminUnit[]>(cache ?? []);
  const [isLoading, setIsLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setUnits(cache);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    fetchNewAdminUnits().then((data) => {
      if (active) {
        setUnits(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const cityOptions: LocationOption[] = units.map((u) => ({
    value: u.city,
    label: u.city,
  }));

  const getWardsByCity = (city?: string): LocationOption[] => {
    if (!city) return [];
    const unit = units.find((u) => u.city === city);
    return unit ? unit.wards.map((w) => ({ value: w, label: w })) : [];
  };

  return { cityOptions, getWardsByCity, isLoading };
}
