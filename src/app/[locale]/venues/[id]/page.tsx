import { Metadata } from 'next';
import { cache } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { formatVenueName } from '@/utils';
import VenueDetailClient from './VenueDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

const getVenue = cache(async (id: string): Promise<Venue | null> => {
  try {
    return await VenueService.getVenue(id);
  } catch (error) {
    return null;
  }
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const messages = (await import(`@/i18n/messages/${locale || 'vi'}.json`))
    .default;
  const nameFormat = messages.venue.nameFormat;

  const venue = await getVenue(id);

  if (!venue) {
    return {
      title: 'Sân cầu lông | Vmito',
      description:
        'Xem thông tin chi tiết sân cầu lông trên Vmito - nền tảng quản lý kèo cầu lông.',
      openGraph: {
        images: ['/og-image.png'],
      },
    };
  }

  const venueName = formatVenueName(venue.name, nameFormat);
  const title = `${venueName} | Vmito`;

  const descriptionParts = [venueName];
  if (venue.address) descriptionParts.push(venue.address);
  if (venue.district && venue.city)
    descriptionParts.push(`${venue.district}, ${venue.city}`);
  else if (venue.city) descriptionParts.push(venue.city);
  if (venue.numberOfCourts)
    descriptionParts.push(`${venue.numberOfCourts} sân`);
  if (venue.openingHours)
    descriptionParts.push(`Mở cửa: ${venue.openingHours}`);
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
  const { id } = await params;
  const venue = await getVenue(id);

  return <VenueDetailClient initialVenue={venue} />;
}
