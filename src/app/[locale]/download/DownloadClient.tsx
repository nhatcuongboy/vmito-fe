'use client';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Apple, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type CSSProperties } from 'react';
import Footer from '@/components/layout/Footer';
import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { resolveInstallTarget } from '@/constants/android-app';
import HeroSection from './components/HeroSection';
import PlatformCard from './components/PlatformCard';

const topBarOffset = {
  '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
  '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
} as CSSProperties;

export default function DownloadClient() {
  const t = useTranslations('pages.download');
  const iosTarget = resolveInstallTarget('ios');
  const androidTarget = resolveInstallTarget('android');

  return (
    <PageWrapper minH="auto">
      <TopBar showBackButton={false} title={t('title')} />
      <main className="top-bar-content-offset" style={topBarOffset}>
        <HeroSection />
        <Box maxW="4xl" mx="auto" px={4} py={{ base: 8, md: 12 }}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <PlatformCard
              os="ios"
              icon={Apple}
              title={t('ios.title')}
              description={t('ios.description')}
              target={iosTarget}
              qrHint={t('qrHint')}
            />
            <PlatformCard
              os="android"
              icon={Smartphone}
              title={t('android.title')}
              description={t('android.description')}
              target={androidTarget}
              qrHint={t('qrHint')}
            />
          </SimpleGrid>
        </Box>
      </main>
      <Footer />
    </PageWrapper>
  );
}
