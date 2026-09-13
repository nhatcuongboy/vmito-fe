'use client';

import { Box, Flex, Heading, IconButton, Portal, Text } from '@chakra-ui/react';
import { Cookie, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { useCookieConsent } from '@/components/providers/CookieConsentProvider';
import { Button } from './chakra-compat';

export default function CookieConsentBanner() {
  const t = useTranslations('cookieConsent');
  const { choice, isOpen, acceptAll, acceptNecessary, closeSettings } =
    useCookieConsent();

  if (!isOpen) return null;

  const isSettings = choice !== null;

  return (
    <Portal>
      <Box
        aria-labelledby="cookie-consent-title"
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        bottom={{ base: 'calc(12px + env(safe-area-inset-bottom))', md: 6 }}
        boxShadow="0 20px 44px rgba(15, 23, 42, 0.22)"
        className="cookie-consent-banner"
        data-slot="cookie-consent-banner"
        data-testid="cookie-consent-banner"
        left="50%"
        maxW="440px"
        p={{ base: 3.5, md: 4 }}
        position="fixed"
        role="region"
        transform="translateX(-50%)"
        w="calc(100% - 24px)"
        zIndex="var(--z-assistant)"
      >
        <Flex align="flex-start" gap={3}>
          <Flex
            align="center"
            aria-hidden="true"
            bg="green.50"
            borderRadius="lg"
            color="green.600"
            flexShrink={0}
            h={10}
            justify="center"
            _dark={{ bg: 'green.900/45', color: 'green.300' }}
            w={10}
          >
            <Cookie size={20} />
          </Flex>
          <Box minW={0} flex={1}>
            <Heading
              id="cookie-consent-title"
              color="fg"
              fontSize="md"
              lineHeight="short"
            >
              {t('title')}
            </Heading>
            <Text color="fg.muted" fontSize="sm" lineHeight="tall" mt={1}>
              {t('description')}{' '}
              <Link
                className="cookie-consent-link"
                href="/privacy"
                onClick={closeSettings}
              >
                {t('privacyLink')}
              </Link>
            </Text>
          </Box>
          {isSettings ? (
            <IconButton
              aria-label={t('close')}
              minH="44px"
              minW="44px"
              onClick={closeSettings}
              size="sm"
              variant="ghost"
            >
              <X aria-hidden="true" size={18} />
            </IconButton>
          ) : null}
        </Flex>
        <Flex gap={2} mt={4}>
          <Button
            colorPalette="gray"
            flex={1}
            minH="44px"
            onClick={acceptNecessary}
            variant="outline"
          >
            {t('necessary')}
          </Button>
          <Button colorPalette="green" flex={1} minH="44px" onClick={acceptAll}>
            {t('all')}
          </Button>
        </Flex>
      </Box>
    </Portal>
  );
}
