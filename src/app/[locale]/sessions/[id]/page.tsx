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

// Helper to fetch session safely on server
async function getSession(id: string): Promise<ISession | null> {
  try {
    return await SessionService.getSession(id);
  } catch (error) {
    console.error('Failed to fetch session for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return {
      title: 'Không tìm thấy kèo | Vmito',
      description: 'Kèo cầu lông bạn tìm kiếm không tồn tại hoặc đã bị xóa.',
    };
  }

  const title = `${session.name || 'Kèo cầu lông'} | Vmito`;
  const locationName = session.venue?.name || session.location || 'Địa điểm chưa xác định';
  // Strip HTML or keep simple
  const description = `Tham gia giao lưu cầu lông cùng ${session.host?.name || 'host'} tại ${locationName}. Chi tiết: ${session.description || 'Bấm để xem chi tiết.'}`;

  const images = session.coverPhoto
    ? [session.coverPhoto]
    : ['/og-image.png']; // Fallback image

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
