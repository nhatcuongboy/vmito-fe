import { Metadata } from 'next';
import { cookies } from 'next/headers';
import {
  defaultOpenGraphImage,
  defaultSeoDescription,
} from '@/lib/seo/metadata';
import HomePageContent from './HomePageContent';
import type { ISession } from '@/lib/api/types';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { isValidViewMode, type ViewMode } from '@/lib/view-mode';
import { PREFERRED_CITY_COOKIE, cityCodeToApiName } from '@/lib/preferred-city';
import {
  COMPACT_COVER_TRANSFORM,
  GRID_COVER_TRANSFORM,
} from '@/lib/images/coverTransforms';

// The home content tree reads useSearchParams (mode switch + URL filters).
// Under static/ISR rendering Next bails out to the Suspense fallback, so the
// prerendered HTML contained only a spinner — the session cards (LCP) only
// appeared after full client hydration, and the spinner→list swap caused a
// huge layout shift. Rendering dynamically gives the server the real query
// string, so the cards are in the first HTML byte; the sessions fetch below
// is still cached for 60s so the backend isn't hit per-request.
export const dynamic = 'force-dynamic';

// Query params the browse list turns into API filters. If any of them is in the
// URL we cannot faithfully reproduce the client's query here (levels and time
// ranges are even post-filtered in the browser), so we skip the server fetch
// entirely rather than seed the page with a list the client is about to
// replace. `cities` is the one exception — it is handled below.
const FILTER_PARAMS = [
  'q',
  'date',
  'districts',
  'venueId',
  'levels',
  'timeRanges',
  'minFee',
  'maxFee',
  'hasSlots',
  'minSlots',
  'splitEvenly',
  'sessionType',
  'near',
  'sort',
  'favorite',
] as const;

// Fetch the first page of sessions on the server so the above-the-fold session
// cards (the LCP element) are present in the HTML instead of waiting for
// client-side JS + an API round trip.
//
// This MUST issue the same query the client will issue on mount, or the user
// watches one list get swapped for another. The only input the client adds is
// the saved city preference, which is why it is mirrored into a cookie.
// Cached for 60s per city so the backend isn't hit per request.
async function getInitialSessions(city?: string): Promise<ISession[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  // A relative base URL (e.g. '/api') can't be fetched from the server
  if (!apiUrl || apiUrl.startsWith('/')) return [];

  const params = new URLSearchParams({
    page: '1',
    limit: '12',
    sortBy: 'date',
    sortOrder: 'asc',
  });
  if (city) params.set('city', city);

  try {
    const res = await fetch(`${apiUrl}/sessions/available?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.data ?? [];
  } catch {
    // Backend unreachable (e.g. during build) — fall back to client fetch
    return [];
  }
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const localeDescriptions: Record<string, string> = {
  vi: 'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam. Dạy sớm healthy, cầu lông dưỡng sinh, giao lưu cuối tuần.',
  en: 'Find badminton sessions, join games, and manage tournaments in Vietnam. Browse courts and connect with players near you.',
  cn: '在越南寻找羽毛球场次、加入比赛和管理锦标赛。浏览球场并与附近球员联系。',
};

const localeTitles: Record<string, string> = {
  vi: 'Tìm kèo cầu lông',
  en: 'Find Badminton Sessions',
  cn: '寻找羽毛球场次',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const title = localeTitles[locale] ?? localeTitles.vi;
  const description =
    localeDescriptions[locale] ??
    localeDescriptions.vi ??
    defaultSeoDescription;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vmito.com/${locale}`,
      languages: {
        vi: 'https://vmito.com/vi',
        en: 'https://vmito.com/en',
        'zh-Hans': 'https://vmito.com/cn',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Vmito',
      url: `/${locale}`,
      title,
      description,
      images: [defaultOpenGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultOpenGraphImage.url],
    },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const [resolvedSearchParams, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ]);

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  // The city the client will filter by on mount: an explicit ?cities= wins over
  // the saved preference, exactly as it does in FindSessionList.
  const urlCities = first(resolvedSearchParams?.cities);
  const cookieCity = cookieStore.get(PREFERRED_CITY_COOKIE)?.value;
  const initialCity = urlCities
    ? urlCities.split(',').map(cityCodeToApiName).filter(Boolean).join(',')
    : cityCodeToApiName(cookieCity);

  // Anything else in the URL means the client's query differs from ours, and
  // ?mode=auto doesn't render this list at all — seeding either would just
  // produce a flash of the wrong sessions.
  const canSeedFromServer =
    first(resolvedSearchParams?.mode) !== 'auto' &&
    !FILTER_PARAMS.some((key) => resolvedSearchParams?.[key] !== undefined);

  const initialSessions = canSeedFromServer
    ? await getInitialSessions(initialCity || undefined)
    : [];

  // The user's saved view-mode preference, persisted as a cookie by
  // useViewMode precisely so this server render can resolve the SAME mode
  // the client will (URL param → cookie → default 'list'). Without it the
  // first HTML used the default and hydration swapped the layout to the
  // saved mode — a visible flash on every card.
  const cookieView = cookieStore.get('view-mode-sessions')?.value;
  const savedViewMode: ViewMode | undefined =
    cookieView && isValidViewMode(cookieView) ? cookieView : undefined;

  const urlView = first(resolvedSearchParams?.view);
  const effectiveViewMode: ViewMode =
    urlView && isValidViewMode(urlView) ? urlView : (savedViewMode ?? 'list');

  // The first card's cover photo is the LCP element — tell the browser to
  // start fetching it before it parses down to the <img> in the body. The URL
  // must match what the card builds byte for byte or the preload is wasted,
  // so the list transform is imported rather than restated here.
  const lcpImage = initialSessions.length
    ? normalizeImageUrl(
        initialSessions[0].coverPhoto,
        effectiveViewMode === 'grid'
          ? GRID_COVER_TRANSFORM
          : COMPACT_COVER_TRANSFORM
      ) || DEFAULT_COVER_PHOTO
    : null;

  return (
    <>
      {/* React hoists this <link> into <head> */}
      {lcpImage && (
        <link
          rel="preload"
          as="image"
          href={lcpImage}
          // eslint-disable-next-line react/no-unknown-property
          fetchPriority="high"
        />
      )}
      <HomePageContent
        initialSessions={initialSessions}
        initialSessionsCity={initialCity || null}
        serverViewMode={savedViewMode}
      />
    </>
  );
}
