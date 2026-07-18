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

// The home content tree reads useSearchParams (mode switch + URL filters).
// Under static/ISR rendering Next bails out to the Suspense fallback, so the
// prerendered HTML contained only a spinner — the session cards (LCP) only
// appeared after full client hydration, and the spinner→list swap caused a
// huge layout shift. Rendering dynamically gives the server the real query
// string, so the cards are in the first HTML byte; the sessions fetch below
// is still cached for 60s so the backend isn't hit per-request.
export const dynamic = 'force-dynamic';

// Fetch the default first page of sessions on the server so the
// above-the-fold session cards (the LCP element) are present in the
// HTML instead of waiting for client-side JS + API round trip.
// Uses ISR (60s) to keep the route static and TTFB low; the client
// still revalidates on mount with the user's own filters.
async function getInitialSessions(): Promise<ISession[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  // A relative base URL (e.g. '/api') can't be fetched from the server
  if (!apiUrl || apiUrl.startsWith('/')) return [];

  try {
    const res = await fetch(
      `${apiUrl}/sessions/available?page=1&limit=12&sortBy=date&sortOrder=asc`,
      { next: { revalidate: 60 } }
    );
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
  searchParams?: Promise<{ view?: string }>;
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
  const [initialSessions, resolvedSearchParams, cookieStore] =
    await Promise.all([getInitialSessions(), searchParams, cookies()]);

  // The user's saved view-mode preference, persisted as a cookie by
  // useViewMode precisely so this server render can resolve the SAME mode
  // the client will (URL param → cookie → default 'list'). Without it the
  // first HTML used the default and hydration swapped the layout to the
  // saved mode — a visible flash on every card.
  const cookieView = cookieStore.get('view-mode-sessions')?.value;
  const savedViewMode: ViewMode | undefined =
    cookieView && isValidViewMode(cookieView) ? cookieView : undefined;

  const urlView = resolvedSearchParams?.view;
  const effectiveViewMode: ViewMode =
    urlView && isValidViewMode(urlView) ? urlView : (savedViewMode ?? 'list');

  // The first card's cover photo is the LCP element — tell the browser to
  // start fetching it before it parses down to the <img> in the body.
  // Must mirror the URL the card builds for the cover photo:
  // BaseSessionCard (grid, 800x380) / SessionCardCompact
  // COMPACT_COVER_TRANSFORM (list, 600x450).
  const lcpImage = initialSessions.length
    ? normalizeImageUrl(
        initialSessions[0].coverPhoto,
        effectiveViewMode === 'grid'
          ? { cloudinaryWidth: 800, cloudinaryHeight: 380 }
          : { cloudinaryWidth: 600, cloudinaryHeight: 450 }
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
        serverViewMode={savedViewMode}
      />
    </>
  );
}
