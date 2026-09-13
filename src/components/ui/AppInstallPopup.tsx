'use client';

import React, { useCallback, useEffect, useId, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CheckCircle2,
  Download,
  FolderDown,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './chakra-compat';
import { VModal } from './VModal';
import { toaster } from './toaster';
import {
  APP_INSTALL_CONFIG,
  resolveInstallTarget,
  type InstallTarget,
} from '@/constants/android-app';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';
import {
  detectPWAPlatform,
  isPWAStandalone,
  type PWAPlatform,
} from '@/lib/pwa/install';
import {
  useAppInstallStore,
  useShouldShowAppInstallPrompt,
} from '@/stores/useAndroidInstallStore';
import { useIsCityOnboardingOpen } from '@/stores/usePreferenceStore';
import {
  useVisibleWelcomePopup,
  useWelcomePopupStore,
} from '@/stores/useWelcomePopupStore';

function AndroidApkGuide({
  isOpen,
  onClose,
  onRedownload,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRedownload: () => void;
}) {
  const t = useTranslations('androidInstall');

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isCentered
      showCloseButton
    >
      <VStack gap={4} align="stretch" py={1}>
        <Box textAlign="center" pb={1}>
          <Heading size="md" color="fg">
            {t('guideTitle')}
          </Heading>
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {t('guideSubtitle')}
          </Text>
        </Box>

        <VStack gap={3} align="stretch">
          <GuideStep
            icon={<FolderDown size={18} />}
            color="blue"
            title={t('step1Title')}
            description={t('step1Desc')}
          />
          <GuideStep
            icon={<Smartphone size={18} />}
            color="purple"
            title={t('step2Title')}
            description={t('step2Desc')}
          />
          <GuideStep
            icon={<Settings size={18} />}
            color="yellow"
            title={t('step3Title')}
            description={t('step3Desc')}
          />
          <GuideStep
            icon={<CheckCircle2 size={18} />}
            color="green"
            title={t('step4Title')}
            description={t('step4Desc')}
          />
        </VStack>

        <HStack gap={3} pt={2}>
          <Button
            variant="outline"
            colorPalette="gray"
            flex={1}
            onClick={onRedownload}
          >
            <RefreshCw size={16} />
            {t('redownload')}
          </Button>
          <Button colorPalette="green" flex={1} onClick={onClose}>
            <ShieldCheck size={18} />
            {t('done')}
          </Button>
        </HStack>
      </VStack>
    </VModal>
  );
}

