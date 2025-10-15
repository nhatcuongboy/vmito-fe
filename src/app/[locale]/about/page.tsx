'use client';

import { Box, Container, Heading, Text, Stack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

export default function AboutPage() {
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
          {t('about')}
        </Heading>
        <Text fontSize="xl" mb={10} color="gray.600">
          About Badminton Session Manager
        </Text>

        <Stack gap={4} maxW="2xl" mx="auto" textAlign="left">
          <Box>
            <Heading size="md" mb={2}>
              What is this app?
            </Heading>
            <Text color="gray.600">
              Badminton Session Manager is a comprehensive tool for organizing
              and managing badminton sessions. It helps hosts create sessions,
              manage players, track court usage, and ensure fair play time for
              everyone.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={2}>
              Key Features
            </Heading>
            <Text color="gray.600">
              • Session creation and management
              <br />
              • Player registration and tracking
              <br />
              • Court rotation and assignment
              <br />
              • Real-time session monitoring
              <br />• Multilingual support (English & Vietnamese)
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={2}>
              Version
            </Heading>
            <Text color="gray.600">
              Version 1.0.0 - Built with Next.js, Chakra UI, and Prisma
            </Text>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
