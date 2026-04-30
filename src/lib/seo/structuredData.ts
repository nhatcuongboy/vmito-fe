/**
 * Utility functions to generate Schema.org structured data
 * for SEO and rich snippets in search engines
 */

const SITE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://vmito.com'
    : 'http://localhost:3000';

/**
 * Generate WebSite schema with Sitelinks Search Box
 * This enables the search box to appear in Google search results
 */
export function generateWebsiteSchema(locale: string = 'vi') {
  const searchUrl =
    locale === 'vi' ? `${SITE_URL}/vi/search` : `${SITE_URL}/${locale}/search`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vmito',
    alternateName: 'Vmito — Tìm kèo cầu lông',
    url: SITE_URL,
    description:
      'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam. Dạy sớm healthy, cầu lông dưỡng sinh, giao lưu cuối tuần.',
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Organization schema
 * This provides information about Vmito as an organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vmito',
    url: SITE_URL,
    logo: `${SITE_URL}/icons/app-logo.png`,
    description:
      'Nền tảng tìm kèo cầu lông, giao lưu và quản lý giải đấu hàng đầu tại Việt Nam',
    foundingDate: '2024',
    sameAs: [
      // Add social media links here when available
      // 'https://facebook.com/vmito',
      // 'https://twitter.com/vmito',
      // 'https://instagram.com/vmito',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Vietnamese', 'English'],
    },
  };
}

/**
 * Generate BreadcrumbList schema
 * Helps search engines understand the page hierarchy
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate SportsEvent schema for badminton sessions
 * Used on session detail pages
 */
export function generateSportsEventSchema(session: {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  maxPlayers?: number;
  currentPlayers?: number;
  price?: number;
  organizer?: {
    name: string;
    image?: string;
  };
}) {
  const eventUrl = `${SITE_URL}/sessions/${session.id}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: session.title,
    description: session.description || session.title,
    startDate: session.startTime,
    sport: 'Badminton',
    url: eventUrl,
  };

  if (session.endTime) {
    schema.endDate = session.endTime;
  }

  if (session.location) {
    schema.location = {
      '@type': 'Place',
      name: session.location.name || 'Sân cầu lông',
      address: session.location.address
        ? {
            '@type': 'PostalAddress',
            streetAddress: session.location.address,
            addressCountry: 'VN',
          }
        : undefined,
      geo:
        session.location.latitude && session.location.longitude
          ? {
              '@type': 'GeoCoordinates',
              latitude: session.location.latitude,
              longitude: session.location.longitude,
            }
          : undefined,
    };
  }

  if (session.organizer) {
    schema.organizer = {
      '@type': 'Person',
      name: session.organizer.name,
      image: session.organizer.image,
    };
  }

  if (session.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: session.price,
      priceCurrency: 'VND',
      availability:
        session.currentPlayers && session.maxPlayers
          ? session.currentPlayers < session.maxPlayers
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
    };
  }

  if (session.maxPlayers) {
    schema.maximumAttendeeCapacity = session.maxPlayers;
  }

  if (session.currentPlayers !== undefined) {
    schema.attendeeCount = session.currentPlayers;
  }

  return schema;
}

/**
 * Generate LocalBusiness schema for sports venues
 * Used on venue/court pages
 */
export function generateLocalBusinessSchema(venue: {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  openingHours?: string[];
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
}) {
  const venueUrl = `${SITE_URL}/venues/${venue.id}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: venue.name,
    description: venue.description,
    url: venueUrl,
  };

  if (venue.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      addressCountry: 'VN',
    };
  }

  if (venue.latitude && venue.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: venue.latitude,
      longitude: venue.longitude,
    };
  }

  if (venue.phone) {
    schema.telephone = venue.phone;
  }

  if (venue.website) {
    schema.url = venue.website;
  }

  if (venue.openingHours && venue.openingHours.length > 0) {
    schema.openingHoursSpecification = venue.openingHours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: hours.split('-')[0],
      closes: hours.split('-')[1],
    }));
  }

  if (venue.priceRange) {
    schema.priceRange = venue.priceRange;
  }

  if (venue.rating && venue.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: venue.rating,
      reviewCount: venue.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}
