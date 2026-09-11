'use client';

import { useEffect } from 'react';
import { Box, Image, Text } from '@chakra-ui/react';
import { Button } from './chakra-compat';
import { VModal } from './VModal';
import { useIsCityOnboardingOpen } from '@/stores/usePreferenceStore';
import {
  useVisibleWelcomePopup,
  useWelcomePopupStore,
} from '@/stores/useWelcomePopupStore';
import { useRouter } from '@/i18n/config';

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

export default function WelcomePopupModal() {
  const router = useRouter();
  const fetchActive = useWelcomePopupStore((s) => s.fetchActive);
  const dismiss = useWelcomePopupStore((s) => s.dismiss);
  const popup = useVisibleWelcomePopup();
  // City onboarding is a blocking first-run step; defer the promotional
  // popup until it's been resolved so the two never stack.
  const isCityOnboardingOpen = useIsCityOnboardingOpen();

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  if (!popup) return null;

  const handleClose = () => dismiss(popup);

  const handleCta = () => {
    dismiss(popup);
    if (!popup.ctaUrl) return;
    if (isExternalUrl(popup.ctaUrl)) {
      window.open(popup.ctaUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push(popup.ctaUrl);
    }
  };

  return (
    <VModal
      isOpen={!isCityOnboardingOpen}
      onClose={handleClose}
      title={popup.title}
      size="md"
      footer={
        popup.ctaLabel && popup.ctaUrl ? (
          <Button colorPalette="green" w="full" onClick={handleCta}>
            {popup.ctaLabel}
          </Button>
        ) : undefined
      }
    >
      <Box>
        {popup.imageUrl && (
          <Image
            src={popup.imageUrl}
            alt={popup.title}
            borderRadius="lg"
            mb={4}
            w="full"
            objectFit="cover"
          />
        )}
        <Text color="fg.muted" whiteSpace="pre-wrap">
          {popup.description}
        </Text>
      </Box>
    </VModal>
  );
}
