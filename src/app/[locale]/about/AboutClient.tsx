'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Box, Container, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Suspense } from 'react';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import UseCasesSection from './components/UseCasesSection';
import HowItWorksSection from './components/HowItWorksSection';
import TestimonialsSection from './components/TestimonialsSection';
import CTASection from './components/CTASection';

interface AboutClientProps {
  locale: string;
}

function AboutContent({ locale }: AboutClientProps) {
  const common = useTranslations('common');
  const t = useTranslations('pages.home');

  return (
    <PageLayout showBackButton={true} pb="0">
      <Box>
        <HeroSection />
        <StatsSection />
        <UseCasesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </Box>

      {/* Footer */}
      <Box
        bg="gray.100"
        _dark={{ bg: 'gray.900' }}
        py={10}
        borderTopWidth="1px"
      >
        <Container maxW="container.xl">
          <Flex direction="column" align="center">
            <Text color="gray.500" fontSize="sm" suppressHydrationWarning>
              © {new Date().getFullYear()} {common('appName')}.{' '}
              {t('copyright')}
            </Text>
          </Flex>
        </Container>
      </Box>
    </PageLayout>
  );
}

export default function AboutClient(props: AboutClientProps) {
  return (
    <Suspense>
      <AboutContent {...props} />
    </Suspense>
  );
}
