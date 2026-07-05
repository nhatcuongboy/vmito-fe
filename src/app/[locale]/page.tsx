import { Metadata } from 'next';
import {
  defaultOpenGraphImage,
  defaultSeoDescription,
} from '@/lib/seo/metadata';
import HomePageContent from './HomePageContent';
import type { ISession } from '@/lib/api/types';

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

export default async function HomePage() {
  const initialSessions = await getInitialSessions();
  return <HomePageContent initialSessions={initialSessions} />;
}
