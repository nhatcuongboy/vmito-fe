import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { MapPin, Clock, Hash } from 'lucide-react';
import { Venue } from '@/lib/api/types';
import { VENUE_DISTRICT_BY_SLUG } from '@/constants/venue-districts';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { formatVenueName } from '@/utils/venue-helpers';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Revalidate daily — venue data doesn't change often
export const revalidate = 86400;
// Allow on-demand generation for slugs not in generateStaticParams
export const dynamicParams = true;

// Intentionally NOT pre-rendering these pages at build time. The backend is not
// reliably reachable during the Docker/CI `next build`, so pre-rendering would
// bake empty pages that stay cached for a full day. Instead we let each page
// generate on-demand on its first request (where the API is reachable) and then
// cache via ISR (`revalidate`). `dynamicParams` above allows this.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const entry = VENUE_DISTRICT_BY_SLUG.get(slug);
  if (!entry) return { title: 'Sân cầu lông | Vmito' };

  const title = `Sân cầu lông ${entry.displayName}`;
  const description = `Danh sách sân cầu lông tại ${entry.displayName}. Xem thông tin, giá thuê sân, giờ mở cửa và đặt kèo tại Vmito.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vmito.com/${locale}/san-cau-long/${slug}`,
      languages: {
        vi: `https://vmito.com/vi/san-cau-long/${slug}`,
        en: `https://vmito.com/en/san-cau-long/${slug}`,
        'zh-Hans': `https://vmito.com/cn/san-cau-long/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

async function fetchVenues(
  district: string | null,
  city: string
): Promise<Venue[]> {
  // Server-side fetch: prefer the internal API URL to avoid public DNS loopback,
  // and never call a relative base URL ('/api') which can't be fetched from the
  // server. Uses native fetch (not the axios client) so it works reliably in SSR.
  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.startsWith('/')) return [];

  const params = new URLSearchParams({
    city,
    limit: '60',
    status: 'ACTIVE',
  });
  if (district) params.set('district', district);

  try {
    const res = await fetch(`${apiUrl}/venues/search?${params.toString()}`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.data as Venue[]) ?? [];
  } catch {
    return [];
  }
}

export default async function VenueDistrictPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const entry = VENUE_DISTRICT_BY_SLUG.get(slug);

  if (!entry) notFound();

  const venues = await fetchVenues(entry.district, entry.city);

  // JSON-LD for ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Sân cầu lông ${entry.displayName}`,
    description: `Danh sách sân cầu lông tại ${entry.displayName}`,
    numberOfItems: venues.length,
    itemListElement: venues.map((venue, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SportsActivityLocation',
        name: venue.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: venue.address,
          addressLocality: venue.district ?? entry.city,
          addressRegion: entry.city,
          addressCountry: 'VN',
        },
        url: `https://vmito.com/${locale}/venues/${venue.slug ?? venue.id}`,
        ...(venue.coverPhoto ? { image: venue.coverPhoto } : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} py={8}>
        {/* Page Header */}
        <VStack align="start" gap={2} mb={8}>
          <Heading size="xl" color="fg">
            Sân cầu lông {entry.displayName}
          </Heading>
          <Text color="fg.muted" fontSize="md">
            {venues.length > 0
              ? `Tìm thấy ${venues.length} sân cầu lông tại ${entry.displayName}`
              : `Chưa có sân cầu lông nào tại ${entry.displayName} trên Vmito`}
          </Text>
        </VStack>

        {/* Venue Grid */}
        {venues.length > 0 ? (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={5}
          >
            {venues.map((venue) => (
              <Link
                key={venue.id}
                href={`/${locale}/venues/${venue.slug ?? venue.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Box
                  bg="bg"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="xl"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{
                    boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                  }}
                  h="100%"
                >
                  {/* Cover Photo */}
                  <Box position="relative" h="160px" bg="bg.muted">
                    <Image
                      src={venue.coverPhoto ?? DEFAULT_COVER_PHOTO}
                      alt={venue.name}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                    {venue.isVerified && (
                      <Badge
                        position="absolute"
                        top={2}
                        left={2}
                        colorPalette="green"
                        variant="solid"
                        fontSize="xs"
                      >
                        Đã xác thực
                      </Badge>
                    )}
                  </Box>

                  {/* Card Content */}
                  <Box p={4}>
                    <VStack align="start" gap={2}>
                      <Heading size="sm" color="fg" lineClamp={2}>
                        {formatVenueName(venue.name, '{name}')}
                      </Heading>

                      {venue.address && (
                        <Flex gap={1} align="start">
                          <MapPin
                            size={14}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                            {[venue.address, venue.district]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        </Flex>
                      )}

                      <Flex gap={4} wrap="wrap">
                        {venue.numberOfCourts && (
                          <Flex gap={1} align="center">
                            <Hash size={12} />
                            <Text fontSize="xs" color="fg.muted">
                              {venue.numberOfCourts} sân
                            </Text>
                          </Flex>
                        )}
                        {venue.openingHours && (
                          <Flex gap={1} align="center">
                            <Clock size={12} />
                            <Text fontSize="xs" color="fg.muted">
                              {venue.openingHours}
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                    </VStack>
                  </Box>
                </Box>
              </Link>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={16}>
            <Text color="fg.muted" fontSize="lg">
              Chưa có sân nào trong khu vực này.
            </Text>
            <Text color="fg.muted" fontSize="sm" mt={2}>
              Bạn có thể{' '}
              <Link href={`/${locale}/venues`}>tìm kiếm sân cầu lông</Link> theo
              địa điểm khác.
            </Text>
          </Box>
        )}
      </Box>
    </>
  );
}
