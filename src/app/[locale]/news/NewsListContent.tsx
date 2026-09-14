'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Container, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, SimpleGrid } from '@/components/ui/chakra-compat';
import { useLocale, useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import AppEmptyState from '@/components/ui/AppEmptyState';
import ArticleCard from '@/components/news/ArticleCard';
import ArticleCardSkeletonGrid from '@/components/news/ArticleCardSkeletonGrid';
import { Link } from '@/i18n/config';
import { Locale } from '@/i18n/locales';
import { NewsService } from '@/lib/api/news.service';
import {
  ARTICLE_CATEGORIES,
  EArticleCategory,
  IArticleCategoryCount,
  IArticleSummary,
} from '@/types/news';

interface NewsListContentProps {
  initialArticles: IArticleSummary[];
  initialTotal: number;
  initialTotalPages: number;
  pageSize: number;
  categoryCounts: IArticleCategoryCount[];
  hasLoadError: boolean;
}

const isKnownCategory = (value: string | null): value is EArticleCategory =>
  !!value && (Object.values(EArticleCategory) as string[]).includes(value);

export default function NewsListContent({
  initialArticles,
  initialTotal,
  initialTotalPages,
  pageSize,
  categoryCounts,
  hasLoadError,
}: NewsListContentProps) {
  const t = useTranslations('pages.news');
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get('category');
  const category = isKnownCategory(categoryParam) ? categoryParam : undefined;
  const tag = searchParams.get('tag') ?? undefined;
  const isFiltered = Boolean(category || tag);

  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // The server already rendered the unfiltered first page, so skip the
  // redundant refetch on mount when no filter is active.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isFiltered) return;
    }

    let isStale = false;

    const applyFilter = async () => {
      setIsFilterLoading(true);
      try {
        const result = await NewsService.getArticles({
          locale,
          limit: pageSize,
          ...(category ? { category } : {}),
          ...(tag ? { tag } : {}),
        });
        if (isStale) return;
        setArticles(result.items);
        setTotalPages(result.totalPages);
        setPage(1);
      } finally {
        if (!isStale) setIsFilterLoading(false);
      }
    };

    void applyFilter();

    // A newer filter must win even if an older request resolves after it.
    return () => {
      isStale = true;
    };
  }, [category, isFiltered, locale, pageSize, tag]);

  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const next = await NewsService.getArticles({
        locale,
        limit: pageSize,
        page: page + 1,
        ...(category ? { category } : {}),
        ...(tag ? { tag } : {}),
      });
      setArticles((prev) => [...prev, ...next.items]);
      setPage((prev) => prev + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [category, hasMore, isLoadingMore, locale, page, pageSize, tag]);

  // The newest article leads the page; the rest fill the grid beneath it.
  const [lead, ...rest] = articles;

  return (
    <MainLayout title={t('title')}>
      <Box bg="bg.subtle" minH="100%">
        <Container maxW="container.xl" py={{ base: 5, md: 8 }}>
          <Box mb={{ base: 5, md: 7 }}>
            <Heading size="xl" textWrap="balance">
              {t('title')}
            </Heading>
            <Text color="fg.muted" mt={1}>
              {t('subtitle')}
            </Text>
          </Box>

          <Flex gap={2} mb={6} wrap="wrap" as="nav" aria-label={t('filterBy')}>
            <CategoryChip
              href="/news"
              label={t('allCategories')}
              count={initialTotal}
              isActive={!category && !tag}
            />
            {ARTICLE_CATEGORIES.map((entry) => {
              const count =
                categoryCounts.find((row) => row.category === entry)?.count ??
                0;
              if (count === 0) return null;
              return (
                <CategoryChip
                  key={entry}
                  href={`/news?category=${entry}`}
                  label={t(`categories.${entry}`)}
                  count={count}
                  isActive={category === entry}
                />
              );
            })}
          </Flex>

          {isFilterLoading ? (
            <ArticleCardSkeletonGrid />
          ) : articles.length === 0 ? (
            <AppEmptyState
              title={hasLoadError ? t('loadErrorTitle') : t('emptyTitle')}
              description={
                hasLoadError ? t('loadErrorDescription') : t('emptyDescription')
              }
            />
          ) : (
            <>
              <Box mb={{ base: 4, md: 6 }}>
                <ArticleCard article={lead} featured />
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {rest.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </SimpleGrid>

              {hasMore && (
                <Flex justify="center" mt={8}>
                  <Button
                    onClick={loadMore}
                    loading={isLoadingMore}
                    variant="outline"
                  >
                    {t('loadMore')}
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Container>
      </Box>
    </MainLayout>
  );
}

/**
 * A real link rather than a button: filtering by category is a distinct URL, so
 * it stays shareable and survives a page reload.
 */
function CategoryChip({
  href,
  label,
  count,
  isActive,
}: {
  href: string;
  label: string;
  count: number;
  isActive: boolean;
}) {
  return (
    <Link href={href}>
      <Flex
        align="center"
        gap={1.5}
        px={3}
        py={1.5}
        borderRadius="full"
        borderWidth="1px"
        fontSize="sm"
        fontWeight="medium"
        bg={isActive ? 'green.500' : 'bg.panel'}
        color={isActive ? 'white' : 'fg'}
        borderColor={isActive ? 'green.500' : 'border.subtle'}
        _hover={{ borderColor: 'green.400' }}
        aria-current={isActive ? 'page' : undefined}
      >
        <span>{label}</span>
        <Text as="span" fontSize="xs" opacity={0.8}>
          {count}
        </Text>
      </Flex>
    </Link>
  );
}
