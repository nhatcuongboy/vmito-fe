import { Metadata } from 'next';
import PublicSessionDetailClient from './PublicSessionDetailClient';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import { cache } from 'react';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { formatVenueName } from '@/utils';
import StructuredData from '@/components/seo/StructuredData';
import { generateSportsEventSchema } from '@/lib/seo/structuredData';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

// Helper to fetch session safely on server - cached to deduplicate calls
const getSession = cache(async (id: string): Promise<ISession | null> => {
  try {
    // For server-side rendering, we want to fetch metadata quickly
    // Use the service directly but we could also pass custom config if needed.
    // The global axios timeout is 10s, but we want metadata to be even faster or at least safe.
    return await SessionService.getSession(id);
  } catch (error) {
    // If it's a timeout or network error, it will be logged by the interceptor in base.ts
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

  // Attempt to get session. Use a slightly shorter timeout for metadata if possible,
  // but here we rely on the global axios timeout.
  const session = await getSession(id);

  const defaultMetadata: Metadata = {
    title: 'Vmito | Quản lý kèo cầu lông chuyên nghiệp',
    description:
      'Tham gia giao lưu, quản lý kèo và giải đấu cầu lông cùng Vmito.',
    openGraph: {
      images: ['/og-image.png'],
    },
  };

  // If session is null, it could be a 404 OR a timeout.
  // In SSR, we'd rather show generic brand info than "Not Found" if it was just a technical glitch.
  if (!session) {
    // We can't easily check the error type here since getSession swallows it,
    // but we can assume if it's null, we show default brand info which is better for SEO than "Not Found"
    return {
      ...defaultMetadata,
      title: 'Chi tiết kèo cầu lông | Vmito',
    };
  }

  const title = `${session.name || 'Kèo cầu lông'}`;
  const locationName =
    (session.venue?.name
      ? formatVenueName(session.venue.name, nameFormat)
      : session.location) || 'Địa điểm chưa xác định';
  const description = `Tham gia giao lưu cầu lông cùng ${session.host?.name || 'host'} tại ${locationName}. Chi tiết: ${session.description || 'Bấm để xem chi tiết.'}`;

  const images = session.coverPhoto
    ? [session.coverPhoto]
    : [DEFAULT_COVER_PHOTO];

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

export default async function PublicSessionDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const session = await getSession(id);
  const messages = (await import(`@/i18n/messages/${locale || 'vi'}.json`))
    .default;
  const nameFormat = messages.venue.nameFormat;

  // Generate structured data if session exists
  let eventSchema = null;
  if (session) {
    const locationName =
      (session.venue?.name
        ? formatVenueName(session.venue.name, nameFormat)
        : session.location) || 'Địa điểm chưa xác định';

    // Estimate price for schema
    let price = 0;
    if (session.feeConfig?.feeType === 'FIXED') {
      price = session.feeConfig.maleFee || session.feeConfig.femaleFee || 0;
    }

    const maxPlayers = session.numberOfCourts
      ? session.numberOfCourts * (session.maxPlayersPerCourt || 4)
      : 0;
    const currentPlayers = session._count?.players || 0;

    eventSchema = generateSportsEventSchema({
      id: session.id,
      title: session.name,
      description:
        session.description || `Giao lưu cầu lông tại ${locationName}`,
      startTime: session.startTime
        ? new Date(session.startTime).toISOString()
        : new Date().toISOString(),
      endTime: session.endTime
        ? new Date(session.endTime).toISOString()
        : undefined,
      location: {
        name: locationName,
        address: session.venue?.address || session.location,
        latitude: session.venue?.lat,
        longitude: session.venue?.lng,
      },
      maxPlayers: maxPlayers > 0 ? maxPlayers : undefined,
      currentPlayers: currentPlayers,
      price: price,
      organizer: {
        name: session.host?.name || 'Host',
        image: session.host?.image || undefined,
      },
    });
  }

  return (
    <>
      {eventSchema && <StructuredData data={eventSchema} />}
      <PublicSessionDetailClient initialSession={session} />
    </>
  );
}
