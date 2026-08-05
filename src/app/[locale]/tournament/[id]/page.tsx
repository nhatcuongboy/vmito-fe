import { Metadata } from 'next';
import { cache } from 'react';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament } from '@/lib/api/types';
import { defaultOpenGraphImage } from '@/lib/seo/metadata';
import { getPrimaryVenueDisplay } from '@/utils';

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
  const primaryVenue = getPrimaryVenueDisplay(tournament);
  const venueName = primaryVenue?.name;
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
    primaryVenue?.coverPhoto ||
    primaryVenue?.images?.[0] ||
    DEFAULT_COVER_PHOTO;
  const url = `/${locale}/tournament/${tournament.slug || id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        vi: `/vi/tournament/${tournament.slug || id}`,
        en: `/en/tournament/${tournament.slug || id}`,
        'zh-Hans': `/cn/tournament/${tournament.slug || id}`,
      },
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

const toIsoDate = (value?: Date | string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export default async function TournamentPage({ params }: PageProps) {
  const { id, locale } = await params;
  const tournament = await getTournament(id);

  const primaryVenue = tournament ? getPrimaryVenueDisplay(tournament) : null;
  const jsonLd = tournament
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: tournament.name,
        sport: 'Badminton',
        url: `https://vmito.com/${locale || 'vi'}/tournament/${tournament.slug || id}`,
        ...(toIsoDate(tournament.startDate)
          ? { startDate: toIsoDate(tournament.startDate) }
          : {}),
        ...(toIsoDate(tournament.endDate)
          ? { endDate: toIsoDate(tournament.endDate) }
          : {}),
        ...(tournament.coverPhoto ? { image: tournament.coverPhoto } : {}),
        ...(primaryVenue?.name
          ? {
              location: {
                '@type': 'Place',
                name: primaryVenue.name,
                ...(primaryVenue.address
                  ? {
                      address: {
                        '@type': 'PostalAddress',
                        streetAddress: primaryVenue.address,
                        addressCountry: 'VN',
                      },
                    }
                  : {}),
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
    </>
  );
}