function GuideStep({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'yellow' | 'green';
  title: string;
  description: string;
}) {
  const colorMap = {
    blue: { bg: 'blue.100', darkBg: 'blue.900/40', text: 'blue.600' },
    purple: { bg: 'purple.100', darkBg: 'purple.900/40', text: 'purple.600' },
    yellow: { bg: 'amber.100', darkBg: 'yellow.900/40', text: 'yellow.600' },
    green: { bg: 'green.100', darkBg: 'green.900/40', text: 'green.600' },
  } as const;
  const style = colorMap[color];

  return (
    <Flex
      gap={3}
      p={3}
      borderRadius="lg"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.subtle"
      align="flex-start"
    >
      <Box
        p={2}
        borderRadius="md"
        bg={style.bg}
        _dark={{ bg: style.darkBg, color: style.text }}
        color={style.text}
        flexShrink={0}
      >
        {icon}
      </Box>
      <Box flex={1}>
        <Text fontSize="sm" fontWeight="semibold" color="fg">
          {title}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight="tall">
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

function triggerApkDownload(target: InstallTarget) {
  const link = document.createElement('a');
  link.href = target.url;
  link.setAttribute(
    'download',
    `vmito-v${APP_INSTALL_CONFIG.android.version || 'latest'}.apk`
  );
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AppInstallPopup() {
  const t = useTranslations('appInstall');
  const androidT = useTranslations('androidInstall');
  const titleId = useId();
  const descriptionId = useId();
  const [platform, setPlatform] = useState<PWAPlatform>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const isBottomNavVisible = useBottomNavVisibility();
  const isCityOnboardingOpen = useIsCityOnboardingOpen();
  const welcomePopup = useVisibleWelcomePopup();
  const welcomeReady = useWelcomePopupStore(
    (state) => state._hasHydrated && state.isLoaded
  );
  const target = resolveInstallTarget(platform);
  const shouldPrompt = useShouldShowAppInstallPrompt(target, isStandalone);
  const { isAndroidGuideOpen, dismiss, openAndroidGuide, closeAndroidGuide } =
    useAppInstallStore();
  const isApkGuideOpen = isAndroidGuideOpen && target?.channel === 'apk';

  useEffect(() => {
    const resolvedPlatform = detectPWAPlatform(
      navigator.userAgent,
      navigator.maxTouchPoints
    );
    setPlatform(resolvedPlatform);
    setIsStandalone(
      isPWAStandalone(
        window.matchMedia('(display-mode: standalone)').matches,
        window.navigator as { standalone?: boolean }
      )
    );
  }, []);

  useEffect(() => {
    if (isAndroidGuideOpen && target?.channel !== 'apk') {
      closeAndroidGuide();
    }
  }, [closeAndroidGuide, isAndroidGuideOpen, target?.channel]);

  const handleApkDownload = useCallback(() => {
    if (!target || target.channel !== 'apk') return;

    dismiss(target.targetKey);
    toaster.info({ title: androidT('downloadStarted') });
    triggerApkDownload(target);
    openAndroidGuide(target);
  }, [androidT, dismiss, openAndroidGuide, target]);

  const handleStoreVisit = () => {
    if (target) dismiss(target.targetKey);
  };

  const cardIsVisible =
    shouldPrompt &&
    !isApkGuideOpen &&
    welcomeReady &&
    !isCityOnboardingOpen &&
    !welcomePopup;

  const bottomOffset = isBottomNavVisible
    ? 'calc(76px + env(safe-area-inset-bottom))'
    : 'max(16px, env(safe-area-inset-bottom))';

  return (
    <>
      {cardIsVisible ? (
        <Portal>
          <Box
            as="aside"
            role="region"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            position="fixed"
            bottom={bottomOffset}
            left={0}
            right={0}
            zIndex={1400}
            w="calc(100% - 24px)"
            maxW="400px"
            mx="auto"
            p={3}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border"
            bg={{ base: 'white', _dark: 'gray.800' }}
            boxShadow="0 14px 40px rgba(0, 0, 0, 0.22)"
            css={{
              animation: 'appInstallPopupIn 180ms ease-out',
              '@keyframes appInstallPopupIn': {
                from: { opacity: 0, transform: 'translateY(12px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          >
            <Flex align="flex-start" gap={3}>
              <Image
                src="/icons/app-logo-96.png"
                alt=""
                boxSize="44px"
                borderRadius="lg"
                flexShrink={0}
              />
              <Box flex={1} minW={0}>
                <Text id={titleId} fontSize="sm" fontWeight="bold" color="fg">
                  {t('title')}
                </Text>
                <Text
                  id={descriptionId}
                  fontSize="xs"
                  color="fg.muted"
                  lineHeight="tall"
                  mt={0.5}
                >
                  {t('description')}
                </Text>
              </Box>
              <Box
                as="button"
                {...({ type: 'button' } as Record<string, unknown>)}
                aria-label={t('closeAriaLabel')}
                onClick={() => target && dismiss(target.targetKey)}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                boxSize="44px"
                mt="-10px"
                mr="-10px"
                borderRadius="full"
                color="fg.muted"
                _hover={{ bg: 'bg.subtle', color: 'fg' }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.500',
                }}
              >
                <X size={18} />
              </Box>
            </Flex>

            {target?.channel === 'apk' ? (
              <Text
                fontSize="xs"
                color="orange.600"
                _dark={{ color: 'orange.300' }}
                mt={2}
              >
                {t('apkNotice')}
              </Text>
            ) : null}

            <Flex mt={3} justify="flex-end">
              {target?.channel === 'apk' ? (
                <Button
                  colorPalette="green"
                  size="sm"
                  onClick={handleApkDownload}
                >
                  <Download size={16} />
                  {t('apkCta')}
                </Button>
              ) : target ? (
                <Box
                  as="a"
                  {...({ href: target.url } as Record<string, unknown>)}
                  onClick={handleStoreVisit}
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  minH="36px"
                  px={3}
                  borderRadius="md"
                  bg="green.500"
                  color="white"
                  fontSize="sm"
                  fontWeight="semibold"
                  _hover={{ bg: 'green.600' }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'green.300',
                    outlineOffset: '2px',
                  }}
                >
                  <Download size={16} />
                  {target.channel === 'app-store'
                    ? t('appStoreCta')
                    : t('playStoreCta')}
                </Box>
              ) : null}
            </Flex>
          </Box>
        </Portal>
      ) : null}

      <AndroidApkGuide
        isOpen={isApkGuideOpen}
        onClose={closeAndroidGuide}
        onRedownload={handleApkDownload}
      />
    </>
  );
}
