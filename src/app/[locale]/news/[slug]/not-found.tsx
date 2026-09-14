'use client';

import { Box, Container } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

/**
 * Client component on purpose: this app never wires next-intl's server plugin
 * (no createNextIntlPlugin in next.config.ts, so `src/i18n/request.ts` is
 * inert), and translations come from NextIntlClientProvider instead. The
 * `pages.news` namespace is route-scoped, re-provided by `news/layout.tsx`,
 * which also wraps this not-found boundary.
 */
export default function ArticleNotFound() {
  const t = useTranslations('pages.news');

  return (
    <Box bg="bg.subtle" minH="100vh">
      <Container maxW="container.md" py={{ base: 10, md: 16 }}>
        <AppEmptyState
          title={t('notFoundTitle')}
          description={t('notFoundDescription')}
          actions={
            <NextLinkButton href="/news">{t('backToList')}</NextLinkButton>
          }
        />
      </Container>
    </Box>
  );
}
