'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Container, Flex, Heading, Text } from '@chakra-ui/react';
import { Avatar } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, Clock, Eye, Link2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button, SimpleGrid } from '@/components/ui/chakra-compat';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import ArticleCard from '@/components/news/ArticleCard';
import { Link } from '@/i18n/config';
import { NewsService } from '@/lib/api/news.service';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { IArticle, IArticleSummary } from '@/types/news';
import { useArticleHeadings } from './useArticleHeadings';

interface ArticleContentProps {
  article: IArticle;
  relatedArticles: IArticleSummary[];
  canonicalUrl: string;
}

export default function ArticleContent({
  article,
  relatedArticles,
  canonicalUrl,
}: ArticleContentProps) {
  const t = useTranslations('pages.news');
  const format = useFormatter();
  const bodyRef = useRef<HTMLDivElement>(null);
  const headings = useArticleHeadings(bodyRef, article.content);

  const coverImage = normalizeImageUrl(article.coverImage ?? undefined);
  const publishedAt = article.publishedAt
    ? new Date(article.publishedAt)
    : null;

  // The page itself is statically cached, so the counter has to be bumped from
  // the browser. Once per mount, and never fatal.
  useEffect(() => {
    void NewsService.trackView(article.slug).catch(() => undefined);
  }, [article.slug]);

  const otherLocales = useMemo(
    () =>
      article.translations.filter(
        (translation) => translation.locale !== article.locale
      ),
    [article.locale, article.translations]
  );

  return (
    <MainLayout title={t('title')} showBackButton backHref="/news">
      <Box bg="bg.subtle" minH="100%">
        <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
          <Flex gap={8} align="flex-start">
            <Box flex="1" minW={0} maxW={{ base: '100%', xl: '768px' }}>
              <Box
                as="article"
                bg="bg.panel"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                overflow="hidden"
              >
                {coverImage && (
                  <Box
                    aspectRatio={16 / 9}
                    backgroundImage={`url(${coverImage})`}
                    backgroundSize="cover"
                    backgroundPosition="center"
                    role="img"
                    aria-label={article.title}
                  />
                )}

                <Box p={{ base: 4, md: 8 }}>
                  <Flex align="center" gap={2} mb={3} wrap="wrap">
                    <Badge colorPalette="green" variant="subtle">
                      {t(`categories.${article.category}`)}
                    </Badge>
                    {publishedAt && (
                      <Text fontSize="sm" color="fg.muted">
                        {format.dateTime(publishedAt, {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    )}
                    <Flex align="center" gap={1} fontSize="sm" color="fg.muted">
                      <Clock size={14} aria-hidden="true" />
                      <span>
                        {t('readingTime', {
                          minutes: article.readingTimeMinutes,
                        })}
                      </span>
                    </Flex>
                    <Flex align="center" gap={1} fontSize="sm" color="fg.muted">
                      <Eye size={14} aria-hidden="true" />
                      <span>{format.number(article.viewCount)}</span>
                    </Flex>
                  </Flex>

                  <Heading size="2xl" mb={3} textWrap="balance">
                    {article.title}
                  </Heading>

                  <Text fontSize="lg" color="fg.muted" mb={5}>
                    {article.excerpt}
                  </Text>

                  {article.author && (
                    <Flex align="center" gap={3} mb={6}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback name={article.author.name} />
                        {article.author.image && (
                          <Avatar.Image
                            src={article.author.image}
                            alt={article.author.name}
                          />
                        )}
                      </Avatar.Root>
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          {article.author.name}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {t('author')}
                        </Text>
                      </Box>
                    </Flex>
                  )}

                  <Box ref={bodyRef}>
                    <RichTextDisplay content={article.content} />
                  </Box>

                  {article.tags.length > 0 && (
                    <Flex gap={2} mt={8} wrap="wrap">
                      {article.tags.map((tag) => (
                        <Link key={tag} href={`/news?tag=${tag}`}>
                          <Badge variant="outline">#{tag}</Badge>
                        </Link>
                      ))}
                    </Flex>
                  )}

                  <Flex
                    mt={6}
                    pt={6}
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                    gap={3}
                    wrap="wrap"
                    align="center"
                  >
                    <CopyLinkButton url={canonicalUrl} />
                    {otherLocales.map((translation) => (
                      <Link
                        key={translation.locale}
                        href={`/news/${translation.slug}`}
                        locale={translation.locale}
                      >
                        <Button variant="ghost" size="sm">
                          {t(`readIn.${translation.locale}`)}
                        </Button>
                      </Link>
                    ))}
                  </Flex>
                </Box>
              </Box>

              {relatedArticles.length > 0 && (
                <Box mt={8}>
                  <Heading size="lg" mb={4}>
                    {t('relatedTitle')}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    {relatedArticles.map((related) => (
                      <ArticleCard key={related.id} article={related} />
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Box>

            {headings.length > 1 && (
              <Box
                as="nav"
                aria-label={t('tableOfContents')}
                display={{ base: 'none', xl: 'block' }}
                position="sticky"
                top="90px"
                width="260px"
                flexShrink={0}
                bg="bg.panel"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                p={4}
              >
                <Text fontSize="sm" fontWeight="semibold" mb={3}>
                  {t('tableOfContents')}
                </Text>
                <Flex direction="column" gap={2}>
                  {headings.map((heading) => (
                    <a key={heading.id} href={`#${heading.id}`}>
                      <Text
                        fontSize="sm"
                        color="fg.muted"
                        pl={heading.level === 3 ? 3 : 0}
                        _hover={{ color: 'green.500' }}
                      >
                        {heading.text}
                      </Text>
                    </a>
                  ))}
                </Flex>
              </Box>
            )}
          </Flex>
        </Container>
      </Box>
    </MainLayout>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations('pages.news');
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the URL is in the address bar anyway.
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {isCopied ? <Check size={16} /> : <Link2 size={16} />}
      {isCopied ? t('linkCopied') : t('copyLink')}
    </Button>
  );
}
