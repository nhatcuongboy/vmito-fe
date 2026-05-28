'use client';

import { Box, Container, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  Rocket,
  Gamepad2,
  Trophy,
  CreditCard,
  Users,
  Star,
  Lightbulb,
} from 'lucide-react';
import * as React from 'react';

const SECTIONS = [
  { id: 'getting-started', icon: Rocket, key: 'gettingStarted' },
  { id: 'sessions', icon: Gamepad2, key: 'sessions' },
  { id: 'tournaments', icon: Trophy, key: 'tournaments' },
  { id: 'payments', icon: CreditCard, key: 'payments' },
  { id: 'clubs', icon: Users, key: 'clubs' },
  { id: 'ratings', icon: Star, key: 'ratings' },
  { id: 'tips', icon: Lightbulb, key: 'tips' },
] as const;

const GuideTableOfContents = () => {
  const t = useTranslations('pages.guide.toc');

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <VStack gap={3} align="stretch">
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            {t('title')}
          </Text>
          {SECTIONS.map((section) => (
            <HStack
              key={section.id}
              gap={3}
              px={4}
              py={3}
              borderRadius="lg"
              cursor="pointer"
              _hover={{ bg: 'green.50', _dark: { bg: 'green.950' } }}
              transition="background 0.2s"
              onClick={() => handleScrollTo(section.id)}
            >
              <Box color="green.500">
                <section.icon size={20} />
              </Box>
              <Text fontWeight="medium">{t(section.key)}</Text>
            </HStack>
          ))}
        </VStack>
      </Container>
    </Box>
  );
};

export default GuideTableOfContents;
