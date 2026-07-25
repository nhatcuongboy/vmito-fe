import { VIETNAM_CITIES } from './vietnam-locations';
import { districtToSlug, slugifyVi } from '@/utils/slugify';

// Strip the admin-unit prefix for display (e.g. "Quận Bình Thạnh" -> "Bình Thạnh"),
// but keep it for numbered districts — "Quận 7" stripped down to "7" reads as a typo.
function stripDistrictPrefix(name: string): string {
  const stripped = name.replace(/^(?:Quận|Huyện|Thành phố|Thị xã)\s+/, '');
  return /^\d+$/.test(stripped) ? name : stripped;
}

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
        displayName: `${stripDistrictPrefix(d.name)}, ${city.name}`,
      })),
    ];
    return cityEntries;
  });

/** Lookup map: slug → entry */
export const VENUE_DISTRICT_BY_SLUG = new Map<string, IVenueDistrictEntry>(
  VENUE_DISTRICT_ENTRIES.map((e) => [e.slug, e])
);
