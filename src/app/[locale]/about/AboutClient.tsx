'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { Link } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Suspense, type CSSProperties } from 'react';
import CTASection from './components/CTASection';
import FAQSection from './components/FAQSection';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import TestimonialsSection from './components/TestimonialsSection';
import UseCasesSection from './components/UseCasesSection';

const topBarOffset = {
  '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
  '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
} as CSSProperties;

function AboutContent() {
  const common = useTranslations('common');
  const t = useTranslations('pages.home');

  return (
    <PageWrapper>
      <TopBar showBackButton={false} title={common('about')} />
      <main className="top-bar-content-offset" style={topBarOffset}>
        <HeroSection />
        <UseCasesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>

      <footer className="border-t bg-muted py-10 pb-[calc(64px+env(safe-area-inset-bottom)+40px)] dark:bg-gray-900">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center gap-4 px-4 sm:px-6">
          <p
            className="text-center text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            © {new Date().getFullYear()} {common('appName')}. {t('copyright')}
          </p>
          <nav
            aria-label={common('navigation')}
            className="flex items-center gap-3"
          >
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {common('terms')}
            </Link>
            <span aria-hidden className="text-sm text-muted-foreground">
              •
            </span>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {common('privacy')}
            </Link>
          </nav>
        </div>
      </footer>
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
