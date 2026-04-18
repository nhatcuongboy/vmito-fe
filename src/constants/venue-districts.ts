import { VIETNAM_CITIES } from './vietnam-locations';
import { districtToSlug, slugifyVi } from '@/utils/slugify';

export interface IVenueDistrictEntry {
  /** URL slug, e.g. "binh-thanh" */
  slug: string;
  /** Vietnamese district name as stored in the Venue.district field, e.g. "Quận Bình Thạnh" */
  district: string | null;
  /** Vietnamese city name as stored in the Venue.city field, e.g. "Hồ Chí Minh" */
  city: string;
  /** Human-readable label for UI and SEO, e.g. "Bình Thạnh, TP.HCM" */
  displayName: string;
}

/**
 * All SEO landing-page entries, auto-generated from VIETNAM_CITIES.
 * Each city gets one whole-city entry + one entry per district.
 */
export const VENUE_DISTRICT_ENTRIES: IVenueDistrictEntry[] =
  VIETNAM_CITIES.flatMap((city) => {
    const citySlug = slugifyVi(city.name);
    const cityEntries: IVenueDistrictEntry[] = [
      // Whole-city page, e.g. /san-cau-long/ho-chi-minh
      {
        slug: citySlug,
        district: null,
        city: city.name,
        displayName: city.name,
      },
      // Per-district pages
      ...city.districts.map((d) => ({
        slug: districtToSlug(d.name),
        district: d.name,
        city: city.name,
        displayName: `${d.name.replace(/^(?:Quận|Huyện|Thành phố|Thị xã)\s+/, '')}, ${city.name}`,
      })),
    ];
    return cityEntries;
  });

/** Lookup map: slug → entry */
export const VENUE_DISTRICT_BY_SLUG = new Map<string, IVenueDistrictEntry>(
  VENUE_DISTRICT_ENTRIES.map((e) => [e.slug, e])
);
