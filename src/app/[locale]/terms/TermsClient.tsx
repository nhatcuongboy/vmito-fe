'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Suspense } from 'react';

interface Section {
  heading: string;
  body: string;
}

function TermsContent() {
  const common = useTranslations('common');
  const t = useTranslations('pages.terms');
  const home = useTranslations('pages.home');

  const sections = t.raw('sections') as Section[];

  return (
    <PageWrapper>
      <TopBar showBackButton title={t('title')} />
      <Box
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
      >
        <Container maxW="container.md" py={{ base: 6, md: 10 }}>
          <Stack gap={2} mb={8}>
            <Heading size={{ base: 'lg', md: 'xl' }}>{t('title')}</Heading>
            <Text color="fg.muted" fontSize="sm" suppressHydrationWarning>
              {t('lastUpdated')}
            </Text>
          </Stack>

          <Text mb={8} color="fg.muted" lineHeight="tall">
            {t('intro')}
          </Text>

          <Stack gap={8}>
            {sections.map((section, index) => (
              <Box key={index}>
                <Heading size="md" mb={3}>
                  {section.heading}
                </Heading>
                <Text color="fg.muted" lineHeight="tall" whiteSpace="pre-line">
                  {section.body}
                </Text>
              </Box>
            ))}
          </Stack>

          <Box
            mt={12}
            pt={6}
            borderTopWidth="1px"
            pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
          >
            <Flex direction="column" align="center">
              <Text color="fg.muted" fontSize="sm" suppressHydrationWarning>
                © {new Date().getFullYear()} {common('appName')}.{' '}
                {home('copyright')}
              </Text>
            </Flex>
          </Box>
        </Container>
      </Box>
    </PageWrapper>
  );
}

export default function TermsClient() {
  return (
    <Suspense>
      <TermsContent />
    </Suspense>
  );
}
