import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { NewsService } from '@/lib/api/news.service';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { stripHtml } from '@/utils/string-utils';
import { IArticle } from '@/types/news';
import ArticleContent from './ArticleContent';

export const revalidate = 3600;

// Articles published after the last build are rendered on demand and then
// cached, so the build never has to know about every slug up front.
export const dynamicParams = true;

const BASE_URL = 'https://vmito.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

// hreflang uses BCP-47; the `cn` route segment is Simplified Chinese.
const HREFLANG_BY_LOCALE: Record<string, string> = {
  vi: 'vi',
  en: 'en',
  cn: 'zh-Hans',
};

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// generateMetadata and the page body both need the article; `cache` collapses
// them into a single request per render.
const getArticle = cache(
  async (slug: string): Promise<IArticle | null> => NewsService.getArticle(slug)
);

export async function generateStaticParams() {
  try {
    const entries = await NewsService.getSitemapArticles();
    // Each article exists in exactly one locale, so pre-render only that one
    // rather than the cross-product of every locale.
    return entries.map((entry) => ({
      locale: entry.locale,
      slug: entry.slug,
    }));
  } catch {
    // API unavailable at build time — every slug falls back to on-demand ISR.
    return [];
  }
}

const buildCanonical = (locale: string, slug: string) =>
  `${BASE_URL}/${locale}/news/${slug}`;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { robots: { index: false, follow: false } };
  }

  const canonical = buildCanonical(article.locale, article.slug);
  const coverImage =
    normalizeImageUrl(article.coverImage ?? undefined) ?? DEFAULT_OG_IMAGE;

  // Only the locales this article actually has a translation in.
  const languages = Object.fromEntries(
    article.translations
      .map((translation) => [
        HREFLANG_BY_LOCALE[translation.locale] ?? translation.locale,
        buildCanonical(translation.locale, translation.slug),
      ])
      .filter(([hreflang]) => Boolean(hreflang))
  );

  return {
    title: article.title,
    description: article.excerpt,
    authors: article.author ? [{ name: article.author.name }] : undefined,
    keywords: article.tags,
    alternates: {
      canonical,
      ...(Object.keys(languages).length > 1 ? { languages } : {}),
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonical,
      images: [{ url: coverImage, alt: article.title }],
      type: 'article',
      locale,
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      modifiedTime: article.updatedAt,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [coverImage],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  const related = await NewsService.getRelatedArticles(slug);
  const canonical = buildCanonical(article.locale, article.slug);
  const coverImage = normalizeImageUrl(article.coverImage ?? undefined);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${canonical}#article`,
    headline: article.title,
    description: article.excerpt,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: HREFLANG_BY_LOCALE[article.locale] ?? article.locale,
    ...(coverImage ? { image: [coverImage] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt,
    ...(article.author
      ? { author: { '@type': 'Person', name: article.author.name } }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Vmito',
      url: BASE_URL,
    },
    ...(article.tags.length > 0 ? { keywords: article.tags.join(', ') } : {}),
    articleBody: stripHtml(article.content).slice(0, 5000),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <ArticleContent
        article={article}
        relatedArticles={related}
        canonicalUrl={canonical}
      />
    </>
  );
}
