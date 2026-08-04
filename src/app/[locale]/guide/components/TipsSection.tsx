'use client';

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Bell, Smartphone, Filter, Share2, Globe, Wifi } from 'lucide-react';
import * as React from 'react';
import PWAInstallTour from './PWAInstallTour';

const TipsSection = () => {
  const t = useTranslations('pages.guide.tips');
  const [isPWAInstallTourOpen, setIsPWAInstallTourOpen] = React.useState(false);

  const tips = [
    { icon: Bell, key: 'notifications', color: 'red.500' },
    { icon: Smartphone, key: 'pwa', color: 'blue.500' },
    { icon: Filter, key: 'filters', color: 'purple.500' },
    { icon: Share2, key: 'share', color: 'green.500' },
    { icon: Globe, key: 'language', color: 'orange.500' },
    { icon: Wifi, key: 'realtime', color: 'cyan.500' },
  ];

  return (
    <Box
      id="tips"
      py={{ base: 12, md: 16 }}
      bg="bg.muted"
      _dark={{ bg: 'gray.900' }}
    >
      <Container maxW="container.lg">
        <VStack gap={10}>
          <VStack gap={3} textAlign="center">
            <Heading size={{ base: 'xl', md: '2xl' }}>{t('title')}</Heading>
            <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>
              {t('subtitle')}
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5} w="full">
            {tips.map((tip) => {
              const isPwaTip = tip.key === 'pwa';
              return (
                <Box
                  key={tip.key}
                  as={isPwaTip ? 'button' : 'div'}
                  onClick={
                    isPwaTip ? () => setIsPWAInstallTourOpen(true) : undefined
                  }
                  cursor={isPwaTip ? 'pointer' : undefined}
                  textAlign="left"
                  bg="bg"
                  _dark={{ bg: 'gray.800' }}
                  p={4}
                  borderRadius="lg"
                  boxShadow="sm"
                  gap={4}
                  _hover={
                    isPwaTip
                      ? { transform: 'translateY(-2px)', boxShadow: 'md' }
                      : undefined
                  }
                  transition="all 0.2s"
                >
                  <HStack gap={4} align="start">
                    <Box color={tip.color} flexShrink={0} mt={0.5}>
                      <tip.icon size={22} />
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {t(`${tip.key}.title`)}
                      </Text>
                      <Text color="fg.muted" fontSize="xs">
                        {t(`${tip.key}.description`)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              );
            })}
          </SimpleGrid>
        </VStack>
      </Container>
      <PWAInstallTour
        isOpen={isPWAInstallTourOpen}
        onClose={() => setIsPWAInstallTourOpen(false)}
      />
    </Box>
  );
};

export default TipsSection;
