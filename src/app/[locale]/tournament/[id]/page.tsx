import { Metadata } from 'next';
import { cache } from 'react';
import TournamentPageShell from '@/components/tournament/TournamentPageShell';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament } from '@/lib/api/types';
import { defaultOpenGraphImage } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

const getTournament = cache(async (id: string): Promise<Tournament | null> => {
  try {
    return await TournamentService.getTournament(id);
  } catch {
    return null;
  }
});

const formatTournamentDateRange = (
  startDate?: Date | string,
  endDate?: Date | string,
  locale = 'vi'
) => {
  if (!startDate) return null;

  const formatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const start = formatter.format(new Date(startDate));

  if (!endDate) return start;

  const end = formatter.format(new Date(endDate));
  return start === end ? start : `${start} - ${end}`;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const tournament = await getTournament(id);

  if (!tournament) {
    const title = 'Giải cầu lông | Vmito';
    const description =
      'Xem thông tin giải đấu cầu lông trên Vmito - nền tảng quản lý giải đấu và kèo cầu lông chuyên nghiệp.';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [defaultOpenGraphImage],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [defaultOpenGraphImage.url],
      },
    };
  }

  const title = tournament.name || 'Giải cầu lông';
  const venueName = tournament.venue?.name;
  const dateRange = formatTournamentDateRange(
    tournament.startDate,
    tournament.endDate,
    locale
  );
  const descriptionParts = ['Theo dõi giải cầu lông trên Vmito'];

  if (venueName) descriptionParts.push(venueName);
  if (dateRange) descriptionParts.push(dateRange);
  if (tournament._count?.categories)
    descriptionParts.push(`${tournament._count.categories} nội dung thi đấu`);
  if (tournament._count?.players)
    descriptionParts.push(`${tournament._count.players} vận động viên`);

  const description = descriptionParts.join(' - ');
  const image =
    tournament.coverPhoto ||
    tournament.venue?.coverPhoto ||
    tournament.venue?.images?.[0] ||
    DEFAULT_COVER_PHOTO;
  const url = `/${locale}/tournament/${tournament.slug || id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function TournamentPage() {
  return <TournamentPageShell activeSegment="home" />;
}
