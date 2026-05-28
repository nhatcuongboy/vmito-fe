'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { Box, Container, Flex, Text } from '@chakra-ui/react';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Suspense } from 'react';
import GuideHeroSection from './components/GuideHeroSection';
import GettingStartedSection from './components/GettingStartedSection';
import SessionGuideSection from './components/SessionGuideSection';
import TournamentGuideSection from './components/TournamentGuideSection';
import PaymentGuideSection from './components/PaymentGuideSection';
import ClubGuideSection from './components/ClubGuideSection';
import RatingGuideSection from './components/RatingGuideSection';
import TipsSection from './components/TipsSection';
import GuideTableOfContents from './components/GuideTableOfContents';

const GuideContent = () => {
  const common = useTranslations('common');
  const t = useTranslations('pages.guide.hero');

  return (
    <PageWrapper>
      <TopBar showBackButton={false} title={common('guide')} />
      <Box
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
      >
        <GuideHeroSection />
        <GuideTableOfContents />
        <GettingStartedSection />
        <SessionGuideSection />
        <TournamentGuideSection />
        <PaymentGuideSection />
        <ClubGuideSection />
        <RatingGuideSection />
        <TipsSection />

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
                © {new Date().getFullYear()} {common('appName')}
              </Text>
            </Flex>
          </Container>
        </Box>
      </Box>
    </PageWrapper>
  );
};

const GuideClient = () => {
  return (
    <Suspense>
      <GuideContent />
    </Suspense>
  );
};

export default GuideClient;
