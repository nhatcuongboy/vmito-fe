import { Metadata } from 'next';
import { cache } from 'react';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub } from '@/types/club';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { stripHtml } from '@/utils/string-utils';
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

const getClubSeoImages = (club: IClub): string[] => {
  const candidates = [club.image, ...(club.images ?? []), club.logo];

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;

  if (locale !== 'vi') {
    return {
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const club = await getClub(id);

  if (!club) {
    return {
      title: 'Câu lạc bộ cầu lông',
      description:
        'Xem thông tin chi tiết câu lạc bộ cầu lông trên Vmito - nền tảng quản lý kèo cầu lông.',
      openGraph: {
        images: ['/og-image.png'],
      },
    };
  }

  const pageTitle = club.name;
  const socialTitle = `${club.name} | Vmito`;

  const descriptionParts = [`CLB ${club.name}`];
  const plainDescription = stripHtml(club.description).replace(/\s+/g, ' ');
  if (plainDescription) descriptionParts.push(plainDescription.slice(0, 120));
  if (club.location) descriptionParts.push(club.location);
  if (club.memberCount) descriptionParts.push(`${club.memberCount} thành viên`);
  if (club.host?.name) descriptionParts.push(`Host: ${club.host.name}`);
  const description = descriptionParts.join(' - ');

  const clubImages = getClubSeoImages(club);
  const primaryImage = clubImages[0] ?? DEFAULT_COVER_PHOTO;
  const images = [
    {
      url: primaryImage,
      alt: `${club.name} - Câu lạc bộ cầu lông`,
    },
  ];

  const clubSlug = club.slug ?? club.id;
  const canonicalUrl = `${BASE_URL}/vi/clubs/${clubSlug}`;

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
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

export default async function ClubDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const club = await getClub(id);

  if (locale !== 'vi') {
    return <ClubDetailClient initialClub={club} />;
  }

  const clubImages = club ? getClubSeoImages(club) : [];
  const clubDescription = club
    ? stripHtml(club.description).replace(/\s+/g, ' ')
    : '';

  const jsonLd = club
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsClub',
        name: club.name,
        sport: 'Badminton',
        url: `${BASE_URL}/vi/clubs/${club.slug ?? club.id}`,
        ...(clubDescription ? { description: clubDescription } : {}),
        ...(clubImages.length > 0 ? { image: clubImages } : {}),
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
