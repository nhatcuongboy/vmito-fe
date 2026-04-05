'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { Box, Container, Flex, Text } from '@chakra-ui/react';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Suspense } from 'react';
import HeroSection from './components/HeroSection';
import UseCasesSection from './components/UseCasesSection';
import HowItWorksSection from './components/HowItWorksSection';
import FAQSection from './components/FAQSection';
import TestimonialsSection from './components/TestimonialsSection';
import CTASection from './components/CTASection';

interface AboutClientProps {
  locale: string;
}

function AboutContent() {
  const common = useTranslations('common');
  const t = useTranslations('pages.home');
  return (
    <PageWrapper>
      <TopBar showBackButton />
      <Box
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
      >
        <HeroSection />
        <UseCasesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />

        {/* Footer */}
        <Box
          bg="bg.muted"
          _dark={{ bg: 'gray.900' }}
          py={10}
          pb="calc(64px + env(safe-area-inset-bottom) + 40px)"
          borderTopWidth="1px"
        >
          <Container maxW="container.xl">
            <Flex direction="column" align="center">
              <Text color="fg.muted" fontSize="sm" suppressHydrationWarning>
                © {new Date().getFullYear()} {common('appName')}.{' '}
                {t('copyright')}
              </Text>
            </Flex>
          </Container>
        </Box>
      </Box>
    </PageWrapper>
  );
}

export default function AboutClient({ locale: _locale }: AboutClientProps) {
  return (
    <Suspense>
      <AboutContent />
    </Suspense>
  );
}
