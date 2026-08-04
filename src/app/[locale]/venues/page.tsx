import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { cityCodeToApiName, PREFERRED_CITY_COOKIE } from '@/lib/preferred-city';
import { buildBrowseSeedKey } from '@/lib/browse-seed-key';
import {
  parseUserLocationCookie,
  USER_LOCATION_COOKIE,
} from '@/lib/user-location';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { BROWSE_CARD_COVER_TRANSFORM } from '@/lib/images/coverTransforms';
import { isValidViewMode, type ViewMode } from '@/lib/view-mode';
import type { Venue } from '@/lib/api/types';
import BrowseVenuesContent from './BrowseVenuesContent';

export const dynamic = 'force-dynamic';

const FILTER_PARAMS = [
  'q',
  'city',
  'district',
  'near',
  'sort',
  'favorite',
] as const;

interface VenueSearchResponse {
  data?: {
    data?: Venue[];
  };
}

async function getInitialVenues(
  city: string | undefined,
  location: { lat: number; lng: number }
): Promise<Venue[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.startsWith('/')) return [];

  const params = new URLSearchParams({
    closureStatus: 'OPERATING',
    lat: String(location.lat),
    lng: String(location.lng),
    sortBy: 'distance',
    sortOrder: 'asc',
    page: '1',
    limit: '12',
  });
  if (city) params.set('city', city);

  try {
    const response = await fetch(`${apiUrl}/venues/search?${params}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const json = (await response.json()) as VenueSearchResponse;
    return json.data?.data ?? [];
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const localeTitles: Record<string, string> = {
  vi: 'Tìm sân cầu lông',
  en: 'Find Badminton Courts',
  cn: '查找羽毛球场',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Tìm kiếm các sân cầu lông. Xem thông tin, giờ mở cửa, giá thuê sân.',
  en: 'Find badminton courts. View details, opening hours, and court rental prices.',
  cn: '查找羽毛球场。查看详情、开放时间和场地租用价格。',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const title = localeTitles[locale] ?? localeTitles.vi;
  const description = localeDescriptions[locale] ?? localeDescriptions.vi;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vmito.com/${locale}/venues`,
      languages: {
        vi: 'https://vmito.com/vi/venues',
        en: 'https://vmito.com/en/venues',
        'zh-Hans': 'https://vmito.com/cn/venues',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function BrowseVenuesPage({ searchParams }: PageProps) {
  const [resolvedSearchParams, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ]);
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const urlView = first(resolvedSearchParams?.view);
  const cookieView = cookieStore.get('view-mode-venues')?.value;
  const serverViewMode: ViewMode | undefined =
    cookieView && isValidViewMode(cookieView) ? cookieView : undefined;
  const effectiveViewMode =
    urlView && isValidViewMode(urlView) ? urlView : (serverViewMode ?? 'list');
  const city = cityCodeToApiName(cookieStore.get(PREFERRED_CITY_COOKIE)?.value);
  const location = parseUserLocationCookie(
    cookieStore.get(USER_LOCATION_COOKIE)?.value
  );
  const canSeed =
    effectiveViewMode !== 'map' &&
    !!location &&
    !FILTER_PARAMS.some((key) => resolvedSearchParams?.[key] !== undefined);
  const initialSeedKey = canSeed
    ? buildBrowseSeedKey({
        city,
        sortBy: 'distance',
        sortOrder: 'asc',
        location,
      })
    : null;
  const initialVenues = canSeed ? await getInitialVenues(city, location) : [];
  const lcpImage = initialVenues.length
    ? normalizeImageUrl(
        initialVenues[0].coverPhoto,
        BROWSE_CARD_COVER_TRANSFORM
      ) || DEFAULT_COVER_PHOTO
    : null;

  return (
    <>
      {lcpImage && (
        <link
          rel="preload"
          as="image"
          href={lcpImage}
          // eslint-disable-next-line react/no-unknown-property
          fetchPriority="high"
        />
      )}
      <BrowseVenuesContent
        initialVenues={initialVenues}
        initialSeedKey={initialSeedKey}
        serverViewMode={serverViewMode}
      />
    </>
  );
}
