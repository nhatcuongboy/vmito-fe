import { Metadata } from 'next';
import { Suspense } from 'react';
import { NewsService } from '@/lib/api/news.service';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';
import { IArticleCategoryCount, IArticleSummary } from '@/types/news';
import NewsListContent from './NewsListContent';
import NewsListSkeleton from './NewsListSkeleton';

// News changes a few times a day at most — an hour of staleness buys static
// delivery for every visitor. Note this only holds because the page reads no
// searchParams: category/tag filtering happens client-side in NewsListContent,
// which would otherwise force the whole route to render per request.
export const revalidate = 3600;

const BASE_URL = 'https://vmito.com';
const PAGE_SIZE = 12;

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeMeta: Record<string, { title: string; description: string }> = {
  vi: {
    title: 'Tin tức cầu lông',
    description:
      'Tin tức, hướng dẫn kỹ thuật, review vợt và câu chuyện cộng đồng cầu lông trên Vmito.',
  },
  en: {
    title: 'Badminton news',
    description:
      'Badminton news, technique guides, gear reviews and community stories on Vmito.',
  },
  cn: {
    title: '羽毛球资讯',
    description: 'Vmito 上的羽毛球新闻、技术指南、装备评测与社区故事。',
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const meta = localeMeta[locale] ?? localeMeta.vi;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/news`,
      languages: {
        vi: `${BASE_URL}/vi/news`,
        en: `${BASE_URL}/en/news`,
        'zh-Hans': `${BASE_URL}/cn/news`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE_URL}/${locale}/news`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function NewsPage({ params }: PageProps) {
  const { locale } = await params;

  // The API is the source of truth for what exists, but it must never take the
  // list page down — an empty state is a better failure than a 500.
  let items: IArticleSummary[] = [];
  let total = 0;
  let totalPages = 1;
  let categoryCounts: IArticleCategoryCount[] = [];
  let hasLoadError = false;

  try {
    const [page, counts] = await Promise.all([
      NewsService.getArticles({ locale: locale as Locale, limit: PAGE_SIZE }),
      NewsService.getCategoryCounts(locale),
    ]);
    items = page.items;
    total = page.total;
    totalPages = page.totalPages;
    categoryCounts = counts;
  } catch {
    hasLoadError = true;
  }

  return (
    // NewsListContent reads the filter from the URL via useSearchParams, which
    // needs a Suspense boundary inside a statically rendered route.
    <Suspense fallback={<NewsListSkeleton />}>
      <NewsListContent
        initialArticles={items}
        initialTotal={total}
        initialTotalPages={totalPages}
        pageSize={PAGE_SIZE}
        categoryCounts={categoryCounts}
        hasLoadError={hasLoadError}
      />
    </Suspense>
  );
}
