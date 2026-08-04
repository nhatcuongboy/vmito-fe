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
import type { IClubListItem } from '@/types/club';
import BrowseClubsContent from './BrowseClubsContent';

export const dynamic = 'force-dynamic';

const FILTER_PARAMS = ['favorite', 'search'] as const;

interface BrowseClubsResponse {
  data?: {
    items?: IClubListItem[];
  };
}

async function getInitialClubs(
  city: string | undefined,
  location: { lat: number; lng: number }
): Promise<IClubListItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.startsWith('/')) return [];

  const params = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    sortBy: 'distance',
    sortOrder: 'asc',
    page: '1',
    limit: '12',
  });
  if (city) params.set('city', city);

  try {
    const response = await fetch(`${apiUrl}/clubs?${params}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const json = (await response.json()) as BrowseClubsResponse;
    return json.data?.items ?? [];
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const localeTitles: Record<string, string> = {
  vi: 'Câu lạc bộ cầu lông',
  en: 'Browse Badminton Clubs',
  cn: '浏览羽毛球俱乐部',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Khám phá và tham gia các câu lạc bộ cầu lông tại Việt Nam. Xem thông tin, thành viên và hoạt động của từng CLB trên Vmito.',
  en: 'Discover and join badminton clubs in Vietnam. View club details, members, and activities on Vmito.',
  cn: '探索并加入越南的羽毛球俱乐部。在 Vmito 上查看俱乐部详情、成员和活动。',
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
      canonical: `https://vmito.com/${locale}/clubs`,
      languages: {
        vi: 'https://vmito.com/vi/clubs',
        en: 'https://vmito.com/en/clubs',
        'zh-Hans': 'https://vmito.com/cn/clubs',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function BrowseClubsPage({ searchParams }: PageProps) {
  const [resolvedSearchParams, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ]);
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const urlView = first(resolvedSearchParams?.view);
  const cookieView = cookieStore.get('view-mode-clubs')?.value;
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
  const initialClubs = canSeed ? await getInitialClubs(city, location) : [];
  const lcpImage = initialClubs.length
    ? normalizeImageUrl(initialClubs[0].image, BROWSE_CARD_COVER_TRANSFORM) ||
      DEFAULT_COVER_PHOTO
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
      <BrowseClubsContent
        initialClubs={initialClubs}
        initialSeedKey={initialSeedKey}
        serverViewMode={serverViewMode}
      />
    </>
  );
}
