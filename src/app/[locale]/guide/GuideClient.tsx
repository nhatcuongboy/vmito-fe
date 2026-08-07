'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useTranslations } from 'next-intl';
import { Suspense, type CSSProperties } from 'react';
import ClubGuideSection from './components/ClubGuideSection';
import GettingStartedSection from './components/GettingStartedSection';
import GuideHeroSection from './components/GuideHeroSection';
import GuideTableOfContents from './components/GuideTableOfContents';
import PaymentGuideSection from './components/PaymentGuideSection';
import RatingGuideSection from './components/RatingGuideSection';
import SessionGuideSection from './components/SessionGuideSection';
import TipsSection from './components/TipsSection';
import TournamentGuideSection from './components/TournamentGuideSection';

const topBarOffset = {
  '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
  '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
} as CSSProperties;

function GuideContent() {
  const common = useTranslations('common');

  return (
    <PageWrapper>
      <TopBar showBackButton={false} title={common('guide')} />
      <main className="top-bar-content-offset" style={topBarOffset}>
        <GuideHeroSection />
        <GuideTableOfContents />
        <GettingStartedSection />
        <SessionGuideSection />
        <TournamentGuideSection />
        <PaymentGuideSection />
        <ClubGuideSection />
        <RatingGuideSection />
        <TipsSection />
      </main>

      <footer className="border-t bg-muted py-10 pb-[calc(64px+env(safe-area-inset-bottom)+40px)] dark:bg-gray-900">
        <p
          className="text-center text-sm text-muted-foreground"
          suppressHydrationWarning
        >
          © {new Date().getFullYear()} {common('appName')}
        </p>
      </footer>
    </PageWrapper>
  );
}

export default function GuideClient() {
  return (
    <Suspense>
      <GuideContent />
    </Suspense>
  );
}
