'use client';

import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { Clock, Eye, ScrollText } from 'lucide-react';
import { Link } from '@/i18n/config';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { IArticleSummary } from '@/types/news';

interface ArticleCardProps {
  article: IArticleSummary;
  /** Lead story: reads as a wide banner on desktop, stacked on mobile. */
  featured?: boolean;
}

export default function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  const t = useTranslations('pages.news');
  const format = useFormatter();
  const coverImage = normalizeImageUrl(article.coverImage ?? undefined);

  return (
    <Box
      as="article"
      h="100%"
      bg="bg.panel"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      overflow="hidden"
      transition="box-shadow 0.2s, transform 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      <Link
        href={`/news/${article.slug}`}
        style={{ display: 'block', height: '100%' }}
      >
        {/*
          The lead story splits side-by-side from md up. Stacking it would give
          the cover the full content width, which on desktop is a ~500px tall
          band before the reader reaches a single headline.
        */}
        <Flex
          direction={featured ? { base: 'column', md: 'row' } : 'column'}
          h="100%"
        >
          <Box
            position="relative"
            flexShrink={0}
            w={featured ? { base: '100%', md: '46%' } : '100%'}
            aspectRatio={16 / 9}
            bg="bg.muted"
            backgroundImage={coverImage ? `url(${coverImage})` : undefined}
            backgroundSize="cover"
            backgroundPosition="center"
          >
            {/* Articles often ship without a cover; an empty grey block reads
                as a broken image, so fall back to a quiet placeholder. */}
            {!coverImage && (
              <Flex
                position="absolute"
                inset="0"
                align="center"
                justify="center"
                color="fg.muted"
                opacity={0.35}
                aria-hidden="true"
              >
                <ScrollText size={featured ? 40 : 28} />
              </Flex>
            )}
          </Box>

          <Flex
            direction="column"
            flex="1"
            minW={0}
            justify={featured ? 'center' : 'flex-start'}
            p={{ base: 4, md: featured ? 6 : 5 }}
          >
            <Flex align="center" gap={2} mb={2} wrap="wrap">
              <Badge colorPalette="green" variant="subtle">
                {t(`categories.${article.category}`)}
              </Badge>
              {article.publishedAt && (
                <Text fontSize="xs" color="fg.muted">
                  {format.dateTime(new Date(article.publishedAt), {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </Flex>

            <Heading
              size={featured ? { base: 'md', md: 'xl' } : 'md'}
              mb={2}
              lineClamp={2}
              textWrap="balance"
            >
              {article.title}
            </Heading>

            <Text
              fontSize="sm"
              color="fg.muted"
              lineClamp={featured ? 3 : 2}
              mb={3}
            >
              {article.excerpt}
            </Text>

            {/* Grid cards pin the meta row to the bottom so it lines up across
                a row; the centred lead card must not stretch to reach it. */}
            <Flex
              align="center"
              gap={4}
              fontSize="xs"
              color="fg.muted"
              mt={featured ? 0 : 'auto'}
            >
              <Flex align="center" gap={1}>
                <Clock size={14} aria-hidden="true" />
                <span>
                  {t('readingTime', { minutes: article.readingTimeMinutes })}
                </span>
              </Flex>
              <Flex align="center" gap={1}>
                <Eye size={14} aria-hidden="true" />
                <span>{format.number(article.viewCount)}</span>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Link>
    </Box>
  );
}
