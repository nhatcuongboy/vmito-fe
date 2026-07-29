'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import {
  Box,
  Container,
  Flex,
  Link as ChakraLink,
  Stack,
  Text,
} from '@chakra-ui/react';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Suspense } from 'react';
import { Link } from '@/i18n/config';
import HeroSection from './components/HeroSection';
import UseCasesSection from './components/UseCasesSection';
import HowItWorksSection from './components/HowItWorksSection';
import FAQSection from './components/FAQSection';
import TestimonialsSection from './components/TestimonialsSection';
import CTASection from './components/CTASection';

function AboutContent() {
  const common = useTranslations('common');
  const t = useTranslations('pages.home');
  return (
    <PageWrapper>
      <TopBar showBackButton={false} title={common('about')} />
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
            <Flex direction="column" align="center" gap={4}>
              <Text color="fg.muted" fontSize="sm" suppressHydrationWarning>
                © {new Date().getFullYear()} {common('appName')}.{' '}
                {t('copyright')}
              </Text>
              <Stack direction="row" gap={3} align="center">
                <ChakraLink
                  as={Link}
                  href="/terms"
                  fontSize="sm"
                  color="fg.muted"
                  _hover={{ color: 'brand.500' }}
                >
                  {common('terms')}
                </ChakraLink>
                <Text fontSize="sm" color="fg.muted">
                  •
                </Text>
                <ChakraLink
                  as={Link}
                  href="/privacy"
                  fontSize="sm"
                  color="fg.muted"
                  _hover={{ color: 'brand.500' }}
                >
                  {common('privacy')}
                </ChakraLink>
              </Stack>
            </Flex>
          </Container>
        </Box>
      </Box>
    </PageWrapper>
  );
}

export default function AboutClient() {
  return (
    <Suspense>
      <AboutContent />
    </Suspense>
  );
}
