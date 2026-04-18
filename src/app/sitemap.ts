import { MetadataRoute } from 'next';
import { VenueService } from '@/lib/api/venue.service';
import { ClubsService } from '@/lib/api/clubs.service';
import { VENUE_DISTRICT_ENTRIES } from '@/constants/venue-districts';

const BASE_URL = 'https://vmito.com';
const LOCALES = ['vi', 'en', 'cn'] as const;

const staticRoutes = [
  { path: '', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Static routes (3 locales each)
  for (const { path, priority, changeFrequency } of staticRoutes) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
      });
    }
  }

  // SEO landing pages: /[locale]/san-cau-long/[slug] (vi only — most SEO value)
  for (const { slug } of VENUE_DISTRICT_ENTRIES) {
    entries.push({
      url: `${BASE_URL}/vi/san-cau-long/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Dynamic venue detail pages: /[locale]/venues/[id]
  try {
    const venueResponse = await VenueService.searchVenues({
      limit: 500,
      status: 'ACTIVE',
    });
    const venues = venueResponse.data ?? [];
    for (const venue of venues) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/venues/${venue.id}`,
          lastModified: venue.updatedAt ? new Date(venue.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // API unavailable at build time — skip venue detail pages
  }

  // Dynamic club detail pages: /[locale]/clubs/[id]
  try {
    const clubResponse = await ClubsService.browseClubs({
      limit: 500,
      sortBy: 'memberCount',
      sortOrder: 'desc',
    });
    const clubs = clubResponse.items ?? [];
    for (const club of clubs) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/clubs/${club.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // API unavailable at build time — skip club detail pages
  }

  return entries;
}
