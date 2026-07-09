'use client';

import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { BookOpen, PlayCircle } from 'lucide-react';
import * as React from 'react';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { useTourStore } from '@/stores/useTourStore';

const GuideHeroSection = () => {
  const t = useTranslations('pages.guide.hero');
  const tTour = useTranslations('productTour');
  const router = useRouter();

  const handleStartTour = () => {
    useTourStore.getState().restartJourney();
    router.push(ROUTES.HOST.SESSIONS.LIST);
  };

  return (
    <Box
      py={{ base: 12, md: 20 }}
      bg="green.50"
      _dark={{ bg: 'green.950' }}
      textAlign="center"
    >
      <Container maxW="container.lg">
        <VStack gap={5}>
          <Box
            bg="green.500"
            p={4}
            borderRadius="full"
            color="white"
            boxShadow="lg"
          >
            <BookOpen size={40} />
          </Box>
          <Heading
            size={{ base: '2xl', md: '3xl' }}
            color="green.700"
            _dark={{ color: 'green.300' }}
          >
            {t('title')}
          </Heading>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color="fg.muted"
            maxW="600px"
          >
            {t('subtitle')}
          </Text>
          <Button
            colorPalette="green"
            size="lg"
            onClick={handleStartTour}
            leftIcon={<PlayCircle size={20} />}
          >
            {tTour('restartCta')}
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default GuideHeroSection;
