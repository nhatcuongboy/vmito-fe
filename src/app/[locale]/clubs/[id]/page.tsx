import { Metadata } from 'next';
import { cache } from 'react';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub } from '@/types/club';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import ClubDetailClient from './ClubDetailClient';

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
  const { id } = await params;

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

export default async function ClubDetailPage({ params }: PageProps) {
  const { id } = await params;
  const club = await getClub(id);

  return <ClubDetailClient initialClub={club} />;
}
