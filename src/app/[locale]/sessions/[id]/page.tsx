import { Metadata } from 'next';
import PublicSessionDetailClient from './PublicSessionDetailClient';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

import { cache } from 'react';

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Attempt to get session. Use a slightly shorter timeout for metadata if possible, 
  // but here we rely on the global axios timeout.
  const session = await getSession(id);

  const defaultMetadata: Metadata = {
    title: 'Vmito | Quản lý kèo cầu lông chuyên nghiệp',
    description: 'Tham gia giao lưu, quản lý kèo và giải đấu cầu lông cùng Vmito.',
    openGraph: {
      images: ['/og-image.png'],
    }
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

  const title = `${session.name || 'Kèo cầu lông'} | Vmito`;
  const locationName = session.venue?.name || session.location || 'Địa điểm chưa xác định';
  const description = `Tham gia giao lưu cầu lông cùng ${session.host?.name || 'host'} tại ${locationName}. Chi tiết: ${session.description || 'Bấm để xem chi tiết.'}`;

  const images = session.coverPhoto
    ? [session.coverPhoto]
    : ['/og-image.png'];

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
  const { id } = await params;
  const session = await getSession(id);

  // If session not found, we still render the client component which handles its own "not found" state or loading
  // calling it with null initialSession will trigger client-side fetch (which will also fail, consistent behavior)

  let jsonLd = null;

  if (session) {
    const startTime = session.startTime ? new Date(session.startTime).toISOString() : undefined;
    const endTime = session.endTime ? new Date(session.endTime).toISOString() : undefined;

    // Estimate price for schema
    let price = 0;
    if (session.feeConfig?.feeType === 'FIXED') {
      price = session.feeConfig.maleFee || session.feeConfig.femaleFee || 0;
    }

    // Determine availability
    const maxPlayers = session.numberOfCourts ? session.numberOfCourts * (session.maxPlayersPerCourt || 4) : 0;
    const currentPlayers = session._count?.players || 0;
    const availability = (maxPlayers > 0 && currentPlayers >= maxPlayers)
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock';

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: session.name,
      description: session.description || `Giao lưu cầu lông tại ${session.venue?.name || session.location}`,
      startDate: startTime,
      endDate: endTime,
      image: session.coverPhoto ? [session.coverPhoto] : [],
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: session.venue?.name || session.location,
        address: {
          '@type': 'PostalAddress',
          streetAddress: session.venue?.address || session.location,
          addressCountry: 'VN'
        }
      },
      organizer: {
        '@type': 'Person',
        name: session.host?.name,
        image: session.host?.image
      },
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'VND',
        availability: availability,
        validFrom: session.createdAt ? new Date(session.createdAt).toISOString() : undefined,
      },
      performer: {
        '@type': 'Person',
        name: session.host?.name
      }
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PublicSessionDetailClient initialSession={session} />
    </>
  );
}
