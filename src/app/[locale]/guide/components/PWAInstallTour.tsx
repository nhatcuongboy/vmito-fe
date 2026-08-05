'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Check,
  Download,
  MoreVertical,
  Plus,
  Share,
  Smartphone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrowserIllustration = ({
  platform,
  step,
  label,
}: {
  platform: 'ios' | 'android';
  step: number;
  label: string;
}) => (
  <Box
    borderWidth="1px"
    borderColor="border"
    borderRadius="xl"
    bg="bg.muted"
    p={4}
    w="full"
  >
    <Flex
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg"
      minH="132px"
      direction="column"
      overflow="hidden"
    >
      <Flex
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border.subtle"
        justify="space-between"
        color="fg.muted"
      >
        <Text fontSize="xs">vmito.com</Text>
        {platform === 'ios' ? (
          <Share size={18} color="#2563eb" />
        ) : (
          <MoreVertical size={18} />
        )}
      </Flex>
      <Flex
        flex={1}
        align="center"
        justify="center"
        p={3}
        textAlign="center"
        color="fg.muted"
      >
        {platform === 'ios' && step === 0 && (
          <Share size={32} color="#2563eb" />
        )}
        {platform === 'ios' && step === 1 && (
          <HStack>
            <Plus size={22} color="#2563eb" />
            <Text fontSize="sm">{label}</Text>
          </HStack>
        )}
        {platform === 'ios' && step === 2 && (
          <HStack>
            <Check size={22} color="#179a3b" />
            <Text fontSize="sm">{label}</Text>
          </HStack>
        )}
        {platform === 'android' && (
          <HStack>
            <MoreVertical size={24} />
            <Text fontSize="sm">{label}</Text>
          </HStack>
        )}
      </Flex>
    </Flex>
  </Box>
);

export default function PWAInstallTour({
  isOpen,
  onClose,
}: PWAInstallTourProps) {
  const t = useTranslations('pages.guide.tips.pwa.tour');
  const { isInstalled, isInstallable, platform, promptInstall } = usePWA();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen, platform]);

  useEffect(() => {
    if (isInstalled && isOpen) onClose();
  }, [isInstalled, isOpen, onClose]);

  const iosSteps = ['share', 'homeScreen', 'add'];
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const totalSteps = isIOS ? iosSteps.length : 1;
  const activeKey = isIOS ? iosSteps[step] : 'androidFallback';

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <Dialog.Root
      open={isOpen && !isInstalled}
      onOpenChange={({ open }) => !open && onClose()}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop zIndex={1700} />
        <Dialog.Positioner zIndex={1701} p={4}>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>{t('title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {isIOS && (
                <VStack align="stretch" gap={4}>
                  <Text color="fg.muted">{t('iosSafari')}</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {t('stepCount', { current: step + 1, total: totalSteps })}
                  </Text>
                  <BrowserIllustration
                    platform="ios"
                    step={step}
                    label={t(`ios.${activeKey}.illustration`)}
                  />
                  <Text fontWeight="semibold">
                    {t(`ios.${activeKey}.title`)}
                  </Text>
                  <Text color="fg.muted">
                    {t(`ios.${activeKey}.description`)}
                  </Text>
                </VStack>
              )}
              {isAndroid && (
                <VStack align="stretch" gap={4}>
                  <BrowserIllustration
                    platform="android"
                    step={0}
                    label={t('androidFallback.illustration')}
                  />
                  <Text fontWeight="semibold">
                    {t(
                      isInstallable
                        ? 'androidReady.title'
                        : 'androidFallback.title'
                    )}
                  </Text>
                  <Text color="fg.muted">
                    {t(
                      isInstallable
                        ? 'androidReady.description'
                        : 'androidFallback.description'
                    )}
                  </Text>
                </VStack>
              )}
              {!isIOS && !isAndroid && (
                <VStack align="stretch" gap={3} textAlign="center" py={4}>
                  <Smartphone
                    size={38}
                    color="#2563eb"
                    style={{ margin: '0 auto' }}
                  />
                  <Text fontWeight="semibold">{t('mobileOnly.title')}</Text>
                  <Text color="fg.muted">{t('mobileOnly.description')}</Text>
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <HStack w="full" justify="space-between">
                {isIOS && step > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => setStep((value) => value - 1)}
                  >
                    {t('previous')}
                  </Button>
                ) : (
                  <Box />
                )}
                <HStack>
                  {isAndroid && isInstallable && (
                    <Button colorPalette="green" onClick={handleInstall}>
                      <Download size={16} />
                      {t('installNow')}
                    </Button>
                  )}
                  {isIOS ? (
                    step < totalSteps - 1 ? (
                      <Button
                        colorPalette="green"
                        onClick={() => setStep((value) => value + 1)}
                      >
                        {t('next')}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={onClose}>
                        {t('close')}
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" onClick={onClose}>
                      {t('close')}
                    </Button>
                  )}
                </HStack>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
