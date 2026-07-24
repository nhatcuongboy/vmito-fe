import { Metadata } from 'next';
import { cache } from 'react';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub } from '@/types/club';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import ClubDetailClient from './ClubDetailClient';

const BASE_URL = 'https://vmito.com';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

const getClub = cache(async (id: string): Promise<IClub | null> => {
  try {
    return await ClubsService.getClubDetails(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;

  const club = await getClub(id);

  if (!club) {
    return {
      title: 'Câu lạc bộ cầu lông | Vmito',
      description:
        'Xem thông tin chi tiết câu lạc bộ cầu lông trên Vmito - nền tảng quản lý kèo cầu lông.',
      openGraph: {
        images: ['/og-image.png'],
      },
    };
  }

  const title = `${club.name} | Vmito`;

  const descriptionParts = [`CLB ${club.name}`];
  if (club.description) descriptionParts.push(club.description.slice(0, 120));
  if (club.location) descriptionParts.push(club.location);
  if (club.memberCount) descriptionParts.push(`${club.memberCount} thành viên`);
  if (club.host?.name) descriptionParts.push(`Host: ${club.host.name}`);
  const description = descriptionParts.join(' - ');

  const images = club.image ? [club.image] : [DEFAULT_COVER_PHOTO];

  const clubSlug = club.slug ?? club.id;
  const canonicalUrl = `${BASE_URL}/${locale || 'vi'}/clubs/${clubSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        vi: `${BASE_URL}/vi/clubs/${clubSlug}`,
        en: `${BASE_URL}/en/clubs/${clubSlug}`,
        'zh-Hans': `${BASE_URL}/cn/clubs/${clubSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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

export default async function ClubDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const club = await getClub(id);

  const jsonLd = club
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsClub',
        name: club.name,
        sport: 'Badminton',
        url: `${BASE_URL}/${locale || 'vi'}/clubs/${club.slug ?? club.id}`,
        ...(club.description ? { description: club.description } : {}),
        ...(club.image ? { image: club.image } : {}),
        ...(club.location
          ? {
              address: {
                '@type': 'PostalAddress',
                addressLocality: club.location,
                addressCountry: 'VN',
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ClubDetailClient initialClub={club} />
    </>
  );
}
