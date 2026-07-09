import { Metadata } from 'next';
import { cache } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { formatVenueFullName } from '@/utils';
import VenueDetailClient from './VenueDetailClient';

const BASE_URL = 'https://vmito.com';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

interface VenueSeoMessages {
  fullNameFormat: Record<string, string>;
  seo: {
    courtsCount: string;
    openingHours: string;
    fallbackTitle: string;
    fallbackDescription: string;
  };
}

const getVenue = cache(async (id: string): Promise<Venue | null> => {
  try {
    return await VenueService.getVenue(id);
  } catch {
    return null;
  }
});

const getVenueMessages = async (locale: string): Promise<VenueSeoMessages> => {
  const messages = (await import(`@/i18n/messages/${locale || 'vi'}.json`))
    .default;
  return messages.venue as VenueSeoMessages;
};

/**
 * Full localized venue name with sport prefix/suffix (e.g. vi "Sân cầu lông
 * Nhật Cường", en "Nhật Cường Badminton Court"). Must match what the detail
 * page UI renders so the search-engine title equals the on-page name.
 */
const getFullVenueName = (venue: Venue, venueMessages: VenueSeoMessages) => {
  const pattern =
    venueMessages.fullNameFormat[venue.sportType ?? 'BADMINTON'] ??
    venueMessages.fullNameFormat.BADMINTON;
  return formatVenueFullName(venue.name, pattern);
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const venueMessages = await getVenueMessages(locale);

  const venue = await getVenue(id);

  if (!venue) {
    return {
      title: `${venueMessages.seo.fallbackTitle} | Vmito`,
      description: venueMessages.seo.fallbackDescription,
      openGraph: {
        images: ['/og-image.png'],
      },
    };
  }

  const venueName = getFullVenueName(venue, venueMessages);
  const title = `${venueName} | Vmito`;

  const descriptionParts = [venueName];
  if (venue.address) descriptionParts.push(venue.address);
  if (venue.district && venue.city)
    descriptionParts.push(`${venue.district}, ${venue.city}`);
  else if (venue.city) descriptionParts.push(venue.city);
  if (venue.numberOfCourts)
    descriptionParts.push(
      venueMessages.seo.courtsCount.replace(
        '{count}',
        String(venue.numberOfCourts)
      )
    );
  if (venue.openingHours)
    descriptionParts.push(
      venueMessages.seo.openingHours.replace('{hours}', venue.openingHours)
    );
  const description = descriptionParts.join(' - ');

  const images = venue.coverPhoto ? [venue.coverPhoto] : [DEFAULT_COVER_PHOTO];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const venue = await getVenue(id);

  if (!venue) {
    return <VenueDetailClient initialVenue={venue} />;
  }

  const venueMessages = await getVenueMessages(locale);
  const venueName = getFullVenueName(venue, venueMessages);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: venueName,
    ...(venue.description ? { description: venue.description } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      ...(venue.district ? { addressLocality: venue.district } : {}),
      ...(venue.city ? { addressRegion: venue.city } : {}),
      addressCountry: 'VN',
    },
    url: `${BASE_URL}/${locale || 'vi'}/venues/${venue.slug ?? venue.id}`,
    ...(venue.phone ? { telephone: venue.phone } : {}),
    ...(venue.openingHours ? { openingHours: venue.openingHours } : {}),
    ...(venue.coverPhoto ? { image: venue.coverPhoto } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VenueDetailClient initialVenue={venue} />
    </>
  );
}
