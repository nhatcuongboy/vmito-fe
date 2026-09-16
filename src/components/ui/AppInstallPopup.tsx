'use client';

import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  Image,
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
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './chakra-compat';
import { VDrawer } from './VDrawer';
import { VModal } from './VModal';
import { toaster } from './toaster';
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

export default function AppInstallPopup() {
  const { isResolved } = useCookieConsent();
  const t = useTranslations('appInstall');
  const androidT = useTranslations('androidInstall');
  const isCityOnboardingOpen = useIsCityOnboardingOpen();
  const welcomePopup = useVisibleWelcomePopup();
  const welcomeReady = useWelcomePopupStore(
    (state) => state._hasHydrated && state.isLoaded
  );
  const { target, shouldShowPopup, dismiss } = useAppInstallEligibility();
  const { isAndroidGuideOpen, openAndroidGuide, closeAndroidGuide } =
    useAppInstallStore();
  const isApkGuideOpen = isAndroidGuideOpen && target?.channel === 'apk';

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

  const handleNotNow = useCallback(() => {
    if (target) dismiss(target.targetKey);
  }, [dismiss, target]);

  const handleUniversalLinkVisit = () => {
    if (target) dismiss(target.targetKey);
  };

  const isOpen =
    isResolved &&
    shouldShowPopup &&
    !isApkGuideOpen &&
    welcomeReady &&
    !isCityOnboardingOpen &&
    !welcomePopup;

  return (
    <>
      <VDrawer
        isOpen={isOpen}
        onClose={handleNotNow}
        placement="bottom"
        showCloseButton={false}
        closeOnOverlayClick={false}
        showFooterDivider={false}
        footer={
          target ? (
            <VStack gap={2} w="full">
              {target.channel === 'apk' ? (
                <Button
                  colorPalette="green"
                  size="lg"
                  w="full"
                  onClick={handleApkDownload}
                >
                  <Download size={18} />
                  {t('downloadCta')}
                </Button>
              ) : (
                <Box
                  as="a"
                  {...({ href: UNIVERSAL_LINK_URL } as Record<string, unknown>)}
                  onClick={handleUniversalLinkVisit}
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  w="full"
                  minH="48px"
                  borderRadius="md"
                  bg="green.500"
                  color="white"
                  fontSize="md"
                  fontWeight="bold"
                  _hover={{ bg: 'green.600' }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'green.300',
                    outlineOffset: '2px',
                  }}
                >
                  <Download size={18} />
                  {t('downloadCta')}
                </Box>
              )}
              {target.channel === 'apk' ? (
                <Text
                  fontSize="xs"
                  color="orange.600"
                  _dark={{ color: 'orange.300' }}
                  textAlign="center"
                >
                  {t('apkNotice')}
                </Text>
              ) : null}
              <Button
                variant="ghost"
                w="full"
                onClick={handleNotNow}
                color="fg.muted"
              >
                {t('notNow')}
              </Button>
            </VStack>
          ) : null
        }
      >
        <VStack gap={4} py={2} textAlign="center">
          <Image
            src="/icons/app-logo.png"
            alt=""
            boxSize="88px"
            borderRadius="2xl"
            boxShadow="md"
          />
          <VStack gap={1}>
            <Heading size="lg" color="fg">
              {t('title')}
            </Heading>
            <Text color="fg.muted" lineHeight="tall">
              {t('description')}
            </Text>
          </VStack>
        </VStack>
      </VDrawer>

      <AndroidApkGuide
        isOpen={isResolved && isApkGuideOpen}
        onClose={closeAndroidGuide}
        onRedownload={handleApkDownload}
      />
    </>
  );
}
