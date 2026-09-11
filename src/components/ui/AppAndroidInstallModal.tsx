'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  FolderDown,
  Settings,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './chakra-compat';
import { VModal } from './VModal';
import { toaster } from './toaster';
import {
  useAndroidInstallStore,
  useShouldShowAndroidPrompt,
} from '@/stores/useAndroidInstallStore';
import { detectPWAPlatform, isPWAStandalone } from '@/lib/pwa/install';
import { ANDROID_APP_CONFIG } from '@/constants/android-app';

export default function AppAndroidInstallModal() {
  const t = useTranslations('androidInstall');
  const { isModalOpen, step, openModal, closeModal, setStep, dismiss } =
    useAndroidInstallStore();

  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect platform and standalone display mode
    const platform = detectPWAPlatform(
      navigator.userAgent,
      navigator.maxTouchPoints
    );
    const standalone = isPWAStandalone(
      window.matchMedia('(display-mode: standalone)').matches,
      window.navigator as { standalone?: boolean }
    );

    setIsAndroid(platform === 'android');
    setIsStandalone(standalone);
  }, []);

  const shouldPrompt = useShouldShowAndroidPrompt(isAndroid, isStandalone);

  // Auto-open prompt if eligible
  useEffect(() => {
    if (shouldPrompt && !isModalOpen) {
      openModal('prompt');
    }
  }, [shouldPrompt, isModalOpen, openModal]);

  const handleDownload = useCallback(() => {
    if (!ANDROID_APP_CONFIG.downloadUrl) return;

    toaster.info({
      title: t('downloadStarted'),
    });

    const link = document.createElement('a');
    link.href = ANDROID_APP_CONFIG.downloadUrl;
    link.setAttribute(
      'download',
      `vmito-v${ANDROID_APP_CONFIG.version || 'latest'}.apk`
    );
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Transition to step-by-step installation instructions
    setStep('guide');
  }, [setStep, t]);

  const handleCancel = () => {
    dismiss();
  };

  const handleCloseGuide = () => {
    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <VModal
      isOpen={isModalOpen}
      onClose={step === 'guide' ? handleCloseGuide : handleCancel}
      size="md"
      isCentered
      showCloseButton={step === 'guide'}
    >
      {step === 'prompt' ? (
        <VStack gap={5} align="stretch" py={2}>
          {/* Header with App icon & Badge */}
          <Flex align="center" gap={3}>
            <Box
              w={14}
              h={14}
              borderRadius="xl"
              bg="green.500"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="md"
              flexShrink={0}
            >
              <Smartphone size={32} />
            </Box>
            <Box flex={1}>
              <HStack gap={2} mb={1}>
                <Badge
                  colorPalette="green"
                  variant="subtle"
                  fontSize="xs"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {t('badge')}
                </Badge>
                {ANDROID_APP_CONFIG.version && (
                  <Badge
                    colorPalette="gray"
                    variant="outline"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    v{ANDROID_APP_CONFIG.version}
                  </Badge>
                )}
              </HStack>
              <Heading size="md" color="fg" lineHeight="short">
                {t('promptTitle')}
              </Heading>
            </Box>
          </Flex>

          {/* Description */}
          <Text fontSize="sm" color="fg.muted" lineHeight="tall">
            {t('promptDesc')}
          </Text>

          {/* Version Info & Highlights */}
          <Box
            p={3.5}
            borderRadius="lg"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <HStack
              justify="space-between"
              fontSize="xs"
              color="fg.muted"
              mb={2}
            >
              <Text>
                {t('version')}:{' '}
                <Text as="span" fontWeight="semibold" color="fg">
                  {ANDROID_APP_CONFIG.version}
                </Text>
              </Text>
              {ANDROID_APP_CONFIG.fileSize && (
                <Text>
                  {t('fileSize')}:{' '}
                  <Text as="span" fontWeight="semibold" color="fg">
                    {ANDROID_APP_CONFIG.fileSize}
                  </Text>
                </Text>
              )}
            </HStack>

            {ANDROID_APP_CONFIG.releaseNotes && (
              <Box
                mt={2}
                pt={2}
                borderTopWidth="1px"
                borderColor="border.subtle"
              >
                <HStack gap={1.5} mb={1}>
                  <Sparkles size={14} className="text-green-600" />
                  <Text fontSize="xs" fontWeight="semibold" color="fg">
                    {t('releaseNotesTitle')}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  {ANDROID_APP_CONFIG.releaseNotes}
                </Text>
              </Box>
            )}
          </Box>

          {/* Actions */}
          <HStack gap={3} pt={2}>
            <Button
              variant="outline"
              colorPalette="gray"
              flex={1}
              onClick={handleCancel}
            >
              {t('cancel')}
            </Button>
            <Button colorPalette="green" flex={1.4} onClick={handleDownload}>
              <Download size={18} />
              {t('installNow')}
            </Button>
          </HStack>
        </VStack>
      ) : (
        <VStack gap={4} align="stretch" py={1}>
          {/* Guide Header */}
          <Box textAlign="center" pb={1}>
            <Heading size="md" color="fg">
              {t('guideTitle')}
            </Heading>
            <Text fontSize="xs" color="fg.muted" mt={1}>
              {t('guideSubtitle')}
            </Text>
          </Box>

          {/* Step list */}
          <VStack gap={3} align="stretch">
            {/* Step 1 */}
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
                bg="blue.100"
                _dark={{ bg: 'blue.900/40', color: 'blue.300' }}
                color="blue.600"
                flexShrink={0}
              >
                <FolderDown size={18} />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {t('step1Title')}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight="tall">
                  {t('step1Desc')}
                </Text>
              </Box>
            </Flex>

            {/* Step 2 */}
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
                bg="purple.100"
                _dark={{ bg: 'purple.900/40', color: 'purple.300' }}
                color="purple.600"
                flexShrink={0}
              >
                <Smartphone size={18} />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {t('step2Title')}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight="tall">
                  {t('step2Desc')}
                </Text>
              </Box>
            </Flex>

            {/* Step 3 */}
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
                bg="amber.100"
                _dark={{ bg: 'yellow.900/40', color: 'yellow.300' }}
                color="yellow.600"
                flexShrink={0}
              >
                <Settings size={18} />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {t('step3Title')}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight="tall">
                  {t('step3Desc')}
                </Text>
              </Box>
            </Flex>

            {/* Step 4 */}
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
                bg="green.100"
                _dark={{ bg: 'green.900/40', color: 'green.300' }}
                color="green.600"
                flexShrink={0}
              >
                <CheckCircle2 size={18} />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {t('step4Title')}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight="tall">
                  {t('step4Desc')}
                </Text>
              </Box>
            </Flex>
          </VStack>

          {/* Guide Actions */}
          <HStack gap={3} pt={2}>
            <Button
              variant="outline"
              colorPalette="gray"
              flex={1}
              onClick={handleDownload}
            >
              <RefreshCw size={16} />
              {t('redownload')}
            </Button>
            <Button colorPalette="green" flex={1} onClick={handleCloseGuide}>
              <ShieldCheck size={18} />
              {t('done')}
            </Button>
          </HStack>
        </VStack>
      )}
    </VModal>
  );
}
