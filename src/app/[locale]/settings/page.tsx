'use client';

import { Box, Container, Heading, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

export default function SettingsPage() {
  const t = useTranslations('common');

  return (
    <Container maxW="container.xl" p={4}>
      <Box mb={8}>
        <NextLinkButton href="/" variant="ghost" size="sm">
          ← {t('backToHome')}
        </NextLinkButton>
      </Box>

      <Box textAlign="center" py={10}>
        <Heading size="2xl" mb={6}>
          {t('settings')}
        </Heading>
        <Text fontSize="xl" mb={10} color="gray.600">
          Configure your preferences and settings
        </Text>

        <Box>
          <Text color="gray.500">Settings page coming soon...</Text>
        </Box>
      </Box>
    </Container>
  );
}
