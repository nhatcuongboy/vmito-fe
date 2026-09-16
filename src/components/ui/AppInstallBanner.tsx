'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Box, HStack, Image, Text } from '@chakra-ui/react';
import { Download, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UNIVERSAL_LINK_URL } from '@/constants/android-app';
import { useAppInstallEligibility } from '@/hooks/useAppInstallEligibility';
import { triggerApkDownload } from '@/lib/pwa/apk-download';
import { useAppInstallStore } from '@/stores/useAndroidInstallStore';
import { useIsCityOnboardingOpen } from '@/stores/usePreferenceStore';
import {
  useVisibleWelcomePopup,
  useWelcomePopupStore,
} from '@/stores/useWelcomePopupStore';
import { useCookieConsent } from '@/components/providers/CookieConsentProvider';

const BANNER_HEIGHT_VAR = '--smart-banner-height';

/**
 * Slim top banner — the lighter, secondary reminder shown only after the
 * full-sheet AppInstallPopup has already been dismissed or is cooling
 * down (never at the same time as the popup, see
 * useAppInstallEligibility's shouldShowBanner). Writes its own rendered
 * height (safe-area padding included) to --smart-banner-height so
 * globals.css/MainLayout can shift the TopBar and page content down while
 * it's visible, and reset it to 0px otherwise.
 */
export default function AppInstallBanner() {
  const { isResolved } = useCookieConsent();
  const t = useTranslations('appInstall');
  const isCityOnboardingOpen = useIsCityOnboardingOpen();
  const welcomePopup = useVisibleWelcomePopup();
  const welcomeReady = useWelcomePopupStore(
    (state) => state._hasHydrated && state.isLoaded
  );
  const { target, shouldShowBanner, dismiss, dismissBanner } =
    useAppInstallEligibility();
  const openAndroidGuide = useAppInstallStore(
    (state) => state.openAndroidGuide
  );
  const barRef = useRef<HTMLDivElement>(null);

  const isVisible =
    isResolved &&
    shouldShowBanner &&
    welcomeReady &&
    !isCityOnboardingOpen &&
    !welcomePopup;

  useLayoutEffect(() => {
    if (!isVisible) {
      document.documentElement.style.setProperty(BANNER_HEIGHT_VAR, '0px');
      return;
    }
    const node = barRef.current;
    if (!node) return;

    const setHeight = () =>
      document.documentElement.style.setProperty(
        BANNER_HEIGHT_VAR,
        `${node.offsetHeight}px`
      );
    setHeight();

    const observer = new ResizeObserver(setHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(
    () => () => {
      document.documentElement.style.setProperty(BANNER_HEIGHT_VAR, '0px');
    },
    []
  );

  const handleCtaClick = useCallback(() => {
    if (!target) return;
    dismiss(target.targetKey);
    if (target.channel === 'apk') {
      triggerApkDownload(target);
      openAndroidGuide(target);
    }
  }, [dismiss, openAndroidGuide, target]);

  if (!isVisible || !target) return null;

  const ctaProps =
    target.channel === 'apk'
      ? ({ as: 'button', type: 'button' } as const)
      : ({ as: 'a', href: UNIVERSAL_LINK_URL } as const);

  return (
    <Box
      ref={barRef}
      as="aside"
      role="region"
      aria-label={t('bannerTitle')}
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1150}
      pt="env(safe-area-inset-top)"
      bg={{ base: 'white', _dark: 'gray.900' }}
      borderBottomWidth="1px"
      borderColor="border"
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
    >
      <HStack gap={2} px={3} py={2}>
        <Image
          src="/icons/app-logo-96.png"
          alt=""
          boxSize="32px"
          borderRadius="md"
          flexShrink={0}
        />
        <Text
          flex={1}
          minW={0}
          fontSize="sm"
          fontWeight="semibold"
          color="fg"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {t('bannerTitle')}
        </Text>
        <Box
          {...(ctaProps as Record<string, unknown>)}
          onClick={handleCtaClick}
          display="inline-flex"
          alignItems="center"
          gap={1}
          px={3}
          py={1.5}
          borderRadius="md"
          bg="green.500"
          color="white"
          fontSize="sm"
          fontWeight="semibold"
          flexShrink={0}
        >
          <Download size={14} />
          {t('bannerCta')}
        </Box>
        <Box
          as="button"
          {...({ type: 'button' } as Record<string, unknown>)}
          aria-label={t('closeAriaLabel')}
          onClick={dismissBanner}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          boxSize="32px"
          borderRadius="full"
          color="fg.muted"
          flexShrink={0}
          _hover={{ bg: 'bg.subtle', color: 'fg' }}
        >
          <X size={16} />
        </Box>
      </HStack>
    </Box>
  );
}
