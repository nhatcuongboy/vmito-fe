import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { isAxiosError } from 'axios';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { formatVenueFullName } from '@/utils';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { stripHtml } from '@/utils/string-utils';
import VenueDetailClient from './VenueDetailClient';

const BASE_URL = 'https://vmito.com';
const DEFAULT_VENUE_SEO_IMAGE = `${BASE_URL}/og-image.jpg`;

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

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
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    // A timeout or backend failure is not a missing venue. Let Next.js return
    // an error response instead of exposing an indexable soft-404 page.
    throw error;
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

const getVenueSeoImages = (venue: Venue): string[] => {
  const candidates = [
    venue.coverPhoto,
    ...(venue.images ?? []),
    venue.logo,
    venue.courtLayoutImage,
  ];

  return Array.from(
    new Set(
      candidates
        .map((image) => {
          const normalizedImage = normalizeImageUrl(image);
          if (!normalizedImage) return undefined;

          try {
            return new URL(normalizedImage, BASE_URL).toString();
          } catch {
            return undefined;
          }
        })
        .filter((image): image is string => Boolean(image))
    )
  );
};

const getVenueAddress = (venue: Venue) => ({
  streetAddress: venue.streetAddress ?? venue.address,
  addressLocality: venue.newDistrict ?? venue.district,
  addressRegion: venue.newCity ?? venue.city,
});

const getPlainDescription = (description?: string) =>
  stripHtml(description)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSchemaTime = (
  hoursText: string,
  minutesText: string,
  isClosingTime: boolean
): string | null => {
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  if (hours === 24 && minutes === 0 && isClosingTime) {
    return '23:59';
  }

  if (hours < 0 || hours > 23) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getOpeningHoursSpecification = (openingHours?: string) => {
  if (!openingHours) return null;

  const match = openingHours.match(
    /^\s*(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})\s*$/
  );
  if (!match) return null;

  const opens = normalizeSchemaTime(match[1], match[2], false);
  const closes = normalizeSchemaTime(match[3], match[4], true);
  if (!opens || !closes) return null;

  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ALL_DAYS,
    opens,
    closes,
  };
};

const getPriceRange = (venue: Venue): string | null => {
  const rates = [venue.hourlyRateFixed, venue.hourlyRateWalkIn]
    .filter((rate): rate is number => typeof rate === 'number' && rate > 0)
    .sort((left, right) => left - right);

  if (rates.length === 0) return null;
  if (rates.length === 1 || rates[0] === rates[rates.length - 1]) {
    return `${rates[0]} VND/hour`;
  }

  return `${rates[0]}-${rates[rates.length - 1]} VND/hour`;
};

const getExternalWebsite = (website?: string): string | null => {
  if (!website?.trim()) return null;

  try {
    const trimmedWebsite = website.trim();
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedWebsite)
      ? trimmedWebsite
      : `https://${trimmedWebsite}`;
    const parsedUrl = new URL(candidate);
    return ['http:', 'https:'].includes(parsedUrl.protocol)
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const venueMessages = await getVenueMessages(locale);

  const venue = await getVenue(id);

  if (!venue) {
    return {
      title: venueMessages.seo.fallbackTitle,
      description: venueMessages.seo.fallbackDescription,
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        images: [DEFAULT_VENUE_SEO_IMAGE],
      },
    };
  }

  const venueName = getFullVenueName(venue, venueMessages);
  const socialTitle = `${venueName} | Vmito`;
  const venueAddress = getVenueAddress(venue);

  const descriptionParts = [venueName];
  if (venueAddress.streetAddress)
    descriptionParts.push(venueAddress.streetAddress);
  if (venueAddress.addressLocality && venueAddress.addressRegion)
    descriptionParts.push(
      `${venueAddress.addressLocality}, ${venueAddress.addressRegion}`
    );
  else if (venueAddress.addressRegion)
    descriptionParts.push(venueAddress.addressRegion);
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

  const venueImages = getVenueSeoImages(venue);
  const primaryImage = venueImages[0] ?? DEFAULT_VENUE_SEO_IMAGE;
  const images = [
    {
      url: primaryImage,
      alt: venueName,
    },
  ];

  const venueSlug = venue.slug ?? venue.id;
  const canonicalUrl = `${BASE_URL}/${locale || 'vi'}/venues/${venueSlug}`;

  return {
    title: venueName,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        vi: `${BASE_URL}/vi/venues/${venueSlug}`,
        en: `${BASE_URL}/en/venues/${venueSlug}`,
        'zh-Hans': `${BASE_URL}/cn/venues/${venueSlug}`,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images,
    },
  };
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const venue = await getVenue(id);

  if (!venue) {
    notFound();
  }

  const venueMessages = await getVenueMessages(locale);
  const venueName = getFullVenueName(venue, venueMessages);
  const venueSlug = venue.slug ?? venue.id;
  const canonicalUrl = `${BASE_URL}/${locale || 'vi'}/venues/${venueSlug}`;
  const venueImages = getVenueSeoImages(venue);
  const venueAddress = getVenueAddress(venue);
  const plainDescription = getPlainDescription(venue.description);
  const openingHoursSpecification = getOpeningHoursSpecification(
    venue.openingHours
  );
  const priceRange = getPriceRange(venue);
  const externalWebsite = getExternalWebsite(venue.website);
  const hasGeoCoordinates =
    typeof venue.lat === 'number' && typeof venue.lng === 'number';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${canonicalUrl}#venue`,
    name: venueName,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    ...(plainDescription ? { description: plainDescription } : {}),
    ...(venueImages.length > 0 ? { image: venueImages } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: venueAddress.streetAddress,
      ...(venueAddress.addressLocality
        ? { addressLocality: venueAddress.addressLocality }
        : {}),
      ...(venueAddress.addressRegion
        ? { addressRegion: venueAddress.addressRegion }
        : {}),
      addressCountry: 'VN',
    },
    ...(hasGeoCoordinates
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: venue.lat,
            longitude: venue.lng,
          },
        }
      : {}),
    ...(venue.phone ? { telephone: venue.phone } : {}),
    ...(openingHoursSpecification ? { openingHoursSpecification } : {}),
    ...(priceRange ? { priceRange } : {}),
    ...(externalWebsite ? { sameAs: externalWebsite } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <VenueDetailClient initialVenue={venue} />
    </>
  );
}
