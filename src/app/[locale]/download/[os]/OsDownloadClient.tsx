'use client';

import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import {
  Apple,
  Clock,
  Download,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type CSSProperties } from 'react';
import Footer from '@/components/layout/Footer';
import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import {
  APP_INSTALL_CONFIG,
  resolveInstallTarget,
} from '@/constants/android-app';
import { Link } from '@/i18n/config';
import { OTHER_DOWNLOAD_OS, type DownloadOs } from '../download-os';

const topBarOffset = {
  '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
  '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
} as CSSProperties;

const OS_ICON: Record<DownloadOs, LucideIcon> = {
  ios: Apple,
  android: Smartphone,
};

interface OsDownloadClientProps {
  os: DownloadOs;
}

export default function OsDownloadClient({ os }: OsDownloadClientProps) {
  const t = useTranslations('pages.download');
  const appInstallT = useTranslations('appInstall');

  const Icon = OS_ICON[os];
  const otherOs = OTHER_DOWNLOAD_OS[os];
  const target = resolveInstallTarget(os);

  // Android may have both a Play Store listing and a direct APK; whichever
  // resolveInstallTarget did NOT pick as primary is shown as a secondary link
  // (mirrors the primary-installer + store-listing pattern on Slack's page).
  const secondaryUrl =
    os === 'android' && target
      ? target.channel === 'apk'
        ? APP_INSTALL_CONFIG.android.playStoreUrl
        : target.channel === 'play-store'
          ? APP_INSTALL_CONFIG.android.apkUrl
          : null
      : null;
  const secondaryLabel =
    target?.channel === 'apk'
      ? appInstallT('playStoreCta')
      : appInstallT('apkCta');

  const primaryLabel = target
    ? target.channel === 'app-store'
      ? appInstallT('appStoreCta')
      : target.channel === 'play-store'
        ? appInstallT('playStoreCta')
        : appInstallT('apkCta')
    : null;

  return (
    <PageWrapper minH="auto">
      <TopBar showBackButton={false} title={t(`${os}.pageTitle`)} />
      <main
        className="top-bar-content-offset"
        style={{ ...topBarOffset, minHeight: '100%' }}
      >
        <Box bg="green.50" _dark={{ bg: 'green.950' }} minH="100%">
          <Box as="section" textAlign="center" px={4} py={{ base: 10, md: 16 }}>
            <VStack gap={5} maxW="xl" mx="auto">
              <Box
                p={4}
                borderRadius="full"
                bg="green.100"
                color="green.600"
                _dark={{ bg: 'green.900/40', color: 'green.300' }}
              >
                <Icon size={40} />
              </Box>
              <Heading
                size="3xl"
                color="green.700"
                _dark={{ color: 'green.300' }}
              >
                {t(`${os}.pageTitle`)}
              </Heading>
              <Text fontSize="lg" color="fg.muted">
                {t(`${os}.description`)}
              </Text>

              {target ? (
                <>
                  <Box
                    as="a"
                    {...({
                      href: target.url,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      ...(target.channel === 'apk'
                        ? {
                            download: `vmito-v${APP_INSTALL_CONFIG.android.version || 'latest'}.apk`,
                          }
                        : {}),
                    } as Record<string, unknown>)}
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    minH="56px"
                    px={10}
                    borderRadius="full"
                    bg="green.600"
                    color="white"
                    fontSize="lg"
                    fontWeight="bold"
                    boxShadow="md"
                    _hover={{ bg: 'green.700' }}
                    _focusVisible={{
                      outline: '2px solid',
                      outlineColor: 'green.300',
                      outlineOffset: '2px',
                    }}
                  >
                    <Download size={20} />
                    {primaryLabel}
                  </Box>

                  {secondaryUrl ? (
                    <Box
                      as="a"
                      {...({
                        href: secondaryUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      } as Record<string, unknown>)}
                      fontSize="sm"
                      color="green.700"
                      _dark={{ color: 'green.300' }}
                      textDecoration="underline"
                    >
                      {secondaryLabel}
                    </Box>
                  ) : null}
                </>
              ) : (
                <HStack
                  minH="56px"
                  px={10}
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="border"
                  color="fg.muted"
                  fontSize="lg"
                  fontWeight="semibold"
                >
                  <Clock size={20} />
                  <Text>{t('comingSoon')}</Text>
                </HStack>
              )}
            </VStack>
          </Box>

          {target?.channel === 'apk' ? (
            <Box maxW="sm" mx="auto" px={4} pb={{ base: 6, md: 8 }}>
              <Text
                fontSize="xs"
                color="orange.600"
                _dark={{ color: 'orange.300' }}
                textAlign="center"
              >
                {appInstallT('apkNotice')}
              </Text>
            </Box>
          ) : null}

          <Box textAlign="center" px={4} pb={{ base: 10, md: 14 }}>
            <Text color="fg.muted">
              {t.rich('osPage.alsoAvailable', {
                platform: t(`${otherOs}.title`),
                link: (chunks) => (
                  <Link
                    href={`/download/${otherOs}`}
                    style={{ textDecoration: 'underline', fontWeight: 600 }}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </Text>
          </Box>
        </Box>
      </main>
      <Footer />
    </PageWrapper>
  );
}
